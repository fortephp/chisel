import { describe, expect, it } from "vitest";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { format } from "../helpers.js";

type InterpolationCase = {
  name: string;
  input: string;
  fragments: string[];
  delimiterPairs?: Array<{ open: string; close: string }>;
};

const withPhpPlugins = [bladePlugin, phpPlugin];

const baseOptionMatrix = [
  { label: "baseline", options: {} },
  { label: "echo-space", options: { bladeEchoSpacing: "space" as const } },
  { label: "echo-tight", options: { bladeEchoSpacing: "tight" as const } },
];

const phpOptionMatrix = [
  {
    label: "php-safe-space",
    options: {
      plugins: withPhpPlugins,
      bladePhpFormatting: "safe" as const,
      bladeEchoSpacing: "space" as const,
    },
  },
  {
    label: "php-safe-tight",
    options: {
      plugins: withPhpPlugins,
      bladePhpFormatting: "safe" as const,
      bladeEchoSpacing: "tight" as const,
    },
  },
  {
    label: "php-aggressive-space",
    options: {
      plugins: withPhpPlugins,
      bladePhpFormatting: "aggressive" as const,
      bladeEchoSpacing: "space" as const,
    },
  },
];

const cases: InterpolationCase[] = [
  {
    name: "multiline-echo-chain-in-content",
    input: [
      "<section>",
      "{{",
      "collect($users)",
      "  ->filter(fn ($u) => $u->active)",
      "  ->map(fn ($u) => $u->email)",
      "  ->join(', ')",
      "}}",
      "</section>",
      "",
    ].join("\n"),
    fragments: ["collect($users)", "->filter", "->map", "->join"],
    delimiterPairs: [{ open: "{{", close: "}}" }],
  },
  {
    name: "multiline-raw-and-triple-in-attributes",
    input: [
      "<div",
      'data-json="{!!',
      "json_encode(",
      "  [",
      "    'id' => $id,",
      "    'meta' => ['a' => $a],",
      "  ],",
      "  JSON_THROW_ON_ERROR",
      ")",
      '!!}"',
      'title="{{{',
      "$headline",
      '}}}"',
      "></div>",
      "",
    ].join("\n"),
    fragments: ["JSON_THROW_ON_ERROR", "$headline", "'meta' => ['a' => $a]"],
    delimiterPairs: [
      { open: "{!!", close: "!!}" },
      { open: "{{{", close: "}}}" },
    ],
  },
  {
    name: "directive-body-multiline-attr-interpolations",
    input: [
      "<div",
      "@if($ready)",
      'wire:key="{{',
      "$record->id",
      '}}"',
      'data-label="{{',
      "strtoupper(",
      "  $record->name",
      ")",
      '}}"',
      "<?php echo $record->updated_at; ?>",
      "@endif",
      "></div>",
      "",
    ].join("\n"),
    fragments: ["$record->id", "strtoupper(", "$record->name", "<?php", "@if", "@endif"],
    delimiterPairs: [{ open: "{{", close: "}}" }],
  },
  {
    name: "adjacent-multiline-echo-variants",
    input: [
      "<div>",
      "{{",
      "$one",
      "}}{{--",
      "--}}",
      "{{",
      "$two",
      "}}",
      "{!!",
      "$three",
      "!!}",
      "{{{",
      "$four",
      "}}}",
      "</div>",
      "",
    ].join("\n"),
    fragments: ["$one", "$two", "$three", "$four"],
    delimiterPairs: [
      { open: "{{", close: "}}" },
      { open: "{!!", close: "!!}" },
      { open: "{{{", close: "}}}" },
    ],
  },
  {
    name: "multiline-interpolation-in-compound-attr-name",
    input: [
      "<div",
      "{{",
      "$one",
      "}}-{{",
      "$two",
      '}}="<?php echo $three; ?>"',
      'data-note="{{',
      "$four",
      '}}"',
      "></div>",
      "",
    ].join("\n"),
    fragments: ["$one", "$two", "$three", "$four", "<?php"],
    delimiterPairs: [{ open: "{{", close: "}}" }],
  },
  {
    name: "multiline-interpolation-in-compound-element-name",
    input: [
      "<my-{{",
      "Str::of($name)",
      "  ->lower()",
      "  ->replace(' ', '-')",
      "}}",
      'data-id="{{',
      "$id",
      '}}"',
      ">",
      "{{",
      "$slot",
      "}}",
      "</my-{{",
      "Str::of($name)",
      "  ->lower()",
      "  ->replace(' ', '-')",
      "}}>",
      "",
    ].join("\n"),
    fragments: ["Str::of($name)", "->replace", "$id", "$slot"],
    delimiterPairs: [{ open: "{{", close: "}}" }],
  },
  {
    name: "multipart-attr-name-with-php-tag",
    input: [
      "<div",
      "{{",
      "$one",
      "}}{{",
      "$two",
      "}}{{",
      "$three",
      "}}-<?php",
      "echo trim($name);",
      '?>="Things"',
      ">compound attribute payload</div>",
      "",
    ].join("\n"),
    fragments: ["$one", "$two", "$three", "trim($name)", "Things", "<?php"],
    delimiterPairs: [
      { open: "{{", close: "}}" },
      { open: "<?php", close: "?>" },
    ],
  },
  {
    name: "crlf-multiline-interpolations",
    input: [
      "<div",
      "@foreach($items as $item)",
      'wire:key="{{',
      "$item->id",
      '}}"',
      "{!!",
      "$item->label",
      "!!}",
      "@endforeach",
      "></div>",
      "",
    ].join("\r\n"),
    fragments: ["$item->id", "$item->label", "@foreach", "@endforeach"],
    delimiterPairs: [
      { open: "{{", close: "}}" },
      { open: "{!!", close: "!!}" },
    ],
  },
  {
    name: "optional-tags-with-multiline-interpolations",
    input: [
      "<ul><li>{{",
      "$one",
      "}}<li>{!!",
      "$two",
      "!!}</ul>",
      "<table><tr><td>{{",
      "$a",
      "}}<td>{{",
      "$b",
      "}}</table>",
      "",
    ].join("\n"),
    fragments: ["$one", "$two", "$a", "$b"],
    delimiterPairs: [
      { open: "{{", close: "}}" },
      { open: "{!!", close: "!!}" },
    ],
  },
];

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let index = 0;
  while (true) {
    const next = haystack.indexOf(needle, index);
    if (next === -1) return count;
    count++;
    index = next + needle.length;
  }
}

describe("directives/multiline-interpolation-safety", () => {
  for (const c of cases) {
    const matrix = [...baseOptionMatrix, ...phpOptionMatrix];

    for (const variant of matrix) {
      it(`${c.name} :: ${variant.label}`, async () => {
        const output = await format(c.input, variant.options);

        for (const fragment of c.fragments) {
          expect(output, `missing fragment: ${fragment}`).toContain(fragment);
        }

        for (const pair of c.delimiterPairs ?? []) {
          const openCount = countOccurrences(output, pair.open);
          const closeCount = countOccurrences(output, pair.close);
          expect(
            openCount,
            `missing opener '${pair.open}' in ${c.name} (${variant.label})`,
          ).toBeGreaterThan(0);
          expect(
            openCount,
            `unbalanced '${pair.open}'/'${pair.close}' in ${c.name} (${variant.label})`,
          ).toBe(closeCount);
        }
      });
    }
  }
});
