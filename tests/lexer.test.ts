import { describe, it, expect } from "vitest";
import { tokenize, tokenContent, TokenType, tokenLabel } from "../src/lexer/index.js";

function tok(input: string) {
  const { tokens } = tokenize(input);
  return tokens.map((t) => ({
    type: tokenLabel(t.type),
    content: tokenContent(input, t),
  }));
}

function types(input: string) {
  return tokenize(input).tokens.map((t) => tokenLabel(t.type));
}


describe("lexer — text", () => {
  it("plain text → single Text token", () => {
    expect(tok("hello world")).toEqual([
      { type: "Text", content: "hello world" },
    ]);
  });

  it("empty string → no tokens", () => {
    expect(tokenize("").tokens).toEqual([]);
  });

  it("user@example.com stays as text (not a directive)", () => {
    expect(types("user@example.com")).toEqual(["Text"]);
  });
});


describe("lexer — blade echo", () => {
  it("scans {{ expr }}", () => {
    expect(tok("{{ $var }}")).toEqual([
      { type: "EchoStart", content: "{{" },
      { type: "EchoContent", content: " $var " },
      { type: "EchoEnd", content: "}}" },
    ]);
  });

  it("echo with surrounding text", () => {
    expect(types("hello {{ $name }} world")).toEqual([
      "Text", "EchoStart", "EchoContent", "EchoEnd", "Text",
    ]);
  });

  it("handles strings containing closing braces inside echo", () => {
    const t = tok("{{ $a ? '}}' : $b }}");
    expect(t[0].type).toBe("EchoStart");
    expect(t[t.length - 1].type).toBe("EchoEnd");
  });
});


describe("lexer — blade raw echo", () => {
  it("scans {!! expr !!}", () => {
    expect(tok("{!! $html !!}")).toEqual([
      { type: "RawEchoStart", content: "{!!" },
      { type: "EchoContent", content: " $html " },
      { type: "RawEchoEnd", content: "!!}" },
    ]);
  });

  it("handles strings inside raw echo", () => {
    const t = tok("{!! '<b>' . $x . '</b>' !!}");
    expect(t[0].type).toBe("RawEchoStart");
    expect(t[t.length - 1].type).toBe("RawEchoEnd");
  });
});


describe("lexer — triple echo", () => {
  it("scans {{{ expr }}}", () => {
    expect(tok("{{{ $val }}}")).toEqual([
      { type: "TripleEchoStart", content: "{{{" },
      { type: "EchoContent", content: " $val " },
      { type: "TripleEchoEnd", content: "}}}" },
    ]);
  });
});


describe("lexer — blade comment", () => {
  it("scans {{-- comment --}}", () => {
    expect(tok("{{-- This is a comment --}}")).toEqual([
      { type: "BladeCommentStart", content: "{{--" },
      { type: "Text", content: " This is a comment " },
      { type: "BladeCommentEnd", content: "--}}" },
    ]);
  });

  it("comment with surrounding text", () => {
    expect(types("before {{-- x --}} after")).toEqual([
      "Text", "BladeCommentStart", "Text", "BladeCommentEnd", "Text",
    ]);
  });
});


describe("lexer — blade directive", () => {
  it("scans directive without params", () => {
    expect(tok("@csrf")).toEqual([
      { type: "Directive", content: "@csrf" },
    ]);
  });

  it("scans directive with params", () => {
    const t = tok("@if($show)");
    expect(t).toEqual([
      { type: "Directive", content: "@if" },
      { type: "DirectiveArgs", content: "($show)" },
    ]);
  });

  it("scans directive with nested parens", () => {
    const t = tok("@if($items->count() > 0)");
    expect(t[0]).toEqual({ type: "Directive", content: "@if" });
    expect(t[1].type).toBe("DirectiveArgs");
    expect(t[1].content).toBe("($items->count() > 0)");
  });

  it("scans directive with string containing closing paren", () => {
    const t = tok("@if(str_contains($b, ')'))");
    expect(t[1].content).toBe("(str_contains($b, ')'))");
  });

  it("unknown @word emits Directive (permissive)", () => {
    expect(types("@foobar")).toEqual(["Directive"]);
  });

  it("email address treated as text (not directive)", () => {
    expect(types("user@example.com")).toEqual(["Text"]);
  });
});


describe("lexer — escaped blade", () => {
  it("@@ emits AtSign then text", () => {
    const t = tok("@@if($show)");
    expect(t[0]).toEqual({ type: "AtSign", content: "@" });
  });

  it("@{{ emits AtSign then text (escaped echo)", () => {
    const t = tok("@{{ $thing }}");
    expect(t[0]).toEqual({ type: "AtSign", content: "@" });
  });
});


describe("lexer — verbatim", () => {
  it("@verbatim ... @endverbatim treats content as text", () => {
    const t = tok("@verbatim {{ $x }} @endverbatim");
    expect(t[0]).toEqual({ type: "VerbatimStart", content: "@verbatim" });
    expect(t[1].type).toBe("Text");
    expect(t[1].content).toContain("{{ $x }}");
    expect(t[t.length - 1]).toEqual({ type: "VerbatimEnd", content: "@endverbatim" });
  });
});


describe("lexer — php block", () => {
  it("@php ... @endphp wraps PHP content", () => {
    const t = tok("@php $x = 1; @endphp");
    expect(t[0]).toEqual({ type: "PhpBlockStart", content: "@php" });
    expect(t[1]).toEqual({ type: "PhpBlock", content: " $x = 1; " });
    expect(t[2]).toEqual({ type: "PhpBlockEnd", content: "@endphp" });
  });
});


describe("lexer — HTML tags", () => {
  it("scans simple open tag", () => {
    expect(types("<div>")).toEqual([
      "LessThan", "TagName", "GreaterThan",
    ]);
  });

  it("scans tag name content", () => {
    const t = tok("<div>");
    expect(t[1].content).toBe("div");
  });

  it("scans self-closing tag", () => {
    expect(types("<img />")).toEqual([
      "LessThan", "TagName", "Whitespace", "Slash", "GreaterThan",
    ]);
  });

  it("scans close tag", () => {
    expect(types("</div>")).toEqual([
      "LessThan", "Slash", "TagName", "GreaterThan",
    ]);
  });

  it("scans element with text content", () => {
    expect(types("<div>hello</div>")).toEqual([
      "LessThan", "TagName", "GreaterThan",
      "Text",
      "LessThan", "Slash", "TagName", "GreaterThan",
    ]);
  });

  it("scans component tag names", () => {
    const t = tok("<x-component>");
    expect(t[1].content).toBe("x-component");
  });

  it("scans namespaced tag names", () => {
    const t = tok("<x:slot>");
    expect(t[1].content).toBe("x:slot");
  });
});


describe("lexer — HTML attributes", () => {
  it("scans boolean attribute", () => {
    expect(types("<input disabled>")).toEqual([
      "LessThan", "TagName", "Whitespace",
      "AttributeName", "GreaterThan",
    ]);
  });

  it("scans quoted attribute", () => {
    const t = tok('<div class="foo">');
    const ty = types('<div class="foo">');
    expect(ty).toEqual([
      "LessThan", "TagName", "Whitespace",
      "AttributeName", "Equals", "Quote",
      "AttributeValue", "Quote", "GreaterThan",
    ]);
    const names = t.filter((x) => x.type === "AttributeName");
    expect(names[0].content).toBe("class");
    const vals = t.filter((x) => x.type === "AttributeValue");
    expect(vals[0].content).toBe("foo");
  });

  it("scans single-quoted attribute", () => {
    const t = tok("<div class='bar'>");
    const vals = t.filter((x) => x.type === "AttributeValue");
    expect(vals[0].content).toBe("bar");
  });

  it("scans multiple attributes", () => {
    const t = tok('<div class="a" id="b">');
    const names = t
      .filter((x) => x.type === "AttributeName")
      .map((x) => x.content);
    expect(names).toEqual(["class", "id"]);
  });

  it("scans unquoted attribute value", () => {
    const t = tok("<div x-data=something>");
    const vals = t.filter((x) => x.type === "AttributeValue");
    expect(vals[0].content).toBe("something");
  });

  it("scans blade echo inside attribute value", () => {
    const ty = types('<div class="{{ $cls }}">');
    expect(ty).toContain("EchoStart");
    expect(ty).toContain("EchoContent");
    expect(ty).toContain("EchoEnd");
  });

  it("scans mixed text and blade in attribute value", () => {
    const t = tok('<div class="mt-4 {{ $cls }}">');
    const vals = t.filter((x) => x.type === "AttributeValue");
    expect(vals[0].content).toBe("mt-4 ");
    expect(t.some((x) => x.type === "EchoStart")).toBe(true);
  });

  it("scans blade directive as attribute", () => {
    const ty = types('<div @if($show) class="foo" @endif>');
    expect(ty).toContain("Directive");
    expect(ty).toContain("AttributeName");
  });

  it("scans blade echo as attribute (spread)", () => {
    const ty = types("<div {{ $attributes }}>");
    expect(ty).toContain("EchoStart");
  });

  it("scans raw echo in attribute value", () => {
    const ty = types('<div class="{!! $raw !!}">');
    expect(ty).toContain("RawEchoStart");
    expect(ty).toContain("RawEchoEnd");
  });

  it("scans alpine x-data attribute", () => {
    const t = tok('<div x-data="{ open: false }">');
    const names = t.filter((x) => x.type === "AttributeName");
    expect(names[0].content).toBe("x-data");
  });

  it("scans vue :class binding as BoundAttribute", () => {
    const t = tok('<div :class="active">');
    const bound = t.filter((x) => x.type === "BoundAttribute");
    expect(bound[0].content).toBe(":class");
  });

  it("scans ::class as EscapedAttribute", () => {
    const t = tok('<div ::class="active">');
    const escaped = t.filter((x) => x.type === "EscapedAttribute");
    expect(escaped[0].content).toBe("::class");
  });

  it("scans :$name as ShorthandAttribute", () => {
    const t = tok('<div :$color>');
    const shorthand = t.filter((x) => x.type === "ShorthandAttribute");
    expect(shorthand[0].content).toBe(":$color");
  });

  it("scans whitespace between attributes", () => {
    const ty = types('<div  class="a"  id="b">');
    const wsCount = ty.filter((x) => x === "Whitespace").length;
    expect(wsCount).toBeGreaterThanOrEqual(2);
  });
});


describe("lexer — HTML comments", () => {
  it("scans HTML comment", () => {
    expect(types("<!-- hello -->")).toEqual([
      "CommentStart", "Text", "CommentEnd",
    ]);
  });

  it("scans multiline comment", () => {
    const t = tok("<!-- line1\nline2 -->");
    expect(t[0].type).toBe("CommentStart");
    expect(t[t.length - 1].type).toBe("CommentEnd");
  });
});


describe("lexer — doctype", () => {
  it("scans doctype", () => {
    expect(types("<!DOCTYPE html>")).toEqual([
      "DoctypeStart", "Whitespace", "Doctype", "DoctypeEnd",
    ]);
  });

  it("scans lowercase doctype", () => {
    const t = tok("<!doctype html>");
    expect(t[0].type).toBe("DoctypeStart");
  });
});


describe("lexer — raw content tags", () => {
  it("scans script with raw content", () => {
    const t = tok("<script>var x = 1;</script>");
    expect(t.some((x) => x.content === "var x = 1;")).toBe(true);
    // Closing tag is decomposed into LessThan + Slash + TagName + GreaterThan
    const closeLT = t.findIndex((x) => x.type === "LessThan" && t.indexOf(x) > 0);
    expect(closeLT).toBeGreaterThan(0);
  });

  it("scans style with raw content", () => {
    const t = tok("<style>.foo { color: red; }</style>");
    expect(t.some((x) => x.content === ".foo { color: red; }")).toBe(true);
  });

  it("scans script with attributes", () => {
    const t = tok('<script type="module">import x from "y";</script>');
    expect(t.some((x) => x.type === "AttributeName")).toBe(true);
  });

  it("emits blade tokens inside rawtext", () => {
    const ty = types("<script>var x = @js($data);</script>");
    expect(ty).toContain("Directive");
    expect(ty).toContain("DirectiveArgs");
  });

  it("emits blade echo inside rawtext", () => {
    const ty = types("<script>var x = {{ $val }};</script>");
    expect(ty).toContain("EchoStart");
    expect(ty).toContain("EchoEnd");
  });

  it("@media in CSS rawtext emits Directive (permissive lexer)", () => {
    // Permissive lexer treats any @identifier as a directive.
    // Filtering CSS at-rules (@media, @keyframes, etc.) is the
    // tree builder's responsibility, not the lexer's.
    const ty = types("<style>@media (max-width: 768px) { }</style>");
    expect(ty).toContain("Directive");
  });

  it("blade directive in CSS rawtext", () => {
    const ty = types("<style>.foo { color: red; } @if($x) .bar { } @endif</style>");
    expect(ty).toContain("Directive");
  });

  it("handles empty script tag", () => {
    const ty = types("<script></script>");
    // Open tag tokens + close tag tokens, no text in between
    expect(ty.includes("Text")).toBe(false);
  });

  it("handles escaped blade in rawtext", () => {
    const ty = types("<script>@@if</script>");
    expect(ty).toContain("AtSign");
    expect(ty).not.toContain("Directive");
  });
});


describe("lexer — mixed HTML + Blade", () => {
  it("scans a full blade template", () => {
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
    const ty = types(input);

    expect(ty).toContain("DoctypeStart");
    expect(ty).toContain("LessThan");
    expect(ty).toContain("TagName");
    expect(ty).toContain("EchoStart");
    expect(ty).toContain("Directive");
    expect(ty).toContain("Text");
  });

  it("handles blade directive between HTML elements", () => {
    const ty = types("<div>\n@if($show)\n<p>hello</p>\n@endif\n</div>");
    expect(ty).toContain("Directive");
    expect(ty).toContain("LessThan");
  });

  it("handles blade inside tag attributes", () => {
    const input = '<div @if($x) class="foo" @endif>';
    const { tokens } = tokenize(input);
    const directives = tokens.filter((t) => t.type === TokenType.Directive);
    expect(directives.length).toBe(2);
    expect(tokenContent(input, directives[0])).toBe("@if");
    expect(tokenContent(input, directives[1])).toBe("@endif");
  });
});
