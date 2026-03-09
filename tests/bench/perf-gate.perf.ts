import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import * as prettier from "prettier";
import { describe, expect, it } from "vitest";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import * as tailwindPlugin from "prettier-plugin-tailwindcss";

type PerfCase = {
  id: string;
  name: string;
  source: string;
  bladeOptions: prettier.Options;
  htmlOptions?: prettier.Options;
};

type PerfCaseResult = {
  id: string;
  name: string;
  bladeMedianMs: number;
  htmlMedianMs: number | null;
  bladeToHtmlRatio: number | null;
};

type PerfBaseline = {
  version: 1;
  updatedAt: string;
  notes: string;
  cases: Record<
    string,
    {
      bladeMedianMs: number;
      htmlMedianMs: number | null;
    }
  >;
};

const ROOT = process.cwd();
const BASELINE_PATH = join(ROOT, "tests", "bench", "perf-baseline.json");

const WARMUP_RUNS = Number(process.env.PERF_WARMUP_RUNS ?? "3");
const MEASURED_RUNS = Number(process.env.PERF_MEASURED_RUNS ?? "12");
const MAX_REGRESSION_PCT = Number(process.env.PERF_MAX_REGRESSION_PCT ?? "35");
const MAX_BLADE_TO_HTML_RATIO = Number(process.env.PERF_MAX_BLADE_TO_HTML_RATIO ?? "4");
const PERF_MODE = process.env.PERF_MODE ?? "gate";
const REPORT_ONLY = PERF_MODE === "report";
const UPDATE_BASELINE =
  PERF_MODE === "update" ||
  process.argv.includes("--update-baseline") ||
  process.env.PERF_UPDATE_BASELINE === "1";

const FILAMENT_FIXTURE_DIR = join(ROOT, "tests", "fixtures", "validation", "forte", "filament");

const LARGE_FILAMENT_FIXTURE = readFileSync(
  join(FILAMENT_FIXTURE_DIR, "tables_resources_views_index.blade.php"),
  "utf8",
);

const MEDIUM_FILAMENT_FIXTURE = readFileSync(
  join(FILAMENT_FIXTURE_DIR, "forms_resources_views_components_builder.blade.php"),
  "utf8",
);

const SYNTHETIC_INTERPOLATION_BLOCK = Array.from({ length: 80 }, (_, i) => {
  return [
    `@if ($records[${i}]?->isVisible())`,
    `<div`,
    `  wire:key="{{ $records[${i}]->id }}"`,
    `  data-{{ $one }}-{{ $two }}-<?php echo 'segment'; ?>="value"`,
    `  x-data="{`,
    `    open: false,`,
    `    current: '{{ $records[${i}]->name }}',`,
    `  }"`,
    `>`,
    `  {{ collect($records[${i}]->tags)->map(fn($t) => strtoupper($t))->join(', ') }}`,
    `  @php`,
    `    $meta = ['id' => $records[${i}]->id, 'active' => $records[${i}]->active];`,
    `  @endphp`,
    `</div>`,
    `@endif`,
  ].join("\n");
}).join("\n");

const SYNTHETIC_TAILWIND_BLOCK = Array.from({ length: 200 }, (_, i) => {
  return `<div class="z-10 font-bold bg-red-500 p-4 mt-2" className="z-10 font-bold bg-red-500 p-4 mt-2" data-row="${i}"></div>`;
}).join("\n");

const SYNTHETIC_HTML_BASELINE_BLOCK = Array.from({ length: 180 }, (_, i) => {
  return `<section class="z-10 font-bold bg-red-500 p-4 mt-2" data-id="${i}"><h2>Item ${i}</h2><p>Simple HTML benchmark payload.</p></section>`;
}).join("\n");

const CASES: PerfCase[] = [
  {
    id: "large-filament-default",
    name: "Large Filament Fixture (blade parser)",
    source: LARGE_FILAMENT_FIXTURE,
    bladeOptions: { plugins: [bladePlugin] },
  },
  {
    id: "medium-filament-default",
    name: "Medium Filament Fixture (blade parser)",
    source: MEDIUM_FILAMENT_FIXTURE,
    bladeOptions: { plugins: [bladePlugin] },
  },
  {
    id: "interpolation-php-safe",
    name: "Interpolation Benchmark + PHP Safe Embedding",
    source: SYNTHETIC_INTERPOLATION_BLOCK,
    bladeOptions: {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      bladeEchoSpacing: "space",
    },
  },
  {
    id: "tailwind-class-and-classname",
    name: "Tailwind Class/ClassName Sort Path",
    source: SYNTHETIC_TAILWIND_BLOCK,
    bladeOptions: { plugins: [bladePlugin, tailwindPlugin] },
    htmlOptions: { plugins: [tailwindPlugin] },
  },
  {
    id: "synthetic-html-baseline",
    name: "Synthetic HTML Baseline Payload",
    source: SYNTHETIC_HTML_BASELINE_BLOCK,
    bladeOptions: { plugins: [bladePlugin] },
    htmlOptions: {},
  },
];

async function formatBlade(source: string, options: prettier.Options): Promise<void> {
  await prettier.format(source, {
    parser: "blade",
    ...options,
  });
}

async function formatHtml(source: string, options: prettier.Options): Promise<void> {
  await prettier.format(source, {
    parser: "html",
    ...options,
  });
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

async function measureMedianMs(run: () => Promise<void>): Promise<number> {
  for (let i = 0; i < WARMUP_RUNS; i++) {
    await run();
  }

  const durations: number[] = [];
  for (let i = 0; i < MEASURED_RUNS; i++) {
    const start = performance.now();
    await run();
    durations.push(performance.now() - start);
  }

  return median(durations);
}

function roundMs(ms: number): number {
  return Number(ms.toFixed(3));
}

function readBaseline(): PerfBaseline | null {
  if (!existsSync(BASELINE_PATH)) return null;
  const raw = readFileSync(BASELINE_PATH, "utf8");
  return JSON.parse(raw) as PerfBaseline;
}

function writeBaseline(results: PerfCaseResult[]): void {
  const baseline: PerfBaseline = {
    version: 1,
    updatedAt: new Date().toISOString(),
    notes: `Median milliseconds over ${MEASURED_RUNS} measured runs after ${WARMUP_RUNS} warmups.`,
    cases: Object.fromEntries(
      results.map((r) => [
        r.id,
        {
          bladeMedianMs: roundMs(r.bladeMedianMs),
          htmlMedianMs: r.htmlMedianMs === null ? null : roundMs(r.htmlMedianMs),
        },
      ]),
    ),
  };

  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + "\n", "utf8");
}

async function runAllCases(): Promise<PerfCaseResult[]> {
  const results: PerfCaseResult[] = [];

  for (const perfCase of CASES) {
    const bladeMedianMs = await measureMedianMs(() =>
      formatBlade(perfCase.source, perfCase.bladeOptions),
    );

    let htmlMedianMs: number | null = null;
    if (perfCase.htmlOptions) {
      htmlMedianMs = await measureMedianMs(() =>
        formatHtml(perfCase.source, perfCase.htmlOptions!),
      );
    }

    const bladeToHtmlRatio = htmlMedianMs && htmlMedianMs > 0 ? bladeMedianMs / htmlMedianMs : null;

    results.push({
      id: perfCase.id,
      name: perfCase.name,
      bladeMedianMs,
      htmlMedianMs,
      bladeToHtmlRatio,
    });
  }

  return results;
}

describe("perf/gate", () => {
  it("reports performance and enforces regression thresholds", async () => {
    const results = await runAllCases();

    // eslint-disable-next-line no-console
    console.table(
      results.map((r) => ({
        id: r.id,
        bladeMedianMs: roundMs(r.bladeMedianMs),
        htmlMedianMs: r.htmlMedianMs === null ? "n/a" : roundMs(r.htmlMedianMs),
        bladeToHtmlRatio:
          r.bladeToHtmlRatio === null ? "n/a" : Number(r.bladeToHtmlRatio.toFixed(3)),
      })),
    );

    if (UPDATE_BASELINE) {
      writeBaseline(results);
      expect(true).toBe(true);
      return;
    }

    const baseline = readBaseline();
    if (REPORT_ONLY) {
      expect(true).toBe(true);
      return;
    }

    expect(baseline, `Missing ${BASELINE_PATH}. Run: npm run perf:baseline:update`).not.toBeNull();

    for (const result of results) {
      const baselineCase = baseline!.cases[result.id];
      expect(
        baselineCase,
        `Missing baseline case '${result.id}' in ${BASELINE_PATH}.`,
      ).toBeDefined();

      const allowedMs = baselineCase.bladeMedianMs * (1 + MAX_REGRESSION_PCT / 100);

      expect(
        result.bladeMedianMs,
        `${result.id}: blade median ${roundMs(result.bladeMedianMs)}ms exceeds allowed ${roundMs(allowedMs)}ms (${MAX_REGRESSION_PCT}% regression budget).`,
      ).toBeLessThanOrEqual(allowedMs);

      if (result.bladeToHtmlRatio !== null) {
        expect(
          result.bladeToHtmlRatio,
          `${result.id}: blade/html ratio ${result.bladeToHtmlRatio.toFixed(3)} exceeds limit ${MAX_BLADE_TO_HTML_RATIO}.`,
        ).toBeLessThanOrEqual(MAX_BLADE_TO_HTML_RATIO);
      }
    }
  });
});
