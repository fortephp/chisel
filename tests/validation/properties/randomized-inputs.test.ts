import { describe, expect, it } from "vitest";
import type { Options } from "prettier";
import { formatWithPasses, wrapInDiv } from "../../helpers.js";
import {
  expectCoreConstructDelimiterSafety,
  expectNoBladePhpConstructLoss,
  expectRespectsFormattingInvariants,
} from "../support/fixture-suite.js";

const DEFAULT_CASE_COUNT = 24;
const DEFAULT_MAX_DEPTH = 4;
const BASE_SEED = 0x5f3759df;

const OPTION_PROFILES: Array<{ name: string; options: Options }> = [
  { name: "default", options: {} },
  {
    name: "inline-intent-plugin-defaults",
    options: { bladeInlineIntentElements: ["p", "svg", "svg:*"] },
  },
  {
    name: "inline-intent-disabled",
    options: { bladeInlineIntentElements: [] },
  },
  {
    name: "php-safe-single-quote",
    options: { bladePhpFormatting: "safe", singleQuote: true },
  },
  {
    name: "tabs-strict",
    options: {
      useTabs: true,
      tabWidth: 4,
      htmlWhitespaceSensitivity: "strict",
      singleAttributePerLine: true,
    },
  },
];

class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    // xorshift32
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  int(maxExclusive: number): number {
    return this.next() % maxExclusive;
  }
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let start = 0;
  for (;;) {
    const at = haystack.indexOf(needle, start);
    if (at < 0) return count;
    count++;
    start = at + needle.length;
  }
}

function buildFragment(rng: Rng, caseId: number, fragmentId: number, marker: string): string {
  const varId = `v${caseId}_${fragmentId}`;
  switch (rng.int(22)) {
    case 0:
      return `<div data-fz="${marker}">${marker}</div>`;
    case 1:
      return `{{ $${varId} ?? "${marker}" }}`;
    case 2:
      return `{!! $${varId} ?? "${marker}" !!}`;
    case 3:
      return `{{{ $${varId} ?? "${marker}" }}}`;
    case 4:
      return `@if ($cond_${caseId}_${fragmentId})\n<span>${marker}</span>\n@endif`;
    case 5:
      return `@foreach ($items_${caseId}_${fragmentId} as $item_${caseId}_${fragmentId})\n<i>{{ $item_${caseId}_${fragmentId} }}</i>\n@endforeach`;
    case 6:
      return `<?php $${varId} = "${marker}"; ?>`;
    case 7:
      return `@php\n$${varId} = "${marker}";\n@endphp`;
    case 8:
      return `{{-- ${marker} --}}`;
    case 9:
      return `@verbatim\n<div>${marker} {{ untouched_${caseId}_${fragmentId} }}</div>\n@endverbatim`;
    case 10:
      return `<x-card :title="'${marker}'" :count="$count_${caseId}_${fragmentId}">{{ $slot_${caseId}_${fragmentId} ?? '${marker}' }}</x-card>`;
    case 11:
      return `<script>var ${varId} = "${marker}";</script>`;
    case 12:
      return `<style>.${varId} { content: "${marker}" }</style>`;
    case 13:
      return `<script>const token_${varId} = "@encoding"; const value_${varId} = @foo($${varId})</script>`;
    case 14:
      return `<script>// @encoding\nconst value_${varId} = @foo($${varId})</script>`;
    case 15:
      return `<script>const token_${varId} = \`@encoding\`;\nconst value_${varId} = @foo($${varId})</script>`;
    case 16:
      return `<script>const known_${varId} = "@if"; const knownEnd_${varId} = "@endif";</script>`;
    case 17:
      return `<script>// @if @endif\nconst literal_${varId} = \`@if @endif\`;</script>`;
    case 18:
      return `<style>.${varId}::before { content: "@if"; } .${varId}::after { content: "@endif"; } /* @if @endif */</style>`;
    case 19:
      return `<style>.${varId} { background: url(http://example.com/${varId}); content: @foo($${varId}) }</style>`;
    case 20:
      return `<style>.${varId} { content: @if($${varId}) red @else blue @endif }</style>`;
    default:
      return `@if ($broken_${caseId}_${fragmentId})\n<p>${marker}`;
  }
}

function generateRandomInput(caseId: number): { input: string; markers: string[] } {
  const rng = new Rng((BASE_SEED + caseId * 7919) >>> 0);
  const fragmentCount = 8 + rng.int(10);
  const parts: string[] = [];
  const markers: string[] = [];

  for (let fragmentId = 0; fragmentId < fragmentCount; fragmentId++) {
    const marker = `FZ_MARK_${caseId}_${fragmentId}`;
    markers.push(marker);
    parts.push(buildFragment(rng, caseId, fragmentId, marker));
  }

  const trailingMarker = `FZ_TRAIL_${caseId}`;
  markers.push(trailingMarker);
  parts.push(`<p>${trailingMarker}</p>`);

  let input = `${parts.join("\n\n")}\n`;
  const depth = rng.int(DEFAULT_MAX_DEPTH + 1);
  if (depth > 0) {
    input = wrapInDiv(input, depth);
  }

  return { input, markers };
}

describe("validation/randomized-inputs", () => {
  const caseCount = parsePositiveInt(
    process.env.VALIDATION_RANDOM_INPUT_CASE_COUNT,
    DEFAULT_CASE_COUNT,
  );

  it(`keeps marker and blade/php construct counts stable across ${caseCount} randomized fixtures`, async () => {
    for (let caseId = 0; caseId < caseCount; caseId++) {
      const { input, markers } = generateRandomInput(caseId);

      for (const profile of OPTION_PROFILES) {
        const output = await formatWithPasses(input, profile.options, {
          passes: 3,
          assertIdempotent: true,
        });
        const context = `randomized-input case=${caseId} profile=${profile.name}`;

        expectCoreConstructDelimiterSafety(input, output, context);
        expectNoBladePhpConstructLoss(input, output, context);
        expectRespectsFormattingInvariants(output, profile.options, context);

        for (const marker of markers) {
          expect(
            countOccurrences(output, marker),
            `${context}: marker count drifted for ${marker}`,
          ).toBe(countOccurrences(input, marker));
        }
      }
    }
  }, 120_000);
});
