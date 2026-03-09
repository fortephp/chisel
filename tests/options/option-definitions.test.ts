import { describe, expect, it } from "vitest";
import bladePlugin, { options as declaredPluginOptions } from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { format, hasLoneLf } from "../helpers.js";

async function formatWithPhp(input: string, options: Record<string, unknown>) {
  return format(input, {
    plugins: [bladePlugin, phpPlugin],
    ...options,
  });
}

const pluginOptionScenarios: Record<string, () => Promise<void>> = {
  htmlWhitespaceSensitivity: async () => {
    const input = "<div> <span>foo</span> </div>\n";
    const css = await format(input, { htmlWhitespaceSensitivity: "css" });
    const strict = await format(input, { htmlWhitespaceSensitivity: "strict" });
    expect(css).toBe("<div><span>foo</span></div>\n");
    expect(strict).toBe("<div> <span>foo</span> </div>\n");
  },
  bladePhpFormatting: async () => {
    const input = '@if($x=="y")\n@endif\n{{ "abc" }}\n';
    const off = await formatWithPhp(input, {
      bladePhpFormatting: "off",
      singleQuote: true,
    });
    const safe = await formatWithPhp(input, {
      bladePhpFormatting: "safe",
      singleQuote: true,
    });

    expect(off).toContain('@if ($x=="y")');
    expect(off).toContain('{{ "abc" }}');
    expect(safe).toContain("@if ($x == 'y')");
    expect(safe).toContain("{{ 'abc' }}");
  },
  bladePhpFormattingTargets: async () => {
    const input = "{{ $a+$b }}\n@blaze(a:1+2)\n<?php $y=2+3; ?>\n";
    const output = await formatWithPhp(input, {
      bladePhpFormatting: "safe",
      bladePhpFormattingTargets: ["echo"],
    });

    expect(output).toContain("{{ $a + $b }}");
    expect(output).toContain("@blaze (a:1+2)");
    expect(output).toContain("<?php $y=2+3; ?>");
  },
  bladeSyntaxPlugins: async () => {
    const input = "@antlers\n<div>{{$x}}</div>\n@if($ready)\n@endantlers\n<div>{{$y}}</div>\n";
    const output = await format(input, {
      bladeEchoSpacing: "space",
      bladeSyntaxPlugins: ["statamic"],
    });

    expect(output).toContain("@antlers\n<div>{{$x}}</div>\n@if($ready)\n@endantlers");
    expect(output).toContain("<div>{{ $y }}</div>");
  },
  bladeDirectiveCase: async () => {
    const lower = await format("@EndPushOnce($x)\n", {
      bladeDirectiveCase: "lower",
    });
    expect(lower).toBe("@endpushonce ($x)\n");
  },
  bladeDirectiveCaseMap: async () => {
    const canonical = await format("@disk($value)\n", {
      bladeDirectiveCase: "canonical",
      bladeDirectiveCaseMap: '{"disk":"Disk"}',
    });
    expect(canonical).toBe("@Disk ($value)\n");
  },
  bladeDirectiveArgSpacing: async () => {
    const none = await format("@if ($x)\n@endif\n", {
      bladeDirectiveArgSpacing: "none",
    });
    const space = await format("@if($x)\n@endif\n", {
      bladeDirectiveArgSpacing: "space",
    });
    expect(none).toContain("@if($x)");
    expect(space).toContain("@if ($x)");
  },
  bladeDirectiveBlockStyle: async () => {
    const output = await format("@if($x)\n{{$y}}\n@endif\n", {
      bladeDirectiveBlockStyle: "inline-if-short",
    });
    expect(output).toBe("@if ($x) {{$y}} @endif\n");
  },
  bladeBlankLinesAroundDirectives: async () => {
    const input = "@if($x)\n<p>a</p>\n@else\n<p>b</p>\n@endif\n";
    const output = await format(input, {
      bladeDirectiveBlockStyle: "multiline",
      bladeBlankLinesAroundDirectives: "always",
    });
    expect(output).toContain("<p>a</p>\n\n@else");
    expect(output).toContain("<p>b</p>\n\n@endif");
  },
  bladeEchoSpacing: async () => {
    const output = await format("{{ $x }}\n", { bladeEchoSpacing: "tight" });
    expect(output).toBe("{{$x}}\n");
  },
  bladeSlotClosingTag: async () => {
    const input = "<x-card><x-slot:[items]>Content</x-slot></x-card>\n";
    const canonical = await format(input, { bladeSlotClosingTag: "canonical" });
    const preserve = await format(input, { bladeSlotClosingTag: "preserve" });

    expect(canonical).toContain("</x-slot:[items]>");
    expect(preserve).toContain("</x-slot>");
  },
  bladeInlineIntentElements: async () => {
    const input =
      '<svg><path d="M0 0 L10 10 L20 20 L30 30 L40 40" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" fill="none" vector-effect="non-scaling-stroke" /></svg>\n';
    const longParagraph =
      '<p id="alpha" data-one="1" data-two="2" data-three="3" data-four="4" data-five="5" data-six="6" data-seven="7" data-eight="8">Hello {{   $name   }} this is a long inline paragraph that should remain on one line.</p>\n';

    const preserve = await format(input, {
      printWidth: 10,
      singleAttributePerLine: true,
      bladeInlineIntentElements: ["svg", "svg:*"],
    });
    const wrap = await format(input, {
      printWidth: 10,
      singleAttributePerLine: true,
      bladeInlineIntentElements: ["p"],
    });
    const rootOnly = await format(input, {
      printWidth: 40,
      singleAttributePerLine: true,
      bladeInlineIntentElements: ["svg"],
    });
    const childrenOnly = await format(input, {
      printWidth: 40,
      singleAttributePerLine: true,
      bladeInlineIntentElements: ["svg:*"],
    });
    const preserveParagraph = await format(longParagraph, {
      printWidth: 40,
      bladePhpFormatting: "safe",
      bladeEchoSpacing: "space",
      bladeInlineIntentElements: ["p"],
    });
    const wrapParagraph = await format(longParagraph, {
      printWidth: 40,
      bladePhpFormatting: "safe",
      bladeEchoSpacing: "space",
      bladeInlineIntentElements: [],
    });

    expect(preserve.trimEnd()).toBe(
      '<svg><path d="M0 0 L10 10 L20 20 L30 30 L40 40" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" fill="none" vector-effect="non-scaling-stroke" /></svg>',
    );
    expect(wrap).toContain("<svg>");
    expect(wrap).toContain("<path\n");
    expect((rootOnly.match(/<path\b[\s\S]*?>/u)?.[0] ?? "").includes("\n")).toBe(true);
    expect(rootOnly).toContain("<svg><path");
    expect(childrenOnly).toContain("<svg>\n");
    expect((childrenOnly.match(/<path\b[\s\S]*?>/u)?.[0] ?? "").includes("\n")).toBe(false);
    expect(preserveParagraph.trimEnd()).toBe(
      '<p id="alpha" data-one="1" data-two="2" data-three="3" data-four="4" data-five="5" data-six="6" data-seven="7" data-eight="8">Hello {{ $name }} this is a long inline paragraph that should remain on one line.</p>',
    );
    expect(wrapParagraph).toContain("<p\n");
  },
  bladeComponentPrefixes: async () => {
    const dashInput = '<widget-card :title="$user->name??$fallback" />\n';
    const colonInput = '<widget:card :title="$user->name??$fallback" />\n';

    const defaultDashOutput = await formatWithPhp(dashInput, {
      bladePhpFormatting: "safe",
    });
    const customDashOutput = await formatWithPhp(dashInput, {
      bladePhpFormatting: "safe",
      bladeComponentPrefixes: ["widget"],
    });
    const customColonOutput = await formatWithPhp(colonInput, {
      bladePhpFormatting: "safe",
      bladeComponentPrefixes: ["widget"],
    });

    expect(defaultDashOutput).toContain(':title="$user->name??$fallback"');
    expect(customDashOutput).toContain(':title="$user->name ?? $fallback"');
    expect(customColonOutput).toContain(':title="$user->name ?? $fallback"');
  },
  bladeInsertOptionalClosingTags: async () => {
    const input = "<div>\n<script>\n</script>\n";
    const noInsert = await format(input, {
      bladeInsertOptionalClosingTags: false,
    });
    const insert = await format(input, {
      bladeInsertOptionalClosingTags: true,
    });

    expect(noInsert).not.toContain("</div>");
    expect(insert).toContain("</div>");
  },
  bladeKeepHeadAndBodyAtRoot: async () => {
    const input = "<!doctype html>\n<html><head></head><body></body></html>\n";
    const defaultOutput = await format(input, {
      bladeKeepHeadAndBodyAtRoot: false,
    });
    const rootOutput = await format(input, {
      bladeKeepHeadAndBodyAtRoot: true,
    });

    expect(defaultOutput).toContain("<html>\n  <head></head>\n  <body></body>\n</html>\n");
    expect(rootOutput).toContain("<html>\n<head></head>\n<body></body>\n</html>\n");
  },
};

const delegatedCoreOptionScenarios: Record<string, () => Promise<void>> = {
  singleQuote: async () => {
    const input = '<script>const label = "hello"</script>\n';
    const single = await format(input, { singleQuote: true });
    const double = await format(input, { singleQuote: false });
    expect(single).toContain("const label = 'hello';");
    expect(double).toContain('const label = "hello";');
  },
  semi: async () => {
    const input = "<script>const x = 1\nconst y = 2</script>\n";
    const semi = await format(input, { semi: true });
    const noSemi = await format(input, { semi: false });
    expect(semi).toContain("const x = 1;");
    expect(noSemi).toContain("const x = 1\n");
    expect(noSemi).not.toContain("const x = 1;");
  },
  trailingComma: async () => {
    const input = "<script>run({ alpha: 1, beta: 2, gamma: 3, longKey: 4 })</script>\n";
    const withTrailing = await format(input, {
      printWidth: 40,
      trailingComma: "all",
    });
    const withoutTrailing = await format(input, {
      printWidth: 40,
      trailingComma: "none",
    });
    expect(withTrailing).toContain("longKey: 4,");
    expect(withoutTrailing).not.toContain("longKey: 4,");
  },
  bracketSpacing: async () => {
    const input = "<script>const obj={a:1,b:2}</script>\n";
    const spaced = await format(input, { bracketSpacing: true });
    const tight = await format(input, { bracketSpacing: false });
    expect(spaced).toContain("const obj = { a: 1, b: 2 };");
    expect(tight).toContain("const obj = {a: 1, b: 2};");
  },
  quoteProps: async () => {
    const input = '<script>const obj={foo:1,"bar-baz":2}</script>\n';
    const asNeeded = await format(input, {
      quoteProps: "as-needed",
      singleQuote: false,
    });
    const consistent = await format(input, {
      quoteProps: "consistent",
      singleQuote: false,
    });
    expect(asNeeded).toContain('foo: 1, "bar-baz": 2');
    expect(consistent).toContain('"foo": 1, "bar-baz": 2');
  },
  jsxSingleQuote: async () => {
    const input = '<script type="text/jsx">const node=<Comp title="hello" />;</script>\n';
    const single = await format(input, { jsxSingleQuote: true });
    const double = await format(input, { jsxSingleQuote: false });
    expect(single).toContain("title='hello'");
    expect(double).toContain('title="hello"');
  },
  printWidth: async () => {
    const input =
      "<script>const value = someFunction(alpha, beta, gamma, delta, epsilon, zeta)</script>\n";
    const narrow = await format(input, { printWidth: 40 });
    const wide = await format(input, { printWidth: 120 });
    expect(narrow).toContain("someFunction(\n");
    expect(wide).toContain("const value = someFunction(alpha, beta, gamma, delta, epsilon, zeta);");
  },
  tabWidth: async () => {
    const input = "<script>if (x) {\nconsole.log(1)\n}</script>\n";
    const two = await format(input, { useTabs: false, tabWidth: 2 });
    const four = await format(input, { useTabs: false, tabWidth: 4 });
    expect(two).toContain("\n  if (x) {\n");
    expect(four).toContain("\n    if (x) {\n");
  },
  useTabs: async () => {
    const input = "<script>if (x) {\nconsole.log(1)\n}</script>\n";
    const spaces = await format(input, { useTabs: false, tabWidth: 2 });
    const tabs = await format(input, { useTabs: true, tabWidth: 2 });
    expect(spaces).toContain("\n  if (x) {\n");
    expect(tabs).toContain("\n\tif (x) {\n");
  },
  endOfLine: async () => {
    const input = "<script>const x = 1\nconst y = 2</script>\n";
    const crlf = await format(input, { endOfLine: "crlf" });
    expect(hasLoneLf(crlf)).toBe(false);
    expect(crlf).toContain("\r\n");
  },
  trailingCommaPHP: async () => {
    const input = "@php\n$y=['a'=>1,'b'=>2,'long_key'=>3];\n@endphp\n";
    const withTrailing = await formatWithPhp(input, {
      bladePhpFormatting: "safe",
      printWidth: 30,
      trailingCommaPHP: true,
    });
    const withoutTrailing = await formatWithPhp(input, {
      bladePhpFormatting: "safe",
      printWidth: 30,
      trailingCommaPHP: false,
    });
    expect(withTrailing).toContain('"long_key" => 3,');
    expect(withoutTrailing).not.toContain('"long_key" => 3,');
  },
  singleAttributePerLine: async () => {
    const input = '<div data-a="1" data-b="2" data-c="3"></div>\n';
    const output = await format(input, { singleAttributePerLine: true });
    expect(output).toContain('\n  data-a="1"\n');
    expect(output).toContain('\n  data-b="2"\n');
    expect(output).toContain('\n  data-c="3"\n');
  },
  bracketSameLine: async () => {
    const input = '<div very_long_attribute_name="value_value_value_value_value_value"></div>\n';
    const output = await format(input, {
      printWidth: 40,
      bracketSameLine: true,
    });
    expect(output).toContain('value_value_value_value_value_value"></div>');
  },
};

describe("options/option-definitions/blade-options", () => {
  it("has scenario coverage for every declared plugin option", () => {
    const declared = Object.keys(declaredPluginOptions).sort();
    const covered = Object.keys(pluginOptionScenarios).sort();
    expect(covered).toEqual(declared);
  });

  it("declares the shipped defaults", () => {
    expect(declaredPluginOptions.bladePhpFormatting.default).toBe("safe");
    expect(declaredPluginOptions.bladeKeepHeadAndBodyAtRoot.default).toBe(true);
    expect(declaredPluginOptions.bladeSyntaxPlugins.default).toEqual([{ value: ["statamic"] }]);
    expect(declaredPluginOptions.bladeComponentPrefixes.default).toEqual([
      { value: ["x", "s", "statamic", "flux", "livewire", "native"] },
    ]);
  });

  for (const [optionName, runScenario] of Object.entries(pluginOptionScenarios)) {
    it(`covers ${optionName}`, async () => {
      await runScenario();
    });
  }
});

describe("options/option-definitions/delegated-options", () => {
  for (const [optionName, runScenario] of Object.entries(delegatedCoreOptionScenarios)) {
    it(`passes ${optionName} through delegated formatters`, async () => {
      await runScenario();
    });
  }
});
