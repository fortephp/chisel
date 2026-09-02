import { createHash } from "node:crypto";
import ts from "typescript";

export const CORE_MARKERS = [
  "{{{",
  "}}}",
  "{!!",
  "!!}",
  "{{",
  "}}",
  "@php",
  "@endphp",
  "<?php",
  "?>",
  "{{--",
  "--}}",
];

export function normalizeCaseText(value) {
  const normalized = value.replace(/\r\n?/gu, "\n").trim();
  return normalized.length === 0 ? "" : `${normalized}\n`;
}

export function contentHash(value) {
  return createHash("sha256").update(normalizeCaseText(value)).digest("hex");
}

export function makeCaseId(sourcePath) {
  const segments = sourcePath.replaceAll("\\", "/").split("/");
  const group = segments.at(-2) ?? "case";
  const digest = createHash("sha256").update(sourcePath).digest("hex").slice(0, 12);
  return `${group}-${digest}`;
}

export function parseAcceptanceTest(source, sourcePath = "acceptance.test.ts") {
  const sourceFile = ts.createSourceFile(
    sourcePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const values = new Map();

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      (node.name.text === "input" || node.name.text === "output")
    ) {
      if (!node.initializer || !ts.isStringLiteralLike(node.initializer)) {
        throw new Error(`${sourcePath}: ${node.name.text} must be a string or template literal`);
      }

      if (values.has(node.name.text)) {
        throw new Error(`${sourcePath}: found more than one ${node.name.text} declaration`);
      }

      values.set(node.name.text, normalizeCaseText(node.initializer.text));
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  const input = values.get("input");
  const reference = values.get("output");
  if (input === undefined || reference === undefined) {
    throw new Error(`${sourcePath}: expected one input and one output literal`);
  }

  return { input, reference };
}

function countOccurrences(value, needle) {
  let count = 0;
  let offset = 0;

  while (true) {
    const next = value.indexOf(needle, offset);
    if (next === -1) return count;
    count += 1;
    offset = next + needle.length;
  }
}

export function changedCoreMarkers(input, output) {
  return CORE_MARKERS.flatMap((marker) => {
    const before = countOccurrences(input, marker);
    const after = countOccurrences(output, marker);
    return before === after ? [] : [{ marker, before, after }];
  });
}

function textLines(value) {
  const lines = value.replace(/\r\n?/gu, "\n").split("\n");
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

function lineMetrics(left, right) {
  const leftLines = textLines(left);
  const rightLines = textLines(right);
  const remaining = new Map();

  for (const line of leftLines) {
    remaining.set(line, (remaining.get(line) ?? 0) + 1);
  }

  let common = 0;
  for (const line of rightLines) {
    const count = remaining.get(line) ?? 0;
    if (count === 0) continue;
    common += 1;
    remaining.set(line, count - 1);
  }

  const total = leftLines.length + rightLines.length;
  const changedLineRatio = total === 0 ? 0 : 1 - (2 * common) / total;

  return {
    leftLines: leftLines.length,
    rightLines: rightLines.length,
    changedLineRatio,
    estimatedChangedLines: total - 2 * common,
  };
}

function indentationMetrics(value) {
  let maxIndent = 0;
  let longestBlankRun = 0;
  let blankRun = 0;

  for (const line of textLines(value)) {
    if (line.trim().length === 0) {
      blankRun += 1;
      longestBlankRun = Math.max(longestBlankRun, blankRun);
      continue;
    }

    blankRun = 0;
    const leading = line.match(/^[\t ]*/u)?.[0] ?? "";
    const width = [...leading].reduce((sum, character) => sum + (character === "\t" ? 4 : 1), 0);
    maxIndent = Math.max(maxIndent, width);
  }

  return { maxIndent, longestBlankRun };
}

export function analyzeFormattedOutput({ input, reference, output, convergedAt, error }) {
  const diagnostics = [];

  if (error) {
    diagnostics.push({ level: "error", code: "format-error", message: error });
  }

  if (!error && convergedAt === null) {
    diagnostics.push({
      level: "error",
      code: "non-convergent",
      message: "The formatter did not converge within four passes.",
    });
  }

  if (!error) {
    for (const change of changedCoreMarkers(input, output)) {
      diagnostics.push({
        level: "error",
        code: "delimiter-count",
        message: `${change.marker} count changed from ${change.before} to ${change.after}.`,
      });
    }
  }

  if (!error && output.length > input.length * 8 + 500) {
    diagnostics.push({
      level: "error",
      code: "output-growth",
      message: "Output exceeded the corpus sanity bound (8x input length plus 500 characters).",
    });
  }

  if (output.length > 0 && !output.endsWith("\n")) {
    diagnostics.push({
      level: "warning",
      code: "missing-final-newline",
      message: "Output does not end with a newline.",
    });
  }

  if (/(^|\n)[^\n]*[\t ]+(?=\n|$)/u.test(output)) {
    diagnostics.push({
      level: "warning",
      code: "trailing-whitespace",
      message: "Output contains trailing horizontal whitespace.",
    });
  }

  const versusV2 = lineMetrics(reference, output);
  const versusInput = lineMetrics(input, output);
  const inputIndentation = indentationMetrics(input);
  const outputIndentation = indentationMetrics(output);
  const indentIncrease = outputIndentation.maxIndent - inputIndentation.maxIndent;
  const lineRatio =
    versusInput.leftLines === 0 ? 1 : versusInput.rightLines / versusInput.leftLines;

  if (indentIncrease > 24) {
    diagnostics.push({
      level: "warning",
      code: "indent-growth",
      message: `Maximum indentation increased by ${indentIncrease} columns.`,
    });
  }

  if (lineRatio > 1.75 || lineRatio < 0.55) {
    diagnostics.push({
      level: "warning",
      code: "line-growth",
      message: `Output line count is ${lineRatio.toFixed(2)}x the input line count.`,
    });
  }

  if (outputIndentation.longestBlankRun > 3) {
    diagnostics.push({
      level: "warning",
      code: "blank-line-run",
      message: `Output contains ${outputIndentation.longestBlankRun} consecutive blank lines.`,
    });
  }

  const hardFailure = diagnostics.some((diagnostic) => diagnostic.level === "error");
  const warningCount = diagnostics.filter((diagnostic) => diagnostic.level === "warning").length;
  const priorityScore = Math.round(
    (hardFailure ? 1000 : 0) +
      versusV2.changedLineRatio * 100 +
      versusInput.changedLineRatio * 20 +
      warningCount * 25 +
      Math.max(0, indentIncrease - 8),
  );

  return {
    hardFailure,
    priorityScore,
    diagnostics,
    metrics: {
      versusV2,
      versusInput,
      inputCharacters: input.length,
      outputCharacters: output.length,
      v2Characters: reference.length,
      inputMaxIndent: inputIndentation.maxIndent,
      outputMaxIndent: outputIndentation.maxIndent,
      longestBlankRun: outputIndentation.longestBlankRun,
    },
  };
}
