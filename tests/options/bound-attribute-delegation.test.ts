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
