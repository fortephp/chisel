import { describe, it, expect } from "vitest";
import { NodeKind } from "../../src/tree/types.js";
import {
  parse,
  rootChildren,
  childrenOf,
  indexOf,
  renderDocument,
  getDirectiveName,
  getDirectiveArgs,
} from "./helpers.js";

describe("Section Directive", () => {
  it("unpaired section directive", () => {
    const source = "@section('content')";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, nodes[0])).toBe("section");
    expect(getDirectiveArgs(r, nodes[0])).toBe("('content')");
    expect(renderDocument(r)).toBe(source);
  });

  it("properly paired section with endsection", () => {
    const source = "@section('content') Hello World @endsection";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    const directives = blockChildren.filter((c) => c.kind === NodeKind.Directive);
    expect(getDirectiveName(r, directives[0])).toBe("section");
    expect(getDirectiveName(r, directives[directives.length - 1])).toBe("endsection");
    expect(renderDocument(r)).toBe(source);
  });

  it("section with show terminator", () => {
    const source = "@section('sidebar') Sidebar content @show";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    const directives = blockChildren.filter((c) => c.kind === NodeKind.Directive);
    expect(getDirectiveName(r, directives[directives.length - 1])).toBe("show");
    expect(renderDocument(r)).toBe(source);
  });

  it("section with append terminator", () => {
    const source = "@section('scripts') <script>alert('hi')</script> @append";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    const directives = blockChildren.filter((c) => c.kind === NodeKind.Directive);
    expect(getDirectiveName(r, directives[directives.length - 1])).toBe("append");
    expect(renderDocument(r)).toBe(source);
  });

  it("section with overwrite terminator", () => {
    const source = "@section('footer') Footer @overwrite";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    const directives = blockChildren.filter((c) => c.kind === NodeKind.Directive);
    expect(getDirectiveName(r, directives[directives.length - 1])).toBe("overwrite");
    expect(renderDocument(r)).toBe(source);
  });

  it("section with stop terminator", () => {
    const source = "@section('title') Page Title @stop";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    const directives = blockChildren.filter((c) => c.kind === NodeKind.Directive);
    expect(getDirectiveName(r, directives[directives.length - 1])).toBe("stop");
    expect(renderDocument(r)).toBe(source);
  });

  it("section with multiple arguments as simple directive", () => {
    const source = "@section('content', 'Default Value')";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, nodes[0])).toBe("section");
    expect(renderDocument(r)).toBe(source);
  });

  it("section without arguments", () => {
    const source = "@section";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, nodes[0])).toBe("section");
    expect(getDirectiveArgs(r, nodes[0])).toBeNull();
    expect(renderDocument(r)).toBe(source);
  });

  it("nested sections", () => {
    const source =
      "@section('outer') Outer @section('inner') Inner @endsection More outer @endsection";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);
    expect(renderDocument(r)).toBe(source);
  });

  it("multiple unpaired sections in sequence", () => {
    const source = "@section('header') @section('footer')";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(3);
    expect(nodes[0].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, nodes[0])).toBe("section");
    expect(nodes[1].kind).toBe(NodeKind.Text);
    expect(nodes[2].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, nodes[2])).toBe("section");
    expect(renderDocument(r)).toBe(source);
  });

  it("nested content with blade expressions", () => {
    const source = "@section('content') Hello {{ $name }} @endsection";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);
    expect(renderDocument(r)).toBe(source);
  });
});

describe("Lang Directive", () => {
  it("handles unpaired lang directive with array argument", () => {
    const source = "@lang(['something'])";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, nodes[0])).toBe("lang");
    expect(getDirectiveArgs(r, nodes[0])).toBe("(['something'])");
    expect(renderDocument(r)).toBe(source);
  });

  it("handles properly paired lang directive", () => {
    const source = "@lang(['key']) content here @endlang";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    const directives = blockChildren.filter((c) => c.kind === NodeKind.Directive);
    expect(getDirectiveName(r, directives[directives.length - 1])).toBe("endlang");
    expect(renderDocument(r)).toBe(source);
  });

  it("handles unpaired lang directive with simple string argument", () => {
    const source = "@lang('messages.welcome')";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, nodes[0])).toBe("lang");
    expect(renderDocument(r)).toBe(source);
  });

  it("handles lang directive without arguments", () => {
    const source = "@lang";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, nodes[0])).toBe("lang");
    expect(getDirectiveArgs(r, nodes[0])).toBeNull();
    expect(renderDocument(r)).toBe(source);
  });

  it("nested content in paired lang directive", () => {
    const source = "@lang(['key']) Hello {{ $name }} @endlang";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles multiple unpaired lang directives", () => {
    const source = "@lang(['key1']) @lang(['key2'])";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(3);
    expect(nodes[0].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, nodes[0])).toBe("lang");
    expect(nodes[1].kind).toBe(NodeKind.Text);
    expect(nodes[2].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, nodes[2])).toBe("lang");
    expect(renderDocument(r)).toBe(source);
  });
});
