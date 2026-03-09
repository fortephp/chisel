import { describe, expect, it } from "vitest";
import * as prettier from "prettier";
import plugin from "../../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { CONFORMANCE_SUITE_DEFAULT_OPTIONS } from "./support/suite-options.js";
import { expectRespectsFormattingInvariants } from "../support/fixture-suite.js";
import { loadConformanceCases, type ConformanceGroup } from "./support/cases.js";
import { wrapInDiv } from "../../helpers.js";

type LoadedCase = {
  id: string;
  input: string;
  options: Record<string, unknown>;
};

const HTML_WHITESPACE_SENSITIVITY_OPTIONS = ["css", "strict", "ignore"] as const;
const DEFAULT_MAX_WRAP_DEPTH = 2;

function parseMaxWrapDepth(): number {
  const raw = process.env.CONFORMANCE_MAX_WRAP_DEPTH;
  if (!raw) return DEFAULT_MAX_WRAP_DEPTH;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_MAX_WRAP_DEPTH;
}

const MAX_WRAP_DEPTH = parseMaxWrapDepth();

function loadCases(group: ConformanceGroup): LoadedCase[] {
  return loadConformanceCases(group).map((entry) => ({
    id: entry.id,
    input: entry.input,
    options: entry.options,
  }));
}

async function formatWithSuiteOptions(
  input: string,
  options: Record<string, unknown>,
): Promise<string> {
  return prettier.format(input, {
    parser: "blade",
    plugins: [plugin, phpPlugin],
    ...options,
    ...CONFORMANCE_SUITE_DEFAULT_OPTIONS,
  });
}

function runMatrix(name: string, cases: LoadedCase[]): void {
  describe(name, () => {
    for (const htmlWhitespaceSensitivity of HTML_WHITESPACE_SENSITIVITY_OPTIONS) {
      it(`all cases idempotent at wrap depths 0..${MAX_WRAP_DEPTH} with htmlWhitespaceSensitivity=${htmlWhitespaceSensitivity}`, async () => {
        for (const c of cases) {
          for (let depth = 0; depth <= MAX_WRAP_DEPTH; depth++) {
            const wrappedInput = wrapInDiv(c.input, depth);
            const opts = {
              ...c.options,
              htmlWhitespaceSensitivity,
            };

            const first = await formatWithSuiteOptions(wrappedInput, opts);
            const second = await formatWithSuiteOptions(first, opts);

            expect(
              second,
              `idempotency drift: ${c.id} depth=${depth} htmlWhitespaceSensitivity=${htmlWhitespaceSensitivity}`,
            ).toBe(first);
            expectRespectsFormattingInvariants(
              second,
              opts,
              `${c.id} depth=${depth} htmlWhitespaceSensitivity=${htmlWhitespaceSensitivity}`,
              { checkTrailingWhitespace: false },
            );
          }
        }
      }, 180_000);
    }
  });
}

runMatrix("validation/conformance/idempotency-depth-whitespace/formatter", loadCases("formatter"));
runMatrix("validation/conformance/idempotency-depth-whitespace/format", loadCases("format"));
