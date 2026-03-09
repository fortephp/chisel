import { describe, expect, it } from "vitest";
import type { Options } from "prettier";
import * as prettier from "prettier";
import bladePlugin from "../../../src/index.js";
import { wrapInDiv } from "../../helpers.js";
import {
  expectCoreConstructDelimiterSafety,
  expectNoBladePhpConstructLoss,
  expectRespectsFormattingInvariants,
} from "../support/fixture-suite.js";

type RecoveryCase = {
  name: string;
  input: string;
  markers: string[];
};

const CASES: readonly RecoveryCase[] = [
  {
    name: "style-branches-and-unclosed-selector-block",
    input: `<style>
@if($dark)
.panel{color:red}
@elseif($alt)
.panel{color:blue
@endif
</style>
<div>MAL_GA_0</div>
`,
    markers: ["MAL_GA_0"],
  },
  {
    name: "script-loop-with-unclosed-template-and-directive-like-regex",
    input: `<script>
@foreach($items as $item)
const token = \`MAL_GA_1-{{ $item }}
if (ok) /@endif/.test(token)
@endforeach
</script>
`,
    markers: ["MAL_GA_1"],
  },
  {
    name: "mismatched-attribute-quotes-with-directive-branches",
    input: `<div class="a" data-x='MAL_GA_2>
@if($ready)
<span>{{ $value }}</span>
@else
</div>
`,
    markers: ["MAL_GA_2"],
  },
  {
    name: "php-tag-open-close-mismatch-around-blade",
    input: `<?php if ($ok): ?>
<div>MAL_GA_3 {{ $x }}
@if($y)
<?php endif; ?>
`,
    markers: ["MAL_GA_3"],
  },
  {
    name: "style-comment-and-inline-branch-chain",
    input: `<style>
/* @if($guard) */
@else .a{content:"MAL_GA_4"}
@endif .b{content:@foo($x)}
</style>
`,
    markers: ["MAL_GA_4"],
  },
  {
    name: "nested-directives-with-orphan-close-tags",
    input: `@if($a)
<section>
  @foreach($list as $item)
    <x-card>{{ $item }} MAL_GA_5
  @endforeach
</aside>
`,
    markers: ["MAL_GA_5"],
  },
  {
    name: "script-with-inline-directive-and-unterminated-comment",
    input: `<script>
const data = @json(["MAL_GA_6", "{{ $value }}"])
/* comment starts
const x = @foo($x)
</script>
`,
    markers: ["MAL_GA_6"],
  },
  {
    name: "style-values-with-inline-blade-and-unclosed-directive",
    input: `<style>
.x{content:@if($ok)red @else blue @endif}
@if($gate)
.y{content:"MAL_GA_7";x:{{ $v }}
}
</style>
`,
    markers: ["MAL_GA_7"],
  },
] as const;

const PROFILES: Array<{ name: string; options: Options }> = [
  { name: "default", options: {} },
  { name: "php-safe", options: { bladePhpFormatting: "safe", singleQuote: true } },
  {
    name: "strict",
    options: {
      htmlWhitespaceSensitivity: "strict",
      bladeDirectiveArgSpacing: "space",
      singleAttributePerLine: true,
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

describe("validation/malformed-recovery-cases", () => {
  for (const caseEntry of CASES) {
    for (const profile of PROFILES) {
      it(`${caseEntry.name} :: ${profile.name} :: depth=0..2`, async () => {
        for (let depth = 0; depth <= 2; depth++) {
          const input = depth === 0 ? caseEntry.input : wrapInDiv(caseEntry.input, depth);
          const { third, fourth } = await formatPasses(input, profile.options);
          const context = `${caseEntry.name} profile=${profile.name} depth=${depth}`;

          expect(fourth, `${context}: did not converge by pass 4`).toBe(third);
          expectCoreConstructDelimiterSafety(input, fourth, context);
          expectNoBladePhpConstructLoss(input, fourth, context);
          expectRespectsFormattingInvariants(fourth, profile.options, context);

          for (const marker of caseEntry.markers) {
            expect(
              countOccurrences(fourth, marker),
              `${context}: marker count drifted for ${marker}`,
            ).toBe(countOccurrences(input, marker));
          }
        }
      });
    }
  }
});
