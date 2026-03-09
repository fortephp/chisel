import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect } from "vitest";
import {
  DEFAULT_OPTION_MATRIX,
  listRecursiveFixtureFiles,
} from "../support/fixture-suite.js";
import { defineCorpusFixtureSuite } from "../support/corpus-suite.js";

const VOLT_ROOT = join(
  process.cwd(),
  "tests",
  "fixtures",
  "validation",
  "volt",
);
const VOLT_FIXTURE_ROOT = join(
  VOLT_ROOT,
  "tests",
  "Feature",
  "resources",
  "views",
);
const OPTION_SAMPLE_SIZE = 12;

function readFixture(relativePath: string): string {
  return readFileSync(join(VOLT_ROOT, relativePath), "utf8");
}

const FIXTURE_FILES = listRecursiveFixtureFiles(
  VOLT_FIXTURE_ROOT,
  (name) => name.endsWith(".blade.php"),
).map((file) => `tests/Feature/resources/views/${file}`);

defineCorpusFixtureSuite({
  name: "validation/volt-fixtures",
  files: FIXTURE_FILES,
  readFixture,
  defaultCaseLabel: "round-trip + delimiter-safe + no-loss",
  formatMode: "roundTrip",
  optionMatrix: DEFAULT_OPTION_MATRIX,
  optionSampleSize: OPTION_SAMPLE_SIZE,
  defineExtraAssertions: () => {
    expect(
      FIXTURE_FILES.some((file) =>
        file.startsWith("tests/Feature/resources/views/functional-api/"),
      ),
    ).toBe(true);
    expect(
      FIXTURE_FILES.some((file) =>
        file.startsWith("tests/Feature/resources/views/class-api/"),
      ),
    ).toBe(true);
    expect(
      FIXTURE_FILES.some((file) => file.includes("functional-api-pages/")),
    ).toBe(true);
  },
});
