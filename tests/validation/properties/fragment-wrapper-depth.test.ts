import { describe, expect, it } from "vitest";
import type { Options } from "prettier";
import {
  collectIgnoreRangeSlices,
  expectIgnoreRangesUnchanged,
  formatWithPasses,
  wrapInDiv,
} from "../../helpers.js";
import {
  expectCoreConstructDelimiterSafety,
  expectNoBladePhpConstructLoss,
  expectRespectsFormattingInvariants,
} from "../support/fixture-suite.js";

const DEFAULT_MAX_DEPTH = 6;

type FragmentCase = {
  name: string;
  source: string;
  requiredLiterals?: readonly string[];
  compareAcrossDepth?: "all" | "php-safe-only";
};

const FRAGMENTS: readonly FragmentCase[] = [
  {
    name: "conditional-card",
    source: `<section>
@if ($user)
<x-card :title="$title">{{ $content }}</x-card>
@else
<p>Guest</p>
@endif
</section>
`,
  },
  {
    name: "script-loop",
    source: `<script>
@foreach ($items as $item)
window.items.push("WRAP_B-{{ $item }}")
@endforeach
</script>
`,
  },
  {
    name: "style-branch",
    source: `<style>
.thing {
  color: red;
  @if ($dark)
  background-color: black;
  @endif
}
</style>
<p>WRAP_C</p>
`,
    compareAcrossDepth: "php-safe-only",
  },
  {
    name: "php-loader",
    source: `<?php if ($loading): ?>
<div class="loader">
  <x-loader />
</div>
<?php endif; ?>
`,
  },
  {
    name: "php-textarea",
    source: `@php
$message = "WRAP_E";
@endphp

<textarea>{{ $message }}</textarea>
`,
  },
  {
    name: "ignore-range-blade-whitespace",
    source: `{{-- format-ignore-start --}}
Dear {{$user->first_name}},  
Roster on {{$date->format('d-m-Y')}}

@foreach($messageData as $ecrewMessage)
=====
@endforeach
{{-- format-ignore-end --}}
<p   class="after"   >After</p>
`,
    requiredLiterals: ['<p class="after">After</p>'],
  },
  {
    name: "ignore-range-inline-sibling-pressure",
    source: `<span>{{-- prettier-ignore-start --}}@csrf('item'){{ $label }}*{{-- prettier-ignore-end --}}</span>
<div   class="x"   ></div>
`,
    requiredLiterals: ["<div class=\"x\"></div>"],
  },
  {
    name: "ignore-range-mixed-wrapper-html",
    source: `<!-- format-ignore-start -->
🚨 <b>Stick Time Monitor Alert</b> 🚨  

<b>Date:</b> {{ $flightplan->date->format('Y-m-d') }}
{{-- format-ignore-end --}}
<section   class="q"   ></section>
`,
    requiredLiterals: ["<section class=\"q\"></section>"],
  },
] as const;

const PROFILES: Array<{ name: string; options: Options }> = [
  { name: "default", options: {} },
  { name: "php-safe", options: { bladePhpFormatting: "safe", singleQuote: true } },
  {
    name: "strict",
    options: { htmlWhitespaceSensitivity: "strict", bladeDirectiveArgSpacing: "space" },
  },
];

function normalizeEol(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

function normalizeForCompare(value: string): string {
  return normalizeEol(value).replace(/\n+$/u, "\n");
}

function shouldCompareAcrossDepth(fragment: FragmentCase, profileName: string): boolean {
  if (fragment.compareAcrossDepth === "php-safe-only") {
    return profileName === "php-safe";
  }

  return true;
}

function unwrapOneDivLayer(output: string): string {
  const lines = normalizeEol(output).split("\n");
  let start = 0;
  while (start < lines.length && lines[start].trim() === "") start++;
  if (start >= lines.length || lines[start].trim() !== "<div>") {
    throw new Error(`expected outer <div>, got: ${lines[start] ?? "<eof>"}`);
  }

  let end = lines.length - 1;
  while (end >= 0 && lines[end].trim() === "") end--;
  if (end < 0 || lines[end].trim() !== "</div>") {
    throw new Error(`expected outer </div>, got: ${lines[end] ?? "<eof>"}`);
  }

  return `${lines.slice(start + 1, end).join("\n")}\n`;
}

function dedentByTwoSpaces(value: string): string {
  const lines = normalizeEol(value).split("\n");
  return `${lines
    .map((line) => {
      if (line.startsWith("  ")) return line.slice(2);
      return line;
    })
    .join("\n")}\n`;
}

function assertIgnoredSlicesPresent(
  input: string,
  output: string,
  context: string,
  options: Options,
): void {
  const normalizedOutput = normalizeEol(output);

  for (const [index, slice] of collectIgnoreRangeSlices(input, options)
    .map(normalizeEol)
    .entries()) {
    expect(
      normalizedOutput,
      `${context}: missing preserved ignore slice ${index}`,
    ).toContain(slice);
  }
}

describe("validation/fragment-wrapper-depth", () => {
  const maxDepth = Number.parseInt(process.env.VALIDATION_WRAPPER_INVARIANCE_MAX_DEPTH ?? "", 10);
  const depthLimit = Number.isFinite(maxDepth) && maxDepth > 0 ? maxDepth : DEFAULT_MAX_DEPTH;

  for (const fragment of FRAGMENTS) {
    for (const profile of PROFILES) {
      it(`fragment=${fragment.name} :: ${profile.name} :: depth=0..${depthLimit}`, async () => {
        const compareAcrossDepth = shouldCompareAcrossDepth(fragment, profile.name);
        const outputs: string[] = [];

        for (let depth = 0; depth <= depthLimit; depth++) {
          const input = wrapInDiv(fragment.source, depth);
          const output = await formatWithPasses(input, profile.options, {
            passes: 3,
            assertIdempotent: true,
          });
          const context = `wrapper-depth fragment=${fragment.name} depth=${depth} profile=${profile.name}`;

          expectCoreConstructDelimiterSafety(input, output, context);
          expectNoBladePhpConstructLoss(input, output, context);
          expectRespectsFormattingInvariants(output, profile.options, context);
          expectIgnoreRangesUnchanged(input, output, context, profile.options);
          assertIgnoredSlicesPresent(input, output, context, profile.options);

          for (const literal of fragment.requiredLiterals ?? []) {
            expect(output, `${context}: missing required literal ${literal}`).toContain(literal);
          }

          outputs.push(output);
        }

        for (let depth = 1; depth <= depthLimit; depth++) {
          if (!compareAcrossDepth) {
            continue;
          }
          const unwrapped = unwrapOneDivLayer(outputs[depth]);
          const dedented = dedentByTwoSpaces(unwrapped);
          const reparsed = await formatWithPasses(dedented, profile.options, {
            passes: 2,
            assertIdempotent: true,
          });

          expect(
            normalizeForCompare(reparsed),
            `wrapper-depth mismatch at depth=${depth} profile=${profile.name}`,
          ).toBe(normalizeForCompare(outputs[depth - 1]));
        }
      });
    }
  }
});
