import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect } from "vitest";
import {
  listRecursiveFixtureFiles,
} from "../support/fixture-suite.js";
import { defineCorpusFixtureSuite } from "../support/corpus-suite.js";

const LIVEWIRE_ROOT = join(
  process.cwd(),
  "tests",
  "fixtures",
  "validation",
  "livewire",
);
const LIVEWIRE_BLADE_DIRS = [
  "src/Finder/Fixtures",
  "src/Mechanisms/HandleRouting/fixtures",
  "tests/views",
] as const;
const OPTION_SAMPLE_SIZE = 12;

function readFixture(relativePath: string): string {
  return readFileSync(join(LIVEWIRE_ROOT, relativePath), "utf8");
}

const FIXTURE_FILES = LIVEWIRE_BLADE_DIRS.flatMap((dir) =>
  listRecursiveFixtureFiles(join(LIVEWIRE_ROOT, dir), (name) => name.endsWith(".blade.php")).map(
    (file) => `${dir.replaceAll("\\", "/")}/${file}`,
  ),
);

defineCorpusFixtureSuite({
  name: "validation/livewire-fixtures",
  files: FIXTURE_FILES,
  readFixture,
  defaultCaseLabel: "converges + delimiter-safe + no-loss",
  formatMode: "convergence",
  optionSampleSize: OPTION_SAMPLE_SIZE,
  defineExtraAssertions: () => {
    expect(
      FIXTURE_FILES.some((file) => file.endsWith("sfc-counter.blade.php")),
    ).toBe(true);
    expect(
      FIXTURE_FILES.some((file) =>
        file.endsWith("finder-test-single-file-component.blade.php"),
      ),
    ).toBe(true);
    expect(
      FIXTURE_FILES.some((file) =>
        file.endsWith("finder-test-single-file-component-with-zap.blade.php"),
      ),
    ).toBe(true);
  },
});
