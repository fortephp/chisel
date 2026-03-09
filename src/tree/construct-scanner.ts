import { TokenType, type Token } from "../lexer/types.js";
import { NodeKind } from "./types.js";

const CONSTRUCT_PAIRS: Readonly<Record<number, number>> = {
  [TokenType.EchoStart]: TokenType.EchoEnd,
  [TokenType.RawEchoStart]: TokenType.RawEchoEnd,
  [TokenType.TripleEchoStart]: TokenType.TripleEchoEnd,
  [TokenType.PhpTagStart]: TokenType.PhpTagEnd,
  [TokenType.PhpBlockStart]: TokenType.PhpBlockEnd,
};

const CONSTRUCT_KINDS: Readonly<Record<number, number>> = {
  [TokenType.EchoStart]: NodeKind.Echo,
  [TokenType.RawEchoStart]: NodeKind.RawEcho,
  [TokenType.TripleEchoStart]: NodeKind.TripleEcho,
  [TokenType.PhpTagStart]: NodeKind.PhpTag,
  [TokenType.PhpBlockStart]: NodeKind.PhpBlock,
};

export function isConstructStart(tokenType: number): boolean {
  return tokenType in CONSTRUCT_PAIRS;
}

export function isEchoStart(tokenType: number): boolean {
  return (
    tokenType === TokenType.EchoStart ||
    tokenType === TokenType.RawEchoStart ||
    tokenType === TokenType.TripleEchoStart
  );
}

export function isPhpStart(tokenType: number): boolean {
  return tokenType === TokenType.PhpBlockStart || tokenType === TokenType.PhpTagStart;
}

export function getEndType(startType: number): number | null {
  return CONSTRUCT_PAIRS[startType] ?? null;
}

export function getNodeKind(startType: number): number | null {
  return CONSTRUCT_KINDS[startType] ?? null;
}

export function scanConstruct(
  tokens: readonly Token[],
  pos: number,
  end: number,
): [number, number] {
  if (pos >= end) return [pos, 0];

  const endType = getEndType(tokens[pos].type);
  if (endType === null) return [pos + 1, 1];

  let count = 1;
  pos++;

  while (pos < end && tokens[pos].type !== endType) {
    count++;
    pos++;
  }

  if (pos < end && tokens[pos].type === endType) {
    count++;
    pos++;
  }

  return [pos, count];
}

export function countConstructTokens(tokens: readonly Token[], pos: number, end: number): number {
  return scanConstruct(tokens, pos, end)[1];
}

export function advancePast(tokens: readonly Token[], pos: number, end: number): number {
  if (pos >= end) return pos;
  if (isConstructStart(tokens[pos].type)) {
    return scanConstruct(tokens, pos, end)[0];
  }
  return pos + 1;
}
