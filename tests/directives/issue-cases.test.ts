import { describe, it, expect } from "vitest";
import * as prettier from "prettier";
import { formatEqual, format } from "../helpers.js";
import * as phpPlugin from "@prettier/plugin-php";
import bladePlugin from "../../src/index.js";
import { bladeParser } from "../../src/parser.js";
import { bladePrinter } from "../../src/printer.js";

const SAGE_LIKE_PLUGIN = {
  name: "sage-like",
  lexerDirectives: [],
  treeDirectives: [
    { name: "hasfield", args: true, structure: { role: "open", terminators: "endfield" } },
    { name: "endfield", args: false, structure: { role: "close" } },
    { name: "fields", args: true, structure: { role: "open", terminators: "endfields" } },
    { name: "endfields", args: false, structure: { role: "close" } },
    { name: "hasoption", args: true, structure: { role: "open", terminators: "endoption" } },
    { name: "endoption", args: false, structure: { role: "close" } },
    { name: "hassub", args: true, structure: { role: "open", terminators: "endsub" } },
    { name: "endsub", args: false, structure: { role: "close" } },
  ],
  verbatimStartDirectives: [],
  verbatimEndDirectives: [],
};

class TestAstPath<T extends { children?: T[]; attrs?: T[] }> {
  constructor(
    readonly node: T,
    readonly ancestors: T[],
  ) {}

  map<R>(callback: (path: TestAstPath<T>, index: number) => R, key = "children"): R[] {
    return this.getChildren(key).map(
      (child, index) => callback(new TestAstPath(child, [...this.ancestors, child]), index),
    );
  }

  each(callback: (path: TestAstPath<T>, index: number) => void, key = "children"): void {
    this.getChildren(key).forEach((child, index) => {
      callback(new TestAstPath(child, [...this.ancestors, child]), index);
    });
  }

  private getChildren(key: string): T[] {
    const value = (this.node as Record<string, unknown>)[key];
    return Array.isArray(value) ? (value as T[]) : [];
  }
}

async function formatWithSyntaxPlugin(code: string, syntaxPlugin: typeof SAGE_LIKE_PLUGIN) {
  const options: prettier.Options = {
    parser: "blade",
    tabWidth: 2,
    useTabs: false,
    printWidth: 80,
    endOfLine: "lf",
    htmlWhitespaceSensitivity: "css",
    bladePhpFormatting: "off",
    bladeSyntaxPlugins: [] as string[],
    bladeKeepHeadAndBodyAtRoot: false,
    bladeInlineIntentElements: ["svg", "svg:*"],
    bladeDirectiveArgSpacing: "space",
    bladeDirectiveBlockStyle: "preserve",
    bladeBlankLinesAroundDirectives: "preserve",
    bladeEchoSpacing: "preserve",
  };

  const ast = bladeParser.parse(code, {
    ...options,
    bladeSyntaxPlugins: [syntaxPlugin],
  });
  const preprocessed = bladePrinter.preprocess ? bladePrinter.preprocess(ast, options) : ast;
  const printPath = (path: TestAstPath<typeof preprocessed>) =>
    bladePrinter.print(path as never, options, printPath as never);
  const doc = printPath(new TestAstPath(preprocessed, [preprocessed]));
  const result = await prettier.doc.printer.printDocToString(doc, options);
  return result.formatted;
}

describe("directives/issue-cases", () => {
  // Issue #126: @error inside class attribute — directive boundaries preserved
  it("#126: @error in class attr preserves directive boundaries", async () => {
    const input =
      '<input type="text" class="@error(\'name\') border-red-300 @enderror border-slate-300" />\n';
    // Classes inside @error must NOT be reordered or moved outside
    const output = await format(input);
    expect(output).toContain("@error('name') border-red-300 @enderror");
    expect(output).toContain("border-slate-300");
  });

  it("#126: @error in class attr with multiple conditional classes", async () => {
    const input = [
      "<input",
      '  type="text"',
      "  class=\"base @error('email') ring-red-500 text-red-900 @enderror ring-gray-300\"",
      "/>",
      "",
    ].join("\n");
    const output = await format(input);
    expect(output).toContain("@error('email') ring-red-500 text-red-900 @enderror");
  });

  // Issue #130: directives in x-bind:style — no blank lines, idempotent
  it("#130: @foreach in x-bind:style stays compact and idempotent", async () => {
    const input = [
      "<div",
      '  x-bind:style="() => {',
      "    @foreach ($features as $index => $feature)",
      "      if (activeTab === @js($feature['name'])) {",
      "        return 'translateX(-' + @js($index * 100) + '%)';",
      "      }",
      "    @endforeach",
      '  }"',
      "></div>",
      "",
    ].join("\n");
    // Must not insert blank lines around @foreach; must be idempotent (formatEqual runs 5 passes)
    await formatEqual(input, input);
  });

  // Issue #125: @props singleQuote + }}@if adjacency
  it("#125: @props preserves singleQuote with }}@if adjacency", async () => {
    const input = [
      "@props([",
      "    'as' => 'h1',",
      "    'dot' => true,",
      "])",
      "",
      "<{{ $as }} {{ $attributes }}>",
      "    {{ $slot }}@if ($dot)<span>.</span>@endif",
      "</{{ $as }}>",
      "",
    ].join("\n");

    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      singleQuote: true,
      bladePhpFormatting: "safe",
    });

    // @props args must keep single quotes
    expect(output).toContain("'as' => 'h1'");
    expect(output).toContain("'dot' => true");
    // }}@if adjacency must not corrupt surrounding formatting
    expect(output).toContain("@if ($dot)");
  });

  // Issue #124: @class() indentation with PHP formatting off
  it("#124: @class with nested array indents correctly without PHP formatting", async () => {
    const input = [
      "<div",
      "  @class ([",
      "    'base-class',",
      "    'active' => $isActive,",
      "    'text-red' => $hasError,",
      "  ])",
      "></div>",
      "",
    ].join("\n");
    await formatEqual(input, input, { bladePhpFormatting: "off" });
  });

  // Issue #123: conditionals in <input> attributes
  it("#123: @unlessrole in input attributes does not error", async () => {
    const input = [
      "<input",
      '  wire:model.defer="id"',
      '  type="text"',
      '  class="w-full border-gray-300 rounded-md"',
      "  @unlessrole ('admin') disabled @endunlessrole",
      "/>",
      "",
    ].join("\n");
    await formatEqual(input, input);
  });

  it("#123: echo brace conditional in input attributes", async () => {
    const input = [
      "<input",
      '  type="text"',
      "  {{ auth()->user()->hasRole('admin') ? '' : 'disabled' }}",
      "/>",
      "",
    ].join("\n");
    const output = await format(input);
    expect(output).toContain("{{ auth()->user()->hasRole('admin')");
    expect(output).toContain("disabled");
  });

  it("#123: @if in input attributes", async () => {
    const input =
      "<input type=\"text\" @if (!auth()->user()->hasRole('admin')) disabled @endif />\n";
    const output = await format(input);
    expect(output).toContain("@if");
    expect(output).toContain("disabled");
    expect(output).toContain("@endif");
  });

  // Issue #122: @lang inside <script> preserved
  it("#122: @lang inside script tag preserves JS integrity", async () => {
    const input = [
      "<script>",
      "  let a = \"@lang('global.resend_available_in')\";",
      "</script>",
      "",
    ].join("\n");
    await formatEqual(input, input);
  });

  // Issue #121: no blank line accumulation after @php
  it("#121: @php block does not accumulate blank lines", async () => {
    const input = ["@php", "  $x = 1;", "@endphp", "", "<div>{{ $x }}</div>", ""].join("\n");
    await formatEqual(input, input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
    });
  });

  // Issue #119: custom component with @class does not error
  it("#119: x-component with @class in attributes does not error", async () => {
    const input = [
      "<x-dashboard-card",
      '  cursor="cursor-pointer"',
      "  @class ([",
      "    '!h-[23rem] !min-h-[23rem]' => true,",
      "    '!mb-8' => $balance_count > 0,",
      "  ])",
      ">",
      "  <p>content</p>",
      "</x-dashboard-card>",
      "",
    ].join("\n");
    await formatEqual(input, input);
  });

  // Issue #115: useTabs with multiline directive attributes
  it("#115: multiline directive attrs indent correctly with useTabs", async () => {
    const input = [
      "<div",
      "\t@if ($show)",
      '\t\tclass="visible"',
      "\t@endif",
      '\tx-data="{',
      "\t\topen: false,",
      '\t}"',
      "></div>",
      "",
    ].join("\n");
    await formatEqual(input, input, { useTabs: true });
  });

  // Issue #114: no unwanted blank lines after @endif
  it("#114: no blank line inserted after @endif", async () => {
    const input = [
      "<p>Something</p>",
      "@if (true)",
      "  <p>True</p>",
      "@endif",
      "<p>Something else</p>",
      "",
    ].join("\n");
    await formatEqual(input, input);
  });

  // Issue #110: correct indentation depth with tabWidth: 2
  it("#110: element inside @if uses tabWidth 2 not 4", async () => {
    const input = [
      "@if ($hasWhatsappButton)",
      "  <a",
      "    href=\"{{ get_field('whatsapp_contact_link', 'option') }}\"",
      '    target="_blank"',
      '    class="btn--contact bg-whatsapp"',
      "  >",
      '    <i class="icon icon-whatsapp"></i>',
      "  </a>",
      "@endif",
      "",
    ].join("\n");
    await formatEqual(input, input, { tabWidth: 2 });
  });

  // Issue #107: no progressive indentation in @section > @if
  it("#107: @section with nested @if does not drift on repeated formatting", async () => {
    const input = [
      "@section ('head-mid')",
      "  @if ($form->picture !== '')",
      '    <meta property="og:image" content="{{ $form->picture_url }}" />',
      "  @endif",
      "",
      "  @if ($form->picture !== '')",
      '    <meta property="twitter:image" content="{{ $form->picture_url }}" />',
      "  @endif",
      "@endsection",
      "",
    ].join("\n");

    const expected = [
      "@section ('head-mid')",
      "  @if ($form->picture !== '')",
      '    <meta property="og:image" content="{{ $form->picture_url }}" />',
      "  @endif",
      "  @if ($form->picture !== '')",
      '    <meta property="twitter:image" content="{{ $form->picture_url }}" />',
      "  @endif",
      "@endsection",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("#131: does not duplicate @endfields when @endsub trains an unrelated inline @sub", async () => {
    const input = [
      "@hasfield('list')",
      "  <ul>",
      "    @fields('list')",
      "      <li>@sub('item')</li>",
      "    @endfields",
      "  </ul>",
      "@endfield",
      "",
      "@hasoption('facebook_url')",
      '  Find us on <a href="@option(\'facebook_url\')" target="_blank">Facebook</a>',
      "@endoption",
      "",
      "@hassub('icon')",
      '  <i class="fas fa-@sub(\'icon\')"></i>',
      "@endsub",
      "",
    ].join("\n");

    const expected = [
      "@hasfield ('list')",
      "  <ul>",
      "    @fields ('list')",
      "      <li>@sub ('item')</li>",
      "    @endfields",
      "  </ul>",
      "@endfield",
      "",
      "@hasoption ('facebook_url')",
      "  Find us on",
      '  <a href="@option(\'facebook_url\')" target="_blank">Facebook</a>',
      "@endoption",
      "",
      "@hassub ('icon')",
      '  <i class="fas fa-@sub(\'icon\')"></i>',
      "@endsub",
      "",
    ].join("\n");

    const output = await formatWithSyntaxPlugin(input, SAGE_LIKE_PLUGIN);
    const secondPass = await formatWithSyntaxPlugin(output, SAGE_LIKE_PLUGIN);

    expect(output).toBe(expected);
    expect(secondPass).toBe(output);
  });

  it("#131: accept-all discovery without custom directives does not let @has* siblings corrupt @fields formatting", async () => {
    const input = [
      "@hasfield('list')",
      "  <ul>",
      "    @fields('list')",
      "      <li>@sub('item')</li>",
      "    @endfields",
      "  </ul>",
      "@endfield",
      "",
      "@hasoption('facebook_url')",
      '  Find us on <a href="@option(\'facebook_url\')" target="_blank">Facebook</a>',
      "@endoption",
      "",
      "@hassub('icon')",
      '  <i class="fas fa-@sub(\'icon\')"></i>',
      "@endsub",
      "",
    ].join("\n");

    const expected = [
      "@hasfield ('list')",
      "<ul>",
      "  @fields ('list')",
      "    <li>@sub ('item')</li>",
      "  @endfields",
      "</ul>",
      "@endfield",
      "",
      "@hasoption ('facebook_url')",
      'Find us on <a href="@option(\'facebook_url\')" target="_blank">Facebook</a>',
      "@endoption",
      "",
      "@hassub ('icon')",
      '<i class="fas fa-@sub(\'icon\')"></i>',
      "@endsub",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });
});

describe("pennant feature flag directives", () => {
  it("@feature/@endfeature formats as conditional block", async () => {
    const input = [
      "@feature ('new-onboarding')",
      "  <div>New onboarding flow</div>",
      "@endfeature",
      "",
    ].join("\n");
    await formatEqual(input, input);
  });

  it("@feature/@else/@endfeature preserves branches", async () => {
    const input = [
      "@feature ('new-onboarding')",
      "  <div>New flow</div>",
      "@else",
      "  <div>Old flow</div>",
      "@endfeature",
      "",
    ].join("\n");
    await formatEqual(input, input);
  });

  it("@featureany/@endfeatureany formats as conditional block", async () => {
    const input = [
      "@featureany (['beta-ui', 'new-dashboard'])",
      "  <p>You have access to beta features</p>",
      "@endfeatureany",
      "",
    ].join("\n");
    await formatEqual(input, input);
  });

  it("@feature nested inside HTML preserves structure", async () => {
    const input = [
      "<nav>",
      "  <ul>",
      "    @feature ('sidebar-v2')",
      "      <li>New sidebar item</li>",
      "    @endfeature",
      "  </ul>",
      "</nav>",
      "",
    ].join("\n");
    await formatEqual(input, input);
  });
});
