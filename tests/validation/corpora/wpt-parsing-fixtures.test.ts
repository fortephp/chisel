import {
  fixtureDir,
  listRecursiveFixtureFiles,
  readFixture,
} from "../support/fixture-suite.js";
import { defineCorpusFixtureSuite } from "../support/corpus-suite.js";

const FIXTURE_DIR = fixtureDir("wpt-parsing");
const FIXTURE_FILES = listRecursiveFixtureFiles(FIXTURE_DIR, (name) => {
  const lower = name.toLowerCase();
  return lower.endsWith(".html") || lower.endsWith(".xhtml");
});

defineCorpusFixtureSuite({
  name: "validation/wpt-parsing-fixtures",
  files: FIXTURE_FILES,
  readFixture: (file) => readFixture(FIXTURE_DIR, file),
  defaultCaseLabel: "snapshot + converges + delimiter-safe",
  formatMode: "convergence",
  snapshot: true,
  optionSampleSize: 18,
});
