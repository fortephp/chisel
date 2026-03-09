import { describe, expect, it } from "vitest";
import type { Options } from "prettier";
import { formatWithPasses, wrapInDiv } from "../../helpers.js";
import {
  expectCoreConstructDelimiterSafety,
  expectNoBladePhpConstructLoss,
  expectRespectsFormattingInvariants,
} from "../support/fixture-suite.js";

const FRAGMENTS = [
  `<script>
const token = "@if";
@foreach ($items as $item)
window.queue.push(\`item-{{ $item }}\`);
@endforeach
</script>
`,
  `<script>
if (ok) /@endif/.test(value)
const map = @json(["x","y"])
const result = @foo($x)
</script>
`,
  `<style>
@if($dark).card{color:red}
.token::before{content:"@endif"}
.value{content:@foo($x)}
@endif
</style>
`,
  `<style>
.mix{
  background:url(http://example.test/a//b);
  content:@if($ok)red @else blue @endif;
}
</style>
`,
] as const;

const PROFILES: Array<{ name: string; options: Options }> = [
  { name: "default", options: {} },
  {
    name: "php-safe",
    options: { bladePhpFormatting: "safe", singleQuote: true },
  },
  {
    name: "strict",
    options: { htmlWhitespaceSensitivity: "strict", bladeDirectiveArgSpacing: "space" },
  },
];

function normalizeEol(value: string): string {
  return value.replace(/\r\n?/gu, "\n");
}

function normalizeForCompare(value: string): string {
  return normalizeEol(value).replace(/\n+$/u, "\n");
}

function unwrapOneDivLayer(output: string): string {
  const lines = normalizeEol(output).split("\n");
  let start = 0;
  while (start < lines.length && lines[start].trim().length === 0) {
    start++;
  }

  let end = lines.length - 1;
  while (end >= 0 && lines[end].trim().length === 0) {
    end--;
  }

  if (start >= lines.length || lines[start].trim() !== "<div>") {
    throw new Error(`expected outer <div>, got ${lines[start] ?? "<eof>"}`);
  }
  if (end < 0 || lines[end].trim() !== "</div>") {
    throw new Error(`expected outer </div>, got ${lines[end] ?? "<eof>"}`);
  }

  return `${lines.slice(start + 1, end).join("\n")}\n`;
}

function dedentByTwoSpaces(value: string): string {
  const lines = normalizeEol(value).split("\n");
  return `${lines.map((line) => (line.startsWith("  ") ? line.slice(2) : line)).join("\n")}\n`;
}

describe("validation/raw-content-wrapper-depth", () => {
  for (const [fragmentIndex, fragment] of FRAGMENTS.entries()) {
    for (const profile of PROFILES) {
      it(`fragment=${fragmentIndex} :: profile=${profile.name} :: depth=0..5`, async () => {
        const outputs: string[] = [];

        for (let depth = 0; depth <= 5; depth++) {
          const input = depth === 0 ? fragment : wrapInDiv(fragment, depth);
          const output = await formatWithPasses(input, profile.options, {
            passes: 4,
            assertIdempotent: true,
          });
          const context = `raw-content-wrapper fragment=${fragmentIndex} profile=${profile.name} depth=${depth}`;

          expectCoreConstructDelimiterSafety(input, output, context);
          expectNoBladePhpConstructLoss(input, output, context);
          expectRespectsFormattingInvariants(output, profile.options, context);
          outputs.push(output);
        }

        for (let depth = 1; depth <= 5; depth++) {
          const unwrapped = unwrapOneDivLayer(outputs[depth]);
          const dedented = dedentByTwoSpaces(unwrapped);
          const reparsed = await formatWithPasses(dedented, profile.options, {
            passes: 3,
            assertIdempotent: true,
          });

          expect(
            normalizeForCompare(reparsed),
            `raw-content-wrapper mismatch fragment=${fragmentIndex} profile=${profile.name} depth=${depth}`,
          ).toBe(normalizeForCompare(outputs[depth - 1]));
        }
      });
    }
  }
});
