import { describe, expect, it } from "vitest";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { formatWithPasses } from "../helpers.js";

describe("options/svg-inline-stability", () => {
  it("is idempotent for svg with multiple child paths", async () => {
    const input = `<div><svg><path d="M0 0" /><path d="M1 1" /></svg></div>\n`;
    const output = await formatWithPasses(input, {}, { passes: 3, assertIdempotent: true });
    const expected = `<div>
  <svg>
    <path d="M0 0" />
    <path d="M1 1" />
  </svg>
</div>
`;

    expect(output).toBe(expected);
  });

  it("is idempotent for svg opening tags with blade echo attrs in php-safe mode", async () => {
    const input = `<svg {{ $attributes->class("absolute inset-0") }} xmlns="http://www.w3.org/2000/svg" version="1.1">\n{{ $slot }}\n</svg>\n`;
    const output = await formatWithPasses(
      input,
      {
        plugins: [bladePlugin, phpPlugin],
        bladePhpFormatting: "safe",
      },
      { passes: 3, assertIdempotent: true },
    );
    const expected = `<svg
  {{
    $attributes->class(
      "absolute inset-0",
    )
  }}
  xmlns="http://www.w3.org/2000/svg"
  version="1.1"
>
  {{ $slot }}
</svg>
`;

    expect(output).toBe(expected);
  });

  it("is idempotent for dotted component tags with inline svg children", async () => {
    const input = `<x:widget.wrapper>\n  <x:widget.button data-action="toggle">\n    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3h12" /><path d="M3 9h12" /><path d="M3 15h12" /></svg>\n  </x:widget.button>\n</x:widget.wrapper>\n`;
    const output = await formatWithPasses(input, {}, { passes: 3, assertIdempotent: true });
    const expected = `<x:widget.wrapper>
  <x:widget.button data-action="toggle">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 3h12" />
      <path d="M3 9h12" />
      <path d="M3 15h12" />
    </svg>
  </x:widget.button>
</x:widget.wrapper>
`;
    expect(output).toBe(expected);
  });

  it("is idempotent when svg inline intent is removed", async () => {
    const input = `<x:widget.icon>\n  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M14.1667 5H2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>\n</x:widget.icon>\n`;
    const output = await formatWithPasses(
      input,
      { bladeInlineIntentElements: [] },
      { passes: 3, assertIdempotent: true },
    );
    const expected = `<x:widget.icon>
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M14.1667 5H2.5"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</x:widget.icon>
`;
    expect(output).toBe(expected);
  });
});
