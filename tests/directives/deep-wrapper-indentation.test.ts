import { describe, expect, it } from "vitest";
import { format } from "../helpers.js";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";

const MAX_WRAP_DEPTH = 10;

const COMPLEX_FIXTURE = `@if ($showRoot)
<div
@if($isPrimary) class="btn-primary"
@elseif($isDanger) class="btn-danger"
@else class="btn-default"
@endif
data-user-id="{{ $user->id }}"
>
<!-- html comment -->
{{-- blade comment --}}

@switch($outer)
@case('one')
@switch($inner)
@case('a')
<span>{{ $label }}</span>
@break
@default
<span>{!! $fallback !!}</span>
@endswitch
@break
@default
<span>{{{ $triple }}}</span>
@endswitch

@foreach($items as $item)
<x-row :key="$item->id">{{ $item->name }}</x-row>
@endforeach

@verbatim
<div class="{{ not_blade }}">
<span>@if(not-a-directive)</span>
</div>
@endverbatim

<pre>
PRE_LINE_ONE
PRE_LINE_TWO
</pre>

<textarea>
TEXTAREA_LINE_ONE
TEXTAREA_LINE_TWO
</textarea>

@php
$total = array_sum($items);
if ($total > 10) {
$state = 'large';
}
@endphp

<?php if ($total > 0) { echo $state; } ?>
</div>
@endif
`;

const RAW_CONTENT_FIXTURE = `@if ($showAssets)
<style>
:root {
@foreach($cssVariables ?? [] as $cssVariableName => $cssVariableValue) --{{ $cssVariableName }}:{{ $cssVariableValue }}; @endforeach
}

@foreach($customColors ?? [] as $customColorName => $customColorShades) .fi-color-{{ $customColorName }} { @foreach($customColorShades as $customColorShade) --color-{{ $customColorShade }}:var(--{{ $customColorName }}-{{ $customColorShade }}); @endforeach } @endforeach
</style>

<script>
window.filamentData = @json($data ?? []);

@foreach ($items ?? [] as $item)
window.values.push(@json($item));
@endforeach
</script>
@endif
`;

const OPTIONAL_TAGS_FIXTURE = `@if ($showOptional)
<ul>
<li>{{ $first }}
<li>{{ $second }}
</ul>

<dl>
<dt>{{ $term }}
<dd>{{ $definition }}
<dt>{{ $termTwo }}
</dl>

<table>
<thead>
<tr><th>One<th>Two
<tbody>
<tr><td>{{ $a }}<td>{{ $b }}
</table>
@endif
`;

const MULTILINE_DIRECTIVE_ARGS_FIXTURE = `@if (
    $something ||
    $this->thing ||
    $that->otherThing()
)
<p>Hi!</p>
@endif
`;

const PHP_TAG_SHORTHAND_FIXTURE = `<?php if ($loading): ?>
<div class="absolute inset-0">{{ $slot }}</div>
<?php elseif ($icon): ?>
<span>{{ $icon }}</span>
<?php else: ?>
<span>fallback</span>
<?php endif; ?>

<?php switch ($kind): ?><?php case 1: ?>
<em>one</em>
<?php default: ?>
<em>other</em>
<?php endswitch; ?>

<?php for ($i = 0; $i < 2; $i++): ?>
<b>{{ $i }}</b>
<?php endfor; ?>

<?php while ($ready): ?>
<i>ready</i>
<?php endwhile; ?>

<?php declare(strict_types=1): ?>
<small>declared</small>
<?php enddeclare; ?>
`;

const SLOT_INLINE_BODY_FIXTURE = `<x-card><x-slot>Hello</x-slot><x-slot:[items]>{{ $item }}</x-slot></x-card>
`;

const REQUIRED_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "@if($showRoot)", pattern: /@if\s*\(\s*\$showRoot\s*\)/ },
  { label: "@elseif($isDanger)", pattern: /@elseif\s*\(\s*\$isDanger\s*\)/ },
  { label: "@switch($outer)", pattern: /@switch\s*\(\s*\$outer\s*\)/ },
  { label: "@switch($inner)", pattern: /@switch\s*\(\s*\$inner\s*\)/ },
  { label: "html comment", pattern: /<!--\s*html comment\s*-->/ },
  { label: "blade comment", pattern: /\{\{--\s*blade comment\s*--\}\}/ },
  { label: "escaped echo", pattern: /\{\{\s*\$label\s*\}\}/ },
  { label: "raw echo", pattern: /\{!!\s*\$fallback\s*!!\}/ },
  { label: "triple echo", pattern: /\{\{\{\s*\$triple\s*\}\}\}/ },
  { label: "@verbatim", pattern: /@verbatim/ },
  { label: "@endverbatim", pattern: /@endverbatim/ },
  { label: "<pre>", pattern: /<pre>/ },
  { label: "<textarea>", pattern: /<textarea>/ },
  { label: "@php", pattern: /@php/ },
  { label: "@endphp", pattern: /@endphp/ },
  {
    label: "php tag block",
    pattern: /<\?php if \(\$total > 0\) \{ echo \$state; \} \?>/,
  },
];

const RAW_CONTENT_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "@if($showAssets)", pattern: /@if\s*\(\s*\$showAssets\s*\)/ },
  { label: "<style>", pattern: /<style>/ },
  { label: "</style>", pattern: /<\/style>/ },
  { label: "<script>", pattern: /<script>/ },
  { label: "</script>", pattern: /<\/script>/ },
  {
    label: "css variable interpolation",
    pattern: /--\{\{\s*\$cssVariableName\s*\}\}/,
  },
  {
    label: "json directive in script",
    pattern: /@json\s*\(\s*\$data\s*\?\?\s*\[\]\s*\)/,
  },
  {
    label: "script foreach",
    pattern: /@foreach\s*\(\s*\$items\s*\?\?\s*\[\]\s+as\s+\$item\s*\)/,
  },
];

const OPTIONAL_TAGS_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "@if($showOptional)", pattern: /@if\s*\(\s*\$showOptional\s*\)/ },
  { label: "list item one", pattern: /<li>\s*\{\{\s*\$first\s*\}\}/ },
  { label: "list item two", pattern: /<li>\s*\{\{\s*\$second\s*\}\}/ },
  { label: "dl term", pattern: /<dt>\s*\{\{\s*\$term\s*\}\}/ },
  { label: "dl description", pattern: /<dd>\s*\{\{\s*\$definition\s*\}\}/ },
  { label: "table row", pattern: /<tr>/ },
  { label: "table cell a", pattern: /<td>\s*\{\{\s*\$a\s*\}\}/ },
  { label: "table cell b", pattern: /<td>\s*\{\{\s*\$b\s*\}\}/ },
];

const MULTILINE_DIRECTIVE_ARGS_PATTERNS: Array<{
  label: string;
  pattern: RegExp;
}> = [
  {
    label: "wrapped multiline if args",
    pattern: /@if \(\n\s+\$something \|\|\n\s+\$this->thing \|\|\n\s+\$that->otherThing\(\)\n\s*\)/,
  },
  { label: "paragraph body", pattern: /<p>Hi!<\/p>/ },
  { label: "@endif", pattern: /@endif/ },
];

const PHP_TAG_SHORTHAND_PATTERNS: Array<{
  label: string;
  pattern: RegExp;
}> = [
  { label: "if opener", pattern: /<\?php if \(\$loading\): \?>/ },
  { label: "elseif branch", pattern: /<\?php elseif \(\$icon\): \?>/ },
  { label: "else branch", pattern: /<\?php else: \?>/ },
  { label: "endif closer", pattern: /<\?php endif; \?>/ },
  {
    label: "switch-case same-line boundary",
    pattern: /<\?php switch \(\$kind\): \?><\?php case 1: \?>/,
  },
  { label: "default branch", pattern: /<\?php default: \?>/ },
  { label: "endswitch closer", pattern: /<\?php endswitch; \?>/ },
  { label: "for opener", pattern: /<\?php for \(\$i = 0; \$i < 2; \$i\+\+\): \?>/ },
  { label: "endfor closer", pattern: /<\?php endfor; \?>/ },
  { label: "while opener", pattern: /<\?php while \(\$ready\): \?>/ },
  { label: "endwhile closer", pattern: /<\?php endwhile; \?>/ },
  {
    label: "declare opener",
    pattern: /<\?php declare\(strict_types=1\): \?>/,
  },
  { label: "enddeclare closer", pattern: /<\?php enddeclare; \?>/ },
];

const SLOT_INLINE_BODY_PATTERNS: Array<{
  label: string;
  pattern: RegExp;
}> = [
  {
    label: "simple slot body prints as multiline block",
    pattern: /<x-slot>\n\s*Hello\n\s*<\/x-slot>/,
  },
  {
    label: "dynamic slot body prints as multiline block",
    pattern: /<x-slot:\[items\]>\n\s*\{\{\s*\$item\s*\}\}\n\s*<\/x-slot(?::\[items\])?>/,
  },
];

const CORE_OPTION_MATRIX = [
  {},
  { bladeDirectiveBlockStyle: "preserve" as const },
  { bladeDirectiveBlockStyle: "multiline" as const },
  { bladeDirectiveBlockStyle: "inline-if-short" as const },
  { bladeDirectiveArgSpacing: "none" as const },
  { bladeDirectiveArgSpacing: "space" as const },
  { bladeDirectiveArgSpacing: "preserve" as const },
  { bladeEchoSpacing: "preserve" as const },
  { bladeEchoSpacing: "space" as const },
  { bladeEchoSpacing: "tight" as const },
  {
    bladeDirectiveBlockStyle: "multiline" as const,
    bladeBlankLinesAroundDirectives: "preserve" as const,
    bladeDirectiveArgSpacing: "space" as const,
    bladeEchoSpacing: "space" as const,
  },
];

const RAW_CONTENT_OPTION_MATRIX = [
  { bladePhpFormatting: "safe" as const },
  {
    bladePhpFormatting: "safe" as const,
    bladeDirectiveBlockStyle: "multiline" as const,
    bladeDirectiveArgSpacing: "space" as const,
  },
  {
    bladePhpFormatting: "safe" as const,
    bladeDirectiveArgSpacing: "none" as const,
    bladeEchoSpacing: "space" as const,
  },
];

const MULTILINE_DIRECTIVE_ARGS_OPTION_MATRIX = [
  { bladePhpFormatting: "safe" as const, plugins: [bladePlugin, phpPlugin] },
  {
    bladePhpFormatting: "safe" as const,
    bladeDirectiveArgSpacing: "space" as const,
    plugins: [bladePlugin, phpPlugin],
  },
  {
    bladePhpFormatting: "safe" as const,
    bladeDirectiveBlockStyle: "multiline" as const,
    plugins: [bladePlugin, phpPlugin],
  },
];

const PHP_TAG_SHORTHAND_OPTION_MATRIX = [
  {},
  { bladeDirectiveBlockStyle: "multiline" as const },
  {
    bladePhpFormatting: "safe" as const,
    plugins: [bladePlugin, phpPlugin],
  },
  {
    bladePhpFormatting: "aggressive" as const,
    plugins: [bladePlugin, phpPlugin],
  },
];

const SLOT_INLINE_BODY_OPTION_MATRIX = [
  {},
  { bladeSlotClosingTag: "canonical" as const },
  { bladeSlotClosingTag: "preserve" as const },
  {
    bladeDirectiveBlockStyle: "multiline" as const,
    bladeSlotClosingTag: "preserve" as const,
  },
];

function wrapInDiv(content: string, levels: number): string {
  let result = content.trimEnd();
  for (let i = 0; i < levels; i++) {
    result = `<div>\n${result}\n</div>`;
  }
  return `${result}\n`;
}

function unwrapOneDivLayer(formatted: string): string {
  const open = "<div>\n";
  const close = "\n</div>\n";

  expect(
    formatted.startsWith(open),
    "expected outer wrapper to start with <div> on its own line",
  ).toBe(true);
  expect(
    formatted.endsWith(close),
    "expected outer wrapper to end with </div> on its own line",
  ).toBe(true);

  return formatted.slice(open.length, formatted.length - close.length);
}

function dedentByTwoSpaces(text: string): string {
  return text
    .split("\n")
    .map((line) => (line.startsWith("  ") ? line.slice(2) : line))
    .join("\n");
}

function normalizeEol(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\n$/, "");
}

function computeIndentationExemptions(lines: string[]): boolean[] {
  const exempt = Array.from({ length: lines.length }, () => false);
  let inPreLikeRaw = false;
  let inVerbatimBody = false;
  let inPhpBlockBody = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (inPhpBlockBody) {
      if (trimmed === "@endphp") {
        exempt[i] = true;
        inPhpBlockBody = false;
      } else {
        exempt[i] = true;
      }
      continue;
    }

    if (trimmed === "@php") {
      exempt[i] = true;
      inPhpBlockBody = true;
      continue;
    }

    if (inVerbatimBody) {
      if (trimmed === "@endverbatim") {
        exempt[i] = true;
        inVerbatimBody = false;
      } else {
        exempt[i] = true;
      }
      continue;
    }

    if (trimmed === "@verbatim") {
      exempt[i] = true;
      inVerbatimBody = true;
      continue;
    }

    if (inPreLikeRaw) {
      exempt[i] = true;
      if (trimmed.startsWith("</pre") || trimmed.startsWith("</textarea")) {
        inPreLikeRaw = false;
      }
      continue;
    }

    if (trimmed.startsWith("<pre") || trimmed.startsWith("<textarea")) {
      inPreLikeRaw = true;
      continue;
    }

    if (trimmed.startsWith("</pre") || trimmed.startsWith("</textarea")) {
      exempt[i] = true;
      continue;
    }

    if (trimmed === ">" && i > 0) {
      const prevTrimmed = lines[i - 1].trim();
      if (prevTrimmed.startsWith("</pre") || prevTrimmed.startsWith("</textarea")) {
        exempt[i] = true;
      }
      continue;
    }
  }

  return exempt;
}

function assertOneLevelIndentationDelta(previous: string, current: string, depth: number): void {
  const prevLines = normalizeEol(previous).split("\n");
  const curLines = normalizeEol(current).split("\n");

  expect(curLines.length, `line count changed at wrapper depth ${depth}`).toBe(prevLines.length);

  const exemptions = computeIndentationExemptions(prevLines);
  let enforcedLineCount = 0;

  for (let i = 0; i < prevLines.length; i++) {
    const prev = prevLines[i];
    const cur = curLines[i];

    if (prev === "") {
      expect(cur, `blank-line drift at depth ${depth}, line ${i + 1}`).toBe("");
      continue;
    }

    if (exemptions[i]) {
      const valid = cur === prev || cur === `  ${prev}`;
      expect(valid, `pre-like/raw line drift at depth ${depth}, line ${i + 1}`).toBe(true);
      continue;
    }

    enforcedLineCount++;
    expect(cur, `expected +2 space indent delta at depth ${depth}, line ${i + 1}`).toBe(
      `  ${prev}`,
    );
  }

  expect(enforcedLineCount, `no enforced lines at depth ${depth}`).toBeGreaterThan(0);
}

function runDeepWrapperMatrix(
  name: string,
  fixture: string,
  requiredPatterns: Array<{ label: string; pattern: RegExp }>,
  optionMatrix: Array<Record<string, unknown>>,
): void {
  describe(name, () => {
    for (const options of optionMatrix) {
      it(`keeps indentation/content correct and idempotent across 0..10 wrapper depths :: ${JSON.stringify(options)}`, async () => {
        const outputs: string[] = [];

        for (let depth = 0; depth <= MAX_WRAP_DEPTH; depth++) {
          const input = wrapInDiv(fixture, depth);
          const output = await format(input, options);

          for (const { label, pattern } of requiredPatterns) {
            expect(output, `missing required content '${label}' at wrapper depth ${depth}`).toMatch(
              pattern,
            );
          }

          outputs.push(output);
        }

        for (let depth = 1; depth <= MAX_WRAP_DEPTH; depth++) {
          const unwrapped = unwrapOneDivLayer(outputs[depth]);
          const dedented = dedentByTwoSpaces(unwrapped);

          expect(normalizeEol(dedented), `inner content drifted at wrapper depth ${depth}`).toBe(
            normalizeEol(outputs[depth - 1]),
          );

          assertOneLevelIndentationDelta(outputs[depth - 1], unwrapped, depth);
        }
      });
    }
  });
}

runDeepWrapperMatrix(
  "directives/deep-wrapper-indentation/core",
  COMPLEX_FIXTURE,
  REQUIRED_PATTERNS,
  CORE_OPTION_MATRIX,
);

runDeepWrapperMatrix(
  "directives/deep-wrapper-indentation/raw-content",
  RAW_CONTENT_FIXTURE,
  RAW_CONTENT_PATTERNS,
  RAW_CONTENT_OPTION_MATRIX,
);

runDeepWrapperMatrix(
  "directives/deep-wrapper-indentation/optional-tags",
  OPTIONAL_TAGS_FIXTURE,
  OPTIONAL_TAGS_PATTERNS,
  CORE_OPTION_MATRIX,
);

runDeepWrapperMatrix(
  "directives/deep-wrapper-indentation/multiline-directive-args",
  MULTILINE_DIRECTIVE_ARGS_FIXTURE,
  MULTILINE_DIRECTIVE_ARGS_PATTERNS,
  MULTILINE_DIRECTIVE_ARGS_OPTION_MATRIX,
);

runDeepWrapperMatrix(
  "directives/deep-wrapper-indentation/php-tag-shorthand",
  PHP_TAG_SHORTHAND_FIXTURE,
  PHP_TAG_SHORTHAND_PATTERNS,
  PHP_TAG_SHORTHAND_OPTION_MATRIX,
);

runDeepWrapperMatrix(
  "directives/deep-wrapper-indentation/slot-inline-body",
  SLOT_INLINE_BODY_FIXTURE,
  SLOT_INLINE_BODY_PATTERNS,
  SLOT_INLINE_BODY_OPTION_MATRIX,
);
