import { describe, expect, it } from "vitest";
import type { Options } from "prettier";
import { formatWithPasses, wrapInDiv } from "../../helpers.js";
import {
  expectCoreConstructDelimiterSafety,
  expectNoBladePhpConstructLoss,
  expectRespectsFormattingInvariants,
} from "../support/fixture-suite.js";

type MarkerScenario = {
  name: string;
  buildInput: (marker: string) => string;
};

const SESSION_KEYS = ["0", "a", "aa", "edge_0", "edge_0_1", "script42", "style42", "zzzz"];

const MARKER_FACTORIES: Array<(session: string, index: number) => string> = [
  (session, index) => `__blade_expr_slot_${session}_${index}__`,
  (session, index) => `__blade_stmt_slot_${session}_${index}__`,
  (session, index) => `__blade_value_slot_${session}_${index}__`,
  (session, index) => `/*__blade_expr_slot_${session}_${index}__*/`,
  (session, index) => `/*__blade_stmt_slot_${session}_${index}__*/`,
  (session, index) => `/*__blade_comment_slot_${session}_${index}__*/`,
  (session, index) => `@__blade_stmt_slot_${session}_${index};`,
];

const SCENARIOS: readonly MarkerScenario[] = [
  {
    name: "script-strings-and-comments",
    buildInput: (marker) => `<script>
const markerLiteral = "${marker}";
const markerTemplate = \`${marker}\`;
// ${marker}
const out = @foo($x);
</script>
`,
  },
  {
    name: "style-comments-and-content-values",
    buildInput: (marker) => `<style>
/* ${marker} */
.token::before { content: "${marker}"; }
.value { content: @foo($x); }
</style>
`,
  },
  {
    name: "style-value-context-with-blade",
    buildInput: (marker) => `<style>
.token {
  content: ${marker} {{ $left }} {{ $right }};
}
</style>
`,
  },
];

const PROFILES: Array<{ name: string; options: Options }> = [
  { name: "default", options: {} },
  {
    name: "php-safe",
    options: { bladePhpFormatting: "safe", singleQuote: true },
  },
];

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  let index = 0;
  for (;;) {
    const next = haystack.indexOf(needle, index);
    if (next < 0) return count;
    count++;
    index = next + needle.length;
  }
}

describe("validation/marker-collisions", () => {
  const markers = SESSION_KEYS.flatMap((session, sessionIndex) =>
    MARKER_FACTORIES.map((factory, factoryIndex) =>
      factory(session, sessionIndex * MARKER_FACTORIES.length + factoryIndex),
    ),
  );

  for (const marker of markers) {
    for (const scenario of SCENARIOS) {
      for (const profile of PROFILES) {
        it(`${scenario.name} :: ${profile.name} :: marker=${marker}`, async () => {
          const input = scenario.buildInput(marker);

          for (let depth = 0; depth <= 2; depth++) {
            const wrapped = depth === 0 ? input : wrapInDiv(input, depth);
            const output = await formatWithPasses(wrapped, profile.options, {
              passes: 4,
              assertIdempotent: true,
            });
            const context = `${scenario.name} marker=${marker} profile=${profile.name} depth=${depth}`;

            expectCoreConstructDelimiterSafety(wrapped, output, context);
            expectNoBladePhpConstructLoss(wrapped, output, context);
            expectRespectsFormattingInvariants(output, profile.options, context);

            expect(countOccurrences(output, marker), `${context}: marker count changed`).toBe(
              countOccurrences(wrapped, marker),
            );
          }
        });
      }
    }
  }
});
