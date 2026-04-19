import { describe, expect, it } from "vitest";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { format, formatWithPasses, leadingIndent, wrapInDiv } from "../helpers.js";

const BLADE_COMPONENT_TAGS = [
  "x-card",
  "x:card",
  "s-collection",
  "s:collection",
  "statamic:collection",
  "livewire-widget",
  "livewire:widget",
  "native-input",
  "native:input",
] as const;

function expectWrappedSrcIndentation(output: string): void {
  const lines = output.replace(/\r\n/g, "\n").split("\n");
  const srcIndex = lines.findIndex((line) => line.includes(':src="'));
  expect(srcIndex).toBeGreaterThanOrEqual(0);

  const srcLine = lines[srcIndex];
  const inline = srcLine.includes("filament()->getTenantAvatarUrl(");

  const callIndex = inline ? srcIndex : srcIndex + 1;
  const tenantIndex = callIndex + 1;
  const closeIndex = callIndex + 2;

  expect(lines[callIndex]).toContain("filament()->getTenantAvatarUrl(");
  expect(lines[tenantIndex].trim()).toBe("$tenant,");
  expect(lines[closeIndex].trim()).toBe(")");
  const closeIndent = leadingIndent(lines[closeIndex]);
  const callIndent = leadingIndent(lines[callIndex]);
  const tenantIndent = leadingIndent(lines[tenantIndex]);

  expect(callIndent).toBeGreaterThan(0);
  expect(tenantIndent).toBeGreaterThan(0);
  expect(closeIndent).toBeGreaterThanOrEqual(0);

  if (!inline) {
    expect(lines[srcIndex].trim()).toBe(':src="');
    const quoteClose = lines[closeIndex + 1];
    expect(quoteClose?.trim()).toBe('"');
    expect(leadingIndent(quoteClose)).toBeLessThanOrEqual(callIndent);
  }
}

function expectWrappedBreadcrumbsIndentation(output: string): void {
  const lines = output.replace(/\r\n/g, "\n").split("\n");
  const attrIndex = lines.findIndex((line) => line.includes(":breadcrumbs="));
  expect(attrIndex).toBeGreaterThanOrEqual(0);
  const openIndex = lines[attrIndex].includes("[")
    ? attrIndex
    : lines.findIndex((line, index) => index > attrIndex && line.trim() === "[");
  expect(openIndex).toBeGreaterThanOrEqual(0);

  const closeIndex = lines.findIndex(
    (line, index) => index > openIndex && (line.trim() === ']"' || line.trim() === "]"),
  );
  expect(closeIndex).toBeGreaterThan(openIndex);

  const nestedArrayIndex = lines.findIndex(
    (line, index) => index > openIndex && index < closeIndex && line.trim() === "[",
  );
  const titleIndex = lines.findIndex(
    (line, index) =>
      index > openIndex &&
      index < closeIndex &&
      line.includes("title") &&
      line.includes("Shortener") &&
      line.includes("=>"),
  );
  const nestedCloseIndex = lines.findIndex(
    (line, index) => index > openIndex && index < closeIndex && line.trim() === "],",
  );

  expect(nestedArrayIndex).toBeGreaterThan(openIndex);
  expect(titleIndex).toBeGreaterThan(nestedArrayIndex);
  expect(nestedCloseIndex).toBeGreaterThan(titleIndex);

  const nestedArrayIndent = leadingIndent(lines[nestedArrayIndex]);
  const titleIndent = leadingIndent(lines[titleIndex]);
  const nestedCloseIndent = leadingIndent(lines[nestedCloseIndex]);
  const closeIndent = leadingIndent(lines[closeIndex]);

  expect(nestedArrayIndent).toBeGreaterThan(0);
  expect(titleIndent).toBeGreaterThanOrEqual(nestedArrayIndent);
  expect(nestedCloseIndent).toBeGreaterThanOrEqual(nestedArrayIndent);
  expect(closeIndent).toBeGreaterThan(0);
  expect(closeIndent).toBeLessThanOrEqual(nestedArrayIndent);
}

describe("options/bound-attribute-delegation", () => {
  for (const tag of BLADE_COMPONENT_TAGS) {
    it(`formats :bound attr values as PHP on Blade component <${tag}>`, async () => {
      const input = `<${tag} :title="$user->name??$fallback" />\n`;
      const output = await format(input, {
        plugins: [bladePlugin, phpPlugin],
        bladePhpFormatting: "safe",
      });

      expect(output).toContain(`:title="$user->name ?? $fallback"`);
    });
  }

  it("does not PHP-format :bound attrs on Blade components when bladePhpFormatting is off", async () => {
    const input = `<x-card :title="$user->name??$fallback" />\n`;
    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "off",
    });

    expect(output).toContain(`:title="$user->name??$fallback"`);
  });

  it("supports custom Blade component prefixes for :bound attr PHP delegation", async () => {
    const dashInput = '<widget-card :title="$user->name??$fallback" />\n';
    const colonInput = '<widget:card :title="$user->name??$fallback" />\n';
    const dashOutput = await format(dashInput, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      bladeComponentPrefixes: ["widget"],
    });
    const colonOutput = await format(colonInput, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      bladeComponentPrefixes: ["widget"],
    });

    expect(dashOutput).toContain(':title="$user->name ?? $fallback"');
    expect(colonOutput).toContain(':title="$user->name ?? $fallback"');
  });

  it("formats :bound attr values as JS on non-Blade elements", async () => {
    const input = `<div :title="foo===null?bar:baz"></div>\n`;
    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      singleQuote: true,
    });

    expect(output).toContain(`:title="foo === null ? bar : baz"`);
  });

  it("keeps non-JS :bound attr values unchanged on non-Blade elements", async () => {
    const input = `<div :title="$user->name"></div>\n`;
    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      singleQuote: true,
    });

    expect(output).toContain(`:title="$user->name"`);
  });

  it("still formats Alpine/Vue-style :bound attrs as JS", async () => {
    const input =
      '<div x-data="{open:false}" :class="{active:open}" :title="foo===null?bar:baz"></div>\n';
    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      singleQuote: true,
    });

    expect(output).toContain('x-data="{ open: false }"');
    expect(output).toContain(':class="{ active: open }"');
    expect(output).toContain(':title="foo === null ? bar : baz"');
  });

  it("skips delegated formatting for :bound attrs containing Blade interpolation", async () => {
    const input = '<x-card :title="{{ $label }}"></x-card>\n';
    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
    });

    expect(output).toContain(':title="{{ $label }}"');
  });

  it("skips delegated formatting for :bound attrs containing Blade raw echoes", async () => {
    const input = '<x-card :title="{!! $raw !!}"></x-card>\n';
    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
    });

    expect(output).toContain(':title="{!! $raw !!}"');
  });

  it("skips delegated formatting for :bound attrs containing Blade comments", async () => {
    const input = '<x-card :title="{{-- cmt --}}"></x-card>\n';
    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
    });

    expect(output).toContain(':title="{{-- cmt --}}"');
  });

  it("leaves bound attrs containing Blade @directives untouched (PHP-parser rejection)", async () => {
    const input = `<x-card :title="@if($a) 'x' @else 'y' @endif"></x-card>\n`;
    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
    });

    expect(output).toContain(`:title="@if($a) 'x' @else 'y' @endif"`);
  });

  it("is idempotent across nesting depth for mixed Blade/non-Blade :bound attrs", async () => {
    const fixture =
      '<x-card :title="$user->name??$fallback"><div :title="foo===null?bar:baz"></div></x-card>';

    for (let depth = 0; depth <= 8; depth++) {
      const output = await formatWithPasses(
        wrapInDiv(fixture, depth),
        {
          plugins: [bladePlugin, phpPlugin],
          bladePhpFormatting: "safe",
          tabWidth: 2,
          useTabs: false,
        },
        { passes: 4, assertIdempotent: true },
      );

      expect(output).toContain(`:title="$user->name ?? $fallback"`);
      expect(output).toContain(':title="foo === null ? bar : baz"');
    }
  });

  it("keeps wrapped PHP :bound attr values indented relative to the attribute opener", async () => {
    const input = `<x-filament::avatar
        :src="filament()->getTenantAvatarUrl($tenant)"
        {{ $attributes }}
        />
`;

    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      tabWidth: 4,
      printWidth: 40,
    });

    expectWrappedSrcIndentation(output);
  });

  it("keeps wrapped PHP :bound attr values idempotent across nesting depth", async () => {
    const fixture = `<x-filament::avatar
        :src="filament()->getTenantAvatarUrl($tenant)"
        {{ $attributes }}
        />
`;

    for (let depth = 0; depth <= 8; depth++) {
      const output = await formatWithPasses(
        wrapInDiv(fixture, depth),
        {
          plugins: [bladePlugin, phpPlugin],
          bladePhpFormatting: "safe",
          tabWidth: 4,
          printWidth: 40,
        },
        { passes: 4, assertIdempotent: true },
      );

      expectWrappedSrcIndentation(output);
    }
  });

  it("keeps wrapped array-style PHP :bound attrs indented relative to the attribute opener", async () => {
    const input = `@section('content')
    <x-tw::page-header :breadcrumbs="[
            [
                'title' => 'Shortener',
            ],
    ]" />
@endsection
`;

    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
    });

    expectWrappedBreadcrumbsIndentation(output);
  });

  it("does not emit &quot; inside :bound PHP attr values when singleQuote is false (issue #150)", async () => {
    const imageInput = `<x-ui.image :src="$article['image']" />\n`;
    const divInput = `<x-div :title="__('Hello')"></x-div>\n`;

    const imageOutput = await format(imageInput, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      singleQuote: false,
    });
    const divOutput = await format(divInput, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      singleQuote: false,
    });

    expect(imageOutput).not.toContain("&quot;");
    expect(divOutput).not.toContain("&quot;");
    expect(imageOutput).toContain(`:src="$article['image']"`);
    expect(divOutput).toContain(`:title="__('Hello')"`);
  });

  it("produces the same :bound PHP attr output regardless of singleQuote setting (issue #150)", async () => {
    const cases = [
      `<x-ui.image :src="$article['image']" />\n`,
      `<x-div :title="__('Hello')"></x-div>\n`,
    ];

    for (const input of cases) {
      const withSingle = await format(input, {
        plugins: [bladePlugin, phpPlugin],
        bladePhpFormatting: "safe",
        singleQuote: true,
      });
      const withDouble = await format(input, {
        plugins: [bladePlugin, phpPlugin],
        bladePhpFormatting: "safe",
        singleQuote: false,
      });

      expect(withDouble).toBe(withSingle);
      expect(withDouble).not.toContain("&quot;");
    }
  });

  it("normalizes author-written double quotes to single quotes inside :bound PHP attrs (issue #150)", async () => {
    const input = `<x-ui.image :src='$article["image"]' />\n`;

    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      singleQuote: false,
    });

    expect(output).not.toContain("&quot;");
    expect(output).toContain(`:src="$article['image']"`);
  });

  it("swaps to single-quoted wrapper for PHP interpolated strings inside :bound attrs (issue #150)", async () => {
    const input = `<x-div :title='"Hello $name"'></x-div>\n`;

    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      singleQuote: false,
    });

    // PHP interpolation requires double quotes, so the outer attribute wrapper
    // swaps to single quotes to avoid escaping the inner `"..."` to &quot;.
    expect(output).not.toContain("&quot;");
    expect(output).toContain(`:title='"Hello $name"'`);
  });

  it("falls back to double-quoted wrapper with &quot; when value contains both quote kinds", async () => {
    const input = `<x-div :title='"He said \\'hi\\' to $name"'></x-div>\n`;

    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      singleQuote: false,
    });

    // Both `"` and `'` appear in the value, so we keep the default `"..."`
    // wrapper and escape the embedded `"` characters.
    expect(output).toContain(`&quot;`);
    expect(output).toContain(`:title="`);
  });

  it("converges pre-escaped &quot; in source to clean single-quoted PHP literals", async () => {
    const input = `<x-ui.image :src="$article[&quot;image&quot;]" />\n`;

    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      singleQuote: false,
    });

    expect(output).not.toContain("&quot;");
    expect(output).toContain(`:src="$article['image']"`);
  });

  it("handles multiple :bound attrs with mixed quote shapes on one element", async () => {
    const input = `<x-card :a="$x['y']" :b='"Hi $n"' :c="$m" />\n`;

    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      singleQuote: false,
    });

    expect(output).toContain(`:a="$x['y']"`);
    expect(output).toContain(`:b='"Hi $n"'`);
    expect(output).toContain(`:c="$m"`);
  });

  it("treats v-bind: as an alias of : on Blade components (PHP formatting)", async () => {
    const input = `<x-card v-bind:title="$user->name??'x'" />\n`;

    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
    });

    expect(output).toContain(`v-bind:title="$user->name ?? 'x'"`);
  });

  it("treats v-bind: as an alias of : on non-Blade elements (JS formatting)", async () => {
    const input = `<div v-bind:title="foo===null?bar:baz"></div>\n`;

    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      singleQuote: true,
    });

    expect(output).toContain(`v-bind:title="foo === null ? bar : baz"`);
  });

  it("applies the wrapper-swap rule to v-bind: PHP interpolated strings", async () => {
    const input = `<x-div v-bind:label='"Hello $name"'></x-div>\n`;

    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      singleQuote: false,
    });

    expect(output).not.toContain("&quot;");
    expect(output).toContain(`v-bind:label='"Hello $name"'`);
  });

  it("skips delegated formatting for v-bind: attrs containing Blade interpolation", async () => {
    const input = '<x-card v-bind:title="{{ $label }}"></x-card>\n';

    const output = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
    });

    expect(output).toContain('v-bind:title="{{ $label }}"');
  });

  it("preserves Vue v-bind: and : modifier syntax (e.g. .sync)", async () => {
    const vbindInput = `<x-card v-bind:title.sync="$user->name??'x'" />\n`;
    const colonInput = `<x-card :title.sync="$user->name??'x'" />\n`;

    const vbindOutput = await format(vbindInput, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
    });
    const colonOutput = await format(colonInput, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
    });

    expect(vbindOutput).toContain(`v-bind:title.sync="$user->name ?? 'x'"`);
    expect(colonOutput).toContain(`:title.sync="$user->name ?? 'x'"`);
  });

  it("keeps wrapped array-style PHP :bound attrs idempotent across nesting depth", async () => {
    const fixture = `<x-tw::page-header :breadcrumbs="[
            [
                'title' => 'Shortener',
            ],
    ]" />
`;

    for (let depth = 0; depth <= 8; depth++) {
      const output = await formatWithPasses(
        wrapInDiv(fixture, depth),
        {
          plugins: [bladePlugin, phpPlugin],
          bladePhpFormatting: "safe",
          singleQuote: true,
        },
        { passes: 4, assertIdempotent: true },
      );

      expectWrappedBreadcrumbsIndentation(output);
    }
  });
});
