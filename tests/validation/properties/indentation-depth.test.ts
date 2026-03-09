import { describe, expect, it } from "vitest";
import * as prettier from "prettier";
import bladePlugin from "../../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { wrapInDiv } from "../../helpers.js";

const MAX_DEPTH = 8;
const IDEMPOTENCY_PASSES = 4;

const BASE_FIXTURE = `@if ($ready)
<ul>
@foreach ($items as $item)
<li>
<span>{{ $item }}</span>
</li>
@endforeach
</ul>
@endif
`;

const PHP_FIXTURE = `@if ($ready)
@php
$x=1+2;
if($x>0){$y=$x+10;}
@endphp
@endif
`;

async function formatStable(
  input: string,
  options: prettier.Options,
  plugins: prettier.Options["plugins"],
): Promise<string> {
  const opts: prettier.Options = {
    parser: "blade",
    plugins,
    ...options,
  };

  let current = await prettier.format(input, opts);
  for (let i = 2; i <= IDEMPOTENCY_PASSES; i++) {
    const next = await prettier.format(current, opts);
    expect(next, `formatter drifted on pass ${i}`).toBe(current);
    current = next;
  }
  return current;
}

function getLeadingIndent(line: string): string {
  return line.match(/^[\t ]*/u)?.[0] ?? "";
}

function findRequiredLine(output: string, contains: string): string {
  const line = output.split(/\r?\n/u).find((entry) => entry.includes(contains));
  expect(line, `missing required line containing: ${contains}`).toBeTruthy();
  return line ?? "";
}

const indentationOptionMatrix: Array<{
  label: string;
  options: prettier.Options;
}> = [
  { label: "spaces-tabWidth-2", options: { useTabs: false, tabWidth: 2 } },
  { label: "spaces-tabWidth-4", options: { useTabs: false, tabWidth: 4 } },
  { label: "tabs-tabWidth-2", options: { useTabs: true, tabWidth: 2 } },
  { label: "tabs-tabWidth-4", options: { useTabs: true, tabWidth: 4 } },
];

describe("validation/indentation-depth", () => {
  for (const entry of indentationOptionMatrix) {
    it(`keeps stable nested indentation for html/blade content (${entry.label})`, async () => {
      let baselineIndent = -1;

      for (let depth = 0; depth <= MAX_DEPTH; depth++) {
        const input = wrapInDiv(BASE_FIXTURE, depth);
        const output = await formatStable(input, entry.options, [bladePlugin]);
        const line = findRequiredLine(output, "<span>{{ $item }}</span>");
        const indent = getLeadingIndent(line);

        if (entry.options.useTabs) {
          expect(indent.includes(" "), `expected tab indentation at depth ${depth}`).toBe(false);
          const tabCount = indent.length;
          if (depth === 0) {
            baselineIndent = tabCount;
          } else {
            expect(tabCount, `unexpected tab indent delta at depth ${depth}`).toBe(
              baselineIndent + depth,
            );
          }
        } else {
          expect(indent.includes("\t"), `expected space indentation at depth ${depth}`).toBe(false);
          const spaceCount = indent.length;
          const tabWidth = (entry.options.tabWidth as number) ?? 2;
          if (depth === 0) {
            baselineIndent = spaceCount;
          } else {
            expect(spaceCount, `unexpected space indent delta at depth ${depth}`).toBe(
              baselineIndent + depth * tabWidth,
            );
          }
        }
      }
    });

    it(`keeps stable nested indentation for embedded php blocks (${entry.label})`, async () => {
      let baselineIndent = -1;

      for (let depth = 0; depth <= MAX_DEPTH; depth++) {
        const input = wrapInDiv(PHP_FIXTURE, depth);
        const output = await formatStable(
          input,
          {
            ...entry.options,
            bladePhpFormatting: "safe",
          },
          [bladePlugin, phpPlugin],
        );
        const line = findRequiredLine(output, "$x = 1 + 2;");
        const indent = getLeadingIndent(line);

        if (entry.options.useTabs) {
          expect(indent.includes(" "), `expected tab indentation at depth ${depth}`).toBe(false);
          const tabCount = indent.length;
          if (depth === 0) {
            baselineIndent = tabCount;
          } else {
            expect(tabCount, `unexpected php tab indent delta at depth ${depth}`).toBe(
              baselineIndent + depth,
            );
          }
        } else {
          expect(indent.includes("\t"), `expected space indentation at depth ${depth}`).toBe(false);
          const spaceCount = indent.length;
          const tabWidth = (entry.options.tabWidth as number) ?? 2;
          if (depth === 0) {
            baselineIndent = spaceCount;
          } else {
            expect(spaceCount, `unexpected php space indent delta at depth ${depth}`).toBe(
              baselineIndent + depth * tabWidth,
            );
          }
        }
      }
    });
  }
});
