import { describe, expect, it } from "vitest";
import { format, formatEqual, wrapInDiv } from "../helpers.js";

const FIXTURE = `@section('content')
    <x-tw::page-header :breadcrumbs="[
            [
                'title' => 'Shortener',
            ],
    ]" />
@endsection
`;

const EXPECTED = `@section ('content')
  <x-tw::page-header
    :breadcrumbs="[
            [
                'title' => 'Shortener',
            ],
    ]"
  />
@endsection
`;

const OPTIONS = {
  bladeDirectiveArgSpacing: "space" as const,
};

function normalizeEol(input: string): string {
  return input.replace(/\r\n/g, "\n");
}

function unwrapOneLevel(input: string): string {
  const normalized = normalizeEol(input);
  const open = "<div>\n";
  const close = "\n</div>\n";
  expect(normalized.startsWith(open)).toBe(true);
  expect(normalized.endsWith(close)).toBe(true);
  return normalized.slice(open.length, normalized.length - close.length);
}

function dedentByTwoSpaces(input: string): string {
  return input
    .split("\n")
    .map((line) => (line.startsWith("  ") ? line.slice(2) : line))
    .join("\n");
}

describe("html/attribute-multiline-indentation", () => {
  it("normalizes multiline static fallback indentation for : attributes", async () => {
    await formatEqual(FIXTURE, EXPECTED, OPTIONS);
  });

  it("remains stable across wrapper depth levels", async () => {
    for (let depth = 0; depth <= 5; depth++) {
      const output = await format(wrapInDiv(FIXTURE, depth), OPTIONS);
      const normalized = normalizeEol(output);

      const match = normalized.match(
        /:breadcrumbs="\[\n([ \t]+)\[\n([ \t]+)'title' => 'Shortener',\n([ \t]+)\],\n([ \t]+)\]"/u,
      );

      expect(match, `missing multiline breadcrumbs block at depth ${depth}`).not.toBeNull();
      const [, innerOpen, keyLine, innerClose, outerClose] = match!;

      expect(innerOpen.length, `inner bracket indentation mismatch at depth ${depth}`).toBe(
        innerClose.length,
      );
      expect(keyLine.length, `key indentation mismatch at depth ${depth}`).toBe(
        innerOpen.length + 4,
      );
      expect(outerClose.length, `outer close indentation mismatch at depth ${depth}`).toBe(4);

      if (depth > 0) {
        const unwrapped = unwrapOneLevel(normalized);
        const dedented = dedentByTwoSpaces(unwrapped);
        expect(
          dedented.includes(`'title' => 'Shortener',`),
          `missing key line after unwrap at depth ${depth}`,
        ).toBe(true);
      }
    }
  });
});
