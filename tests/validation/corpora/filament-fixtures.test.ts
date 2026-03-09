import {
  fixtureDir,
  listFixtureFiles,
  readFixture,
} from "../support/fixture-suite.js";
import { defineCorpusFixtureSuite } from "../support/corpus-suite.js";

const FIXTURE_DIR = fixtureDir("filament");
const FIXTURE_FILES = listFixtureFiles(FIXTURE_DIR);

defineCorpusFixtureSuite({
  name: "validation/filament-fixtures",
  files: FIXTURE_FILES,
  readFixture: (file) => readFixture(FIXTURE_DIR, file),
  defaultCaseLabel: "snapshot + converges + delimiter-safe",
  formatMode: "convergence",
  snapshot: true,
  optionSampleSize: 18,
});
