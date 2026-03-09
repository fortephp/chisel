import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const prettierBinPath = join(repoRoot, "node_modules", "prettier", "bin", "prettier.cjs");
const builtPluginPath = join(repoRoot, "dist", "index.js");
const tsupBinPath = join(repoRoot, "node_modules", "tsup", "dist", "cli-default.js");

function assertSuccess(
  result: { status: number | null; stdout: string; stderr: string; error?: Error },
  context: string,
): void {
  const diagnostics = [
    `exit=${result.status ?? "null"}`,
    result.stdout ? `stdout:\n${result.stdout}` : "",
    result.stderr ? `stderr:\n${result.stderr}` : "",
    result.error ? `error:\n${result.error.message}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  expect(result.status, `${context}\n\n${diagnostics}`).toBe(0);
}

function runPrettierCli(args: string[], input?: string, cwd = repoRoot) {
  return spawnSync(process.execPath, [prettierBinPath, ...args], {
    cwd,
    input,
    encoding: "utf8",
  });
}

beforeAll(() => {
  const build = spawnSync(process.execPath, [tsupBinPath], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  assertSuccess(build, "expected tsup build to succeed before README CLI tests");
}, 30_000);

describe("cli/readme-examples", () => {
  it(
    "supports the quick-start .prettierrc plus quoted write glob example",
    () => {
      const tempDir = mkdtempSync(join(tmpdir(), "blade-readme-write-"));

      try {
        const configPath = join(tempDir, ".prettierrc");
        const viewsDir = join(tempDir, "resources", "views");
        const filePath = join(viewsDir, "demo.blade.php");

        mkdirSync(viewsDir, { recursive: true });
        writeFileSync(
          configPath,
          JSON.stringify(
            {
              plugins: [builtPluginPath],
              overrides: [
                {
                  files: ["*.blade.php"],
                  options: {
                    parser: "blade",
                  },
                },
              ],
            },
            null,
            2,
          ),
        );
        writeFileSync(filePath, "<div><span>foo</span></div>\n");

        const result = runPrettierCli(["--write", "resources/views/**/*.blade.php"], undefined, tempDir);

        assertSuccess(result, "expected README quoted write-glob example to succeed");
        expect(readFileSync(filePath, "utf8")).toBe("<div><span>foo</span></div>\n");
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    },
    20_000,
  );

  it(
    "accepts the README kebab-case CLI option example",
    () => {
      const result = runPrettierCli(
        [
          "--plugin",
          builtPluginPath,
          "--plugin",
          "@prettier/plugin-php",
          "--parser",
          "blade",
          "--blade-php-formatting",
          "safe",
          "--blade-php-formatting-targets",
          "echo",
          "--blade-php-formatting-targets",
          "directiveArgs",
          "--blade-component-prefixes",
          "x",
          "--blade-component-prefixes",
          "flux",
          "--blade-directive-arg-spacing",
          "space",
          "--blade-echo-spacing",
          "tight",
        ],
        "{{$a+$b}}\n@if($x==\"y\")\n@endif\n",
      );

      assertSuccess(result, "expected README CLI flags example to succeed");
      expect(result.stdout).toBe("{{$a + $b}}\n@if ($x == \"y\")\n@endif\n");
    },
    20_000,
  );
});
