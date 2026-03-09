import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("directives in attribute context", () => {
  it("@if in attrs preserves directive body attribute content", async () => {
    const input = '<div\n@if($show) class="visible" @endif\n></div>';

    const expected = '<div @if ($show) class="visible" @endif></div>\n';

    await formatEqual(input, expected);
  });

  it("@if/@else in attrs preserves both branch attributes", async () => {
    const input = '<div\n@if($active) class="active" @else class="inactive" @endif\n></div>';

    const expected = '<div @if ($active) class="active" @else class="inactive" @endif></div>\n';

    await formatEqual(input, expected);
  });

  it("@foreach in attrs preserves body content", async () => {
    const input =
      '<select\n@foreach($options as $opt)\noption="{{ $opt }}"\n@endforeach\n></select>';

    const expected = [
      "<select",
      "  @foreach ($options as $opt)",
      '    option="{{ $opt }}"',
      "  @endforeach",
      "></select>",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("nested @if inside @foreach in attrs preserves nested content", async () => {
    const input =
      "<div\n@foreach($items as $item)\n@if($item->selected) selected @endif\n@endforeach\n></div>";

    const expected = [
      "<div",
      "  @foreach ($items as $item)",
      "    @if ($item->selected) selected @endif",
      "  @endforeach",
      "></div>",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("custom trained pair in attrs preserves body content", async () => {
    const input = '<div\n@custom class="special" @endcustom\n></div>';

    const expected = '<div @custom class="special" @endcustom></div>\n';

    await formatEqual(input, expected);
  });

  it("@forelse/@empty in attrs preserves both branches", async () => {
    const input =
      '<div\n@forelse($items as $item)\ndata-item="{{ $item }}"\n@empty\ndata-empty="true"\n@endforelse\n></div>';

    const expected = [
      "<div",
      "  @forelse ($items as $item)",
      '    data-item="{{ $item }}"',
      "  @empty",
      '    data-empty="true"',
      "  @endforelse",
      "></div>",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("@if/@elseif/@else in attrs preserves all branch content", async () => {
    const input =
      '<span\n@if($type === \'success\') class="green" @elseif($type === \'warning\') class="yellow" @else class="red" @endif\n></span>';

    const expected = [
      "<span",
      '  @if ($type === \'success\') class="green" @elseif ($type === \'warning\') class="yellow" @else class="red" @endif',
      "></span>",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("@switch in attrs preserves case/default content", async () => {
    const input =
      '<div\n@switch($size)\n@case(\'sm\') class="w-4" @break\n@case(\'lg\') class="w-8" @break\n@default class="w-6"\n@endswitch\n></div>';

    const expected = [
      "<div",
      "  @switch ($size)",
      "    @case ('sm')",
      '      class="w-4"',
      "      @break",
      "    @case ('lg')",
      '      class="w-8"',
      "      @break",
      "    @default",
      '      class="w-6"',
      "  @endswitch",
      "></div>",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("@unless in attrs preserves body attribute content", async () => {
    const input = '<button\n@unless($disabled) type="submit" @endunless\n></button>';

    const expected = '<button @unless ($disabled) type="submit" @endunless></button>\n';

    await formatEqual(input, expected);
  });

  it("@auth with @can in attrs preserves nested content", async () => {
    const input = "<div\n@auth\n@can('edit', $post) contenteditable @endcan\n@endauth\n></div>";

    const expected = [
      "<div",
      "  @auth",
      "    @can ('edit', $post) contenteditable @endcan",
      "  @endauth",
      "></div>",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("echo in attrs merges into body", async () => {
    const input = '<div\nclass="base"\n{{ $attributes }}\n></div>';

    const expected = '<div class="base" {{ $attributes }}></div>\n';

    await formatEqual(input, expected);
  });

  it("mixed regular attrs and directive block", async () => {
    const input = '<input\ntype="text"\n@if($required) required @endif\nname="field"\n/>';

    const expected = '<input type="text" @if ($required) required @endif name="field" />\n';

    await formatEqual(input, expected);
  });

  it("is idempotent when inline directive body touches terminator", async () => {
    const input = '<div @if($x)class="a"@endif @if($y)id="b"@endif></div>';

    const expected = '<div @if ($x) class="a"@endif @if ($y) id="b"@endif></div>\n';

    await formatEqual(input, expected);
  });

  it("keeps multiline @if/@else attribute branches multiline across passes", async () => {
    const input = '<div\n@if($x)\nclass="a"\n@else\nclass="b"\n@endif\n></div>';

    const expected = [
      "<div",
      "  @if ($x)",
      '    class="a"',
      "  @else",
      '    class="b"',
      "  @endif",
      "></div>",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });
});
