import { describe, expect, it } from "vitest";
import * as prettier from "prettier";
import plugin from "../../../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { loadConformanceCases, type ConformanceGroup } from "./cases.js";
import { CONFORMANCE_SUITE_DEFAULT_OPTIONS } from "./suite-options.js";

type OptionPrecedence = "entry-over-defaults" | "defaults-over-entry";

export function runConformanceSuite(
  name: string,
  group: ConformanceGroup,
  optionPrecedence: OptionPrecedence,
): void {
  const cases = loadConformanceCases(group);

  describe(name, () => {
    for (const entry of cases) {
      it(`formats ${entry.id}`, async () => {
        const mergedOptions =
          optionPrecedence === "entry-over-defaults"
            ? {
                ...CONFORMANCE_SUITE_DEFAULT_OPTIONS,
                ...entry.options,
              }
            : {
                ...entry.options,
                ...CONFORMANCE_SUITE_DEFAULT_OPTIONS,
              };

        const actual = await prettier.format(entry.input, {
          parser: "blade",
          plugins: [plugin, phpPlugin],
          ...mergedOptions,
        });

        expect(actual, entry.sourceLabel).toMatchSnapshot();
      });
    }
  });
}
