import path from "node:path";
import { fileURLToPath } from "node:url";
import { tokenize } from "../src/lexer/lexer.js";
import { tokenLabel, type Token } from "../src/lexer/types.js";
import { buildTree } from "../src/tree/tree-builder.js";
import { nodeKindLabel, NONE, type FlatNode, type BuildResult } from "../src/tree/types.js";
import { Directives } from "../src/tree/directives.js";

export function dumpTokens(source: string, tokens?: readonly Token[]): string {
  const toks = tokens ?? tokenize(source).tokens;
  const lines: string[] = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    const text = source.slice(t.start, t.end);
    lines.push(
      `  ${String(i).padStart(3)}  ${tokenLabel(t.type).padEnd(20)} ${JSON.stringify(text)}`,
    );
  }
  return lines.join("\n");
}

export function parse(source: string, directives?: Directives): BuildResult {
  const { tokens } = tokenize(source);
  return buildTree(tokens, source, directives);
}

export function childrenOf(result: BuildResult, nodeIdx: number): FlatNode[] {
  const node = result.nodes[nodeIdx];
  const children: FlatNode[] = [];
  let idx = node.firstChild;
  while (idx !== NONE) {
    children.push(result.nodes[idx]);
    idx = result.nodes[idx].nextSibling;
  }
  return children;
}

export function rootChildren(result: BuildResult): FlatNode[] {
  return childrenOf(result, 0);
}

export function findByKind(result: BuildResult, kind: number): FlatNode[] {
  return result.nodes.filter((n) => n.kind === kind);
}

export function nodeText(result: BuildResult, node: FlatNode): string {
  if (node.tokenCount === 0) return "";
  const startToken = result.tokens[node.tokenStart];
  const endToken = result.tokens[node.tokenStart + node.tokenCount - 1];
  return result.source.slice(startToken.start, endToken.end);
}

export function indexOf(result: BuildResult, node: FlatNode): number {
  return result.nodes.indexOf(node);
}

export function dumpTree(result: BuildResult, maxTextLen = 40): string {
  const { nodes, tokens, source } = result;
  const lines: string[] = [];

  function textOf(node: FlatNode): string {
    if (node.tokenCount === 0) return "";
    const s = tokens[node.tokenStart];
    const e = tokens[node.tokenStart + node.tokenCount - 1];
    let text = source.slice(s.start, e.end);
    if (text.length > maxTextLen) {
      text = `${text.slice(0, maxTextLen - 3)}...`;
    }
    return JSON.stringify(text);
  }

  function walk(idx: number, depth: number): void {
    const node = nodes[idx];
    const indent = "  ".repeat(depth);
    const kindName = nodeKindLabel(node.kind);
    const tokRange =
      node.tokenCount > 0
        ? `tokens ${node.tokenStart}-${node.tokenStart + node.tokenCount - 1}`
        : "no tokens";
    const text = textOf(node);
    const dataStr = node.data !== 0 ? ` data=${node.data}` : "";
    lines.push(`${indent}[${idx}] ${kindName}  (${tokRange})${dataStr}${text ? ` ${text}` : ""}`);

    let child = node.firstChild;
    while (child !== NONE) {
      walk(child, depth + 1);
      child = nodes[child].nextSibling;
    }
  }

  walk(0, 0);
  return lines.join("\n");
}

function isDirectRun(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(entry) === path.resolve(currentFile);
}

function runCli(): void {
  const source = process.argv[2];
  if (!source) {
    console.error("Usage: npx tsx tests/debug.ts '<blade template>'");
    process.exit(1);
  }

  const { tokens } = tokenize(source);
  console.log("=== TOKENS ===");
  console.log(dumpTokens(source, tokens));
  console.log();

  const directives = Directives.withDefaults();
  directives.train(tokens, source);
  const result = buildTree(tokens, source, directives);

  console.log("=== TREE ===");
  console.log(dumpTree(result));
}

if (isDirectRun()) {
  runCli();
}
