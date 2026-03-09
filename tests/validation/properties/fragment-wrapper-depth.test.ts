import { describe, expect, it } from "vitest";
import type { Options } from "prettier";
import { formatWithPasses, wrapInDiv } from "../../helpers.js";
import {
  expectCoreConstructDelimiterSafety,
  expectNoBladePhpConstructLoss,
  expectRespectsFormattingInvariants,
} from "../support/fixture-suite.js";

const DEFAULT_MAX_DEPTH = 6;

const FRAGMENTS = [
  `<section>
@if ($user)
<x-card :title="$title">{{ $content }}</x-card>
@else
<p>Guest</p>
@endif
</section>
`,
  `<script>
@foreach ($items as $item)
window.items.push("WRAP_B-{{ $item }}")
@endforeach
</script>
`,
  `<style>
.thing {
  color: red;
  @if ($dark)
  background-color: black;
  @endif
}
</style>
<p>WRAP_C</p>
`,
  `<?php if ($loading): ?>
<div class="loader">
  <x-loader />
</div>
<?php endif; ?>
`,
  `@php
$message = "WRAP_E";
@endphp

<textarea>{{ $message }}</textarea>
`,
];

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

describe("validation/fragment-wrapper-depth", () => {
  const maxDepth = Number.parseInt(process.env.VALIDATION_WRAPPER_INVARIANCE_MAX_DEPTH ?? "", 10);
  const depthLimit = Number.isFinite(maxDepth) && maxDepth > 0 ? maxDepth : DEFAULT_MAX_DEPTH;

  for (const [fragmentIndex, fragment] of FRAGMENTS.entries()) {
    for (const profile of PROFILES) {
      it(`fragment=${fragmentIndex} :: ${profile.name} :: depth=0..${depthLimit}`, async () => {
        const shouldCompareAcrossDepth = !(fragmentIndex === 2 && profile.name !== "php-safe");
        const outputs: string[] = [];

        for (let depth = 0; depth <= depthLimit; depth++) {
          const input = wrapInDiv(fragment, depth);
          const output = await formatWithPasses(input, profile.options, {
            passes: 3,
            assertIdempotent: true,
          });
          const context = `wrapper-depth fragment=${fragmentIndex} depth=${depth} profile=${profile.name}`;

          expectCoreConstructDelimiterSafety(input, output, context);
          expectNoBladePhpConstructLoss(input, output, context);
          expectRespectsFormattingInvariants(output, profile.options, context);
          outputs.push(output);
        }

        for (let depth = 1; depth <= depthLimit; depth++) {
          if (!shouldCompareAcrossDepth) {
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
