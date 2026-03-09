import type * as prettier from "prettier";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_OPTION_MATRIX,
  expectCoreConstructDelimiterSafety,
  expectNoBladePhpConstructLoss,
  expectRespectsFormattingInvariants,
  formatWithConvergenceChecks,
  formatWithRoundTripChecks,
  formatWithStabilityChecks,
  pickDeterministicSample,
} from "./fixture-suite.js";

type CorpusFormatMode = "stability" | "convergence" | "roundTrip";

type OptionMatrixEntry = {
  name: string;
  options: prettier.Options;
};

type CorpusSuiteConfig = {
  name: string;
  files: string[];
  readFixture: (file: string) => string;
  defaultCaseLabel: string;
  formatMode: CorpusFormatMode;
  snapshot?: boolean;
  optionMatrix?: OptionMatrixEntry[];
  optionFiles?: string[];
  optionSampleSize?: number;
  defineExtraAssertions?: () => void;
};

async function formatForCorpusSuite(
  input: string,
  options: prettier.Options,
  mode: CorpusFormatMode,
): Promise<string> {
  if (mode === "stability") {
    return formatWithStabilityChecks(input, options);
  }

  if (mode === "roundTrip") {
    const { second } = await formatWithRoundTripChecks(input, options);
    return second;
  }

  const { second } = await formatWithConvergenceChecks(input, options);
  return second;
}

function resolveOptionFiles(config: CorpusSuiteConfig): string[] {
  if (config.optionFiles) {
    return [...config.optionFiles];
  }

  if (config.optionSampleSize === undefined) {
    return [];
  }

  return pickDeterministicSample(config.files, config.optionSampleSize);
}

export function defineCorpusFixtureSuite(config: CorpusSuiteConfig): void {
  const optionMatrix = config.optionMatrix ?? DEFAULT_OPTION_MATRIX;
  const optionFiles = resolveOptionFiles(config);

  describe(config.name, () => {
    config.defineExtraAssertions?.();

    for (const fileName of config.files) {
      it(`formats ${fileName} (${config.defaultCaseLabel})`, async () => {
        const input = config.readFixture(fileName);
        const output = await formatForCorpusSuite(input, {}, config.formatMode);

        expectCoreConstructDelimiterSafety(input, output, fileName);
        expectNoBladePhpConstructLoss(input, output, fileName);

        if (config.snapshot) {
          expect(output).toMatchSnapshot();
        }
      });
    }

    for (const fileName of optionFiles) {
      for (const entry of optionMatrix) {
        it(`formats ${fileName} with ${entry.name}`, async () => {
          const input = config.readFixture(fileName);
          const output = await formatForCorpusSuite(
            input,
            entry.options,
            config.formatMode,
          );

          const context = `${fileName} (${entry.name})`;
          expectCoreConstructDelimiterSafety(input, output, context);
          expectNoBladePhpConstructLoss(input, output, context);
          expectRespectsFormattingInvariants(output, entry.options, context);
        });
      }
    }
  });
}
