import { describe, expect, it } from "vitest";
import type { Options } from "prettier";
import * as prettier from "prettier";
import bladePlugin from "../../../src/index.js";
import { expectRespectsFormattingInvariants } from "../support/fixture-suite.js";

const SOURCES = [
  `@if ($feature)
<div data-eof="EOF_A">
  <x-card :title="$title">{{ $body }}</x-card>
</div>
@endif
`,
  `<script>
@foreach ($items as $item)
window.queue.push("EOF_B-{{ $item }}")
@endforeach
</script>
`,
  `<style>
.thing {
  background-color: @if ($dark) black @else white @endif;
}
</style>
<p>EOF_C</p>
`,
  `<?php if ($loading): ?>
<span>EOF_D</span>
<?php endif; ?>
`,
  `@php
$config = [
  'name' => "EOF_E",
];
@endphp
{{ $config['name'] }}
`,
];

const PROFILES: Array<{ name: string; options: Options }> = [
  { name: "default", options: {} },
  { name: "php-safe", options: { bladePhpFormatting: "safe", singleQuote: true } },
  {
    name: "tabs-strict",
    options: { useTabs: true, tabWidth: 4, htmlWhitespaceSensitivity: "strict" },
  },
];

function truncationPoints(length: number): number[] {
  const points = new Set<number>();
  const fixed = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  for (const value of fixed) {
    if (value < length) points.add(value);
  }

  const ratios = [0.1, 0.2, 0.33, 0.5, 0.66, 0.8, 0.9, 0.95];
  for (const ratio of ratios) {
    const at = Math.max(1, Math.floor(length * ratio));
    if (at < length) points.add(at);
  }

  if (length > 1) points.add(length - 1);

  return [...points].sort((a, b) => a - b);
}

async function formatPasses(
  input: string,
  options: Options,
): Promise<{ first: string; second: string; third: string; fourth: string }> {
  const formatOptions: Options = {
    parser: "blade",
    plugins: [bladePlugin],
    bladeInlineIntentElements: ["svg", "svg:*"],
    ...options,
  };
  const first = await prettier.format(input, formatOptions);
  const second = await prettier.format(first, formatOptions);
  const third = await prettier.format(second, formatOptions);
  const fourth = await prettier.format(third, formatOptions);
  return { first, second, third, fourth };
}

describe("validation/malformed-eof-cuts", () => {
  for (const [sourceIndex, source] of SOURCES.entries()) {
    const cuts = truncationPoints(source.length);

    for (const cut of cuts) {
      const truncated = source.slice(0, cut);
      const marker = `MEOF_${sourceIndex}_${cut}`;
      const input = `<div data-meof="${marker}">${marker}</div>\n${truncated}\n<p>${marker}</p>\n`;

      for (const profile of PROFILES) {
        it(`source=${sourceIndex} cut=${cut}/${source.length} :: ${profile.name}`, async () => {
          const { first, second, third, fourth } = await formatPasses(input, profile.options);
          const context = `malformed-eof source=${sourceIndex} cut=${cut} profile=${profile.name}`;

          expectRespectsFormattingInvariants(first, profile.options, `${context} pass=1`, {
            checkTrailingWhitespace: false,
          });
          expectRespectsFormattingInvariants(second, profile.options, `${context} pass=2`, {
            checkTrailingWhitespace: false,
          });
          expectRespectsFormattingInvariants(third, profile.options, `${context} pass=3`, {
            checkTrailingWhitespace: false,
          });
          expectRespectsFormattingInvariants(fourth, profile.options, `${context} pass=4`, {
            checkTrailingWhitespace: false,
          });

          const maxAllowedLength = input.length * 10 + 600;
          expect(
            first.length,
            `${context}: pass 1 output growth exceeded sanity bound`,
          ).toBeLessThanOrEqual(maxAllowedLength);
          expect(
            second.length,
            `${context}: pass 2 output growth exceeded sanity bound`,
          ).toBeLessThanOrEqual(maxAllowedLength);
          expect(
            third.length,
            `${context}: pass 3 output growth exceeded sanity bound`,
          ).toBeLessThanOrEqual(maxAllowedLength);
          expect(
            fourth.length,
            `${context}: pass 4 output growth exceeded sanity bound`,
          ).toBeLessThanOrEqual(maxAllowedLength);

          expect(second, `${context}: pass2 drift`).toBe(first);
          expect(third, `${context}: pass3 drift`).toBe(second);
          expect(fourth, `${context}: pass4 drift`).toBe(third);
        });
      }
    }
  }
});
