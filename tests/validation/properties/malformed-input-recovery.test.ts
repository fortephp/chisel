import { describe, expect, it } from "vitest";
import type { Options } from "prettier";
import * as prettier from "prettier";
import bladePlugin from "../../../src/index.js";
import {
  expectCoreConstructDelimiterSafety,
  expectNoBladePhpConstructLoss,
  expectRespectsFormattingInvariants,
} from "../support/fixture-suite.js";

type MalformedInputCase = {
  name: string;
  input: string;
  markers: string[];
  profiles?: string[];
};

const CASES: MalformedInputCase[] = [
  {
    name: "unterminated-directive-and-tag",
    input: `@if ($cond_one)
<p>MAL_A`,
    markers: ["MAL_A"],
  },
  {
    name: "mismatched-html-nesting",
    input: `<div data-m="MAL_B"><span>MAL_B</div>
`,
    markers: ["MAL_B"],
  },
  {
    name: "orphan-closing-with-directive-branches",
    input: `@if ($x)
<div>MAL_C
@endif

@if ($x)
</div>
@endif
`,
    markers: ["MAL_C"],
  },
  {
    name: "compound-attribute-name-with-echo-and-php-tag",
    input: `<div {{ $one }}{{ $two }}{{ $three}}-<?php echo 'MAL_D'; ?>="Things">MAL_D</div>
`,
    markers: ["MAL_D"],
  },
  {
    name: "php-tag-shorthand-with-open-html",
    input: `<?php if ($loading): ?>
<div class="loader">MAL_E
<?php endif; ?>
`,
    markers: ["MAL_E"],
  },
  {
    name: "raw-content-style-with-directive-loop",
    input: `<style>
.thing {
background-color: @foreach ($items as $item)
{{ $item }}
@endforeach
;
}
</style>
<div>MAL_F</div>
`,
    markers: ["MAL_F"],
  },
  {
    name: "raw-content-script-with-blade-loop",
    input: `<script>
@foreach ($stuff as $thing)
var slot = "{{ $thing }}-MAL_G"
@endforeach
</script>
`,
    markers: ["MAL_G"],
  },
  {
    name: "verbatim-boundary-and-orphan-close",
    input: `@verbatim
<div>{{ untouched_MAL_H }}</div>
@endverbatim
</broken>
<p>MAL_H</p>
`,
    markers: ["MAL_H"],
  },
  {
    name: "inline-directive-attribute-and-echo-mix",
    input: `<div
@if($a) wire:key="{{ $id }}" data-v="MAL_I" @endif
>{{ "MAL_I" }}</div>
`,
    markers: ["MAL_I"],
  },
];

const OPTION_PROFILES: Array<{ name: string; options: Options }> = [
  { name: "default", options: {} },
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
  {
    name: "optional-closers-safe",
    options: {
      bladeInsertOptionalClosingTags: true,
      bladePhpFormatting: "safe",
      singleQuote: true,
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

describe("validation/malformed-input-recovery", () => {
  for (const inputCase of CASES) {
    const profiles = inputCase.profiles
      ? OPTION_PROFILES.filter((profile) => inputCase.profiles!.includes(profile.name))
      : OPTION_PROFILES;
    for (const profile of profiles) {
      it(`${inputCase.name} :: ${profile.name}`, async () => {
        const { third, fourth } = await formatPasses(inputCase.input, profile.options);
        const context = `${inputCase.name} profile=${profile.name}`;
        const output = fourth;

        expect(fourth, `${context}: did not converge by pass 4`).toBe(third);

        expectCoreConstructDelimiterSafety(inputCase.input, output, context);
        expectNoBladePhpConstructLoss(inputCase.input, output, context);
        expectRespectsFormattingInvariants(output, profile.options, context);

        for (const marker of inputCase.markers) {
          expect(
            countOccurrences(output, marker),
            `${context}: marker count drifted for ${marker}`,
          ).toBe(countOccurrences(inputCase.input, marker));
        }
      });
    }
  }
});
