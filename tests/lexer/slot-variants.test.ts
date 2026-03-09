import { describe, it, expect } from "vitest";
import {
  tokenize,
  TokenType,
  tokenContent,
  reconstructFromTokens,
} from "../../src/lexer/index.js";

function tagNames(source: string): string[] {
  const { tokens } = tokenize(source);
  return tokens
    .filter((token) => token.type === TokenType.TagName)
    .map((token) => tokenContent(source, token));
}

describe("Lexer - Slot Variants", () => {
  it("tokenizes bracket slot names as tag-name tokens", () => {
    const source = "<x-slot[title]>Hello</x-slot>";
    const { tokens } = tokenize(source);

    expect(reconstructFromTokens(tokens, source)).toBe(source);
    expect(tagNames(source)).toEqual(["x-slot[title]", "x-slot"]);
  });

  it("tokenizes repeated same-name shorthand slots deterministically", () => {
    const source =
      "<x-card><x-slot:title>A</x-slot><x-slot:title>B</x-slot></x-card>";
    const { tokens } = tokenize(source);

    expect(reconstructFromTokens(tokens, source)).toBe(source);
    expect(tagNames(source)).toEqual([
      "x-card",
      "x-slot:title",
      "x-slot",
      "x-slot:title",
      "x-slot",
      "x-card",
    ]);
  });

  it("tokenizes repeated @slot/@endslot directives with args", () => {
    const source = "@slot('title')A @endslot @slot('title')B @endslot";
    const { tokens } = tokenize(source);
    const directives = tokens
      .filter((token) => token.type === TokenType.Directive)
      .map((token) => tokenContent(source, token));
    const directiveArgs = tokens
      .filter((token) => token.type === TokenType.DirectiveArgs)
      .map((token) => tokenContent(source, token));

    expect(reconstructFromTokens(tokens, source)).toBe(source);
    expect(directives).toEqual(["@slot", "@endslot", "@slot", "@endslot"]);
    expect(directiveArgs).toEqual(["('title')", "('title')"]);
  });

  it("tokenizes colon-bracket dynamic expression slot syntax", () => {
    const source = "<x-card><x-slot:[items]>Content</x-slot></x-card>";
    const { tokens } = tokenize(source);

    expect(reconstructFromTokens(tokens, source)).toBe(source);
    expect(tagNames(source)).toEqual(["x-card", "x-slot:[items]", "x-slot", "x-card"]);
  });

  it("tokenizes variadic-style slot tag names", () => {
    const source = "<x-list><x-slot:items[]>Item</x-slot></x-list>";
    const { tokens } = tokenize(source);

    expect(reconstructFromTokens(tokens, source)).toBe(source);
    expect(tagNames(source)).toEqual(["x-list", "x-slot:items[]", "x-slot", "x-list"]);
  });
});
