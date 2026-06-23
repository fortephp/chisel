import { describe, expect, it } from "vitest";
import {
  Directives,
  ErrorReason,
  reconstructFromTokens,
  tokenize,
  tokenContent,
  TokenType,
} from "../../src/lexer/index.js";
import { Directives as LexerDirectives } from "../../src/lexer/directives.js";
import { resolveBladeSyntaxProfile } from "../../src/plugins/runtime.js";

function findClosingTagIndex(
  source: string,
  tokens: ReturnType<typeof tokenize>["tokens"],
  name: string,
): number {
  return tokens.findIndex(
    (token, index) =>
      token.type === TokenType.LessThan &&
      tokens[index + 1]?.type === TokenType.Slash &&
      tokens[index + 2] !== undefined &&
      tokenContent(source, tokens[index + 2]) === name,
  );
}

describe("rawtext directive tokenization", () => {
  it("closes verbatim raw blocks inside rawtext before closing tags", () => {
    const cases = [
      {
        source:
          "<style>@verbatim .brand { color: @{{ $brand }}; } @endverbatim</style><p>after</p>",
        closingTag: "style",
      },
      {
        source: "<script>@verbatim const brand = '{{ $brand }}'; @endverbatim</script><p>after</p>",
        closingTag: "script",
      },
    ];

    for (const { source, closingTag } of cases) {
      const result = tokenize(source, Directives.withDefaults());

      expect(result.errors).toHaveLength(0);
      expect(reconstructFromTokens(result.tokens, source)).toBe(source);
      expect(result.tokens.filter((token) => token.type === TokenType.VerbatimStart)).toHaveLength(
        1,
      );
      expect(result.tokens.filter((token) => token.type === TokenType.VerbatimEnd)).toHaveLength(1);
      expect(findClosingTagIndex(source, result.tokens, closingTag)).toBeGreaterThan(0);
    }
  });

  it("does not let regular directive pairs swallow rawtext closing tags", () => {
    const cases = [
      {
        source: "<style>.brand { color: @if($brand) red @endif; }</style><p>after</p>",
        closingTag: "style",
      },
      {
        source: "<style>.brand { color: @if($brand) red; }</style><p>after</p>",
        closingTag: "style",
      },
      {
        source:
          "<script>@foreach($items as $item) console.log(@json($item)); @endforeach</script><p>after</p>",
        closingTag: "script",
      },
      {
        source: "<script>@foreach($items as $item) console.log($item);</script><p>after</p>",
        closingTag: "script",
      },
    ];

    for (const { source, closingTag } of cases) {
      const result = tokenize(source, Directives.withDefaults());

      expect(result.errors).toHaveLength(0);
      expect(reconstructFromTokens(result.tokens, source)).toBe(source);
      expect(result.tokens.some((token) => token.type === TokenType.Directive)).toBe(true);
      expect(findClosingTagIndex(source, result.tokens, closingTag)).toBeGreaterThan(0);
    }
  });

  it("recovers unclosed verbatim raw blocks at rawtext closing tags", () => {
    const cases = [
      {
        source: "<style>@verbatim .brand { color: @{{ $brand }}; }</style><p>after</p>",
        closingTag: "style",
      },
      {
        source: "<script>@verbatim const brand = '{{ $brand }}';</script><p>after</p>",
        closingTag: "script",
      },
    ];

    for (const { source, closingTag } of cases) {
      const result = tokenize(source, Directives.withDefaults());

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].reason).toBe(ErrorReason.UnexpectedEof);
      expect(reconstructFromTokens(result.tokens, source)).toBe(source);
      expect(result.tokens.some((token) => token.type === TokenType.VerbatimStart)).toBe(false);
      expect(result.tokens.some((token) => token.type === TokenType.VerbatimEnd)).toBe(false);
      expect(findClosingTagIndex(source, result.tokens, closingTag)).toBeGreaterThan(0);
    }
  });

  it("keeps unclosed verbatim raw blocks as raw blocks at true EOF", () => {
    const cases = [
      "<style>@verbatim .brand { color: @{{ $brand }};",
      "<script>@verbatim const brand = '{{ $brand }}';",
    ];

    for (const source of cases) {
      const result = tokenize(source, Directives.withDefaults());

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].reason).toBe(ErrorReason.UnexpectedEof);
      expect(reconstructFromTokens(result.tokens, source)).toBe(source);
      expect(result.tokens.some((token) => token.type === TokenType.VerbatimStart)).toBe(true);
      expect(result.tokens.some((token) => token.type === TokenType.Text)).toBe(true);
      expect(result.tokens.some((token) => token.type === TokenType.VerbatimEnd)).toBe(false);
    }
  });

  it("recovers plugin raw blocks at rawtext closing tags", () => {
    const source = "<style>@antlers .brand { color: {{ brand }}; }</style><p>after</p>";
    const profile = resolveBladeSyntaxProfile({
      bladeSyntaxPlugins: ["statamic"],
    });
    const result = tokenize(source, LexerDirectives.withDefaults(profile.lexerDirectives), {
      verbatimStartDirectives: profile.verbatimStartDirectives,
      verbatimEndDirectives: profile.verbatimEndDirectives,
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].reason).toBe(ErrorReason.UnexpectedEof);
    expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    expect(result.tokens.some((token) => token.type === TokenType.VerbatimStart)).toBe(false);
    expect(result.tokens.some((token) => token.type === TokenType.VerbatimEnd)).toBe(false);
    expect(findClosingTagIndex(source, result.tokens, "style")).toBeGreaterThan(0);
  });
});
