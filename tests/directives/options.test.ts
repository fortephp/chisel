import { describe, expect, it } from "vitest";
import { format, formatEqual, formatWithPasses } from "../helpers.js";

describe("directives/options", () => {
  it("supports bladeDirectiveCase preserve/canonical/lower", async () => {
    await formatEqual("@If($x)\n", "@If ($x)\n", {
      bladeDirectiveCase: "preserve",
    });

    await formatEqual("@endpushonce\n", "@endPushOnce\n", {
      bladeDirectiveCase: "canonical",
    });

    await formatEqual("@EndPushOnce($x)\n", "@endpushonce ($x)\n", {
      bladeDirectiveCase: "lower",
    });
  });

  it("supports bladeDirectiveCaseMap", async () => {
    await formatEqual("@disk($value)\n", "@Disk ($value)\n", {
      bladeDirectiveCase: "canonical",
      bladeDirectiveCaseMap: '{"disk":"Disk"}',
    });
  });

  it("supports bladeDirectiveArgSpacing preserve/none/space", async () => {
    await formatEqual("@if($x)\n", "@if($x)\n", {
      bladeDirectiveArgSpacing: "preserve",
    });

    await formatEqual("@if ($x)\n", "@if($x)\n", {
      bladeDirectiveArgSpacing: "none",
    });

    await formatEqual("@if($x)\n", "@if ($x)\n", {
      bladeDirectiveArgSpacing: "space",
    });
  });

  it("supports bladeDirectiveBlockStyle preserve", async () => {
    await formatEqual("@if($x) <span>x</span> @endif\n", "@if ($x)\n  <span>x</span>\n@endif\n", {
      bladeDirectiveBlockStyle: "preserve",
    });
  });

  it("supports bladeDirectiveBlockStyle multiline", async () => {
    await formatEqual("@if($x) <span>x</span> @endif\n", "@if ($x)\n  <span>x</span>\n@endif\n", {
      bladeDirectiveBlockStyle: "multiline",
    });
  });

  it("supports bladeDirectiveBlockStyle inline-if-short", async () => {
    await formatEqual("@if($x)\n{{$y}}\n@endif\n", "@if ($x) {{$y}} @endif\n", {
      bladeDirectiveBlockStyle: "inline-if-short",
    });
  });

  it("supports bladeBlankLinesAroundDirectives always/preserve", async () => {
    const compact = "@if($x)\n<p>a</p>\n@else\n<p>b</p>\n@endif\n";
    const withBlankLines = "@if($x)\n<p>a</p>\n\n@else\n<p>b</p>\n\n@endif\n";

    await formatEqual(compact, "@if ($x)\n  <p>a</p>\n\n@else\n  <p>b</p>\n\n@endif\n", {
      bladeDirectiveBlockStyle: "multiline",
      bladeBlankLinesAroundDirectives: "always",
    });

    await formatEqual(withBlankLines, "@if ($x)\n  <p>a</p>\n\n@else\n  <p>b</p>\n\n@endif\n", {
      bladeDirectiveBlockStyle: "multiline",
      bladeBlankLinesAroundDirectives: "preserve",
    });
  });

  it("does not treat blank lines inside a branch body as separator blank lines", async () => {
    const input = [
      "@if($x)",
      "<div>",
      "<p>one</p>",
      "",
      "<p>two</p>",
      "</div>",
      "@else",
      "<p>fallback</p>",
      "@endif",
      "",
    ].join("\n");

    await formatEqual(
      input,
      [
        "@if ($x)",
        "  <div>",
        "    <p>one</p>",
        "",
        "    <p>two</p>",
        "  </div>",
        "@else",
        "  <p>fallback</p>",
        "@endif",
        "",
      ].join("\n"),
      {
        bladeDirectiveBlockStyle: "multiline",
        bladeBlankLinesAroundDirectives: "preserve",
      },
    );

    await formatEqual(
      input,
      [
        "@if ($x)",
        "  <div>",
        "    <p>one</p>",
        "",
        "    <p>two</p>",
        "  </div>",
        "",
        "@else",
        "  <p>fallback</p>",
        "",
        "@endif",
        "",
      ].join("\n"),
      {
        bladeDirectiveBlockStyle: "multiline",
        bladeBlankLinesAroundDirectives: "always",
      },
    );
  });

  it("preserves authored blank lines between structured siblings inside a directive body", async () => {
    const input = [
      "@section('content')",
      "@include('partials.header')",
      "",
      "<x-main>",
      "@include('partials.home.hero')",
      "</x-main>",
      "@endsection",
      "",
    ].join("\n");

    await formatEqual(
      input,
      [
        "@section ('content')",
        "  @include ('partials.header')",
        "",
        "  <x-main>",
        "    @include ('partials.home.hero')",
        "  </x-main>",
        "@endsection",
        "",
      ].join("\n"),
      {
        bladeDirectiveBlockStyle: "multiline",
        bladeBlankLinesAroundDirectives: "preserve",
      },
    );
  });

  it("does not invent blank lines between structured siblings inside a directive body", async () => {
    const input = [
      "@section('content')",
      "@include('partials.header')",
      "<x-main>",
      "@include('partials.home.hero')",
      "</x-main>",
      "@endsection",
      "",
    ].join("\n");

    await formatEqual(
      input,
      [
        "@section ('content')",
        "  @include ('partials.header')",
        "  <x-main>",
        "    @include ('partials.home.hero')",
        "  </x-main>",
        "@endsection",
        "",
      ].join("\n"),
      {
        bladeDirectiveBlockStyle: "multiline",
        bladeBlankLinesAroundDirectives: "preserve",
      },
    );
  });

  it("supports bladeEchoSpacing preserve/space/tight", async () => {
    await formatEqual("{{$x}}\n", "{{$x}}\n", {
      bladeEchoSpacing: "preserve",
    });

    await formatEqual("{{$x}}\n", "{{ $x }}\n", {
      bladeEchoSpacing: "space",
    });

    await formatEqual("{{ $x }}\n", "{{$x}}\n", {
      bladeEchoSpacing: "tight",
    });
  });

  it("applies bladeEchoSpacing to dynamic attribute values", async () => {
    const input = '<div wire:key="{{ $x }}" data-label="A{{ $y }}B"></div>\n';

    await formatEqual(input, '<div wire:key="{{ $x }}" data-label="A{{ $y }}B"></div>\n', {
      bladeEchoSpacing: "space",
    });

    await formatEqual(input, '<div wire:key="{{$x}}" data-label="A{{$y}}B"></div>\n', {
      bladeEchoSpacing: "tight",
    });
  });

  it("supports bladeSlotClosingTag canonical/preserve", async () => {
    const input = "<x-card><x-slot:[items]>Content</x-slot></x-card>\n";

    const canonical = await format(input, {
      bladeSlotClosingTag: "canonical",
    });
    expect(canonical).toContain("<x-slot:[items]>");
    expect(canonical).toContain("</x-slot:[items]>");
    expect(canonical).toContain("\n    Content\n  </x-slot:[items]>");

    const preserve = await format(input, {
      bladeSlotClosingTag: "preserve",
    });
    expect(preserve).toContain("<x-slot:[items]>");
    expect(preserve).toContain("</x-slot>");
    expect(preserve).toContain("\n    Content\n  </x-slot>");
  });

  it("normalizes trailing horizontal whitespace inside directive args", async () => {
    const input = ["@varSet({", '  "logo":    ', "  ", '  "logo",   ', "})", ""].join("\n");

    const output = await formatWithPasses(input, {}, { passes: 3, assertIdempotent: true });

    expect(output).toContain("@varSet ({");
    expect(output).not.toMatch(/[ \t]+$/mu);
  });
});
