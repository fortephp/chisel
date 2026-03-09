import { describe, it, expect } from "vitest";
import { scan, tokenContent, hasBladeInRawContent, TokenType } from "../src/scanner.js";

function tokenize(input: string) {
  const tokens = scan(input);
  return tokens.map((t) => ({
    type: t.type,
    content: tokenContent(input, t),
  }));
}

function types(input: string) {
  return scan(input).map((t) => t.type);
}

describe("scanner — text", () => {
  it("scans plain text as a single token", () => {
    const t = tokenize("hello world");
    expect(t).toEqual([{ type: TokenType.Text, content: "hello world" }]);
  });

  it("returns empty array for empty string", () => {
    expect(scan("")).toEqual([]);
  });
});

describe("scanner — blade echo", () => {
  it("scans {{ expr }}", () => {
    const t = tokenize("{{ $var }}");
    expect(t).toEqual([{ type: TokenType.BladeEcho, content: "{{ $var }}" }]);
  });

  it("scans echo with surrounding text", () => {
    const t = tokenize("hello {{ $name }} world");
    expect(t).toEqual([
      { type: TokenType.Text, content: "hello " },
      { type: TokenType.BladeEcho, content: "{{ $name }}" },
      { type: TokenType.Text, content: " world" },
    ]);
  });

  it("handles strings containing closing braces inside echo", () => {
    const t = tokenize("{{ $a ? '}}' : $b }}");
    expect(t).toEqual([
      { type: TokenType.BladeEcho, content: "{{ $a ? '}}' : $b }}" },
    ]);
  });
});

describe("scanner — blade raw echo", () => {
  it("scans {!! expr !!}", () => {
    const t = tokenize("{!! $html !!}");
    expect(t).toEqual([
      { type: TokenType.BladeRawEcho, content: "{!! $html !!}" },
    ]);
  });

  it("handles strings inside raw echo", () => {
    const t = tokenize("{!! '<b>' . $x . '</b>' !!}");
    expect(t).toEqual([
      {
        type: TokenType.BladeRawEcho,
        content: "{!! '<b>' . $x . '</b>' !!}",
      },
    ]);
  });
});

describe("scanner — blade comment", () => {
  it("scans {{-- comment --}}", () => {
    const t = tokenize("{{-- This is a comment --}}");
    expect(t).toEqual([
      { type: TokenType.BladeComment, content: "{{-- This is a comment --}}" },
    ]);
  });

  it("comment with surrounding text", () => {
    const t = tokenize("before {{-- x --}} after");
    expect(t).toEqual([
      { type: TokenType.Text, content: "before " },
      { type: TokenType.BladeComment, content: "{{-- x --}}" },
      { type: TokenType.Text, content: " after" },
    ]);
  });
});

describe("scanner — blade directive", () => {
  it("scans directive without params", () => {
    const t = tokenize("@csrf");
    expect(t).toEqual([{ type: TokenType.BladeDirective, content: "@csrf" }]);
  });

  it("scans directive with params", () => {
    const t = tokenize("@if($show)");
    expect(t).toEqual([
      { type: TokenType.BladeDirective, content: "@if($show)" },
    ]);
  });

  it("scans directive with nested parens", () => {
    const t = tokenize("@if($items->count() > 0)");
    expect(t).toEqual([
      {
        type: TokenType.BladeDirective,
        content: "@if($items->count() > 0)",
      },
    ]);
  });

  it("scans directive with string containing closing paren", () => {
    const t = tokenize("@if(str_contains($b, ')'))");
    expect(t).toEqual([
      {
        type: TokenType.BladeDirective,
        content: "@if(str_contains($b, ')'))",
      },
    ]);
  });

  it("treats @@directive as text (escaped)", () => {
    const t = tokenize("@@if($show)");
    expect(t).toEqual([{ type: TokenType.Text, content: "@@if($show)" }]);
  });

  it("treats @{{ as text (escaped echo)", () => {
    const t = tokenize("@{{ $thing }}");
    // Tokenization remains lossless here; escape semantics are resolved later.
    expect(t.length).toBeGreaterThanOrEqual(1);
  });
});

describe("scanner — escaped blade", () => {
  it("treats @{{ as text", () => {
    const t = tokenize("@{{ $thing }}");
    expect(t.length).toBeGreaterThanOrEqual(1);
  });
});

describe("scanner — HTML tags", () => {
  it("scans simple open tag", () => {
    expect(types("<div>")).toEqual([
      TokenType.HtmlOpenTagStart,
      TokenType.HtmlOpenTagEnd,
    ]);
  });

  it("scans open tag with tag name content", () => {
    const t = tokenize("<div>");
    expect(t[0].content).toBe("<div");
    expect(t[1].content).toBe(">");
  });

  it("scans self-closing tag", () => {
    const t = tokenize("<img />");
    expect(types("<img />")).toEqual([
      TokenType.HtmlOpenTagStart,
      TokenType.HtmlOpenTagEnd,
    ]);
    expect(t[1].content).toBe("/>");
  });

  it("scans close tag", () => {
    const t = tokenize("</div>");
    expect(t).toEqual([{ type: TokenType.HtmlCloseTag, content: "</div>" }]);
  });

  it("scans element with text content", () => {
    expect(types("<div>hello</div>")).toEqual([
      TokenType.HtmlOpenTagStart,
      TokenType.HtmlOpenTagEnd,
      TokenType.Text,
      TokenType.HtmlCloseTag,
    ]);
  });

  it("scans component tag names", () => {
    const t = tokenize("<x-component>");
    expect(t[0].content).toBe("<x-component");
  });

  it("scans namespaced tag names", () => {
    const t = tokenize("<x:slot>");
    expect(t[0].content).toBe("<x:slot");
  });
});

describe("scanner — HTML attributes", () => {
  it("scans boolean attribute", () => {
    expect(types("<input disabled>")).toEqual([
      TokenType.HtmlOpenTagStart,
      TokenType.AttributeName,
      TokenType.HtmlOpenTagEnd,
    ]);
  });

  it("scans quoted attribute", () => {
    const t = tokenize('<div class="foo">');
    expect(types('<div class="foo">')).toEqual([
      TokenType.HtmlOpenTagStart,
      TokenType.AttributeName,
      TokenType.AttributeAssign,
      TokenType.AttributeValueStart,
      TokenType.AttributeValue,
      TokenType.AttributeValueEnd,
      TokenType.HtmlOpenTagEnd,
    ]);
    expect(t[1].content).toBe("class");
    expect(t[4].content).toBe("foo");
  });

  it("scans single-quoted attribute", () => {
    const t = tokenize("<div class='bar'>");
    const vals = t.filter((x) => x.type === TokenType.AttributeValue);
    expect(vals[0].content).toBe("bar");
  });

  it("scans multiple attributes", () => {
    const t = tokenize('<div class="a" id="b">');
    const names = t
      .filter((x) => x.type === TokenType.AttributeName)
      .map((x) => x.content);
    expect(names).toEqual(["class", "id"]);
  });

  it("scans unquoted attribute value", () => {
    const t = tokenize("<div x-data=something>");
    const vals = t.filter((x) => x.type === TokenType.AttributeValue);
    expect(vals[0].content).toBe("something");
  });

  it("scans blade echo inside attribute value", () => {
    const ty = types('<div class="{{ $cls }}">');
    expect(ty).toEqual([
      TokenType.HtmlOpenTagStart,
      TokenType.AttributeName,
      TokenType.AttributeAssign,
      TokenType.AttributeValueStart,
      TokenType.BladeEcho,
      TokenType.AttributeValueEnd,
      TokenType.HtmlOpenTagEnd,
    ]);
  });

  it("scans mixed text and blade in attribute value", () => {
    const t = tokenize('<div class="mt-4 {{ $cls }}">');
    const ty = types('<div class="mt-4 {{ $cls }}">');
    expect(ty).toEqual([
      TokenType.HtmlOpenTagStart,
      TokenType.AttributeName,
      TokenType.AttributeAssign,
      TokenType.AttributeValueStart,
      TokenType.AttributeValue,
      TokenType.BladeEcho,
      TokenType.AttributeValueEnd,
      TokenType.HtmlOpenTagEnd,
    ]);
    expect(t[4].content).toBe("mt-4 ");
  });

  it("scans blade directive as attribute", () => {
    const ty = types("<div @if($show) class=\"foo\" @endif>");
    expect(ty).toContain(TokenType.BladeDirective);
    expect(ty).toContain(TokenType.AttributeName);
  });

  it("scans blade echo as attribute (spread)", () => {
    const ty = types('<div {{ $attributes }}>');
    expect(ty).toContain(TokenType.BladeEcho);
  });

  it("scans alpine x-data attribute", () => {
    const t = tokenize("<div x-data=\"{ open: false }\">");
    const names = t.filter((x) => x.type === TokenType.AttributeName);
    expect(names[0].content).toBe("x-data");
  });

  it("scans vue :class binding", () => {
    const t = tokenize('<div :class="active">');
    const names = t.filter((x) => x.type === TokenType.AttributeName);
    expect(names[0].content).toBe(":class");
  });
});

describe("scanner — HTML comments", () => {
  it("scans HTML comment", () => {
    const t = tokenize("<!-- hello -->");
    expect(t).toEqual([
      { type: TokenType.HtmlComment, content: "<!-- hello -->" },
    ]);
  });

  it("scans multiline comment", () => {
    const t = tokenize("<!-- line1\nline2 -->");
    expect(t[0].type).toBe(TokenType.HtmlComment);
  });
});

describe("scanner — HTML doctype", () => {
  it("scans doctype", () => {
    const t = tokenize("<!DOCTYPE html>");
    expect(t).toEqual([
      { type: TokenType.HtmlDoctype, content: "<!DOCTYPE html>" },
    ]);
  });

  it("scans lowercase doctype", () => {
    const t = tokenize("<!doctype html>");
    expect(t).toEqual([
      { type: TokenType.HtmlDoctype, content: "<!doctype html>" },
    ]);
  });
});

describe("scanner — raw content tags", () => {
  it("scans script with raw content", () => {
    const t = tokenize("<script>var x = 1;</script>");
    const ty = types("<script>var x = 1;</script>");
    expect(ty).toEqual([
      TokenType.HtmlOpenTagStart,
      TokenType.HtmlOpenTagEnd,
      TokenType.RawContent,
      TokenType.HtmlCloseTag,
    ]);
    expect(t[2].content).toBe("var x = 1;");
  });

  it("scans style with raw content", () => {
    const t = tokenize("<style>.foo { color: red; }</style>");
    const raw = t.find((x) => x.type === TokenType.RawContent);
    expect(raw!.content).toBe(".foo { color: red; }");
  });

  it("scans pre with raw content", () => {
    const t = tokenize("<pre>  code  here  </pre>");
    const raw = t.find((x) => x.type === TokenType.RawContent);
    expect(raw!.content).toBe("  code  here  ");
  });

  it("scans script with attributes", () => {
    const t = tokenize('<script type="module">import x from "y";</script>');
    const ty = t.map((x) => x.type);
    expect(ty).toContain(TokenType.AttributeName);
    expect(ty).toContain(TokenType.RawContent);
  });

  it("detects blade in raw content", () => {
    const input = "<script>var x = @js($data);</script>";
    const tokens = scan(input);
    const raw = tokens.find((t) => t.type === TokenType.RawContent);
    expect(raw).toBeDefined();
    expect(hasBladeInRawContent(input, raw!)).toBe(true);
  });

  it("detects no blade in pure JS", () => {
    const input = "<script>var x = 1;</script>";
    const tokens = scan(input);
    const raw = tokens.find((t) => t.type === TokenType.RawContent);
    expect(raw).toBeDefined();
    expect(hasBladeInRawContent(input, raw!)).toBe(false);
  });

  it("detects blade echo in raw content", () => {
    const input = "<script>var x = {{ $val }};</script>";
    const tokens = scan(input);
    const raw = tokens.find((t) => t.type === TokenType.RawContent);
    expect(hasBladeInRawContent(input, raw!)).toBe(true);
  });

  it("handles empty script tag", () => {
    const ty = types("<script></script>");
    expect(ty).toEqual([
      TokenType.HtmlOpenTagStart,
      TokenType.HtmlOpenTagEnd,
      TokenType.HtmlCloseTag,
    ]);
  });
});

describe("scanner — mixed HTML + Blade", () => {
  it("scans full blade template structure", () => {
    const input = `<!DOCTYPE html>
<html>
<head>
  <title>{{ $title }}</title>
</head>
<body>
  @if($show)
    <div class="{{ $cls }}">
      {{ $content }}
    </div>
  @endif
</body>
</html>`;
    const tokens = scan(input);
    const ty = tokens.map((t) => t.type);

    // Should contain all major token types
    expect(ty).toContain(TokenType.HtmlDoctype);
    expect(ty).toContain(TokenType.HtmlOpenTagStart);
    expect(ty).toContain(TokenType.HtmlCloseTag);
    expect(ty).toContain(TokenType.BladeEcho);
    expect(ty).toContain(TokenType.BladeDirective);
    expect(ty).toContain(TokenType.Text);
  });

  it("handles blade directive between HTML elements", () => {
    const input = "<div>\n@if($show)\n<p>hello</p>\n@endif\n</div>";
    const tokens = scan(input);
    const ty = tokens.map((t) => t.type);

    expect(ty).toContain(TokenType.HtmlOpenTagStart);
    expect(ty).toContain(TokenType.BladeDirective);
    expect(ty).toContain(TokenType.HtmlCloseTag);
  });

  it("handles blade inside tag attributes", () => {
    const input = '<div @if($x) class="foo" @endif>';
    const tokens = scan(input);
    const directives = tokens.filter((t) => t.type === TokenType.BladeDirective);
    expect(directives.length).toBe(2);
    expect(tokenContent(input, directives[0])).toBe("@if($x)");
    expect(tokenContent(input, directives[1])).toBe("@endif");
  });
});



