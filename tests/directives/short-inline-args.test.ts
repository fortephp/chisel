import { describe, expect, it } from "vitest";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { findLineStartingWith, format, formatEqual, leadingIndent, wrapInDiv } from "../helpers.js";

const withPhp = {
  plugins: [bladePlugin, phpPlugin],
  bladePhpFormatting: "safe" as const,
  bladeDirectiveArgSpacing: "space" as const,
  singleQuote: true,
};

describe("directives/short-inline-args", () => {
  it("keeps short directive arguments inline", async () => {
    const input = "@section('title', 'Notification')\n";
    const expected = "@section ('title', 'Notification')\n";

    await formatEqual(input, expected, withPhp);
  });

  it("keeps short directive arguments inline across nesting depths", async () => {
    const fixture = `@section('title', 'Notification')`;

    for (let depth = 0; depth <= 5; depth++) {
      const output = await format(wrapInDiv(fixture, depth), withPhp);
      expect(output).toContain("@section ('title', 'Notification')");
      expect(output).not.toContain("@section ('title',\n");
    }
  });

  it("keeps @php(...) shorthand inline with configured spacing", async () => {
    const input =
      "@php(($bg = get_field('populated_bg_color') === 'gray' ? ' bg-gray-100 my-2 my-lg-5' : ''))\n";
    const expected =
      "@php ($bg = get_field('populated_bg_color') === 'gray' ? ' bg-gray-100 my-2 my-lg-5' : '')\n";

    await formatEqual(input, expected, withPhp);
  });

  it("keeps @php(...) shorthand inline across nesting depths", async () => {
    const fixture =
      "@php(($bg = get_field('populated_bg_color') === 'gray' ? ' bg-gray-100 my-2 my-lg-5' : ''))";

    for (let depth = 0; depth <= 5; depth++) {
      const output = await format(wrapInDiv(fixture, depth), withPhp);
      expect(output).toContain(
        "@php ($bg = get_field('populated_bg_color') === 'gray' ? ' bg-gray-100 my-2 my-lg-5' : '')",
      );
      expect(output).toContain("@php (");
      expect(output).not.toContain("@php(\n");
    }
  });

  it("keeps short condition directive arguments inline", async () => {
    const input = "@can('create', App\\Models\\User::class)\n@endcan\n";
    const expected = "@can ('create', App\\Models\\User::class)\n@endcan\n";

    await formatEqual(input, expected, withPhp);
  });

  it("keeps short condition directive arguments inline across nesting depths", async () => {
    const fixture = "@can('create', App\\Models\\User::class)\n@endcan";

    for (let depth = 0; depth <= 5; depth++) {
      const output = await format(wrapInDiv(fixture, depth), withPhp);
      expect(output).toContain("@can ('create', App\\Models\\User::class)");
      expect(output).not.toContain("@can ('create',\n");
    }
  });

  it("prints explicit hasSection closers at block level", async () => {
    const input = "@hasSection\n<div></div>\n@endhasSection\n";
    const expected = "@hasSection\n  <div></div>\n@endhasSection\n";

    await formatEqual(input, expected, withPhp);
  });

  it("keeps explicit hasSection closer aligned across nesting depths", async () => {
    const fixture = "@hasSection\n<div></div>\n@endhasSection";

    for (let depth = 0; depth <= 5; depth++) {
      const output = await format(wrapInDiv(fixture, depth), withPhp);
      const opener = findLineStartingWith(output, "@hasSection");
      const closer = findLineStartingWith(output, "@endhasSection");
      const child = findLineStartingWith(output, "<div></div>");

      expect(opener).toBeDefined();
      expect(closer).toBeDefined();
      expect(child).toBeDefined();

      expect(leadingIndent(closer!)).toBe(leadingIndent(opener!));
      expect(leadingIndent(child!)).toBeGreaterThan(leadingIndent(opener!));
    }
  });

  it("prints explicit sectionMissing closers at block level", async () => {
    const input = "@sectionMissing\n<div></div>\n@endsectionMissing\n";
    const expected = "@sectionMissing\n  <div></div>\n@endsectionMissing\n";

    await formatEqual(input, expected, withPhp);
  });
});
