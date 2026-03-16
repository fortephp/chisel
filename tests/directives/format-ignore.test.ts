import { describe, expect, it } from "vitest";
import { formatEqual, hasLoneLf } from "../helpers.js";

describe("directives/format-ignore", () => {
  it("treats Blade format-ignore-start/end as range ignore markers", async () => {
    const input = `{{-- format-ignore-start --}}
<div   class="x"   ><span> hi </span></div>
{{-- format-ignore-end --}}
<div   class="x"   ><span> hi </span></div>
`;

    const expected = `{{-- format-ignore-start --}}
<div   class="x"   ><span> hi </span></div>
{{-- format-ignore-end --}}
<div class="x"><span> hi </span></div>
`;

    await formatEqual(input, expected);
  });

  it("supports inline Blade range ignore markers", async () => {
    const input = `{{-- format-ignore-start --}}<div   class="x"   ></div>{{-- format-ignore-end --}}
<div   class="x"   ></div>
`;

    const expected = `{{-- format-ignore-start --}}<div   class="x"   ></div>{{-- format-ignore-end --}}
<div class="x"></div>
`;

    await formatEqual(input, expected);
  });

  it("preserves inline format-ignore ranges across ignored siblings", async () => {
    const input = `{{-- format-ignore-start --}}@csrf('item')*{{-- format-ignore-end --}}
`;

    const expected = `{{-- format-ignore-start --}}@csrf('item')*{{-- format-ignore-end --}}
`;

    await formatEqual(input, expected);
  });

  it("works when format-ignore-end is at end of file", async () => {
    const input = `<div>
    text A</div>
{{-- format-ignore-start --}}
<div>
    text B</div>
{{-- format-ignore-end --}}
`;

    const expected = `<div>text A</div>
{{-- format-ignore-start --}}
<div>
    text B</div>
{{-- format-ignore-end --}}
`;

    await formatEqual(input, expected);
  });

  it("works when format-ignore-start has no matching end", async () => {
    const input = `<div>
    text A</div>
{{-- format-ignore-start --}}
<div>
    text B</div>
`;

    const expected = `<div>text A</div>
{{-- format-ignore-start --}}
<div>
    text B</div>
`;

    await formatEqual(input, expected);
  });

  it("accepts prettier-ignore-start/end inside Blade comments", async () => {
    const input = `{{-- prettier-ignore-start --}}
<div   class="x"   ><span> hi </span></div>
{{-- prettier-ignore-end --}}
<div   class="x"   ><span> hi </span></div>
`;

    const expected = `{{-- prettier-ignore-start --}}
<div   class="x"   ><span> hi </span></div>
{{-- prettier-ignore-end --}}
<div class="x"><span> hi </span></div>
`;

    await formatEqual(input, expected);
  });

  it("preserves inline prettier-ignore ranges across ignored siblings", async () => {
    const input = `{{-- prettier-ignore-start --}}@csrf('item')*{{-- prettier-ignore-end --}}
`;

    const expected = `{{-- prettier-ignore-start --}}@csrf('item')*{{-- prettier-ignore-end --}}
`;

    await formatEqual(input, expected);
  });

  it("preserves format-ignore ranges inside directive bodies", async () => {
    const input = `@fields('section1_words')
   {{-- format-ignore-start --}}<span class="word overflow-hidden">@sub('item')*</span>{{-- format-ignore-end --}}
@endfields
`;

    const expected = `@fields ('section1_words')
  {{-- format-ignore-start --}}<span class="word overflow-hidden">@sub('item')*</span>{{-- format-ignore-end --}}
@endfields
`;

    await formatEqual(input, expected);
  });

  it("preserves inline format-ignore ranges across ignored siblings inside directive bodies", async () => {
    const input = `@fields('section1_words')
   {{-- format-ignore-start --}}@csrf('item')*{{-- format-ignore-end --}}
@endfields
`;

    const expected = `@fields ('section1_words')
  {{-- format-ignore-start --}}@csrf('item')*{{-- format-ignore-end --}}
@endfields
`;

    await formatEqual(input, expected);
  });

  it("accepts prettier-ignore-start/end inside directive bodies", async () => {
    const input = `@fields('section1_words')
   {{-- prettier-ignore-start --}}<span class="word overflow-hidden">@sub('item')*</span>{{-- prettier-ignore-end --}}
@endfields
`;

    const expected = `@fields ('section1_words')
  {{-- prettier-ignore-start --}}<span class="word overflow-hidden">@sub('item')*</span>{{-- prettier-ignore-end --}}
@endfields
`;

    await formatEqual(input, expected);
  });

  it("preserves inline prettier-ignore ranges across ignored siblings inside directive bodies", async () => {
    const input = `@fields('section1_words')
   {{-- prettier-ignore-start --}}@csrf('item')*{{-- prettier-ignore-end --}}
@endfields
`;

    const expected = `@fields ('section1_words')
  {{-- prettier-ignore-start --}}@csrf('item')*{{-- prettier-ignore-end --}}
@endfields
`;

    await formatEqual(input, expected);
  });

  it("preserves multiline format-ignore ranges inside directive bodies", async () => {
    const input = `@fields('section1_words')
   {{-- format-ignore-start --}}
     <span class="word overflow-hidden">
        @sub('item')
      *</span
    >
   {{-- format-ignore-end --}}
@endfields
`;

    const expected = `@fields ('section1_words')
  {{-- format-ignore-start --}}
  <span class="word overflow-hidden">
        @sub('item')
      *</span
    >
  {{-- format-ignore-end --}}
@endfields
`;

    await formatEqual(input, expected);
  });

  it("accepts multiline prettier-ignore-start/end inside directive bodies", async () => {
    const input = `@fields('section1_words')
   {{-- prettier-ignore-start --}}
     <span class="word overflow-hidden">
        @sub('item')
      *</span
    >
   {{-- prettier-ignore-end --}}
@endfields
`;

    const expected = `@fields ('section1_words')
  {{-- prettier-ignore-start --}}
  <span class="word overflow-hidden">
        @sub('item')
      *</span
    >
  {{-- prettier-ignore-end --}}
@endfields
`;

    await formatEqual(input, expected);
  });

  it("preserves format-ignore ranges inside nested directive bodies", async () => {
    const input = `@fields('section1_words')
@if($outer)
@unless($inner)
   {{-- format-ignore-start --}}<span class="word overflow-hidden">@sub('item')*</span>{{-- format-ignore-end --}}
@endunless
@endif
@endfields
`;

    const expected = `@fields ('section1_words')
  @if ($outer)
    @unless ($inner)
      {{-- format-ignore-start --}}<span class="word overflow-hidden">@sub('item')*</span>{{-- format-ignore-end --}}
    @endunless
  @endif
@endfields
`;

    await formatEqual(input, expected);
  });

  it("accepts prettier-ignore ranges inside nested directive bodies", async () => {
    const input = `@fields('section1_words')
@if($outer)
@unless($inner)
   {{-- prettier-ignore-start --}}<span class="word overflow-hidden">@sub('item')*</span>{{-- prettier-ignore-end --}}
@endunless
@endif
@endfields
`;

    const expected = `@fields ('section1_words')
  @if ($outer)
    @unless ($inner)
      {{-- prettier-ignore-start --}}<span class="word overflow-hidden">@sub('item')*</span>{{-- prettier-ignore-end --}}
    @endunless
  @endif
@endfields
`;

    await formatEqual(input, expected);
  });

  it("preserves single format-ignore markers inside directive bodies", async () => {
    const input = `@fields('section1_words')
   {{-- format-ignore --}}<span class="word overflow-hidden">@sub('item')*</span>
@endfields
`;

    const expected = `@fields ('section1_words')
  {{-- format-ignore --}}
  <span class="word overflow-hidden">@sub('item')*</span>
@endfields
`;

    await formatEqual(input, expected);
  });

  it("accepts single prettier-ignore markers inside directive bodies", async () => {
    const input = `@fields('section1_words')
   {{-- prettier-ignore --}}<span class="word overflow-hidden">@sub('item')*</span>
@endfields
`;

    const expected = `@fields ('section1_words')
  {{-- prettier-ignore --}}
  <span class="word overflow-hidden">@sub('item')*</span>
@endfields
`;

    await formatEqual(input, expected);
  });

  for (const ignoreLabel of ["format-ignore", "prettier-ignore"] as const) {
    it(`preserves ${ignoreLabel} ranges inside element content with mixed siblings`, async () => {
      const input = `<div>
  <span>{{-- ${ignoreLabel}-start --}}@csrf('item'){{ $label }}{!! $html !!}{{{ $legacy }}}*{{-- ${ignoreLabel}-end --}}</span>
</div>
`;

      const expected = `<div>
  <span>
    {{-- ${ignoreLabel}-start --}}@csrf('item'){{ $label }}{!! $html !!}{{{ $legacy }}}*{{-- ${ignoreLabel}-end --}}
  </span>
</div>
`;

      await formatEqual(input, expected);
    });

    it(`preserves inline ${ignoreLabel} ranges across directive and echo siblings at root`, async () => {
      const input = `{{-- ${ignoreLabel}-start --}}@csrf('item'){{ $label }}*{{-- ${ignoreLabel}-end --}}
<div   class="x"   ></div>
`;

      const expected = `{{-- ${ignoreLabel}-start --}}@csrf('item'){{ $label }}*{{-- ${ignoreLabel}-end --}}
<div class="x"></div>
`;

      await formatEqual(input, expected);
    });

    it(`preserves multiple ${ignoreLabel} ranges in one directive body`, async () => {
      const input = `@section('content')
   {{-- ${ignoreLabel}-start --}}@csrf('a')*{{-- ${ignoreLabel}-end --}}
   <div   class="x"   ></div>
   {{-- ${ignoreLabel}-start --}}{{ $item }}{!! $raw !!}{{-- ${ignoreLabel}-end --}}
@endsection
`;

      const expected = `@section ('content')
  {{-- ${ignoreLabel}-start --}}@csrf('a')*{{-- ${ignoreLabel}-end --}}
  <div class="x"></div>
  {{-- ${ignoreLabel}-start --}}{{ $item }}{!! $raw !!}{{-- ${ignoreLabel}-end --}}
@endsection
`;

      await formatEqual(input, expected);
    });

    it(`preserves ${ignoreLabel} ranges through section/foreach/if nesting`, async () => {
      const input = `@section('content')
@foreach($items as $item)
@if($loop->first)
   {{-- ${ignoreLabel}-start --}}@csrf('item'){{ $item->label }}*{{-- ${ignoreLabel}-end --}}
@endif
@endforeach
@endsection
`;

      const expected = `@section ('content')
  @foreach ($items as $item)
    @if ($loop->first)
      {{-- ${ignoreLabel}-start --}}@csrf('item'){{ $item->label }}*{{-- ${ignoreLabel}-end --}}
    @endif
  @endforeach
@endsection
`;

      await formatEqual(input, expected);
    });

    it(`preserves ${ignoreLabel} ranges immediately before else branches`, async () => {
      const input = `@if($ready)
   {{-- ${ignoreLabel}-start --}}@csrf('item'){{ $value }}*{{-- ${ignoreLabel}-end --}}
@else
   <div   class="x"   ></div>
@endif
`;

      const expected = `@if ($ready)
  {{-- ${ignoreLabel}-start --}}@csrf('item'){{ $value }}*{{-- ${ignoreLabel}-end --}}
@else
  <div class="x"></div>
@endif
`;

      await formatEqual(input, expected);
    });

    it(`preserves ${ignoreLabel} ranges immediately before switch cases`, async () => {
      const input = `@switch($state)
@case('ready')
   {{-- ${ignoreLabel}-start --}}@csrf('item'){{ $value }}*{{-- ${ignoreLabel}-end --}}
@case('done')
   <div   class="x"   ></div>
@endswitch
`;

      const expected = `@switch ($state)
  @case ('ready')
    {{-- ${ignoreLabel}-start --}}@csrf('item'){{ $value }}*{{-- ${ignoreLabel}-end --}}
  @case ('done')
    <div class="x"></div>
@endswitch
`;

      await formatEqual(input, expected);
    });

    it(`preserves multiline ${ignoreLabel} ranges inside switch case bodies`, async () => {
      const input = `@switch($state)
@case('ready')
   {{-- ${ignoreLabel}-start --}}
@csrf('item')
{{ $slot }}
*
   {{-- ${ignoreLabel}-end --}}
   @break
@endswitch
`;

      const expected = `@switch ($state)
  @case ('ready')
    {{-- ${ignoreLabel}-start --}}
    @csrf('item')
{{ $slot }}
*
    {{-- ${ignoreLabel}-end --}}
    @break
@endswitch
`;

      await formatEqual(input, expected);
    });

    it(`preserves ${ignoreLabel} ranges with CRLF line endings`, async () => {
      const input =
        `@fields('section1_words')\r\n` +
        `   {{-- ${ignoreLabel}-start --}}\r\n` +
        `    @csrf('item')\r\n` +
        `    {{ $slot }}\r\n` +
        `   {{-- ${ignoreLabel}-end --}}\r\n` +
        `@endfields\r\n`;

      const expected =
        `@fields ('section1_words')\r\n` +
        `  {{-- ${ignoreLabel}-start --}}\r\n` +
        `  @csrf('item')\r\n` +
        `    {{ $slot }}\r\n` +
        `  {{-- ${ignoreLabel}-end --}}\r\n` +
        `@endfields\r\n`;

      const output = await formatEqual(input, expected, { endOfLine: "crlf" });
      expect(hasLoneLf(output)).toBe(false);
    });
  }
});
