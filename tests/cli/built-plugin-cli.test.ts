import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
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

function runPrettierCli(args: string[], input: string, cwd = repoRoot) {
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

  assertSuccess(build, "expected tsup build to succeed before CLI integration tests");
}, 30_000);

describe("cli/built-plugin", () => {
  it(
    "loads Blade options from .prettierrc.json overrides using dist build",
    () => {
      const tempDir = mkdtempSync(join(tmpdir(), "blade-cli-config-"));
      try {
      const configPath = join(tempDir, ".prettierrc.json");
      writeFileSync(
        configPath,
        JSON.stringify(
          {
            plugins: [builtPluginPath],
            overrides: [
              {
                files: "*.blade.php",
                options: {
                  parser: "blade",
                  bladePhpFormatting: "safe",
                  bladeEchoSpacing: "tight",
                },
              },
            ],
          },
          null,
          2,
        ),
      );

      const result = runPrettierCli(
        ["--config", configPath, "--stdin-filepath", join(tempDir, "demo.blade.php")],
        "{{$a+$b}}\n",
        tempDir,
      );

      assertSuccess(result, "expected prettier CLI with .prettierrc.json to succeed");
      expect(result.stdout).toBe("{{$a + $b}}\n");
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    },
    20_000,
  );

  it(
    "accepts kebab-case Blade option flags through prettier CLI with dist build",
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
          "--blade-echo-spacing",
          "tight",
        ],
        "{{$a+$b}}\n@blaze(a:1+2)\n",
      );

      assertSuccess(result, "expected prettier CLI with Blade option flags to succeed");
      expect(result.stdout).toBe("{{$a + $b}}\n@blaze (a:1+2)\n");
    },
    20_000,
  );
});
