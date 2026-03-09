import { describe, expect, it } from "vitest";
import type { Options } from "prettier";
import { formatWithPasses } from "../helpers.js";
import {
  expectCoreConstructDelimiterSafety,
  expectNoBladePhpConstructLoss,
  expectRespectsFormattingInvariants,
} from "../validation/support/fixture-suite.js";

type Domain<T = unknown> = {
  key: keyof Options;
  values: T[];
};

class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  int(maxExclusive: number): number {
    return this.next() % maxExclusive;
  }
}

const INPUT = `<!doctype html>
<html>
<head></head>
<body>
@if($user&&$enabled)
<div class="z-10 font-bold bg-red-500" x-data="{ greeting: &quot;hello&quot; }" onclick="run({ alpha: 1, beta: 2, longKey: 3 })" wire:key="{{ $id }}">
{{   $a+$b   }}
{!!   $raw+$c   !!}
{{{   $tri+$d   }}}
@php($x+5+5)
<svg><path d="M0 0 L10 10 L20 20 L30 30 L40 40" stroke="currentColor" vector-effect="non-scaling-stroke" /></svg>
</div>
@else
<x-slot:[items]>{{ $item }}</x-slot>
@endif
</body>
</html>
`;

const DOMAINS: Domain[] = [
  { key: "bladePhpFormatting", values: ["off", "safe"] },
  { key: "bladeDirectiveArgSpacing", values: ["none", "space"] },
  { key: "bladeEchoSpacing", values: ["preserve", "space", "tight"] },
  { key: "bladeSlotClosingTag", values: ["canonical", "preserve"] },
  { key: "bladeInsertOptionalClosingTags", values: [false, true] },
  { key: "bladeKeepHeadAndBodyAtRoot", values: [false, true] },
  { key: "bladeInlineIntentElements", values: [["p", "svg", "svg:*"], ["p"], []] },
  { key: "singleQuote", values: [false, true] },
  { key: "printWidth", values: [60, 100] },
  { key: "useTabs", values: [false, true] },
  { key: "htmlWhitespaceSensitivity", values: ["css", "strict"] },
  { key: "singleAttributePerLine", values: [false, true] },
  { key: "bracketSameLine", values: [false, true] },
  { key: "endOfLine", values: ["lf", "crlf"] },
];

function pairKey(i: number, vi: number, j: number, vj: number): string {
  return `${i}:${vi}|${j}:${vj}`;
}

function allRequiredPairs(domains: Domain[]): Set<string> {
  const required = new Set<string>();
  for (let i = 0; i < domains.length; i++) {
    for (let j = i + 1; j < domains.length; j++) {
      for (let vi = 0; vi < domains[i].values.length; vi++) {
        for (let vj = 0; vj < domains[j].values.length; vj++) {
          required.add(pairKey(i, vi, j, vj));
        }
      }
    }
  }
  return required;
}

function rowToPairs(row: number[], domains: Domain[]): string[] {
  const keys: string[] = [];
  for (let i = 0; i < domains.length; i++) {
    for (let j = i + 1; j < domains.length; j++) {
      keys.push(pairKey(i, row[i]!, j, row[j]!));
    }
  }
  return keys;
}

function randomRow(domains: Domain[], rng: Rng): number[] {
  return domains.map((d) => rng.int(d.values.length));
}

function rowToOptions(row: number[], domains: Domain[]): Options {
  const out: Record<string, unknown> = {};
  for (let i = 0; i < domains.length; i++) {
    out[String(domains[i].key)] = domains[i].values[row[i]!];
  }
  return out as Options;
}

function buildPairwiseRows(domains: Domain[]): Options[] {
  const rng = new Rng(0xdeadbeef);
  const uncovered = allRequiredPairs(domains);
  const rows: number[][] = [];

  while (uncovered.size > 0) {
    let best: number[] | null = null;
    let bestScore = -1;

    for (let i = 0; i < 500; i++) {
      const candidate = randomRow(domains, rng);
      let score = 0;
      for (const key of rowToPairs(candidate, domains)) {
        if (uncovered.has(key)) score++;
      }
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }

    if (!best || bestScore <= 0) {
      break;
    }

    rows.push(best);
    for (const key of rowToPairs(best, domains)) {
      uncovered.delete(key);
    }
  }

  if (uncovered.size > 0) {
    for (const key of uncovered) {
      const row = domains.map(() => 0);
      const match = key.match(/^(\d+):(\d+)\|(\d+):(\d+)$/u);
      if (!match) continue;
      const a = Number.parseInt(match[1]!, 10);
      const av = Number.parseInt(match[2]!, 10);
      const b = Number.parseInt(match[3]!, 10);
      const bv = Number.parseInt(match[4]!, 10);
      row[a] = av;
      row[b] = bv;
      rows.push(row);
      for (const pair of rowToPairs(row, domains)) {
        uncovered.delete(pair);
      }
    }
  }

  expect(uncovered.size, "pairwise generator left uncovered pairs").toBe(0);

  return rows.map((row) => rowToOptions(row, domains));
}

function summarizeOptions(options: Options): string {
  return DOMAINS.map(
    (d) => `${String(d.key)}=${String((options as Record<string, unknown>)[d.key])}`,
  ).join(" | ");
}

describe("options/option-pair-profiles", () => {
  const matrix = buildPairwiseRows(DOMAINS);

  it(`covers pairwise interactions across ${matrix.length} option profiles`, async () => {
    for (const options of matrix) {
      const output = await formatWithPasses(INPUT, options, {
        passes: 3,
        assertIdempotent: true,
      });
      const context = `pairwise ${summarizeOptions(options)}`;

      expectCoreConstructDelimiterSafety(INPUT, output, context);
      expectNoBladePhpConstructLoss(INPUT, output, context);
      expectRespectsFormattingInvariants(output, options, context);
    }
  }, 120_000);
});
