import { describe, expect, it } from "vitest";
import { format, formatEqual } from "../helpers.js";

describe("directives/content-loss-audit", () => {
  it("does not inject tag marker text around echo variants in directive bodies", async () => {
    const input = "<div\n@if($a) {{ $one }} {!! $two !!} {{{ $three }}} @endif\n></div>";

    const expected = "<div @if ($a) {{ $one }} {!! $two !!} {{{ $three }}} @endif></div>\n";

    await formatEqual(input, expected);
  });

  it("preserves standalone @php blocks inside attr-context directive bodies", async () => {
    const input = "<div\n@if($a) @php $x=1; $y=2; @endphp @endif\n></div>";

    const expected = "<div @if ($a) @php $x=1; $y=2; @endphp @endif></div>\n";

    await formatEqual(input, expected);
  });

  it("preserves @php content with => operators inside attr-context directive bodies", async () => {
    const input = '<div\n@if($a) @php $x = ["k" => "v"]; @endphp @endif\n></div>';

    const expected = '<div @if ($a) @php $x = ["k" => "v"]; @endphp @endif></div>\n';

    await formatEqual(input, expected);
  });

  it("does not treat @endphp inside php strings as a block terminator in attr-context", async () => {
    const input = '<div\n@if($a) @php echo "@endphp"; @endphp @endif\n></div>';

    const expected = '<div @if ($a) @php echo "@endphp"; @endphp @endif></div>\n';

    await formatEqual(input, expected);
  });

  it("keeps interpolation-bearing attribute-like fragments stable inside @if", async () => {
    const input = '<div\n@if($a) data-{{ $k }}="{{ $v }}" @endif\n></div>';

    const expected = '<div @if ($a) data-{{ $k }}="{{ $v }}" @endif></div>\n';

    await formatEqual(input, expected);
  });

  it("keeps wire:key interpolation stable inside loop directives in attr context", async () => {
    const input = '<div\n@foreach($xs as $x) wire:key="{{ $x->id }}" @endforeach\n></div>';

    const expected = '<div @foreach ($xs as $x) wire:key="{{ $x->id }}" @endforeach></div>\n';

    await formatEqual(input, expected);
  });

  it("keeps quoted attribute values containing php tags stable inside attr-context directive bodies", async () => {
    const input = '<div\n@if($a) data-a="<?php echo $x; ?>" @endif\n></div>';

    const expected = '<div @if ($a) data-a="<?php echo $x; ?>" @endif></div>\n';

    await formatEqual(input, expected);
  });

  it("preserves compound attribute names that include @php blocks and interpolation", async () => {
    const input = '<div\n@if($a) data-{{ $x }}-@php echo "y"; @endphp="z" @endif\n></div>';

    const expected = '<div @if ($a) data-{{ $x }}-@php echo "y"; @endphp="z" @endif></div>\n';

    await formatEqual(input, expected);
  });

  it("handles long standalone echo constructs in attribute context without reclassification loss", async () => {
    const input = "<div\n@if($a) {{ $foo + $bar + $baz + $qux + $quux }} @endif\n></div>";

    const expected = "<div @if ($a) {{ $foo + $bar + $baz + $qux + $quux }} @endif></div>\n";

    await formatEqual(input, expected);
  });

  it("does not inject marker text for echo-first directive bodies outside attr context", async () => {
    const input = ["@if($a)", "{{ $x }}", "@endif", ""].join("\n");

    const expected = ["@if ($a)", "  {{ $x }}", "@endif", ""].join("\n");

    await formatEqual(input, expected);
  });

  it("does not add an extra blank line before a closing branch when body already contains blank lines", async () => {
    const input = [
      "@if($x)",
      '<div wire:key="{{ $x->id }}">',
      "@unless($u) disabled @endunless",
      "",
      "@unless($u) disabled @endunless",
      "{{{ $z }}}",
      "</div>",
      "@endif",
      "",
    ].join("\n");

    const expected = [
      "@if ($x)",
      '  <div wire:key="{{ $x->id }}">',
      "    @unless ($u) disabled @endunless",
      "",
      "    @unless ($u) disabled @endunless",
      "    {{{ $z }}}",
      "  </div>",
      "@endif",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("preserves directive/echo/php sentinel fragments across block style variants", async () => {
    const input = [
      "<div",
      "@if($x)",
      'data-a="A_SENTINEL" <?php echo $p; ?>',
      "@else",
      'data-b="B_SENTINEL" {{ $q }}',
      "@endif",
      ">{{{ $z }}}</div>",
      "",
    ].join("\n");

    const optionsList = [
      { bladeDirectiveBlockStyle: "preserve" },
      { bladeDirectiveBlockStyle: "multiline" },
      { bladeDirectiveBlockStyle: "inline-if-short" },
      {
        bladeDirectiveBlockStyle: "multiline",
        bladeBlankLinesAroundDirectives: "preserve",
      },
      {
        bladeDirectiveBlockStyle: "multiline",
        bladeBlankLinesAroundDirectives: "always",
      },
    ] as const;

    const fragments = [
      "A_SENTINEL",
      "B_SENTINEL",
      "<?php",
      "{{ $q }}",
      "{{{ $z }}}",
      "@if",
      "@else",
      "@endif",
    ];

    for (const options of optionsList) {
      const output = await format(input, options);
      for (const fragment of fragments) {
        expect(output, `missing fragment: ${fragment}`).toContain(fragment);
      }
    }
  });

  it("preserves wire:key and text fragments in multiline branches across blank-line modes", async () => {
    const input = [
      "@if($x)",
      '<div wire:key="{{ $x->id }}">',
      "disabled-one",
      "",
      "disabled-two",
      "</div>",
      "@else",
      "<p>fallback</p>",
      "@endif",
      "",
    ].join("\n");

    const optionsList = [
      {
        bladeDirectiveBlockStyle: "multiline",
        bladeBlankLinesAroundDirectives: "preserve",
      },
      {
        bladeDirectiveBlockStyle: "multiline",
        bladeBlankLinesAroundDirectives: "always",
      },
    ] as const;

    for (const options of optionsList) {
      const output = await format(input, options);
      expect(output).toContain('wire:key="{{ $x->id }}"');
      expect(output).toContain("disabled-one");
      expect(output).toContain("disabled-two");
      expect(output).toContain("@else");
      expect(output).toContain("@endif");
    }
  });
});
