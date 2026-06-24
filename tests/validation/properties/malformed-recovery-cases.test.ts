import { describe, expect, it } from "vitest";
import type { Options } from "prettier";
import * as prettier from "prettier";
import bladePlugin from "../../../src/index.js";
import { expectIgnoreRangesUnchanged, wrapInDiv } from "../../helpers.js";
import {
  expectCoreConstructDelimiterSafety,
  expectNoBladePhpConstructLoss,
  expectRespectsFormattingInvariants,
} from "../support/fixture-suite.js";

type RecoveryCase = {
  name: string;
  input: string;
  markers: string[];
  requiredLiterals?: readonly string[];
  preserveBladePhpTokenCounts?: boolean;
  snapshotProfiles?: readonly string[];
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
  {
    name: "ignore-range-malformed-slot-tail-resumes-after-end-marker",
    input: `@if($x)
{{-- format-ignore-start --}}<x-slot:foo>{{-- format-ignore-end --}}tail
<div   class="x"   ></div>
@endif
`,
    markers: ["format-ignore-start", "format-ignore-end"],
    requiredLiterals: ["tail", '<div class="x"></div>'],
  },
  {
    name: "unterminated-attribute-before-repeated-verbatim-and-orphan-branch",
    input: `<div data-bridge='MAL_GA_8>

@verbatim
<div>A {{ raw }}</div>
@endverbatim

@case('orphan')

@verbatim
<div>MAL_GA_8 {{ raw }}</div>
@endverbatim

@disk('MAL_GA_8')
<span>MAL_GA_8</span>
@enddisk
<footer>MAL_GA_8_TAIL</footer>
`,
    markers: ["MAL_GA_8", "MAL_GA_8_TAIL"],
    requiredLiterals: ["@endverbatim", "@disk", "@enddisk", "MAL_GA_8_TAIL"],
  },
  {
    name: "malformed-alpine-event-value-before-orphan-branch",
    input: `<div data-wrap="1">
<div data-wrap="0">
<main data-case="MAL_GA_9_CASE">

<h1>MAL_GA_9_CASE</h1>

<component :class="{ active: ready, 'MAL_GA_9_0': true, directive: '@endif' }" v-bind:style="{ color: '{{ $color_9_0 }}', content: '@endif MAL_GA_9_0' }" v-on:click="selected = @json($selected_9_0); comment = '// @endif MAL_GA_9_0'" :data-id="'MAL_GA_9_0'">
@if($show_9_0)
<span>MAL_GA_9_0</span>
@endif
</component>

<textarea>
@if($text_9_100)
MAL_GA_9_BRIDGE {{ $text_9_100 }}
@endif
</textarea>

<div x-data="{ marker: 'MAL_GA_9_1', text: "@verbatim MAL_GA_9_1 @endverbatim", on() { return /@if|@unless/.test(value) } }" x-bind:class="{ active: open, 'MAL_GA_9_1': true, blade: '@endif' }" @click.prevent="message = \`MAL_GA_9_1 @if\`; if (ok) submit(@json($payload_9_1))" class="@if($active_9_1) active @endif" data-marker="MAL_GA_9_1">
<span>MAL_GA_9_1 {{ $label_9_1 }}</span>
</div>

<script type="module">
const marker_2 = "MAL_GA_9_2";
const str_2 = "@if @else @endif MAL_GA_9_2";
const tpl_2 = \`MAL_GA_9_2 @verbatim @endverbatim \${@json($value_9_2)}\`;
const regex_2 = /@else|@endif|MAL_GA_9_2/g;
// @endif MAL_GA_9_2
if (ready_2) /@if|@endif/.test(marker_2);
</script>

<script type="module">
const marker_3 = "MAL_GA_9_3";
@foreach($scripts_9_3 as $script)
const blade_3 = "{{ $script }}-MAL_GA_9_3";
@endforeach
const str_3 = "@if @else @endif MAL_GA_9_3";
const tpl_3 = \`MAL_GA_9_3 @verbatim @endverbatim \${@json($value_9_3)}\`;
const regex_3 = /@else|@endif|MAL_GA_9_3/g;
// @endif MAL_GA_9_3
if (ready_3) /@if|@endif/.test(marker_3);
</script>

@else

<style>
.MAL_GA_9_4{content:"@endif MAL_GA_9_4";color:{{ $color_9_4 }};background:url("{{ asset('MAL_GA_9_4.png') }}")}
</style>

<script type="module">
const marker_5 = "MAL_GA_9_5";
const str_5 = "@if @else @endif MAL_GA_9_5";
const tpl_5 = \`MAL_GA_9_5 @verbatim @endverbatim \${@json($value_9_5)}\`;
const regex_5 = /@else|@endif|MAL_GA_9_5/g;
// @endif MAL_GA_9_5
if (ready_5) /@if|@endif/.test(marker_5);
</script>

<template x-if="'MAL_GA_9_BRIDGE_6'">

<div data-json='{"marker":"MAL_GA_9_6","directive":"@endif","pattern":"/@else|@endif/"}'>MAL_GA_9_6</div>

</broken-7>

<template x-if="'MAL_GA_9_7'">
<div x-data="{ open: false, marker: 'MAL_GA_9_7', directive: '@endif', pattern: /@else|@endif/g }" x-bind:class="{ active: open, 'MAL_GA_9_7': true, blade: '@endif' }" @click.prevent="if (/^@endif/.test($event.key)) { selected = 'MAL_GA_9_7' }" class="@if($active_9_7) active @endif" data-marker="MAL_GA_9_7">
<span>MAL_GA_9_7 {{ $label_9_7 }}</span>
</div>
</template>

<component :class="{ title: \`MAL_GA_9_8 @if @endif\`, visible: ok }" v-bind:style="{ color: '{{ $color_9_8 }}', content: '@endif MAL_GA_9_8' }" v-on:click="items.push('MAL_GA_9_8'); if (/(@if|@endif)/.test(name)) done = true" :data-id="'MAL_GA_9_8'">
@if($show_9_8)
<span>MAL_GA_9_8</span>
@endif
</component>

@endif

<template x-if="'MAL_GA_9_9'">
<div x-data="{ marker: 'MAL_GA_9_9', text: "@verbatim MAL_GA_9_9 @endverbatim", on() { return /@if|@unless/.test(value) } }" x-bind:class="{ active: open, 'MAL_GA_9_9': true, blade: '@endif' }" @click.prevent="if (/^@endif/.test($event.key)) { selected = 'MAL_GA_9_9' }" class="@if($active_9_9) active @endif" data-marker="MAL_GA_9_9">
<span>MAL_GA_9_9 {{ $label_9_9 }}</span>
</div>
</template>

<div x-data="{ open: false, marker: 'MAL_GA_9_10', directive: '@endif', pattern: /@else|@endif/g }" x-bind:class="{ active: open, 'MAL_GA_9_10': true, blade: '@endif' }" @click.prevent="if (/^@endif/.test($event.key)) { selected = 'MAL_GA_9_10' }" class="@if($active_9_10) active @endif" data-marker="MAL_GA_9_10">
<span>MAL_GA_9_10 {{ $label_9_10 }}</span>
</div>

<style>
@media (min-width: 611px){@if($dark_9_11).MAL_GA_9_11{color:red}@else.MAL_GA_9_11{color:blue}@endif}
</style>

<textarea>
@if($text_9_111)
MAL_GA_9_TEXTAREA {{ $text_9_111 }}
@endif
</textarea>

<footer>MAL_GA_9_TAIL</footer>
</div>
</div>
`,
    markers: [
      "MAL_GA_9_CASE",
      "MAL_GA_9_0",
      "MAL_GA_9_BRIDGE",
      "MAL_GA_9_1",
      "MAL_GA_9_2",
      "MAL_GA_9_3",
      "MAL_GA_9_4",
      "MAL_GA_9_5",
      "MAL_GA_9_6",
      "MAL_GA_9_7",
      "MAL_GA_9_8",
      "MAL_GA_9_9",
      "MAL_GA_9_10",
      "MAL_GA_9_11",
      "MAL_GA_9_TEXTAREA",
      "MAL_GA_9_TAIL",
    ],
    requiredLiterals: [
      "@click",
      "@foreach",
      "@endforeach",
      "@if",
      "@endif",
      "@json",
      "@unless",
      "<style",
      "</style>",
      "<script",
      "</script>",
      "<template",
      "</template>",
    ],
    preserveBladePhpTokenCounts: false,
    snapshotProfiles: ["default"],
  },
  {
    name: "unterminated-attribute-before-alpine-tag-with-js-comment",
    input: `<section data-broken='MAL_GA_10_BRIDGE>

<div x-data="{ items: @json($items_10), marker: 'MAL_GA_10', comment: '// @endif' }" x-bind:class="{ active: open, 'MAL_GA_10': true, blade: '@endif' }" @click.prevent="if (/^@endif/.test($event.key)) { selected = 'MAL_GA_10' }" class="@if($active_10) active @endif" data-marker="MAL_GA_10">
<span>MAL_GA_10 {{ $label_10 }}</span>
</div>

<footer>MAL_GA_10_TAIL</footer>
`,
    markers: ["MAL_GA_10_BRIDGE", "MAL_GA_10", "MAL_GA_10_TAIL"],
    requiredLiterals: ["@click", "@endif", "@if", "@json", "{{ $label_10 }}"],
    snapshotProfiles: ["default"],
  },
  {
    name: "malformed-alpine-event-literal-else-before-real-branch",
    input: `@if($broken_11)
<div x-data="{ open: false, marker: 'MAL_GA_11', directive: '@endif' }" @click.prevent="queue.push('MAL_GA_11'); note = "@else"" class="@if($active_11) active @endif" data-marker="MAL_GA_11">
<span>MAL_GA_11 {{ $label_11 }}</span>
</div>
@else
<component :class="{ title: \`MAL_GA_11_ELSE @if @endif\`, visible: ok }" v-bind:style="{ color: '{{ $color_11 }}', content: '@endif MAL_GA_11_ELSE' }">
@if($show_11)
<span>MAL_GA_11_ELSE</span>
@endif
</component>
@endif
<footer>MAL_GA_11_TAIL</footer>
`,
    markers: ["MAL_GA_11", "MAL_GA_11_ELSE", "MAL_GA_11_TAIL"],
    requiredLiterals: ["@else", "@endif", "@if", "@click", "{{ $label_11 }}"],
    snapshotProfiles: ["default"],
  },
  {
    name: "unterminated-attribute-preserves-nested-recovered-descendants",
    input: `<section data-broken='MAL_GA_12_BRIDGE>

<template x-if="'MAL_GA_12_OUTER'">
<template x-if="'MAL_GA_12_INNER'">
<div data-json='{"marker":"MAL_GA_12_JSON","directive":"@endif"}'>MAL_GA_12_JSON</div>

<style>
.MAL_GA_12_STYLE{content:"@endif MAL_GA_12_STYLE";color:{{ $color_12 }};}
</style>

<component :class="{ active: ready, 'MAL_GA_12_COMPONENT': true, directive: '@endif' }" v-bind:style="{ color: '{{ $component_color_12 }}', content: '@endif MAL_GA_12_COMPONENT' }">
@if($show_12)
<span>MAL_GA_12_COMPONENT</span>
@endif
</component>

<footer>MAL_GA_12_TAIL</footer>
`,
    markers: [
      "MAL_GA_12_BRIDGE",
      "MAL_GA_12_OUTER",
      "MAL_GA_12_INNER",
      "MAL_GA_12_JSON",
      "MAL_GA_12_STYLE",
      "MAL_GA_12_COMPONENT",
      "MAL_GA_12_TAIL",
    ],
    requiredLiterals: ["<style", "</style>", "<component", "</component>", "@if", "@endif"],
    snapshotProfiles: ["default"],
  },
  {
    name: "swallowed-tag-malformed-section-keeps-branch-like-tail",
    input: `@if($outer_13)
<span>MAL_GA_13_OUTER</span>
@else
<section data-broken='MAL_GA_13_BRIDGE>

<div data-json='{"marker":"MAL_GA_13_JSON","directive":"@endif"}'>MAL_GA_13_JSON</div>

<script type="module">
const marker = "MAL_GA_13_SCRIPT";
const regex = /@else|@endif|MAL_GA_13_SCRIPT/g;
</script>

@else

<style>
.MAL_GA_13_STYLE{content:"@endif MAL_GA_13_STYLE";color:{{ $color_13 }};}
</style>

<footer>MAL_GA_13_TAIL</footer>
@endif
`,
    markers: [
      "MAL_GA_13_OUTER",
      "MAL_GA_13_BRIDGE",
      "MAL_GA_13_JSON",
      "MAL_GA_13_SCRIPT",
      "MAL_GA_13_STYLE",
      "MAL_GA_13_TAIL",
    ],
    requiredLiterals: ["@else", "@endif", "<style", "</style>", "<script", "</script>"],
    preserveBladePhpTokenCounts: false,
    snapshotProfiles: ["default"],
  },
  {
    name: "strict-malformed-swallowed-tag-keeps-parent-markers-stable",
    input: `<div>
<main>
<section data-broken='MAL_GA_14_BRIDGE>

<div data-json='{"marker":"MAL_GA_14_JSON","directive":"@endif"}'>MAL_GA_14_JSON</div>

<footer>MAL_GA_14_TAIL</footer>

</main>
</div>
`,
    markers: ["MAL_GA_14_BRIDGE", "MAL_GA_14_JSON", "MAL_GA_14_TAIL"],
    requiredLiterals: ["</main>", "</div>", "<footer", "</footer>", "data-json"],
    preserveBladePhpTokenCounts: false,
    snapshotProfiles: ["strict"],
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
          const { first, third, fourth } = await formatPasses(input, profile.options);
          const context = `${caseEntry.name} profile=${profile.name} depth=${depth}`;

          if (depth === 0 && caseEntry.snapshotProfiles?.includes(profile.name)) {
            expect(first).toMatchSnapshot();
          }

          expect(fourth, `${context}: did not converge by pass 4`).toBe(third);
          expectCoreConstructDelimiterSafety(input, fourth, context);
          if (caseEntry.preserveBladePhpTokenCounts !== false) {
            expectNoBladePhpConstructLoss(input, fourth, context);
          }
          expectRespectsFormattingInvariants(fourth, profile.options, context);
          expectIgnoreRangesUnchanged(input, fourth, context, profile.options);

          for (const marker of caseEntry.markers) {
            expect(
              countOccurrences(fourth, marker),
              `${context}: marker count drifted for ${marker}`,
            ).toBe(countOccurrences(input, marker));
          }

          for (const literal of caseEntry.requiredLiterals ?? []) {
            expect(fourth, `${context}: missing required literal ${literal}`).toContain(literal);
          }
        }
      });
    }
  }
});
