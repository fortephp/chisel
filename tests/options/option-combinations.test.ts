import { describe, expect, it } from "vitest";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { format, hasLoneLf } from "../helpers.js";

const INPUT = [
  "@if($x)",
  "@can('create', App\\Models\\User::class)",
  '<div @if($y)wire:key="{{ $id }}"@endif>',
  "{{   $a+$b   }}",
  "{!!   $raw+$c   !!}",
  "{{{   $tri+$d   }}}",
  "@php($one+$two)",
  "</div>",
  "@endcan",
  "@endif",
  "",
].join("\n");

const PHP_MODES = ["off", "safe", "aggressive"] as const;
const DIRECTIVE_ARG_SPACING_MODES = ["none", "space"] as const;
const ECHO_SPACING_MODES = ["tight", "space"] as const;
const END_OF_LINE_MODES = ["lf", "crlf"] as const;
const INDENTATION_MODES = [
  { name: "spaces", options: { useTabs: false as const, tabWidth: 2 } },
  { name: "tabs", options: { useTabs: true as const, tabWidth: 2 } },
] as const;

function assertDirectiveArgSpacing(
  output: string,
  directiveArgSpacing: (typeof DIRECTIVE_ARG_SPACING_MODES)[number],
): void {
  if (directiveArgSpacing === "none") {
    expect(output).toMatch(/@if\(/u);
    expect(output).toMatch(/@can\(/u);
    expect(output).toMatch(/@php\(/u);
    expect(output).not.toMatch(/@if \(/u);
    expect(output).not.toMatch(/@can \(/u);
    expect(output).not.toMatch(/@php \(/u);
    return;
  }

  expect(output).toMatch(/@if \(/u);
  expect(output).toMatch(/@can \(/u);
  expect(output).toMatch(/@php \(/u);
  expect(output).not.toMatch(/@if\(/u);
  expect(output).not.toMatch(/@can\(/u);
  expect(output).not.toMatch(/@php\(/u);
}

function assertEchoSpacing(output: string, echoSpacing: (typeof ECHO_SPACING_MODES)[number]): void {
  if (echoSpacing === "tight") {
    expect(output).toMatch(/\{\{\$a(?:\s*\+\s*)\$b\}\}/u);
    expect(output).toMatch(/\{!!\$raw(?:\s*\+\s*)\$c!!\}/u);
    expect(output).toMatch(/\{\{\{\$tri(?:\s*\+\s*)\$d\}\}\}/u);
    expect(output).toContain('wire:key="{{$id}}"');
    return;
  }

  expect(output).toMatch(/\{\{ \$a(?:\s*\+\s*)\$b \}\}/u);
  expect(output).toMatch(/\{!! \$raw(?:\s*\+\s*)\$c !!\}/u);
  expect(output).toMatch(/\{\{\{ \$tri(?:\s*\+\s*)\$d \}\}\}/u);
  expect(output).toContain('wire:key="{{ $id }}"');
}

function assertEndOfLine(output: string, endOfLine: (typeof END_OF_LINE_MODES)[number]): void {
  if (endOfLine === "lf") {
    expect(output.includes("\r\n")).toBe(false);
    return;
  }

  expect(hasLoneLf(output)).toBe(false);
}

function assertIndentationMode(
  output: string,
  indentationMode: (typeof INDENTATION_MODES)[number],
): void {
  if (indentationMode.options.useTabs) {
    expect(output).toMatch(/\r?\n\t\t<div/u);
    expect(output).toMatch(/\r?\n\t\t\t\{\{/u);
    return;
  }

  expect(output).toMatch(/\r?\n    <div/u);
  expect(output).toMatch(/\r?\n      \{\{/u);
}

describe("options/option-combinations", () => {
  for (const phpMode of PHP_MODES) {
    for (const directiveArgSpacing of DIRECTIVE_ARG_SPACING_MODES) {
      for (const echoSpacing of ECHO_SPACING_MODES) {
        for (const endOfLine of END_OF_LINE_MODES) {
          for (const indentationMode of INDENTATION_MODES) {
            const caseName = [
              `php=${phpMode}`,
              `directiveArgSpacing=${directiveArgSpacing}`,
              `echoSpacing=${echoSpacing}`,
              `endOfLine=${endOfLine}`,
              `indent=${indentationMode.name}`,
            ].join(" | ");

            it(caseName, async () => {
              const output = await format(INPUT, {
                plugins: [bladePlugin, phpPlugin],
                bladePhpFormatting: phpMode,
                bladeDirectiveArgSpacing: directiveArgSpacing,
                bladeEchoSpacing: echoSpacing,
                endOfLine,
                ...indentationMode.options,
              });

              assertDirectiveArgSpacing(output, directiveArgSpacing);
              assertEchoSpacing(output, echoSpacing);
              assertEndOfLine(output, endOfLine);
              assertIndentationMode(output, indentationMode);
            });
          }
        }
      }
    }
  }
});
