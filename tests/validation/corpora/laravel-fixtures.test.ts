import { join } from "node:path";
import type * as prettier from "prettier";
import { expect, it } from "vitest";
import { LARGE_STYLE_EMBED_CHAR_THRESHOLD } from "../../../src/print/embed/raw-content.js";
import { formatWithConvergenceChecks, readFixture } from "../support/fixture-suite.js";
import { defineCorpusFixtureSuite } from "../support/corpus-suite.js";

const FIXTURE_DIR = join(process.cwd(), "tests", "fixtures", "validation", "laravel");
const ISSUE_177_WELCOME_FIXTURE = "welcome-issue-177.blade.php";

const FIXTURE_FILES = ["welcome.blade.php", ISSUE_177_WELCOME_FIXTURE];

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

function extractFirstStyleBlockContent(source: string): string {
  const styleMatch = source.match(/<style\b[^>]*>\r?\n([\s\S]*?)\r?\n\s*<\/style>/u);
  if (!styleMatch) {
    throw new Error("Expected formatted fixture to contain a style block.");
  }

  return styleMatch[1];
}

defineCorpusFixtureSuite({
  name: "validation/laravel-fixtures",
  files: FIXTURE_FILES,
  readFixture: (file) => readFixture(FIXTURE_DIR, file),
  defaultCaseLabel: "converges + delimiter-safe + no-loss",
  formatMode: "convergence",
  optionMatrix: LARAVEL_OPTION_MATRIX,
  optionFiles: FIXTURE_FILES,
  defineExtraAssertions: () => {
    it("keeps the issue #177 Tailwind welcome style compact by default", async () => {
      const input = readFixture(FIXTURE_DIR, ISSUE_177_WELCOME_FIXTURE);
      const { second } = await formatWithConvergenceChecks(input);
      const styleLines = extractFirstStyleBlockContent(second)
        .split(/\r?\n/u)
        .filter((line) => line.trim().length > 0);

      expect(styleLines).toHaveLength(1);
      expect(styleLines[0]?.length).toBeGreaterThan(LARGE_STYLE_EMBED_CHAR_THRESHOLD);
      expect(styleLines[0]).toContain("@property --tw-translate-x{");
      expect(styleLines[0]).toContain("@keyframes spin{");
      expect(second).not.toMatch(/^\s*@property\s*$/mu);
      expect(second).not.toMatch(/^\s*@keyframes\s*$/mu);
      expect(second).not.toMatch(/^\s*@media\s*$/mu);
    });
  },
});
