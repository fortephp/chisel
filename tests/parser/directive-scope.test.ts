import { describe, it, expect } from "vitest";
import { NodeKind } from "../../src/tree/types.js";
import { TokenType } from "../../src/lexer/types.js";
import type { BuildResult, FlatNode } from "../../src/tree/types.js";
import {
  parse,
  rootChildren,
  childrenOf,
  nodeText,
  indexOf,
  renderDocument,
  getDirectiveName,
  getTagName,
  isPaired,
  getContentChildren,
} from "./helpers.js";

function getUnpairedTagName(r: BuildResult, node: FlatNode): string {
  let name = "";
  for (let i = 0; i < node.tokenCount; i++) {
    const t = r.tokens[node.tokenStart + i];
    if (t.type === TokenType.TagName) {
      name += r.source.slice(t.start, t.end);
    }
  }
  return name.toLowerCase();
}

describe("Directive Scope Isolation with Split HTML Elements", () => {
  it("handles opening element in one directive and closing in another", () => {
    const source = `@if ($thing)
    <div>
        <p>Hello, world.</p>
@endif

<p>Content.</p>

@if ($thing)
    </div>
@endif`;
    const r = parse(source);
    const nodes = rootChildren(r);

    // 5 root nodes: DirectiveBlock, Text, Element(p), Text, DirectiveBlock
    expect(nodes).toHaveLength(5);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    // First @if block
    const firstIfChildren = childrenOf(r, indexOf(r, nodes[0]));
    expect(firstIfChildren).toHaveLength(2);
    expect(firstIfChildren[0].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, firstIfChildren[0])).toBe("if");
    expect(firstIfChildren[1].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, firstIfChildren[1])).toBe("endif");

    // Content of the @if directive: text, then unclosed <div>
    const ifContent = childrenOf(r, indexOf(r, firstIfChildren[0]));
    expect(ifContent).toHaveLength(2);
    expect(ifContent[0].kind).toBe(NodeKind.Text);
    expect(ifContent[1].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, ifContent[1]))).toBe("div");
    expect(isPaired(r, indexOf(r, ifContent[1]))).toBe(false);

    // The unclosed div should contain: text, <p>Hello, world.</p>, text
    const divChildren = getContentChildren(r, indexOf(r, ifContent[1]));
    expect(divChildren).toHaveLength(3);
    expect(divChildren[0].kind).toBe(NodeKind.Text);
    expect(divChildren[1].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, divChildren[1]))).toBe("p");
    expect(isPaired(r, indexOf(r, divChildren[1]))).toBe(true);
    expect(divChildren[2].kind).toBe(NodeKind.Text);

    // The <p> should contain "Hello, world."
    const pChildren = getContentChildren(r, indexOf(r, divChildren[1]));
    expect(pChildren).toHaveLength(1);
    expect(pChildren[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, pChildren[0]).trim()).toBe("Hello, world.");

    // Root text node
    expect(nodes[1].kind).toBe(NodeKind.Text);

    // Root <p>Content.</p>
    expect(nodes[2].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, nodes[2]))).toBe("p");
    expect(isPaired(r, indexOf(r, nodes[2]))).toBe(true);
    const contentPChildren = getContentChildren(r, indexOf(r, nodes[2]));
    expect(contentPChildren).toHaveLength(1);
    expect(nodeText(r, contentPChildren[0]).trim()).toBe("Content.");

    // Another text node
    expect(nodes[3].kind).toBe(NodeKind.Text);

    // Second @if block
    expect(nodes[4].kind).toBe(NodeKind.DirectiveBlock);

    const secondIfChildren = childrenOf(r, indexOf(r, nodes[4]));
    expect(secondIfChildren).toHaveLength(2);
    expect(secondIfChildren[0].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, secondIfChildren[0])).toBe("if");
    expect(secondIfChildren[1].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, secondIfChildren[1])).toBe("endif");

    // Content of second @if: text, stray </div>, text
    const secondIfContent = childrenOf(r, indexOf(r, secondIfChildren[0]));
    expect(secondIfContent).toHaveLength(3);
    expect(secondIfContent[0].kind).toBe(NodeKind.Text);
    expect(secondIfContent[1].kind).toBe(NodeKind.UnpairedClosingTag);
    expect(getUnpairedTagName(r, secondIfContent[1])).toBe("div");
    expect(secondIfContent[2].kind).toBe(NodeKind.Text);

    expect(renderDocument(r)).toBe(source);
  });

  it("preserves structure correctly", () => {
    const source = `@if ($thing)
    <div>
        <p>Hello, world.</p>
@endif

<p>Content.</p>

@if ($thing)
    </div>
@endif`;
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles multiple split elements across directives", () => {
    const source = `@if ($a)
    <section>
        <div>
@endif
            <p>Middle content</p>
@if ($b)
        </div>
    </section>
@endif`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(5);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    // First @if content: text, unclosed <section>
    const firstIfContent = childrenOf(r, indexOf(r, childrenOf(r, indexOf(r, nodes[0]))[0]));
    expect(firstIfContent).toHaveLength(2);
    expect(firstIfContent[1].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, firstIfContent[1]))).toBe("section");
    expect(isPaired(r, indexOf(r, firstIfContent[1]))).toBe(false);

    // Section should contain: text, unclosed <div>
    const sectionChildren = getContentChildren(r, indexOf(r, firstIfContent[1]));
    expect(sectionChildren).toHaveLength(2);
    expect(sectionChildren[1].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, sectionChildren[1]))).toBe("div");
    expect(isPaired(r, indexOf(r, sectionChildren[1]))).toBe(false);

    // Second @if block
    expect(nodes[4].kind).toBe(NodeKind.DirectiveBlock);

    const secondIfContent = childrenOf(r, indexOf(r, childrenOf(r, indexOf(r, nodes[4]))[0]));
    // text, stray </div>, text, stray </section>, text
    expect(secondIfContent).toHaveLength(5);
    expect(secondIfContent[1].kind).toBe(NodeKind.UnpairedClosingTag);
    expect(getUnpairedTagName(r, secondIfContent[1])).toBe("div");
    expect(secondIfContent[3].kind).toBe(NodeKind.UnpairedClosingTag);
    expect(getUnpairedTagName(r, secondIfContent[3])).toBe("section");
    expect(secondIfContent[4].kind).toBe(NodeKind.Text);

    expect(renderDocument(r)).toBe(source);
  });

  it("isolates HTML scope within foreach directive", () => {
    const source = `@foreach ($items as $item)
    <li>
        {{ $item->name }}
@endforeach`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const foreachChildren = childrenOf(r, indexOf(r, nodes[0]));
    expect(foreachChildren).toHaveLength(2);
    expect(foreachChildren[0].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, foreachChildren[0])).toBe("foreach");
    expect(foreachChildren[1].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, foreachChildren[1])).toBe("endforeach");

    // foreach content: text, unclosed <li>
    const foreachContent = childrenOf(r, indexOf(r, foreachChildren[0]));
    expect(foreachContent).toHaveLength(2);
    expect(foreachContent[0].kind).toBe(NodeKind.Text);
    expect(foreachContent[1].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, foreachContent[1]))).toBe("li");
    expect(isPaired(r, indexOf(r, foreachContent[1]))).toBe(false);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles table structure split across forelse branches", () => {
    const source = `@forelse ($rows as $row)
    <tr>
        <td>{{ $row->value }}</td>
    </tr>
@empty
    <tr>
        <td colspan="5">No data</td>
    </tr>
@endforelse`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    // DirectiveBlock children: @forelse, @empty, @endforelse
    const forelseChildren = childrenOf(r, indexOf(r, nodes[0]));
    expect(forelseChildren).toHaveLength(3);
    expect(forelseChildren[0].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, forelseChildren[0])).toBe("forelse");
    expect(forelseChildren[1].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, forelseChildren[1])).toBe("empty");
    expect(forelseChildren[2].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, forelseChildren[2])).toBe("endforelse");

    // @forelse content: text, <tr> (paired), text
    const forelseContent = childrenOf(r, indexOf(r, forelseChildren[0]));
    expect(forelseContent).toHaveLength(3);
    expect(forelseContent[1].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, forelseContent[1]))).toBe("tr");
    expect(isPaired(r, indexOf(r, forelseContent[1]))).toBe(true);
    expect(forelseContent[2].kind).toBe(NodeKind.Text);

    // @empty content: text, <tr> (paired), text
    const emptyContent = childrenOf(r, indexOf(r, forelseChildren[1]));
    expect(emptyContent).toHaveLength(3);
    expect(emptyContent[1].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, emptyContent[1]))).toBe("tr");
    expect(isPaired(r, indexOf(r, emptyContent[1]))).toBe(true);
    expect(emptyContent[2].kind).toBe(NodeKind.Text);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles nested directives with split elements", () => {
    const source = `@if ($outer)
    <div class="outer">
        @if ($inner)
            <span>
        @endif
        Content
        @if ($inner)
            </span>
        @endif
    </div>
@endif`;
    const r = parse(source);
    const nodes = rootChildren(r);

    // 1 root DirectiveBlock
    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    // Outer @if content: text, <div> (paired), text
    const outerIfContent = childrenOf(r, indexOf(r, childrenOf(r, indexOf(r, nodes[0]))[0]));
    expect(outerIfContent).toHaveLength(3);
    expect(outerIfContent[1].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, outerIfContent[1]))).toBe("div");
    expect(isPaired(r, indexOf(r, outerIfContent[1]))).toBe(true);
    expect(outerIfContent[2].kind).toBe(NodeKind.Text);

    // div children: text, DirectiveBlock(@if inner open), text, DirectiveBlock(@if inner close), text
    const divChildren = getContentChildren(r, indexOf(r, outerIfContent[1]));
    expect(divChildren).toHaveLength(5);
    expect(divChildren[1].kind).toBe(NodeKind.DirectiveBlock);
    expect(divChildren[3].kind).toBe(NodeKind.DirectiveBlock);

    // First inner @if: content has text, unclosed <span>
    const innerIf1Content = childrenOf(r, indexOf(r, childrenOf(r, indexOf(r, divChildren[1]))[0]));
    expect(innerIf1Content).toHaveLength(2);
    expect(innerIf1Content[1].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, innerIf1Content[1]))).toBe("span");
    expect(isPaired(r, indexOf(r, innerIf1Content[1]))).toBe(false);

    // Second inner @if: content has text, stray </span>, text
    const innerIf2Content = childrenOf(r, indexOf(r, childrenOf(r, indexOf(r, divChildren[3]))[0]));
    expect(innerIf2Content).toHaveLength(3);
    expect(innerIf2Content[1].kind).toBe(NodeKind.UnpairedClosingTag);
    expect(getUnpairedTagName(r, innerIf2Content[1])).toBe("span");
    expect(innerIf2Content[2].kind).toBe(NodeKind.Text);

    expect(renderDocument(r)).toBe(source);
  });
});
