import { describe, expect, it } from "vitest";
import { bladeParser } from "../../src/parser.js";
import type { WrappedNode } from "../../src/types.js";
import { NodeKind } from "../../src/tree/types.js";

function findNodesByKind(root: WrappedNode, kind: NodeKind): WrappedNode[] {
  const matches: WrappedNode[] = [];

  function visit(node: WrappedNode): void {
    if (node.kind === kind) {
      matches.push(node);
    }

    for (const attr of node.attrs) {
      visit(attr);
    }

    for (const child of node.children) {
      visit(child);
    }
  }

  visit(root);
  return matches;
}

describe("parser/ignore-range", () => {
  it("materializes root-level ignore ranges as opaque leaf nodes", () => {
    const source = `{{-- format-ignore-start --}}
<div   class="x"   ></div>
{{-- format-ignore-end --}}
<div class="y"></div>
`;
    const root = bladeParser.parse(source, {}) as WrappedNode;
    const ignoreRanges = findNodesByKind(root, NodeKind.IgnoreRange);

    expect(ignoreRanges).toHaveLength(1);
    expect(ignoreRanges[0].rawText).toBe(`{{-- format-ignore-start --}}
<div   class="x"   ></div>
{{-- format-ignore-end --}}`);
    expect(ignoreRanges[0].children).toHaveLength(0);
    expect(ignoreRanges[0].attrs).toHaveLength(0);
    expect(root.children[0].kind).toBe(NodeKind.IgnoreRange);
    expect(root.children[1].kind).toBe(NodeKind.Text);
    expect(root.children[2].kind).toBe(NodeKind.Element);
  });

  it("keeps directive-body ignore ranges opaque and resumes normal siblings after them", () => {
    const source =
      '@if($x){{-- format-ignore-start --}}<span   class="x"   ></span>{{-- format-ignore-end --}}<div class="y"></div>@endif';
    const root = bladeParser.parse(source, {}) as WrappedNode;
    const block = findNodesByKind(root, NodeKind.DirectiveBlock)[0];
    const openingDirective = block.children[0];
    const ignoreRanges = findNodesByKind(openingDirective, NodeKind.IgnoreRange);

    expect(ignoreRanges).toHaveLength(1);
    expect(ignoreRanges[0].children).toHaveLength(0);
    expect(ignoreRanges[0].rawText).toBe(
      '{{-- format-ignore-start --}}<span   class="x"   ></span>{{-- format-ignore-end --}}',
    );

    const childKinds = openingDirective.children.map((child) => child.kind);
    expect(childKinds).toEqual([NodeKind.IgnoreRange, NodeKind.Element]);
    expect(block.children.map((child) => child.kind)).toEqual([
      NodeKind.Directive,
      NodeKind.Directive,
    ]);
  });
});
