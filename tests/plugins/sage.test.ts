import { describe, expect, it } from "vitest";
import { getSageDirectivePhpFormatTemplates } from "../../src/plugins/sage/print.js";
import {
  SAGE_ARGUMENT_DIRECTIVE_NAMES,
  SAGE_DECLARED_DIRECTIVE_NAMES,
  SAGE_TREE_DIRECTIVES,
} from "../../src/plugins/sage/metadata.js";
import { tokenize } from "../../src/lexer/lexer.js";
import { resolveBladeSyntaxProfile } from "../../src/plugins/runtime.js";
import { buildTree } from "../../src/tree/tree-builder.js";
import { Directives as TreeDirectives } from "../../src/tree/directives.js";
import { NodeKind, type BuildResult } from "../../src/tree/types.js";
import { formatEqual } from "../helpers.js";
import {
  childrenOf,
  findByKind,
  getDirectiveName,
  indexOf,
  renderDocument,
  rootChildren,
} from "../parser/helpers.js";

const SAGE_PLUGIN_TOKEN = "log1x/sage-directives";

const SAGE_DECLARED_DIRECTIVES = [
  "__",
  "action",
  "author",
  "authorurl",
  "bodyclass",
  "categories",
  "category",
  "content",
  "endfield",
  "endfields",
  "endgroup",
  "endguest",
  "endhasfields",
  "endhasmenu",
  "endhasoptions",
  "endhasposts",
  "endhassidebar",
  "endinstanceof",
  "endisfalse",
  "endisnotnull",
  "endisnull",
  "endistrue",
  "endlayout",
  "endlayouts",
  "endnoposts",
  "endnotempty",
  "endoption",
  "endoptions",
  "endposts",
  "endrepeat",
  "endrole",
  "endscript",
  "endstylesheet",
  "endsub",
  "endtypeof",
  "enduser",
  "excerpt",
  "extract",
  "field",
  "fields",
  "filter",
  "global",
  "group",
  "guest",
  "hasfield",
  "hasfields",
  "hasmenu",
  "hasoption",
  "hasoptions",
  "hasposts",
  "hassidebar",
  "hassub",
  "image",
  "implode",
  "inline",
  "instanceof",
  "isfalse",
  "isfield",
  "isnotnull",
  "isnull",
  "isoption",
  "issub",
  "istrue",
  "js",
  "layout",
  "layouts",
  "menu",
  "modified",
  "noposts",
  "notempty",
  "option",
  "options",
  "permalink",
  "postclass",
  "postmeta",
  "posts",
  "published",
  "query",
  "repeat",
  "role",
  "script",
  "set",
  "shortcode",
  "sidebar",
  "stylesheet",
  "sub",
  "term",
  "terms",
  "thememod",
  "thumbnail",
  "title",
  "typeof",
  "unset",
  "user",
  "wpautokp",
  "wpautop",
  "wpbodyopen",
  "wpfooter",
  "wphead",
] as const;

function splitDirectiveNames(value: string): string[] {
  return value
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
}

function parseWithSage(source: string): BuildResult {
  const profile = resolveBladeSyntaxProfile({
    bladeSyntaxPlugins: [SAGE_PLUGIN_TOKEN],
  });
  const { tokens } = tokenize(source);
  const directives = TreeDirectives.withDefaults(profile.treeDirectives);
  return buildTree(tokens, source, directives);
}

function blockDirectives(
  result: BuildResult,
  blockNode: { kind: number },
): ReturnType<typeof childrenOf> {
  return childrenOf(result, indexOf(result, blockNode)).filter(
    (c) => c.kind === NodeKind.Directive,
  );
}

describe("plugins/sage", () => {
  it("resolves the package token as a built-in plugin", () => {
    const profile = resolveBladeSyntaxProfile({
      bladeSyntaxPlugins: [SAGE_PLUGIN_TOKEN],
    });

    expect(profile.treeDirectives.length).toBeGreaterThan(0);
  });

  it("registers every directive declared by the Sage package source", () => {
    const profile = resolveBladeSyntaxProfile({
      bladeSyntaxPlugins: [SAGE_PLUGIN_TOKEN],
    });
    const directives = TreeDirectives.withDefaults(profile.treeDirectives);

    for (const name of SAGE_DECLARED_DIRECTIVES) {
      expect(directives.isDirective(name)).toBe(true);
    }
  });

  it("keeps the Sage plugin metadata aligned with the audited source directive list", () => {
    expect([...SAGE_DECLARED_DIRECTIVE_NAMES].sort()).toEqual([...SAGE_DECLARED_DIRECTIVES].sort());
  });

  it("does not declare synthetic Sage directives outside the audited package list", () => {
    const pluginDirectiveNames = new Set(
      SAGE_TREE_DIRECTIVES.flatMap((definition) => splitDirectiveNames(definition.name)),
    );

    expect([...pluginDirectiveNames].sort()).toEqual([...SAGE_DECLARED_DIRECTIVES].sort());
  });

  it("uses Sage-specific guest/role semantics without inventing branch directives", () => {
    const profile = resolveBladeSyntaxProfile({
      bladeSyntaxPlugins: [SAGE_PLUGIN_TOKEN],
    });
    const directives = TreeDirectives.withDefaults(profile.treeDirectives);

    expect(directives.getTerminators("guest")).toEqual(["endguest"]);
    expect(directives.getTerminators("role")).toEqual(["endrole"]);
    expect(SAGE_DECLARED_DIRECTIVE_NAMES).not.toContain("elseguest");
    expect(SAGE_DECLARED_DIRECTIVE_NAMES).not.toContain("elserole");
  });

  it("provides php-format templates for every Sage directive that can take arguments", () => {
    const profile = resolveBladeSyntaxProfile({
      bladeSyntaxPlugins: [SAGE_PLUGIN_TOKEN],
    });
    const directives = TreeDirectives.withDefaults(profile.treeDirectives);
    const context = {
      mode: "safe" as const,
      hasDirective: (name: string) => directives.isDirective(name),
      isConditionLikeDirective: (name: string) => directives.isCondition(name),
    };

    for (const name of SAGE_ARGUMENT_DIRECTIVE_NAMES) {
      expect(getSageDirectivePhpFormatTemplates(name, context)).not.toHaveLength(0);
    }
  });

  it("pairs ACF row directives", () => {
    const source = "@fields('content') <div>{{ $title }}</div> @endfields";
    const result = parseWithSage(source);
    const blocks = findByKind(result, NodeKind.DirectiveBlock);

    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(result, blocks[0]);
    expect(getDirectiveName(result, directives[0])).toBe("fields");
    expect(getDirectiveName(result, directives[1])).toBe("endfields");
    expect(renderDocument(result)).toBe(source);
  });

  it("treats shared-closer ACF helpers as conditions", () => {
    const source = "@hasfield('hero') Yes @else No @endfield";
    const result = parseWithSage(source);
    const blocks = findByKind(result, NodeKind.DirectiveBlock);

    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(result, blocks[0]);
    expect(directives).toHaveLength(3);
    expect(getDirectiveName(result, directives[0])).toBe("hasfield");
    expect(getDirectiveName(result, directives[1])).toBe("else");
    expect(getDirectiveName(result, directives[2])).toBe("endfield");
  });

  it("pairs helper script blocks only when they have no arguments", () => {
    const paired = parseWithSage("@script console.log('ok') @endscript");
    const pairedBlocks = findByKind(paired, NodeKind.DirectiveBlock);

    expect(pairedBlocks).toHaveLength(1);
    expect(getDirectiveName(paired, blockDirectives(paired, pairedBlocks[0])[0])).toBe("script");

    const standalone = parseWithSage("@script('https://cdn.test/app.js')");
    const nodes = rootChildren(standalone);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(standalone, nodes[0])).toBe("script");
  });

  it("supports argument-sensitive condition blocks", () => {
    const source = "@istrue($ready) Ready @else Not ready @endistrue";
    const result = parseWithSage(source);
    const blocks = findByKind(result, NodeKind.DirectiveBlock);

    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(result, blocks[0]);
    expect(directives).toHaveLength(3);
    expect(getDirectiveName(result, directives[0])).toBe("istrue");
    expect(getDirectiveName(result, directives[1])).toBe("else");
    expect(getDirectiveName(result, directives[2])).toBe("endistrue");
  });

  it("keeps inline helper conditions standalone", () => {
    const source = "@istrue($ready, 'Ready')";
    const result = parseWithSage(source);
    const nodes = rootChildren(result);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(result, nodes[0])).toBe("istrue");
  });

  it("formats Sage condition blocks through the built-in plugin option", async () => {
    const input = "@hasfield('hero')<div>{{$title}}</div>@else<div>{{$fallback}}</div>@endfield\n";
    const expected =
      "@hasfield ('hero')\n  <div>{{ $title }}</div>\n@else\n  <div>{{ $fallback }}</div>\n@endfield\n";

    await formatEqual(input, expected, {
      bladeEchoSpacing: "space",
      bladeSyntaxPlugins: [SAGE_PLUGIN_TOKEN],
    });
  });
});
