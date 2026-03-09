import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as prettier from "prettier";
import { describe, expect, it } from "vitest";
import plugin from "../../../src/index.js";
import {
  expectCoreConstructDelimiterSafety,
  expectNoBladePhpConstructLoss,
  fixtureDir,
  listFixtureFiles,
  listRecursiveFixtureFiles,
  pickDeterministicSample,
  readFixture,
} from "../support/fixture-suite.js";

type Suite = {
  name: string;
  files: string[];
  read: (file: string) => string;
};

const DEFAULT_SAMPLE_SIZE = 4;
const DEFAULT_MAX_WRAP_DEPTH = 2;
const HTML_WHITESPACE_SENSITIVITY_OPTIONS = ["css", "strict", "ignore"] as const;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const SAMPLE_SIZE = parsePositiveInt(
  process.env.VALIDATION_WRAPPER_CONVERGENCE_SAMPLE_SIZE,
  DEFAULT_SAMPLE_SIZE,
);
const MAX_WRAP_DEPTH = parsePositiveInt(
  process.env.VALIDATION_WRAPPER_CONVERGENCE_MAX_DEPTH,
  DEFAULT_MAX_WRAP_DEPTH,
);

function wrapInDirectiveDepth(source: string, depth: number): string {
  let out = source.trimEnd();
  for (let i = 0; i < depth; i++) {
    out = `@if ($__validation_depth_${i})\n${out}\n@endif`;
  }
  return `${out}\n`;
}

async function formatPasses(
  input: string,
  options: prettier.Options,
): Promise<{ first: string; second: string; third: string; fourth: string }> {
  const formatOptions: prettier.Options = {
    parser: "blade",
    plugins: [plugin],
    ...options,
  };
  const first = await prettier.format(input, formatOptions);
  const second = await prettier.format(first, formatOptions);
  const third = await prettier.format(second, formatOptions);
  const fourth = await prettier.format(third, formatOptions);
  return { first, second, third, fourth };
}

const forteFilamentDir = fixtureDir("filament");
const forteDocsDir = fixtureDir("laravel-documentation");
const forteWptDir = fixtureDir("wpt-parsing");
const livewireRoot = join(process.cwd(), "tests", "fixtures", "validation", "livewire");
const voltRoot = join(
  process.cwd(),
  "tests",
  "fixtures",
  "validation",
  "volt",
  "tests",
  "Feature",
  "resources",
  "views",
);
const laravelRoot = join(process.cwd(), "tests", "fixtures", "validation", "laravel");

const suites: Suite[] = [
  {
    name: "forte/filament",
    files: listFixtureFiles(forteFilamentDir),
    read: (file) => readFixture(forteFilamentDir, file),
  },
  {
    name: "forte/laravel-docs",
    files: listFixtureFiles(forteDocsDir),
    read: (file) => readFixture(forteDocsDir, file),
  },
  {
    name: "forte/wpt-parsing",
    files: listRecursiveFixtureFiles(
      forteWptDir,
      (name) => name.endsWith(".html") || name.endsWith(".xhtml"),
    ),
    read: (file) => readFileSync(join(forteWptDir, file), "utf8"),
  },
  {
    name: "livewire",
    files: listRecursiveFixtureFiles(livewireRoot, (name) => name.endsWith(".blade.php")),
    read: (file) => readFileSync(join(livewireRoot, file), "utf8"),
  },
  {
    name: "volt",
    files: listRecursiveFixtureFiles(voltRoot, (name) => name.endsWith(".blade.php")),
    read: (file) => readFileSync(join(voltRoot, file), "utf8"),
  },
  {
    name: "laravel",
    files: listRecursiveFixtureFiles(laravelRoot, (name) => name.endsWith(".blade.php")),
    read: (file) => readFileSync(join(laravelRoot, file), "utf8"),
  },
];

describe("validation/fixture-wrapper-depth", () => {
  for (const suite of suites) {
    const sampleFiles = pickDeterministicSample(suite.files, SAMPLE_SIZE);

    for (const htmlWhitespaceSensitivity of HTML_WHITESPACE_SENSITIVITY_OPTIONS) {
      it(`${suite.name} sampled fixtures converge by pass 4 across wrapper depths 0..${MAX_WRAP_DEPTH} (htmlWhitespaceSensitivity=${htmlWhitespaceSensitivity})`, async () => {
        for (const file of sampleFiles) {
          const source = suite.read(file);

          for (let depth = 0; depth <= MAX_WRAP_DEPTH; depth++) {
            const input = wrapInDirectiveDepth(source, depth);
            const context = `${suite.name}/${file} depth=${depth} htmlWhitespaceSensitivity=${htmlWhitespaceSensitivity}`;
            const { third, fourth } = await formatPasses(input, {
              htmlWhitespaceSensitivity,
            });

            expect(fourth, `${context}: did not stabilize by pass 4`).toBe(third);
            expectCoreConstructDelimiterSafety(input, third, context);
            expectNoBladePhpConstructLoss(input, third, context);
          }
        }
      }, 180_000);
    }
  }
});
