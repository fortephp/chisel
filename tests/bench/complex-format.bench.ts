import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as prettier from "prettier";
import { bench, describe } from "vitest";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import * as tailwindPlugin from "prettier-plugin-tailwindcss";

const ROOT = process.cwd();
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

async function formatBlade(source: string, options: prettier.Options = {}): Promise<string> {
  return prettier.format(source, {
    parser: "blade",
    ...options,
  });
}

describe("bench/complex-format/default", () => {
  bench("formats huge filament fixture", async () => {
    await formatBlade(LARGE_FILAMENT_FIXTURE, {
      plugins: [bladePlugin],
    });
  });

  bench("formats medium filament fixture", async () => {
    await formatBlade(MEDIUM_FILAMENT_FIXTURE, {
      plugins: [bladePlugin],
    });
  });

  bench("formats synthetic multiline interpolation benchmark", async () => {
    await formatBlade(SYNTHETIC_INTERPOLATION_BLOCK, {
      plugins: [bladePlugin],
    });
  });
});

describe("bench/complex-format/embedded", () => {
  bench("formats interpolation benchmark with php embedding safe", async () => {
    await formatBlade(SYNTHETIC_INTERPOLATION_BLOCK, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      bladeEchoSpacing: "space",
    });
  });

  bench("formats tailwind class + className sorting path", async () => {
    await formatBlade(SYNTHETIC_TAILWIND_BLOCK, {
      plugins: [bladePlugin, tailwindPlugin],
    });
  });

  bench("formats fixture with php + tailwind plugin stack", async () => {
    await formatBlade(MEDIUM_FILAMENT_FIXTURE, {
      plugins: [bladePlugin, phpPlugin, tailwindPlugin],
      bladePhpFormatting: "safe",
    });
  });
});
