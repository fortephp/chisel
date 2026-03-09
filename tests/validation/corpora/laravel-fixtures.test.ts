import { join } from "node:path";
import type * as prettier from "prettier";
import {
  readFixture,
} from "../support/fixture-suite.js";
import { defineCorpusFixtureSuite } from "../support/corpus-suite.js";

const FIXTURE_DIR = join(
  process.cwd(),
  "tests",
  "fixtures",
  "validation",
  "laravel",
);

const FIXTURE_FILES = ["welcome.blade.php"];

const LARAVEL_OPTION_MATRIX: Array<{ name: string; options: prettier.Options }> = [
  { name: "default", options: {} },
  { name: "printWidth-60", options: { printWidth: 60 } },
  { name: "tabWidth-4", options: { tabWidth: 4 } },
  {
    name: "htmlWhitespaceSensitivity-ignore",
    options: { htmlWhitespaceSensitivity: "ignore" },
  },
  { name: "singleAttributePerLine", options: { singleAttributePerLine: true } },
  { name: "endOfLine-lf", options: { endOfLine: "lf" } },
  { name: "endOfLine-crlf", options: { endOfLine: "crlf" } },
];

defineCorpusFixtureSuite({
  name: "validation/laravel-fixtures",
  files: FIXTURE_FILES,
  readFixture: (file) => readFixture(FIXTURE_DIR, file),
  defaultCaseLabel: "converges + delimiter-safe + no-loss",
  formatMode: "convergence",
  optionMatrix: LARAVEL_OPTION_MATRIX,
  optionFiles: FIXTURE_FILES,
});
