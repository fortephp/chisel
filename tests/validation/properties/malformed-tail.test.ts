import { describe, expect, it } from "vitest";
import { formatWithPasses } from "../../helpers.js";

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  let start = 0;
  for (;;) {
    const at = haystack.indexOf(needle, start);
    if (at < 0) return count;
    count++;
    start = at + needle.length;
  }
}

describe("validation/malformed-tail", () => {
  it("stabilizes malformed unterminated nested elements at eof", async () => {
    const input = `<div
    x-show="open"
    @if ($transition) x-collapse @endif
    @if (! $expanded) x-cloak @endif
    data-ui-accordion-content
>
    <div {{ $attribu`;
    const output = await formatWithPasses(input, {}, { passes: 5, assertIdempotent: true });
    const expected = `<div
  x-show="open"
  @if ($transition) x-collapse @endif
  @if (! $expanded) x-cloak @endif
  data-ui-accordion-content
>
  <div{{ $attribu
`;
    expect(output).toBe(expected);
  });

  it("stabilizes malformed trailing closing-marker fragments at eof", async () => {
    const input = `<div {{ $attributes->class('[:where(&)]:relative') }}> {{ $slot }} </\n`;
    const output = await formatWithPasses(input, {}, { passes: 5, assertIdempotent: true });
    const expected = `<div {{ $attributes->class('[:where(&)]:relative') }}> {{ $slot }} </\n`;
    expect(output).toBe(expected);
  });

  it("preserves malformed directive-block tail content without marker loss", async () => {
    const marker = "FX_M";
    const input = `<section data-tail-case="${marker}">${marker}</section>\n<button>\n  <?php if ($slot->isNotEmpty()): ?>\n    {{ $slot }}\n  <?php else: ?>\n    <x:selected />\n  <?php endif; ?>\n\n  <?php if ($clearable): ?>\n        <x:btn as="div"\n</div>\n    <x:btn as="div"\n  <?php endif; ?>\n</button>\n<footer>${marker}</footer>\n`;
    const output = await formatWithPasses(input, {}, { passes: 5, assertIdempotent: true });
    const expected = `<section data-tail-case="${marker}">${marker}</section>\n<button>\n  <?php if ($slot->isNotEmpty()): ?>\n    {{ $slot }}\n  <?php else: ?>\n    <x:selected />\n  <?php endif; ?>\n\n  <?php if ($clearable): ?>\n        <x:btn as="div"\n</div>\n    <x:btn as="div"\n  <?php endif; ?>\n</button>\n<footer>${marker}</footer>\n`;
    expect(output).toBe(expected);
    expect(countOccurrences(output, marker)).toBe(countOccurrences(input, marker));
  });
});
