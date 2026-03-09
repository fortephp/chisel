import { describe, expect, it } from "vitest";
import type { Options } from "prettier";
import { formatWithPasses } from "../../helpers.js";
import {
  expectCoreConstructDelimiterSafety,
  expectNoBladePhpConstructLoss,
  expectRespectsFormattingInvariants,
} from "../support/fixture-suite.js";

type EndingCase = {
  name: string;
  input: string;
  markers: string[];
};

const CASES: EndingCase[] = [
  {
    name: "directive-and-tag-mix",
    input: `@if ($user)
<div data-mixed="EOL_A">
  {!! $content !!}
</div>
@endif
`,
    markers: ["EOL_A"],
  },
  {
    name: "script-with-blade-loop",
    input: `<script>
@foreach ($items as $item)
const item = "{{ $item }}-EOL_B";
@endforeach
</script>
`,
    markers: ["EOL_B"],
  },
  {
    name: "php-block-and-echo",
    input: `@php
$message = "EOL_C";
@endphp

<p>{{ $message }}</p>
`,
    markers: ["EOL_C"],
  },
  {
    name: "style-with-directive",
    input: `<style>
.thing {
  color: red;
  @if ($dark)
  background: black;
  @endif
}
</style>

<span>EOL_D</span>
`,
    markers: ["EOL_D"],
  },
];

const PROFILES: Array<{ name: string; options: Options }> = [
  { name: "lf-default", options: { endOfLine: "lf" } },
  { name: "crlf-default", options: { endOfLine: "crlf" } },
  {
    name: "lf-php-safe",
    options: { endOfLine: "lf", bladePhpFormatting: "safe", singleQuote: true },
  },
  {
    name: "crlf-tabs-strict",
    options: {
      endOfLine: "crlf",
      useTabs: true,
      tabWidth: 4,
      htmlWhitespaceSensitivity: "strict",
    },
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

function toMixedEndings(input: string): string {
  const normalized = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  let out = "";

  for (let i = 0; i < lines.length; i++) {
    out += lines[i];
    if (i === lines.length - 1) continue;
    out += i % 2 === 0 ? "\r\n" : "\n";
  }

  return out;
}

describe("validation/mixed-line-endings", () => {
  for (const endingCase of CASES) {
    for (const profile of PROFILES) {
      it(`${endingCase.name} :: ${profile.name}`, async () => {
        const input = toMixedEndings(endingCase.input);
        const output = await formatWithPasses(input, profile.options, {
          passes: 4,
          assertIdempotent: true,
        });
        const context = `${endingCase.name} profile=${profile.name}`;

        expectCoreConstructDelimiterSafety(input, output, context);
        expectNoBladePhpConstructLoss(input, output, context);
        expectRespectsFormattingInvariants(output, profile.options, context);

        for (const marker of endingCase.markers) {
          expect(
            countOccurrences(output, marker),
            `${context}: marker count drifted for ${marker}`,
          ).toBe(countOccurrences(input, marker));
        }
      });
    }
  }
});
