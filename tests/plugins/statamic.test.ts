import { describe, expect, it } from "vitest";
import { tokenize } from "../../src/lexer/lexer.js";
import { Directives as LexerDirectives } from "../../src/lexer/directives.js";
import { tokenLabel } from "../../src/lexer/types.js";
import { NodeKind } from "../../src/tree/types.js";
import { buildTree } from "../../src/tree/tree-builder.js";
import { Directives as TreeDirectives } from "../../src/tree/directives.js";
import { resolveBladeSyntaxProfile } from "../../src/plugins/runtime.js";
import { formatEqual } from "../helpers.js";

describe("plugins/statamic", () => {
  it("tokenizes @antlers blocks as verbatim spans", () => {
    const source = "@antlers {{ $x }} @if($ready) @endantlers";
    const profile = resolveBladeSyntaxProfile({
      bladeSyntaxPlugins: ["statamic"],
    });

    const { tokens } = tokenize(
      source,
      LexerDirectives.withDefaults(profile.lexerDirectives),
      {
        verbatimStartDirectives: profile.verbatimStartDirectives,
        verbatimEndDirectives: profile.verbatimEndDirectives,
      },
    );

    expect(tokens.map((t) => tokenLabel(t.type))).toEqual([
      "VerbatimStart",
      "Text",
      "VerbatimEnd",
    ]);
  });

  it("parses @antlers blocks as Verbatim nodes", () => {
    const source = "@antlers\n<div>{{$x}}</div>\n@if($ready)\n@endantlers";
    const profile = resolveBladeSyntaxProfile({
      bladeSyntaxPlugins: ["statamic"],
    });
    const { tokens } = tokenize(
      source,
      LexerDirectives.withDefaults(profile.lexerDirectives),
      {
        verbatimStartDirectives: profile.verbatimStartDirectives,
        verbatimEndDirectives: profile.verbatimEndDirectives,
      },
    );
    const directives = TreeDirectives.withDefaults(profile.treeDirectives);
    directives.train(tokens, source);
    const result = buildTree(tokens, source, directives);
    const root = result.nodes[0];
    const firstChild = result.nodes[root.firstChild];

    expect(root.firstChild).toBe(root.lastChild);
    expect(firstChild.kind).toBe(NodeKind.Verbatim);
  });

  it("preserves antlers content while formatting outside nodes", async () => {
    const input = "@antlers\n<div>{{$x}}</div>\n@if($ready)\n@endantlers\n<div>{{$y}}</div>\n";
    const expected =
      "@antlers\n<div>{{$x}}</div>\n@if($ready)\n@endantlers\n<div>{{ $y }}</div>\n";

    await formatEqual(input, expected, {
      bladeEchoSpacing: "space",
      bladeSyntaxPlugins: ["statamic"],
    });
  });
});
