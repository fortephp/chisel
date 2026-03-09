import { readFileSync } from "node:fs";
import { join, relative } from "node:path";

export type ConformanceGroup = "format" | "formatter";

type ManifestEntry = {
  id: string;
  sourceFile: string;
  line: number;
  inputFile: string;
  options?: Record<string, unknown>;
  group: ConformanceGroup;
};

export type ConformanceCase = {
  id: string;
  sourceFile: string;
  sourceLabel: string;
  line: number;
  options: Record<string, unknown>;
  group: ConformanceGroup;
  input: string;
};

const FIXTURES_DIR = join(process.cwd(), "tests", "validation", "conformance", "fixtures");
const MANIFEST_PATH = join(FIXTURES_DIR, "manifest.json");

function loadManifest(): ManifestEntry[] {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as ManifestEntry[];
}

function normalizeLineEndingsToLf(value: string): string {
  return value.replace(/\r\n?/gu, "\n");
}

function normalizePathSeparators(value: string): string {
  return value.replace(/\\/gu, "/");
}

export function loadConformanceCases(group?: ConformanceGroup): ConformanceCase[] {
  const entries = loadManifest();
  const filtered = group ? entries.filter((entry) => entry.group === group) : entries;

  return filtered.map((entry) => ({
    id: entry.id,
    sourceFile: entry.sourceFile,
    sourceLabel: `${normalizePathSeparators(relative(process.cwd(), entry.sourceFile))}:${entry.line}`,
    line: entry.line,
    group: entry.group,
    options: entry.options ?? {},
    input: normalizeLineEndingsToLf(readFileSync(join(FIXTURES_DIR, entry.inputFile), "utf8")),
  }));
}
