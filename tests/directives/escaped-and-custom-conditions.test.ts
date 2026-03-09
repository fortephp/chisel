import { describe, expect, it } from "vitest";
import { format, formatEqual } from "../helpers.js";

describe("directives/escaped-and-custom-conditions", () => {
  it("keeps escaped blade echo prefixes attached with htmlWhitespaceSensitivity=ignore", async () => {
    const input = "<h1>Laravel</h1>\n\nHello, @{{ name }}.\n";
    const output = await format(input, {
      htmlWhitespaceSensitivity: "ignore",
    });

    expect(output).toContain("@{{ name }}");
    expect(output).not.toMatch(/@\s*\r?\n\s*\{\{/u);
  });

  it("keeps escaped blade directives attached with htmlWhitespaceSensitivity=ignore", async () => {
    const input = [
      "{{-- Blade template --}}",
      "@@if()",
      "",
      "<!-- HTML output -->",
      "@if()",
      "",
    ].join("\n");

    const output = await format(input, {
      htmlWhitespaceSensitivity: "ignore",
    });

    expect(output).toContain("@@if()");
    expect(output).toContain("@if ()");
    expect(output).not.toMatch(/@\s*\r?\n\s*@if\(\)/u);
  });

  it("preserves escaped @@parent semantics inside directive blocks", async () => {
    const input = ["@section('sidebar')", "    @@parent", "@endsection", ""].join("\n");

    const expected = ["@section ('sidebar')", "  @@parent", "@endsection", ""].join("\n");

    await formatEqual(input, expected);
  });

  it("does not duplicate closing directives for custom blocks with @else branches", async () => {
    const input = [
      "@feature('site-redesign')",
      "    <!-- 'site-redesign' is active -->",
      "@else",
      "    <!-- 'site-redesign' is inactive -->",
      "@endfeature",
      "",
      "@featureany(['site-redesign', 'beta'])",
      "    <!-- 'site-redesign' or `beta` is active -->",
      "@endfeatureany",
      "",
    ].join("\n");

    const output = await format(input);
    const endFeatureMatches = output.match(/^@endfeature$/gmu) ?? [];

    expect(endFeatureMatches).toHaveLength(1);
    expect(output).toContain("@featureany (['site-redesign', 'beta'])");
    expect(output).toContain("@endfeatureany");
  });
});
