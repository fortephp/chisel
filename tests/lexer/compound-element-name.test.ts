import { describe, test, expect } from "vitest";
import {
  tokenize,
  TokenType,
  reconstructFromTokens,
} from "../../src/lexer/index.js";

describe("Lexer - Compound Element Names", () => {
  test("tokenizes static + echo element names", () => {
    const source = "<my-{{ $el }}></my-{{ $el }}>";
    const result = tokenize(source);

    expect(result.errors).toHaveLength(0);
    expect(result.tokens.map((t) => t.type)).toEqual([
      TokenType.LessThan,
      TokenType.TagName,
      TokenType.EchoStart,
      TokenType.EchoContent,
      TokenType.EchoEnd,
      TokenType.GreaterThan,
      TokenType.LessThan,
      TokenType.Slash,
      TokenType.TagName,
      TokenType.EchoStart,
      TokenType.EchoContent,
      TokenType.EchoEnd,
      TokenType.GreaterThan,
    ]);
    expect(reconstructFromTokens(result.tokens, source)).toBe(source);
  });

  test("tokenizes static + php-tag element names", () => {
    const source = "<my-<?php echo $el; ?>></my-<?php echo $el; ?>>";
    const result = tokenize(source);

    expect(result.errors).toHaveLength(0);
    expect(result.tokens.map((t) => t.type)).toEqual([
      TokenType.LessThan,
      TokenType.TagName,
      TokenType.PhpTagStart,
      TokenType.PhpContent,
      TokenType.PhpTagEnd,
      TokenType.GreaterThan,
      TokenType.LessThan,
      TokenType.Slash,
      TokenType.TagName,
      TokenType.PhpTagStart,
      TokenType.PhpContent,
      TokenType.PhpTagEnd,
      TokenType.GreaterThan,
    ]);
    expect(reconstructFromTokens(result.tokens, source)).toBe(source);
  });

  test("tokenizes mixed echo + php-tag names", () => {
    const source =
      "<{{ $a }}-<?php echo $b; ?>></{{ $a }}-<?php echo $b; ?>>";
    const result = tokenize(source);

    expect(result.errors).toHaveLength(0);
    expect(result.tokens.map((t) => t.type)).toEqual([
      TokenType.LessThan,
      TokenType.EchoStart,
      TokenType.EchoContent,
      TokenType.EchoEnd,
      TokenType.TagName,
      TokenType.PhpTagStart,
      TokenType.PhpContent,
      TokenType.PhpTagEnd,
      TokenType.GreaterThan,
      TokenType.LessThan,
      TokenType.Slash,
      TokenType.EchoStart,
      TokenType.EchoContent,
      TokenType.EchoEnd,
      TokenType.TagName,
      TokenType.PhpTagStart,
      TokenType.PhpContent,
      TokenType.PhpTagEnd,
      TokenType.GreaterThan,
    ]);
    expect(reconstructFromTokens(result.tokens, source)).toBe(source);
  });
});
