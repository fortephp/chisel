import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { formatWithConvergenceChecks } from "../support/fixture-suite.js";

const CONFORMANCE_FIXTURE_DIR = join(
  process.cwd(),
  "tests",
  "validation",
  "conformance",
  "fixtures",
);

const CRLF_SAFE_OPTIONS = {
  endOfLine: "crlf" as const,
  bladePhpFormatting: "safe" as const,
  singleQuote: true,
};

function readFixture(fileName: string): string {
  return readFileSync(join(CONFORMANCE_FIXTURE_DIR, fileName), "utf8");
}

describe("validation/crlf-stability", () => {
  it("converges for php block docblock fixture under crlf-safe profile", async () => {
    const input = readFixture("php_blocks__003.input.blade.php");
    const { second, third } = await formatWithConvergenceChecks(input, CRLF_SAFE_OPTIONS);

    expect(third).toBe(second);
  });

  it("converges for multiline bound attribute fixture under crlf-safe profile", async () => {
    const input = readFixture("templates__017.input.blade.php");
    const { second, third } = await formatWithConvergenceChecks(input, CRLF_SAFE_OPTIONS);

    expect(third).toBe(second);
  });
});
