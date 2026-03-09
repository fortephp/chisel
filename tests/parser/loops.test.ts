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
  getTagName,
} from "./helpers.js";

describe("Loop Directives", () => {
  it("foreach statements with continue and break", () => {
    const source = `@foreach($items as $item)
    Start
    @continue($item == 'a')
    Middle
    @break($loop->last)
    End
@endforeach`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    expect(blockChildren).toHaveLength(2);

    const foreachDirective = blockChildren[0];
    expect(foreachDirective.kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, foreachDirective)).toBe("foreach");
    expect(getDirectiveArgs(r, foreachDirective)).toBe("($items as $item)");

    const endforeach = blockChildren[1];
    expect(endforeach.kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, endforeach)).toBe("endforeach");

    // Inner children of the foreach directive
    const inner = childrenOf(r, indexOf(r, foreachDirective));
    expect(inner).toHaveLength(5);

    // text "Start"
    expect(inner[0].kind).toBe(NodeKind.Text);

    // @continue directive
    expect(inner[1].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, inner[1])).toBe("continue");
    expect(getDirectiveArgs(r, inner[1])).toBe("($item == 'a')");

    // text "Middle"
    expect(inner[2].kind).toBe(NodeKind.Text);

    // @break directive
    expect(inner[3].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, inner[3])).toBe("break");
    expect(getDirectiveArgs(r, inner[3])).toBe("($loop->last)");

    // text "End"
    expect(inner[4].kind).toBe(NodeKind.Text);

    expect(renderDocument(r)).toBe(source);
  });

  it("forelse without empty branch", () => {
    const source = `@forelse($items as $item)
    <span>{{ $item }}</span>
@endforelse`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    expect(blockChildren).toHaveLength(2);

    const forelseDirective = blockChildren[0];
    expect(forelseDirective.kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, forelseDirective)).toBe("forelse");
    expect(getDirectiveArgs(r, forelseDirective)).toBe("($items as $item)");

    const endforelse = blockChildren[1];
    expect(endforelse.kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, endforelse)).toBe("endforelse");

    // Inner children: text, <span>, text
    const inner = childrenOf(r, indexOf(r, forelseDirective));
    expect(inner).toHaveLength(3);
    expect(inner[0].kind).toBe(NodeKind.Text);
    expect(inner[1].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, inner[1]))).toBe("span");
    expect(inner[2].kind).toBe(NodeKind.Text);

    expect(renderDocument(r)).toBe(source);
  });
});
