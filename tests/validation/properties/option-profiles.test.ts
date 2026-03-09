import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "vitest";
import type { Options } from "prettier";
import {
  expectCoreConstructDelimiterSafety,
  expectNoBladePhpConstructLoss,
  expectRespectsFormattingInvariants,
  formatWithConvergenceChecks,
  pickDeterministicSample,
} from "../support/fixture-suite.js";

const CONFORMANCE_FIXTURE_DIR = join(
  process.cwd(),
  "tests",
  "validation",
  "conformance",
  "fixtures",
);

const OPTION_PROFILES: Array<{ name: string; options: Options }> = [
  { name: "default", options: {} },
  {
    name: "inline-intent-plugin-defaults",
    options: { bladeInlineIntentElements: ["p", "svg", "svg:*"] },
  },
  { name: "php-safe", options: { bladePhpFormatting: "safe" } },
  { name: "strict", options: { htmlWhitespaceSensitivity: "strict" } },
  { name: "ignore", options: { htmlWhitespaceSensitivity: "ignore" } },
  { name: "tabs", options: { useTabs: true, tabWidth: 4 } },
  { name: "single-quote", options: { singleQuote: true } },
  {
    name: "tight-echos-none-args",
    options: { bladeEchoSpacing: "tight", bladeDirectiveArgSpacing: "none" },
  },
  {
    name: "safe-single-quote-strict",
    options: {
      bladePhpFormatting: "safe",
      singleQuote: true,
      htmlWhitespaceSensitivity: "strict",
    },
  },
  {
    name: "tabs-safe-ignore",
    options: {
      useTabs: true,
      tabWidth: 4,
      bladePhpFormatting: "safe",
      htmlWhitespaceSensitivity: "ignore",
    },
  },
  {
    name: "crlf-safe",
    options: { endOfLine: "crlf", bladePhpFormatting: "safe", singleQuote: true },
  },
  {
    name: "lf-tight",
    options: { endOfLine: "lf", bladeEchoSpacing: "tight", bladeDirectiveArgSpacing: "none" },
  },
];

const DEFAULT_SAMPLE_SIZE = 10;
const REQUIRED_FIXTURES = ["ignore__001.input.blade.php", "style_script__001.input.blade.php"];

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function listConformanceInputs(): string[] {
  return readdirSync(CONFORMANCE_FIXTURE_DIR)
    .filter((name) => name.endsWith(".input.blade.php"))
    .sort();
}

describe("validation/option-profiles", () => {
  const allFiles = listConformanceInputs();
  const sampleSize = parsePositiveInt(
    process.env.VALIDATION_OPTION_PROFILE_SAMPLE_SIZE,
    DEFAULT_SAMPLE_SIZE,
  );
  const sampledFiles = pickDeterministicSample(allFiles, sampleSize);
  const sampleFiles = [...new Set([...REQUIRED_FIXTURES, ...sampledFiles])]
    .filter((fileName) => allFiles.includes(fileName))
    .sort();

  for (const fileName of sampleFiles) {
    const input = readFileSync(join(CONFORMANCE_FIXTURE_DIR, fileName), "utf8");

    for (const profile of OPTION_PROFILES) {
      it(`${fileName} :: ${profile.name}`, async () => {
        const { third } = await formatWithConvergenceChecks(input, profile.options);
        const context = `option-profile ${fileName} profile=${profile.name}`;

        expectCoreConstructDelimiterSafety(input, third, context);
        expectNoBladePhpConstructLoss(input, third, context);
        expectRespectsFormattingInvariants(third, profile.options, context);
      });
    }
  }
});
