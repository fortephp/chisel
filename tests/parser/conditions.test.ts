import { describe, it, expect } from "vitest";
import { NodeKind } from "../../src/tree/types.js";
import {
  parse,
  rootChildren,
  childrenOf,
  nodeText,
  indexOf,
  renderDocument,
  getDirectiveName,
  getDirectiveArgs,
  getTagName,
} from "./helpers.js";

describe("Conditional Directive Parsing", () => {
  it("parses simple if/endif condition", () => {
    const source = "@if ($count === 1) One record @endif";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));

    // DirectiveBlock children: @if directive, @endif directive
    expect(blockChildren).toHaveLength(2);
    expect(getDirectiveName(r, blockChildren[0])).toBe("if");
    expect(getDirectiveArgs(r, blockChildren[0])).toBe("($count === 1)");
    expect(getDirectiveName(r, blockChildren[1])).toBe("endif");

    // The @if directive should have a text child " One record "
    const ifChildren = childrenOf(r, indexOf(r, blockChildren[0]));
    const textChildren = ifChildren.filter((c) => c.kind === NodeKind.Text);
    expect(textChildren.length).toBeGreaterThanOrEqual(1);
    expect(nodeText(r, textChildren[0])).toBe(" One record ");

    // The @endif directive should have no children
    const endifChildren = childrenOf(r, indexOf(r, blockChildren[1]));
    expect(endifChildren).toHaveLength(0);

    expect(renderDocument(r)).toBe(source);
  });

  it("parses if/elseif/else/endif condition", () => {
    const source = "@if ($count === 1) One @elseif ($count > 1) Many @else None @endif";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    const directives = blockChildren.filter((c) => c.kind === NodeKind.Directive);

    expect(directives).toHaveLength(4);
    expect(getDirectiveName(r, directives[0])).toBe("if");
    expect(getDirectiveName(r, directives[1])).toBe("elseif");
    expect(getDirectiveName(r, directives[2])).toBe("else");
    expect(getDirectiveName(r, directives[3])).toBe("endif");

    // if, elseif, else should have text children; endif should not
    expect(childrenOf(r, indexOf(r, directives[0])).length).toBeGreaterThan(0);
    expect(childrenOf(r, indexOf(r, directives[1])).length).toBeGreaterThan(0);
    expect(childrenOf(r, indexOf(r, directives[2])).length).toBeGreaterThan(0);
    expect(childrenOf(r, indexOf(r, directives[3]))).toHaveLength(0);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles mixed condition terminators", () => {
    const source = "@if ($this) Content @endunless";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    const directives = blockChildren.filter((c) => c.kind === NodeKind.Directive);
    expect(directives).toHaveLength(2);
    expect(getDirectiveName(r, directives[0])).toBe("if");
    expect(getDirectiveName(r, directives[1])).toBe("endunless");

    expect(renderDocument(r)).toBe(source);
  });

  it("handles mixed condition branches", () => {
    const source = '@if ($this) One @elsecan ("edit") Two @else Three @endif';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    const directives = blockChildren.filter((c) => c.kind === NodeKind.Directive);
    expect(directives).toHaveLength(4);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles nested conditions", () => {
    const source = "@if ($outer) Outer @if ($inner) Inner @endif Back @endif";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    const outerIfDirective = blockChildren[0];
    expect(outerIfDirective.kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, outerIfDirective)).toBe("if");

    // The outer @if should contain a nested DirectiveBlock
    const outerIfChildren = childrenOf(r, indexOf(r, outerIfDirective));
    const nestedBlocks = outerIfChildren.filter((c) => c.kind === NodeKind.DirectiveBlock);
    expect(nestedBlocks).toHaveLength(1);

    // The nested block should be an @if block
    const innerBlockChildren = childrenOf(r, indexOf(r, nestedBlocks[0]));
    const innerDirectives = innerBlockChildren.filter((c) => c.kind === NodeKind.Directive);
    expect(getDirectiveName(r, innerDirectives[0])).toBe("if");
    expect(getDirectiveArgs(r, innerDirectives[0])).toBe("($inner)");

    expect(renderDocument(r)).toBe(source);
  });

  it("handles condition with elements", () => {
    const source = "@if ($show) <div> Content </div> @endif";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    const ifDirective = blockChildren[0];
    expect(ifDirective.kind).toBe(NodeKind.Directive);

    // The @if directive should contain an Element child
    const ifChildren = childrenOf(r, indexOf(r, ifDirective));
    const elements = ifChildren.filter((c) => c.kind === NodeKind.Element);
    expect(elements).toHaveLength(1);
    expect(getTagName(r, indexOf(r, elements[0]))).toBe("div");

    expect(renderDocument(r)).toBe(source);
  });

  it("auto-closes elements between branches", () => {
    const source = "@if ($a) <div> One @else Two </div> @endif";
    const r = parse(source);

    expect(renderDocument(r)).toBe(source);

    const nodes = rootChildren(r);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);
  });

  it("handles unless condition", () => {
    const source = "@unless ($isAdmin) Not admin @endunless";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    const directives = blockChildren.filter((c) => c.kind === NodeKind.Directive);
    expect(directives).toHaveLength(2);
    expect(getDirectiveName(r, directives[0])).toBe("unless");
    expect(getDirectiveName(r, directives[1])).toBe("endunless");

    expect(renderDocument(r)).toBe(source);
  });

  it("parses complex nested conditions with multiple branches", () => {
    const source = `@if ($level === 1)
    Level 1
    @if ($nested)
        Nested
    @else
        Not nested
    @endif
@elseif ($level === 2)
    Level 2
@else
    Default
@endif`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    const outerIfDirective = blockChildren[0];
    expect(outerIfDirective.kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, outerIfDirective)).toBe("if");

    // outer @if should contain a nested DirectiveBlock
    const outerIfChildren = childrenOf(r, indexOf(r, outerIfDirective));
    const nestedBlocks = outerIfChildren.filter((c) => c.kind === NodeKind.DirectiveBlock);
    expect(nestedBlocks).toHaveLength(1);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles multiple separate conditions", () => {
    const source = "@if ($a) A @endif Text @if ($b) B @endif";
    const r = parse(source);
    const nodes = rootChildren(r);

    const ifBlocks = nodes.filter((c) => c.kind === NodeKind.DirectiveBlock);
    expect(ifBlocks).toHaveLength(2);

    const block1Children = childrenOf(r, indexOf(r, ifBlocks[0]));
    const block1Directives = block1Children.filter((c) => c.kind === NodeKind.Directive);
    expect(getDirectiveName(r, block1Directives[0])).toBe("if");
    expect(getDirectiveArgs(r, block1Directives[0])).toBe("($a)");

    const block2Children = childrenOf(r, indexOf(r, ifBlocks[1]));
    const block2Directives = block2Children.filter((c) => c.kind === NodeKind.Directive);
    expect(getDirectiveName(r, block2Directives[0])).toBe("if");
    expect(getDirectiveArgs(r, block2Directives[0])).toBe("($b)");

    const textNodes = nodes.filter((c) => c.kind === NodeKind.Text);
    expect(textNodes.length).toBeGreaterThanOrEqual(1);

    expect(renderDocument(r)).toBe(source);
  });
});
