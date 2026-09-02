import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyzeFormattedOutput,
  changedCoreMarkers,
  contentHash,
  normalizeCaseText,
  parseAcceptanceTest,
} from "../../scripts/v2-corpus/lib/corpus.mjs";
import { sideBySideRows } from "../../scripts/v2-corpus/viewer/diff.js";

describe("v2 corpus tooling", () => {
  it("extracts and normalizes the input and output literals", () => {
    const source = `
      const input = \`<div>\r\n  {{$value}}\r\n</div>\`;
      const output = \`<div>\n    {{ $value }}\n</div>\n\`;
    `;

    expect(parseAcceptanceTest(source, "sample.test.ts")).toEqual({
      input: "<div>\n  {{$value}}\n</div>\n",
      reference: "<div>\n    {{ $value }}\n</div>\n",
    });
  });

  it("rejects acceptance tests without both literals", () => {
    expect(() => parseAcceptanceTest("const input = `x`;", "incomplete.test.ts")).toThrow(
      "expected one input and one output literal",
    );
  });

  it("uses line-ending-independent content hashes", () => {
    expect(contentHash("a\r\nb\r\n")).toBe(contentHash("a\nb\n"));
    expect(normalizeCaseText("\n a \r\n")).toBe("a\n");
  });

  it("reports construct loss and non-convergence as hard failures", () => {
    expect(changedCoreMarkers("{{ $value }}", "$value")).toContainEqual({
      marker: "{{",
      before: 1,
      after: 0,
    });

    const result = analyzeFormattedOutput({
      input: "{{ $value }}\n",
      reference: "{{ $value }}\n",
      output: "$value\n",
      convergedAt: null,
    });

    expect(result.hardFailure).toBe(true);
    expect(result.diagnostics.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(["non-convergent", "delimiter-count"]),
    );
  });

  it("aligns insertions and replacements for the browser diff", () => {
    expect(sideBySideRows("a\nb\nc\n", "a\nnew\nc\n")).toEqual([
      {
        kind: "equal",
        left: { number: 1, text: "a" },
        right: { number: 1, text: "a" },
      },
      {
        kind: "change",
        left: { number: 2, text: "b" },
        right: { number: 2, text: "new" },
      },
      {
        kind: "equal",
        left: { number: 3, text: "c" },
        right: { number: 3, text: "c" },
      },
    ]);
  });

  it("keeps the generated viewer controls wired to the browser application", () => {
    const viewerRoot = join(process.cwd(), "scripts", "v2-corpus", "viewer");
    const html = readFileSync(join(viewerRoot, "index.html"), "utf8");
    const application = readFileSync(join(viewerRoot, "app.js"), "utf8");
    const requiredControls = [
      "case-list",
      "profile",
      "comparison",
      "changes-only",
      "decision-buttons",
      "notes",
      "export-review",
      "import-review",
    ];

    for (const id of requiredControls) {
      expect(html, `missing #${id} from viewer HTML`).toContain(`id="${id}"`);
      expect(application, `missing #${id} binding from viewer application`).toContain(`#${id}`);
    }
  });
});
