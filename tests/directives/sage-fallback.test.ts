import { describe, expect, it } from "vitest";
import { format, formatEqual } from "../helpers.js";

const NO_PLUGINS = {
  bladeEchoSpacing: "space" as const,
  bladeSyntaxPlugins: [],
};

describe("directives/sage-fallback", () => {
  it("still formats simple Sage-style paired blocks via training", async () => {
    await formatEqual(
      ["@fields($list)", "<li>@sub($item)</li>", "@endfields", ""].join("\n"),
      ["@fields ($list)", "  <li>@sub ($item)</li>", "@endfields", ""].join("\n"),
      NO_PLUGINS,
    );

    await formatEqual(
      [
        "@posts",
        '<h2 class="entry-title">@title</h2>',
        '<div class="entry-content">',
        "@content",
        "</div>",
        "@endposts",
        "",
      ].join("\n"),
      [
        "@posts",
        '  <h2 class="entry-title">@title</h2>',
        '  <div class="entry-content">',
        "    @content",
        "  </div>",
        "@endposts",
        "",
      ].join("\n"),
      NO_PLUGINS,
    );

    await formatEqual(
      ["@script", "console.log('Hello World')", "@endscript", ""].join("\n"),
      ["@script", "  console.log('Hello World')", "@endscript", ""].join("\n"),
      NO_PLUGINS,
    );
  });

  it("does not duplicate closers for Sage condition-like directives without the plugin", async () => {
    const hasFieldInput = [
      "@hasfield($hero)",
      "<div>{{$title}}</div>",
      "@else",
      "<div>{{$fallback}}</div>",
      "@endfield",
      "",
    ].join("\n");

    const hasFieldOutput = await format(hasFieldInput, NO_PLUGINS);
    const endFieldMatches = hasFieldOutput.match(/^@endfield$/gmu) ?? [];

    expect(endFieldMatches).toHaveLength(1);
    expect(hasFieldOutput).toContain("@else");
    expect(hasFieldOutput).toContain("<div>{{ $title }}</div>");
    expect(hasFieldOutput).toContain("<div>{{ $fallback }}</div>");

    const isTrueInput = [
      "@istrue($ready)",
      "<div>{{$title}}</div>",
      "@else",
      "<div>{{$fallback}}</div>",
      "@endistrue",
      "",
    ].join("\n");

    const isTrueOutput = await format(isTrueInput, NO_PLUGINS);
    const endIsTrueMatches = isTrueOutput.match(/^@endistrue$/gmu) ?? [];

    expect(endIsTrueMatches).toHaveLength(1);
    expect(isTrueOutput).toContain("@else");
    expect(isTrueOutput).toContain("<div>{{ $title }}</div>");
    expect(isTrueOutput).toContain("<div>{{ $fallback }}</div>");
  });
});
