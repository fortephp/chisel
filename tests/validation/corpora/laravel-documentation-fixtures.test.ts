import {
  fixtureDir,
  listFixtureFiles,
  readFixture,
} from "../support/fixture-suite.js";
import { defineCorpusFixtureSuite } from "../support/corpus-suite.js";

const FIXTURE_DIR = fixtureDir("laravel-documentation");

function docsFixtureIndex(fileName: string): number {
  const match = fileName.match(/^docs_(\d+)\.blade\.php$/);
  return match ? Number.parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

const FIXTURE_FILES = listFixtureFiles(FIXTURE_DIR, (a, b) => {
  return docsFixtureIndex(a) - docsFixtureIndex(b);
});

defineCorpusFixtureSuite({
  name: "validation/laravel-documentation-fixtures",
  files: FIXTURE_FILES,
  readFixture: (file) => readFixture(FIXTURE_DIR, file),
  defaultCaseLabel: "snapshot + idempotent + no-loss",
  formatMode: "stability",
  snapshot: true,
  optionSampleSize: 18,
});
