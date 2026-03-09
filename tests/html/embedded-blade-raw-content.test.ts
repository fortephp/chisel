import { describe, expect, it } from "vitest";
import { format, formatEqual, formatWithPasses, wrapInDiv } from "../helpers.js";

describe("html/embedded-blade-raw-content", () => {
  const phpSafe = { bladePhpFormatting: "safe" as const };

  it("formats script with @json expression content", async () => {
    const input = `<script>
    var _vars = @json(["x","y"])
</script>
`;

    const expected = `<script>
  var _vars = @json (["x", "y"]);
</script>
`;

    await formatEqual(input, expected, phpSafe);
  });

  it("formats script content around directive loops and echoes", async () => {
    const input = `<script>
@foreach ($stuff as $thing)
   var _var{{ $thing }} = "hi";
@endforeach
</script>
`;

    const expected = `<script>
  @foreach ($stuff as $thing)
  var _var{{ $thing }} = "hi";
  @endforeach
</script>
`;

    await formatEqual(input, expected, phpSafe);
  });

  it("stably formats script directive loops when bladePhpFormatting is off", async () => {
    const input = `<script>
@foreach ($stuff as $thing)
var slot = "{{ $thing }}-MAL_G"
@endforeach
</script>
`;

    const expected = `<script>
  @foreach ($stuff as $thing)
  var slot = "{{ $thing }}-MAL_G";
  @endforeach
</script>
`;

    await formatEqual(input, expected);
  });

  it("stably formats script @json expressions when bladePhpFormatting is off", async () => {
    const input = `<script>const data = @json(["x","y"])</script>
`;

    const expected = `<script>
  const data = @json (["x","y"]);
</script>
`;

    await formatEqual(input, expected);
  });

  it("stably formats script @js and @entangle expressions when bladePhpFormatting is off", async () => {
    const input = `<script>
const payload = @js(["x","y"])
let model = @entangle('foo')
</script>
`;

    const expected = `<script>
  const payload = @js (["x","y"]);
  let model = @entangle ('foo');
</script>
`;

    await formatEqual(input, expected);
  });

  it("keeps unknown script directives idempotent when bladePhpFormatting is off", async () => {
    const input = `<script>@foo($x)</script>
`;

    const expected = `<script>
  @foo ($x)
</script>
`;

    await formatEqual(input, expected);
  });

  it("keeps unknown script directive expressions stable when bladePhpFormatting is off", async () => {
    const input = `<script>const a = @foo($x)</script>
`;

    const output = await formatWithPasses(input, {
      bladePhpFormatting: "off",
    });

    expect(output).toMatch(/const a\s*=\s*@foo \(\$x\)/u);
  });

  it("ignores directive-like script strings when detecting standalone directives", async () => {
    const input = `<script>
const token = "@encoding";
const value = @foo($x)
</script>
`;

    const output = await formatWithPasses(input, {
      bladePhpFormatting: "off",
    });

    expect(output).toContain('const token = "@encoding";');
    expect(output).toMatch(/const value\s*=\s*@foo \(\$x\);/u);
  });

  it("ignores directive-like script comments when detecting standalone directives", async () => {
    const input = `<script>
// @encoding
const value = @foo($x)
</script>
`;

    const output = await formatWithPasses(input, {
      bladePhpFormatting: "off",
    });

    expect(output).toContain("// @encoding");
    expect(output).toMatch(/const value\s*=\s*@foo \(\$x\);/u);
  });

  it("ignores directive-like script template literals when detecting standalone directives", async () => {
    const input = `<script>
const token = \`@encoding\`;
const value = @foo($x)
</script>
`;

    const output = await formatWithPasses(input, {
      bladePhpFormatting: "off",
    });

    expect(output).toContain("const token = `@encoding`;");
    expect(output).toMatch(/const value\s*=\s*@foo \(\$x\);/u);
  });

  it("ignores condition-prefixed directive-like script regex literals when bladePhpFormatting is off", async () => {
    const input = `<script>
if (ok) /@if/.test(value)
const value = @foo($x)
</script>
`;

    const output = await formatWithPasses(input, {
      bladePhpFormatting: "off",
    });

    expect(output).toContain("if (ok) /@if/.test(value);");
    expect(output).toMatch(/const value\s*=\s*@foo \(\$x\);/u);
  });

  it("keeps known directive-like script literals idempotent across nesting depths when bladePhpFormatting is off", async () => {
    const snippet = `<script>
const strIf = "@if";
const strEndif = "@endif";
const tpl = \`@if @endif\`;
// @if @endif
</script>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(
        input,
        { bladePhpFormatting: "off" },
        { passes: 3, assertIdempotent: true },
      );

      expect(output).toContain('const strIf = "@if";');
      expect(output).toContain('const strEndif = "@endif";');
      expect(output).toContain("const tpl = `@if @endif`;");
      expect(output).toContain("// @if @endif");
    }
  });

  it("keeps script regex literals with directive-like tokens idempotent across nesting depths", async () => {
    const snippet = `<script>
const r = /@if/;
const b = @foo($x)
</script>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("const r = /@if/;");
      expect(output).toContain("const b = @foo ($x);");
    }
  });

  it("keeps return-prefixed script regex literals with directive-like tokens idempotent across nesting depths", async () => {
    const snippet = `<script>
const ok = () => {
  return /@if/.test(value)
}
const b = @foo($x)
</script>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("return /@if/.test(value);");
      expect(output).toContain("const b = @foo ($x);");
    }
  });

  it("keeps condition-prefixed script regex literals with directive-like tokens idempotent across nesting depths", async () => {
    const snippet = `<script>
if (ok) /@if/.test(value)
const b = @foo($x)
</script>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("if (ok) /@if/.test(value);");
      expect(output).toContain("const b = @foo ($x);");
    }
  });

  it("keeps do-while-prefixed script regex literals with directive-like tokens idempotent across nesting depths", async () => {
    const snippet = `<script>
do /@if/.test(value)
while (ok)
const b = @foo($x)
</script>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("do /@if/.test(value);");
      expect(output).toContain("while (ok);");
      expect(output).toContain("const b = @foo ($x);");
    }
  });

  it("keeps do-while-prefixed script regex literals with escaped slashes and directive-like tokens idempotent across nesting depths", async () => {
    const snippet = `<script>
do /x\\/@if/.test(value)
while (ok)
const b = @foo($x)
</script>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("do /x\\/@if/.test(value);");
      expect(output).toContain("while (ok);");
      expect(output).toContain("const b = @foo ($x);");
    }
  });

  it("keeps post-increment and post-decrement division contexts from masking following blade expressions", async () => {
    const snippet = `<script>
let x = 1
x++ / 2
x-- / 2
const b = @foo($x)
</script>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("x++ / 2;");
      expect(output).toContain("x-- / 2;");
      expect(output).toContain("const b = @foo ($x);");
    }
  });

  it("keeps unicode identifier division contexts from masking following blade expressions", async () => {
    const pi = String.fromCodePoint(0x03c0);
    const han = `${String.fromCodePoint(0x53d8)}${String.fromCodePoint(0x91cf)}`;
    const snippet = `<script>
const ${pi} = 1
${pi} / 2
const ${han} = 1
${han} / 2
const b = @foo($x)
</script>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain(`${pi} / 2;`);
      expect(output).toContain(`${han} / 2;`);
      expect(output).toContain("const b = @foo ($x);");
    }
  });

  it("keeps quoted and template-literal division contexts from masking following blade expressions", async () => {
    const snippet = `<script>
const a = "x" / 2
const b = 'x' / 2
const c = \`x\` / 2
const d = @foo($x)
</script>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain('const a = "x" / 2;');
      expect(output).toContain('const b = "x" / 2;');
      expect(output).toContain("const c = `x` / 2;");
      expect(output).toContain("const d = @foo ($x);");
    }
  });

  it("keeps template-literal interpolation blade expressions from masking following directives", async () => {
    const snippet = `<script>
const tpl = \`\${@json(["x","y"])}\`
const b = @foo($x)
</script>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain('const tpl = `${@json (["x", "y"])}`;');
      expect(output).toContain("const b = @foo ($x);");
    }
  });

  it("stably formats script directive loops with tabs when bladePhpFormatting is off", async () => {
    const input = `<script>
@foreach ($stuff as $thing)
var slot = "{{ $thing }}-MAL_G"
@endforeach
</script>
`;

    const expected = `<script>
\t@foreach ($stuff as $thing)
\tvar slot = "{{ $thing }}-MAL_G";
\t@endforeach
</script>
`;

    await formatEqual(input, expected, {
      useTabs: true,
      tabWidth: 2,
      htmlWhitespaceSensitivity: "strict",
    });
  });

  it("preserves literal marker-like strings in script content", async () => {
    const input = `<script>const marker = "__blade_expr_slot_0__"; const v = {{ $value }};</script>
`;

    const output = await format(input, phpSafe);

    expect(output).toContain('const marker = "__blade_expr_slot_0__";');
    expect(output).toContain("const v = {{ $value }};");
    expect(output).not.toContain('const marker = "{{ $value }}";');
  });

  it("does not duplicate directives when style content contains marker-like comments", async () => {
    const input = `<style>/*__blade_stmt_slot_0__*/ @if($dark).a{color:red}@endif</style>
`;

    const output = await format(input, phpSafe);

    expect(output).toContain("/*__blade_stmt_slot_0__*/");
    expect(output).toContain("@endif");
    expect(output.split("@if ($dark)").length - 1).toBe(1);
  });

  it("formats style blocks containing blade directives", async () => {
    const input = `<style>@if($dark).a{color:red}@endif</style>
`;

    const expected = `<style>
  @if ($dark)
  .a {
    color: red;
  }
  @endif
</style>
`;

    await formatEqual(input, expected, phpSafe);
  });

  it("keeps directive-like style literals idempotent across nesting depths", async () => {
    const snippet = `<style>
.x::before{content:"@if"}
.y::after{content:"@endif"}
/* @if @endif */
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 3,
        assertIdempotent: true,
      });

      expect(output).toContain('content: "@if";');
      expect(output).toContain('content: "@endif";');
      expect(output).toContain("/* @if @endif */");
    }
  });

  it("preserves directive-like tokens inside quoted style strings while formatting surrounding blade blocks", async () => {
    const snippet = `<style>@if($dark).a{content:"} @if($x)";color:red}@endif</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain('content: "} @if($x)";');
      expect(output).not.toContain('content: "}\n');
      expect(output).toContain("@if ($dark)");
      expect(output).toContain("@endif");
    }
  });

  it("keeps slash-delimited style literals with directive-like tokens idempotent across nesting depths", async () => {
    const snippet = `<style>
.x{content:/@if/.source}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toMatch(/content:\s*\/@if\s*\/\s*\.source;/u);
      expect(output).not.toContain("\n    @if\n");
    }
  });

  it("keeps escaped slash-delimited style literals with directive-like tokens idempotent across nesting depths", async () => {
    const snippet = `<style>
.x{content:/@if\\//.source;aux:@foo($x)}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("@if\\//");
      expect(output).toMatch(/aux:\s*@foo\s*\(\$x\)/u);
      expect(output).not.toContain("\n    @if\n");
    }
  });

  it("keeps style value blade expressions idempotent when url values contain //", async () => {
    const snippet = `<style>
.x{background:url(http://example.com/x);content:@foo($x)}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 3,
        assertIdempotent: true,
      });

      expect(output).toContain("background: url(http://example.com/x);");
      expect(output).toContain("content: @foo ($x);");
    }
  });

  it("keeps style custom-property protocol values with blade expressions idempotent across nesting depths", async () => {
    const snippet = `<style>
.x{--u:http://a/b;content:@foo($x)}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("content: @foo ($x);");
    }
  });

  it("keeps style line-comment-like content with blade expressions stable across nesting depths", async () => {
    const snippet = `<style>
.x{color:red;// @if
content:@foo($x)}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("@foo($x)");
    }
  });

  it("keeps directive-like tokens inside block comments intact without delimiter corruption", async () => {
    const snippet = `<style>
@elseif($e10)
@if($c11)
/* @elseif($e12) */
@else
/* @endif */
/* @endif */
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 5,
        assertIdempotent: true,
      });

      expect(output).toContain("/* @endif */");
      expect(output).not.toMatch(/\/\* @endif \*(?:;|\s*$)/mu);
    }
  });

  it("keeps inline style value directive blocks idempotent across nesting depths", async () => {
    const snippet = `<style>
.x{content:@if($x)red @else blue @endif}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 3,
        assertIdempotent: true,
      });

      expect(output).toContain("@if ($x)");
      expect(output).toContain("@else");
      expect(output).toContain("@endif");
      expect(output).toContain("red");
      expect(output).toContain("blue");
      expect(output).not.toContain("@else\n\n");
    }
  });

  it("is idempotent for style blocks combining value constructs before unterminated directive selectors", async () => {
    const snippet = `<style>
.h{aux:@foo($x)}
.i{x:{{ $v }}}
@if($dark).g{color:red}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("@if ($dark)");
      expect(output).toContain(".g {");
      expect(output).toContain("aux: @foo ($x);");
      expect(output).toContain("x: {{ $v }};");
    }
  });

  it("is idempotent for style blocks with malformed adjacent branch directives before selectors", async () => {
    const snippet = `<style>
.d{aux:@foo($x)}
@if($dark)
@elseif($alt)
.x{content:"} @if($x)"}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("@if ($dark)");
      expect(output).toContain("@elseif ($alt)");
      expect(output).toContain(".x {");
      expect(output).toContain('content: "} @if($x)";');
    }
  });

  it("is idempotent for style blocks with standalone branch directives before selectors", async () => {
    const snippet = `<style>
.a{color:red}
@else
.d{aux:@foo($x)}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("@else");
      expect(output).toContain(".d {");
      expect(output).toContain("aux: @foo ($x);");
    }
  });

  it("is idempotent for style blocks with standalone closing directives before selectors", async () => {
    const snippet = `<style>
.c{x:{{ $v }}}
@endif
.c{x:{{ $v }}}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("@endif");
      expect(output).toContain(".c {");
      expect(output).toContain("x: {{ $v }};");
    }
  });

  it("is idempotent for style blocks with standalone closing directives before opening directives", async () => {
    const snippet = `<style>
@endif
@if($dark)*{box-sizing:border-box}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("@endif");
      expect(output).toContain("@if ($dark)");
      expect(output).toContain("* {");
      expect(output).toContain("box-sizing: border-box;");
    }
  });

  it("is idempotent for style blocks with repeated opening directives before selector lines", async () => {
    const snippet = `<style>
@if($dark)
@if($dark):root{--x:1}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("@if ($dark)");
      expect(output).toContain(":root {");
      expect(output).toContain("--x: 1;");
    }
  });

  it("is idempotent for style blocks with repeated opening directive chains before selectors", async () => {
    const snippet = `<style>
@if($dark)
@if($dark)
@if($dark)#id{color:red}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("@if ($dark)");
      expect(output).toContain("#id {");
      expect(output).toContain("color: red;");
    }
  });

  it("is idempotent for style blocks with repeated openings followed by branch directives before selectors", async () => {
    const snippet = `<style>
@if($dark)
@if($dark)
@else
.c{x:{{ $v }}}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("@if ($dark)");
      expect(output).toContain("@else");
      expect(output).toContain(".c {");
      expect(output).toContain("x: {{ $v }};");
    }
  });

  it("is idempotent for style blocks with comment-separated branch selector directives", async () => {
    const snippet = `<style>
/* @endif */
@elseif($e1)

@elseif($e3).c3_290{color:red}
@endif
@if($c5).c5_4{color:red}
#c6_619{x:{{ $v }}}
@endif
@else
.c9_4{color:red}
@if($c10).c10_988{color:red}
@elseif($e11).c11_672{color:red}
.c12_837{background:url(http://example.com/c12_837);content:@foo($x)}
.c13_313{content:@if($x)red @else blue @endif}
#c14_147{x:{{ $v }}}
/* @if($c15) */
/*noise4*/
@else .c17_615{color:red}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("/*noise4*/");
      expect(output).toContain("@else");
      expect(output).toContain(".c17_615 {");
      expect(output).toMatch(/\n([ \t]*)\/\*noise4\*\/\n+\1@else\n\1\.c17_615 \{/u);
    }
  });

  it("is idempotent for style blocks with comment-separated malformed branch directives retaining arg spacing", async () => {
    const snippet = `<style>
/* @endif */

@elseif($e2)
/* @endif */
@elseif($e4)
.c5_898{content:@if($x)red @else blue @endif}
#c6_125{x:{{ $v }}}
@endif
/* @if($c8) */
@elseif($e9)
/* @endif */
.c11_246{color:red}
@elseif($e12).c12_483{color:red}
@endif .c13_48{color:red}
@elseif($e14).c14_84{color:red}
.c15_389{color:red}
.c16_142{color:red}
@else .c17_454{color:red}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toContain("@elseif ($e9)");
      expect(output).toContain("@elseif ($e14)");
      expect(output).not.toContain("@elseif($e9)");
      expect(output).toContain(".c17_454 {");
    }
  });

  it("is idempotent for style blocks with comment-separated opening directive chains", async () => {
    const snippet = `<style>
.c0_877{content:@if($x)red @else blue @endif}
/* @endif */
/* @if($c2) */
/*noise4*/
#c4_249{x:{{ $v }}}
/* @else */
@if($c6)
@elseif($e7)
@elseif($e8)
@if($c9).c9_87{color:red}
@if($c10).c10_546{color:red}
.c11_984{background:url(http://example.com/c11_984);content:@foo($x)}
/* @else */
/* @else */
/*noise3*/
/* @endif */
@elseif($e16).c16_655{color:red}
@endif
@elseif($e18)
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 4,
        assertIdempotent: true,
      });

      expect(output).toMatch(
        /\n([ \t]*)\/\* @else \*\/\n+\1@if \(\$c6\)\n\1@elseif \(\$e7\)\n\1@elseif \(\$e8\)\n\1@if \(\$c9\)/u,
      );
      expect(output).toContain(".c16_655 {");
      expect(output).toContain("@elseif ($e18)");
    }
  });

  it("is idempotent for style blocks with inline structural directives before comments without semicolon churn", async () => {
    const snippet = `<style>
/* @else */
/*noise2*/
.c2_288{color:red}
@elseif($e3).c3_216{color:red}
/* @else */
@if($c5)

/* @if($c7) */
@endif
/*noise0*/
/*noise0*/
/* @elseif($e11) */
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 5,
        assertIdempotent: true,
      });

      expect(output).toContain("@if ($c5)");
      expect(output).toContain("@endif");
      expect(output).toContain("/*noise0*/");
      expect(output).not.toContain("@endif; /*noise0*/");
    }
  });

  it("is idempotent for style blocks with directive-comment chain collapsing pressure", async () => {
    const snippet = `<style>
.c0_596{color:red}
@else
/* @endif */
/*noise0*/
#c4_286{x:{{ $v }}}
@else
/* @if($c6) */
/* @else */
@else
/* @endif */

/*noise8*/
@else
@endif
/* @else */
@endif
@if($c16)
@if($c17)
@else
.c19_290{content:@if($x)red @else blue @endif}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 5,
        assertIdempotent: true,
      });

      expect(output).toContain("@if ($c16)");
      expect(output).toContain("@if ($c17)");
      expect(output).toContain(".c19_290 {");
      expect(output).not.toContain("@else /* @endif */ /*noise8*/ @else @endif");
    }
  });

  it("is idempotent for style blocks with inline directive-comment-selector collapsing pressure", async () => {
    const snippet = `<style>
@endif

/*noise1*/
@else
@else .c4_750{color:red}
.c5_97{background:url(http://example.com/c5_97);content:@foo($x)}
#c6_751{x:{{ $v }}}
@elseif($e7)
/* @elseif($e8) */
@else
/*noise7*/
#c11_253{x:{{ $v }}}
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 5,
        assertIdempotent: true,
      });

      expect(output).toContain("@else");
      expect(output).toContain("/*noise7*/");
      expect(output).toContain("#c11_253 {");
      expect(output).not.toContain("@else /*noise7*/ #c11_253 {");
    }
  });

  it("is idempotent for style blocks with misindented directive comments between branch/open chains", async () => {
    const snippet = `<style>
@endif
@elseif($e1).c1_899{color:red}
@else
#c3_463{x:{{ $v }}}
/* @endif */
@if($c5)
@else

/* @endif */
@if($c9)
@endif .c10_923{color:red}
@else .c11_316{color:red}
/*noise1*/
/*noise5*/
@else
.c15_631{color:red}
@endif
@else .c17_423{color:red}
@endif
/* @if($c19) */
@else
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 5,
        assertIdempotent: true,
      });

      expect(output).toContain("/* @endif */");
      expect(output).toContain("@if ($c9)");
      expect(output).toContain(".c10_923 {");
      expect(output).not.toContain("@else\n             /* @endif */");
    }
  });

  it("is idempotent for style blocks with directive-comment anchors that should not deepen on subsequent passes", async () => {
    const snippet = `<style>
/* @if($c0) */
@else
/* @endif */
/* @if($c3) */
@if($c4).c4_687{color:red}
/* @elseif($e5) */
@endif .c6_882{color:red}
@elseif($e7).c7_483{color:red}
.c8_159{color:red}
@else
/* @else */
#c11_742{x:{{ $v }}}
/*noise2*/
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 5,
        assertIdempotent: true,
      });

      expect(output).toContain("/* @if($c3) */");
      expect(output).toContain("@if ($c4)");
      expect(output).toContain(".c4_687 {");
    }
  });

  it("is idempotent for style blocks with mixed comment runs before selector tails", async () => {
    const snippet = `<style>
#c0_342{x:{{ $v }}}
/* @if($c1) */
.c2_247{color:red}
/* @elseif($e3) */
/* @else */
@else
/* @if($c6) */
/* @else */
/*noise6*/
/* @endif */
.c10_625{color:red}
@else
/* @if($c12) */
/* @if($c13) */
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 5,
        assertIdempotent: true,
      });

      expect(output).toContain("/*noise6*/");
      expect(output).toContain("/* @endif */");
      expect(output).toContain(".c10_625 {");
    }
  });

  it("is idempotent for style blocks with directive-comment to directive blank-line collapse pressure", async () => {
    const snippet = `<style>
@if($c0).c0_989{color:red}
@elseif($e1).c1_359{color:red}

#c3_302{x:{{ $v }}}
/* @elseif($e4) */
@if($c5)
/* @endif */
@if($c7).c7_407{color:red}
/* @else */
/* @if($c9) */
@else
@endif .c11_213{color:red}
.c12_101{color:red}
#c13_813{x:{{ $v }}}
@elseif($e14)
.c15_233{background:url(http://example.com/c15_233);content:@foo($x)}
@endif .c16_62{color:red}
@endif .c17_330{color:red}
.c18_109{content:@if($x)red @else blue @endif}
@else
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 5,
        assertIdempotent: true,
      });

      expect(output).toContain("/* @endif */");
      expect(output).toContain("@if ($c7)");
      expect(output).toContain(".c18_109 {");
    }
  });

  it("is idempotent for style blocks with varied opening directive chains before branch selectors", async () => {
    const snippet = `<style>
@endif .c1_65{color:red}
/* @else */
.c3_204{color:red}
.c4_716{background:url(http://example.com/c4_716);content:@foo($x)}
@endif
.c6_337{color:red}

@elseif($e8).c8_659{color:red}
.c9_198{content:@if($x)red @else blue @endif}

#c11_385{x:{{ $v }}}
#c12_909{x:{{ $v }}}
@if($c13)

@if($c15)
@if($c16)
/* @if($c17) */
@elseif($e18).c18_881{color:red}
/* @else */
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 5,
        assertIdempotent: true,
      });

      expect(output).toContain("@if ($c13)");
      expect(output).toContain("@if ($c15)");
      expect(output).toContain("@if ($c16)");
      expect(output).toContain("@elseif ($e18)");
      expect(output).toContain(".c18_881 {");
    }
  });

  it("is idempotent for style blocks that would otherwise emit standalone semicolon lines after structural directives", async () => {
    const snippet = `<style>
@if($c0).c0_900{color:red}
/* @if($c1) */
/* @endif */
#c3_391{x:{{ $v }}}
/* @elseif($e4) */

@elseif($e6)
/* @if($c7) */
@endif
@else
</style>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(input, phpSafe, {
        passes: 5,
        assertIdempotent: true,
      });

      expect(output).toContain("@else");
      expect(output).toContain("@endif");
      expect(output).not.toContain("\n  ;\n");
    }
  });

  it("keeps blade value loops in style declarations semantically intact", async () => {
    const input = `<style>
.thing {
  background-color: @foreach ($something as $somethingElse)
    {{ $thing}}
  @endforeach
}
</style>
`;

    const expected = `<style>
  .thing {
    background-color:
      @foreach ($something as $somethingElse)
        {{ $thing }}
      @endforeach
      ;
  }
</style>
`;

    await formatEqual(input, expected, phpSafe);
  });

  it("stably formats raw echos in style and script blocks", async () => {
    const input = `<style>
        {!! Vite::content('resources/css/app.css') !!}
    </style>
    <script>
        {!! Vite::content('resources/js/app.js') !!}
    </script>
`;

    const expected = `<style>
  {!!
    Vite::content(
      "resources/css/app.css",
    )
  !!}
</style>
<script>
  {!!
    Vite::content(
      "resources/js/app.js",
    )
  !!};
</script>
`;

    await formatEqual(input, expected, phpSafe);
  });
});
