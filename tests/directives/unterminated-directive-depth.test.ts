import { describe, expect, it } from "vitest";
import type { Options } from "prettier";
import { formatWithPasses, wrapInDiv } from "../helpers.js";
import {
  expectCoreConstructDelimiterSafety,
  expectNoBladePhpConstructLoss,
} from "../validation/support/fixture-suite.js";

const MAX_DEPTH = 10;
const BASE_INPUT = `@if ($this->author(""))
<p>Hello world`;

const OPTION_PROFILES: Array<{ name: string; options: Options }> = [
  { name: "default", options: {} },
  {
    name: "php-safe-single-quote",
    options: { bladePhpFormatting: "safe", singleQuote: true },
  },
];

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

describe("directives/unterminated-directive-depth", () => {
  for (const profile of OPTION_PROFILES) {
    it(`does not duplicate unterminated body content across wrapper depths (${profile.name})`, async () => {
      for (let depth = 0; depth <= MAX_DEPTH; depth++) {
        const input = wrapInDiv(BASE_INPUT, depth);
        const output = await formatWithPasses(input, profile.options, {
          passes: 4,
          assertIdempotent: true,
        });
        const context = `${profile.name} depth=${depth}`;

        expect(
          countOccurrences(output, "Hello world"),
          `${context}: duplicated plain text payload`,
        ).toBe(1);
        expect(
          countOccurrences(output, "<p>Hello world"),
          `${context}: duplicated paragraph payload`,
        ).toBe(1);
        expect(
          countOccurrences(output, "@if"),
          `${context}: changed unterminated directive opener count`,
        ).toBe(countOccurrences(input, "@if"));
        expect(
          countOccurrences(output, "@endif"),
          `${context}: unexpected directive closers were inserted`,
        ).toBe(countOccurrences(input, "@endif"));

        expectCoreConstructDelimiterSafety(input, output, context);
        expectNoBladePhpConstructLoss(input, output, context);
      }
    });
  }
});
