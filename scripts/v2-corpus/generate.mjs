#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as phpPlugin from "@prettier/plugin-php";
import * as prettier from "prettier";
import {
  analyzeFormattedOutput,
  contentHash,
  makeCaseId,
  parseAcceptanceTest,
} from "./lib/corpus.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIR, "../..");
const DEFAULT_OUTPUT = join(REPOSITORY_ROOT, ".tmp", "v2-corpus-review");
const DEFAULT_V2_REF = "origin/v2";
const MAX_PASSES = 4;

const PROFILE_DEFINITIONS = {
  default: {
    label: "v3 default (PHP safe)",
    description: "Published v3 defaults with the PHP plugin loaded.",
    options: { bladePhpFormatting: "safe" },
  },
  "php-off": {
    label: "v3 PHP formatting off",
    description: "Keeps embedded PHP fragments unchanged while formatting Blade and HTML.",
    options: { bladePhpFormatting: "off" },
  },
  tabs: {
    label: "v3 tabs (width 4)",
    description: "Uses tabs with a visual width of four columns.",
    options: { useTabs: true, tabWidth: 4 },
  },
  strict: {
    label: "v3 strict whitespace",
    description: "Runs with htmlWhitespaceSensitivity set to strict.",
    options: { htmlWhitespaceSensitivity: "strict" },
  },
  ignore: {
    label: "v3 ignored HTML whitespace",
    description: "Runs with htmlWhitespaceSensitivity set to ignore.",
    options: { htmlWhitespaceSensitivity: "ignore" },
  },
};

function printHelp() {
  console.log(`Usage: node scripts/v2-corpus/generate.mjs [options]

Options:
  ref=<git-ref>             v2 ref to extract (default: origin/v2)
  output=<directory>        report directory inside this repository
  profiles=<list|all>       comma-separated profiles (default: default)
  limit=<count>             deterministic pilot subset
  case=<text>               only paths containing text
  concurrency=<count>       parallel formatter jobs (default: 2)
  --help                    show this help

Profiles: ${Object.keys(PROFILE_DEFINITIONS).join(", ")}`);
}

function parsePositiveInteger(raw, flag) {
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return value;
}

function parseArguments(argv) {
  const options = {
    ref: DEFAULT_V2_REF,
    output: DEFAULT_OUTPUT,
    profiles: ["default"],
    limit: null,
    caseFilter: null,
    concurrency: 2,
  };

  for (let index = 0; index < argv.length; index++) {
    let argument = argv[index];
    let value;

    if (argument === "--help") {
      printHelp();
      process.exit(0);
    }

    const equalsAt = argument.indexOf("=");
    if (equalsAt !== -1) {
      value = argument.slice(equalsAt + 1);
      argument = argument.slice(0, equalsAt);
    } else {
      value = argv[index + 1];
      index += 1;
    }
    if (!value) throw new Error(`${argument} requires a value`);
    argument = argument.replace(/^--/u, "");

    if (argument === "ref") options.ref = value;
    else if (argument === "output") options.output = resolve(REPOSITORY_ROOT, value);
    else if (argument === "limit") options.limit = parsePositiveInteger(value, argument);
    else if (argument === "case") options.caseFilter = value;
    else if (argument === "concurrency") {
      options.concurrency = parsePositiveInteger(value, argument);
    } else if (argument === "profiles") {
      options.profiles =
        value === "all"
          ? Object.keys(PROFILE_DEFINITIONS)
          : value
              .split(",")
              .map((entry) => entry.trim())
              .filter(Boolean);
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }

  for (const profile of options.profiles) {
    if (!PROFILE_DEFINITIONS[profile]) {
      throw new Error(
        `Unknown profile '${profile}'. Available: ${Object.keys(PROFILE_DEFINITIONS)}`,
      );
    }
  }
  if (options.profiles.length === 0) throw new Error("At least one profile is required");

  return options;
}

function git(args, { allowFailure = false } = {}) {
  try {
    return execFileSync("git", args, {
      cwd: REPOSITORY_ROOT,
      encoding: "utf8",
      maxBuffer: 128 * 1024 * 1024,
      stdio: ["ignore", "pipe", allowFailure ? "ignore" : "pipe"],
    }).trimEnd();
  } catch (error) {
    if (allowFailure) return null;
    const detail = error.stderr?.toString().trim() || error.message;
    throw new Error(`git ${args.join(" ")} failed: ${detail}`);
  }
}

function assertSafeOutputDirectory(output) {
  const relativePath = relative(REPOSITORY_ROOT, output);
  if (
    relativePath === "" ||
    relativePath.startsWith("..") ||
    isAbsolute(relativePath) ||
    relativePath.split(/[\\/]/u).length < 2
  ) {
    throw new Error("--output must be a nested directory inside this repository");
  }
}

async function collectFixtureHashes(root) {
  const hashes = new Map();

  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith(".blade.php")) {
        const hash = contentHash(await readFile(fullPath, "utf8"));
        const fixturePath = relative(REPOSITORY_ROOT, fullPath).replaceAll("\\", "/");
        const entries = hashes.get(hash) ?? [];
        entries.push(fixturePath);
        hashes.set(hash, entries);
      }
    }
  }

  await walk(root);
  return hashes;
}

function loadAcceptanceCases(ref, fixtureHashes, caseFilter, limit) {
  const commit = git(["rev-parse", ref]);
  let paths = git(["ls-tree", "-r", "--name-only", ref, "--", "src/test/acceptance"])
    .split("\n")
    .filter((entry) => entry.endsWith(".test.ts"))
    .sort();

  if (caseFilter) paths = paths.filter((entry) => entry.includes(caseFilter));
  if (limit !== null) paths = paths.slice(0, limit);
  if (paths.length === 0) throw new Error("No v2 acceptance tests matched the requested filters");

  const cases = paths.map((sourcePath) => {
    const source = git(["show", `${ref}:${sourcePath}`]);
    const { input, reference } = parseAcceptanceTest(source, sourcePath);
    const hash = contentHash(input);
    const fileName = basename(sourcePath)
      .replace(/_blade_php\.test\.ts$/u, ".blade.php")
      .replace(/\.test\.ts$/u, ".blade.php");

    return {
      id: makeCaseId(sourcePath),
      group: sourcePath.split("/").at(-2),
      name: fileName,
      sourcePath,
      input,
      reference,
      inputHash: hash,
      duplicateFixtures: fixtureHashes.get(hash) ?? [],
    };
  });

  return { commit, cases };
}

async function formatCase(input, profile, bladePlugin) {
  const startedAt = performance.now();
  let current = input;
  let passCount = 0;
  let convergedAt = null;
  let error = null;

  try {
    for (let pass = 1; pass <= MAX_PASSES; pass++) {
      const next = await prettier.format(current, {
        parser: "blade",
        plugins: [bladePlugin, phpPlugin],
        ...profile.options,
      });
      passCount = pass;
      if (next === current) {
        convergedAt = pass;
        current = next;
        break;
      }
      current = next;
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.stack || caught.message : String(caught);
  }

  return {
    output: current,
    passCount,
    convergedAt,
    elapsedMs: Math.round(performance.now() - startedAt),
    error,
  };
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function prepareOutputDirectory(output) {
  assertSafeOutputDirectory(output);
  await rm(output, { recursive: true, force: true });
  await Promise.all([
    mkdir(join(output, "data", "cases"), { recursive: true }),
    mkdir(join(output, "inputs"), { recursive: true }),
    mkdir(join(output, "v2-reference"), { recursive: true }),
    mkdir(join(output, "v3"), { recursive: true }),
  ]);

  for (const asset of ["index.html", "app.js", "diff.js", "styles.css"]) {
    await copyFile(join(SCRIPT_DIR, "viewer", asset), join(output, asset));
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  assertSafeOutputDirectory(options.output);

  console.log("Building the current v3 plugin...");
  execFileSync(
    process.execPath,
    [join(REPOSITORY_ROOT, "node_modules", "tsup", "dist", "cli-default.js")],
    {
      cwd: REPOSITORY_ROOT,
      stdio: "inherit",
    },
  );

  const builtPluginPath = join(REPOSITORY_ROOT, "dist", "index.js");
  try {
    await stat(builtPluginPath);
  } catch {
    throw new Error("dist/index.js is missing. Run `npm run build` before generating the corpus.");
  }

  const bladePlugin = (await import(pathToFileURL(builtPluginPath).href)).default;
  const fixtureRoot = join(REPOSITORY_ROOT, "tests", "fixtures", "validation");
  console.log(
    `Indexing existing validation fixtures under ${relative(REPOSITORY_ROOT, fixtureRoot)}...`,
  );
  const fixtureHashes = await collectFixtureHashes(fixtureRoot);

  console.log(`Extracting v2 acceptance cases from ${options.ref}...`);
  const { commit: v2Commit, cases } = loadAcceptanceCases(
    options.ref,
    fixtureHashes,
    options.caseFilter,
    options.limit,
  );
  await prepareOutputDirectory(options.output);
  for (const profile of options.profiles) {
    await mkdir(join(options.output, "v3", profile), { recursive: true });
  }

  const summaries = Array.from({ length: cases.length });
  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= cases.length) return;
      const entry = cases[index];
      const detail = {
        id: entry.id,
        group: entry.group,
        name: entry.name,
        sourcePath: entry.sourcePath,
        inputHash: entry.inputHash,
        duplicateFixtures: entry.duplicateFixtures,
        input: entry.input,
        reference: entry.reference,
        profiles: {},
      };
      const profileSummaries = {};

      await Promise.all([
        writeFile(join(options.output, "inputs", `${entry.id}.blade.php`), entry.input, "utf8"),
        writeFile(
          join(options.output, "v2-reference", `${entry.id}.blade.php`),
          entry.reference,
          "utf8",
        ),
      ]);

      for (const profileId of options.profiles) {
        const formatted = await formatCase(
          entry.input,
          PROFILE_DEFINITIONS[profileId],
          bladePlugin,
        );
        const analysis = analyzeFormattedOutput({
          input: entry.input,
          reference: entry.reference,
          output: formatted.output,
          convergedAt: formatted.convergedAt,
          error: formatted.error,
        });
        const profileResult = { ...formatted, ...analysis };
        detail.profiles[profileId] = profileResult;
        profileSummaries[profileId] = {
          passCount: formatted.passCount,
          convergedAt: formatted.convergedAt,
          elapsedMs: formatted.elapsedMs,
          error: formatted.error,
          hardFailure: analysis.hardFailure,
          priorityScore: analysis.priorityScore,
          diagnostics: analysis.diagnostics,
          metrics: analysis.metrics,
        };
        await writeFile(
          join(options.output, "v3", profileId, `${entry.id}.blade.php`),
          formatted.output,
          "utf8",
        );
      }

      await writeJson(join(options.output, "data", "cases", `${entry.id}.json`), detail);
      summaries[index] = {
        id: entry.id,
        group: entry.group,
        name: entry.name,
        sourcePath: entry.sourcePath,
        inputHash: entry.inputHash,
        duplicateFixtures: entry.duplicateFixtures,
        profiles: profileSummaries,
      };

      completed += 1;
      if (completed === cases.length || completed % 10 === 0) {
        console.log(`Formatted ${completed}/${cases.length} cases...`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(options.concurrency, cases.length) }, () => worker()),
  );

  const v3Commit = git(["rev-parse", "HEAD"]);
  const worktreeStatus = git(["status", "--porcelain"], { allowFailure: true }) ?? "";
  const worktreeDiff =
    git(["diff", "--no-ext-diff", "--binary", "HEAD"], {
      allowFailure: true,
    }) ?? "";
  const dirty = worktreeStatus.length > 0;
  const fingerprint = contentHash(`${v3Commit}\n${worktreeStatus}\n${worktreeDiff}`);
  const profileList = options.profiles.map((id) => ({ id, ...PROFILE_DEFINITIONS[id] }));
  const summary = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    v2: { ref: options.ref, commit: v2Commit },
    v3: { commit: v3Commit, dirty, fingerprint },
    maxPasses: MAX_PASSES,
    profiles: profileList,
    counts: {
      cases: summaries.length,
      duplicates: summaries.filter((entry) => entry.duplicateFixtures.length > 0).length,
      hardFailures: summaries.filter((entry) =>
        Object.values(entry.profiles).some((profile) => profile.hardFailure),
      ).length,
      warnings: summaries.filter((entry) =>
        Object.values(entry.profiles).some((profile) =>
          profile.diagnostics.some((diagnostic) => diagnostic.level === "warning"),
        ),
      ).length,
    },
    cases: summaries,
  };
  await writeJson(join(options.output, "data", "summary.json"), summary);
  await writeJson(
    join(options.output, "manifest.json"),
    summaries.map(({ id, sourcePath, inputHash, duplicateFixtures }) => ({
      id,
      sourcePath,
      inputHash,
      duplicateFixtures,
    })),
  );

  const relativeOutput = relative(REPOSITORY_ROOT, options.output).replaceAll("\\", "/");
  console.log(`\nReport generated at ${relativeOutput}/index.html`);
  console.log(
    `Cases: ${summary.counts.cases}; hard failures: ${summary.counts.hardFailures}; warnings: ${summary.counts.warnings}`,
  );
  console.log("Run `node scripts/v2-corpus/serve.mjs` to open the local review server.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
