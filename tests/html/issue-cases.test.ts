import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/issue-cases", () => {
  it("keeps li elements inside Alpine templates nested under the template", async () => {
    const input = `<ul>
    <li x-show="tab === 'a'" class="mt-2">
        <template x-for="thread in threads">
            <li class="cursor-default select-none px-4 py-2 hover:bg-lio-100" :id="\`option-\${thread.id}\`" role="option" tabindex="-1">
                <a :href="'/forum/'+thread.slug" class="flex flex-col">
                    <span x-html="thread.value"></span>
                </a>
            </li>
        </template>
    </li>
</ul>
`;

    const expected = `<ul>
  <li x-show="tab === 'a'" class="mt-2">
    <template x-for="thread in threads">
      <li
        class="cursor-default select-none px-4 py-2 hover:bg-lio-100"
        :id="\`option-\${thread.id}\`"
        role="option"
        tabindex="-1"
      >
        <a :href="'/forum/' + thread.slug" class="flex flex-col">
          <span x-html="thread.value"></span>
        </a>
      </li>
    </template>
  </li>
</ul>
`;

    await formatEqual(input, expected);
  });

  it("does not let template-contained optional tags escape while list siblings still auto-close", async () => {
    const input = `<ul>
    <li>
        Outer
        <template x-if="show">
            <li x-text="item"></li>
        </template>
    <li>Next
</ul>
`;

    const expected = `<ul>
  <li>
    Outer
    <template x-if="show">
      <li x-text="item"></li>
    </template>
  <li>Next
</ul>
`;

    await formatEqual(input, expected);
  });

  it("keeps template-contained optional tags stable inside deeper nesting", async () => {
    const input = `<section>
    <div class="panel">
        <ul>
            <li>
                Outer
                <template x-if="show">
                    <li x-text="item"></li>
                </template>
            <li>Next
        </ul>
    </div>
</section>
`;

    const expected = `<section>
  <div class="panel">
    <ul>
      <li>
        Outer
        <template x-if="show">
          <li x-text="item"></li>
        </template>
      <li>Next
    </ul>
  </div>
</section>
`;

    await formatEqual(input, expected);
  });

  it("keeps shared content aligned between conditionally split wrapper tags", async () => {
    const input = `<div class="relative inline-block">
    @unless ($unlinked)
        <a href="{{ $url }}">
    @endunless

    <flux:avatar src="{{ $src }}" />

    @unless ($unlinked)
        </a>
    @endunless
</div>
`;

    const expected = `<div class="relative inline-block">
  @unless ($unlinked)
    <a href="{{ $url }}">
  @endunless

  <flux:avatar src="{{ $src }}" />

  @unless ($unlinked)
    </a>
  @endunless
</div>
`;

    await formatEqual(input, expected);
  });

  it("keeps split wrapper recovery aligned inside deeper nesting", async () => {
    const input = `<section>
    <div class="stack">
        <div class="relative inline-block">
            @unless ($unlinked)
                <a href="{{ $url }}">
            @endunless

            <flux:avatar src="{{ $src }}" />

            @unless ($unlinked)
                </a>
            @endunless
        </div>
    </div>
</section>
`;

    const expected = `<section>
  <div class="stack">
    <div class="relative inline-block">
      @unless ($unlinked)
        <a href="{{ $url }}">
      @endunless

      <flux:avatar src="{{ $src }}" />

      @unless ($unlinked)
        </a>
      @endunless
    </div>
  </div>
</section>
`;

    await formatEqual(input, expected);
  });

  it("keeps shared content aligned between alternate conditionally split wrapper tags", async () => {
    const input = `<div>
    @if ($linked)
        <a href="{{ $url }}">
    @else
        <button type="button">
    @endif

    <span>{{ $slot }}</span>

    @if ($linked)
        </a>
    @else
        </button>
    @endif
</div>
`;

    const expected = `<div>
  @if ($linked)
    <a href="{{ $url }}">
  @else
    <button type="button">
  @endif

  <span>{{ $slot }}</span>

  @if ($linked)
    </a>
  @else
    </button>
  @endif
</div>
`;

    await formatEqual(input, expected);
  });

  it("formats regular conditionally wrapped pairs without recovery indentation", async () => {
    const input = `<div class="relative inline-block">
    @unless ($unlinked)
        <a href="{{ $url }}">
            <flux:avatar src="{{ $src }}" />
        </a>
    @endunless
</div>
`;

    const expected = `<div class="relative inline-block">
  @unless ($unlinked)
    <a href="{{ $url }}">
      <flux:avatar src="{{ $src }}" />
    </a>
  @endunless
</div>
`;

    await formatEqual(input, expected);
  });

  it("does not preserve one-sided line padding when collapsing dynamic-attribute button content", async () => {
    const input = `<button type="submit" {{ $attributes }}>
    {{ $slot }}
</button>
`;

    const expected = `<button type="submit" {{ $attributes }}>{{ $slot }}</button>
`;

    await formatEqual(input, expected);
  });

  it("collapses nested dynamic-attribute block content without changing inline padding rules", async () => {
    const input = `<section>
    <form>
        <button type="submit" {{ $attributes }}>
            {{ $slot }}
        </button>
        <span {{ $attributes }}>
            {{ $label }}
        </span>
    </form>
</section>
`;

    const expected = `<section>
  <form>
    <button type="submit" {{ $attributes }}>{{ $slot }}</button>
    <span {{ $attributes }}> {{ $label }} </span>
  </form>
</section>
`;

    await formatEqual(input, expected);
  });

  it("formats dynamic-attribute button content consistently when attributes break", async () => {
    const input = `<button type="submit" {{ $attributes }}>
    {{ $slot }}
</button>
`;

    const expected = `<button
  type="submit"
  {{ $attributes }}
>
  {{ $slot }}
</button>
`;

    await formatEqual(input, expected, { singleAttributePerLine: true });
  });

  it("does not preserve one-sided line padding when single-attribute-per-line leaves a dynamic-attribute button flat", async () => {
    const input = `<button {{ $attributes }}>
    {{ $slot }}
</button>
`;

    const expected = `<button {{ $attributes }}>{{ $slot }}</button>
`;

    await formatEqual(input, expected, { singleAttributePerLine: true });
  });

  it("collapses nested dynamic-attribute block content with single-attribute-per-line enabled", async () => {
    const input = `<section>
    <form>
        <button {{ $attributes }}>
            {{ $slot }}
        </button>
    </form>
</section>
`;

    const expected = `<section>
  <form>
    <button {{ $attributes }}>{{ $slot }}</button>
  </form>
</section>
`;

    await formatEqual(input, expected, { singleAttributePerLine: true });
  });

  it("still preserves line padding for dynamic-attribute inline content", async () => {
    const input = `<span {{ $attributes }}>
    {{ $slot }}
</span>
`;

    const expected = `<span {{ $attributes }}> {{ $slot }} </span>
`;

    await formatEqual(input, expected);
  });
});
