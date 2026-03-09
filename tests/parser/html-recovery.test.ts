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
  getTagName,
  isPaired,
  isSelfClosing,
  getContentChildren,
  getAttributes,
  getAttributeName,
  getDirectiveName,
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

describe("HTML Recovery", () => {
  it("parses malformed closing tag and continues parsing", () => {
    const source = "<div>content</div extra text";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(2);

    const divIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, divIdx)).toBe("div");
    expect(isPaired(r, divIdx)).toBe(true);

    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(1);
    expect(divChildren[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, divChildren[0])).toBe("content");

    expect(nodes[1].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[1])).toBe(" extra text");

    expect(renderDocument(r)).toBe(source);
  });

  it("parses malformed closing tag followed by new element", () => {
    const source = "<div>first</div<p>second</p>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(2);

    const divIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, divIdx)).toBe("div");
    expect(isPaired(r, divIdx)).toBe(true);

    const pIdx = indexOf(r, nodes[1]);
    expect(nodes[1].kind).toBe(NodeKind.Element);
    expect(getTagName(r, pIdx)).toBe("p");
    expect(isPaired(r, pIdx)).toBe(true);

    expect(renderDocument(r)).toBe(source);
  });

  it("preserves element structure with malformed closing tag", () => {
    const source = '<div class="test">content</div';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    const divIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, divIdx)).toBe("div");
    expect(isPaired(r, divIdx)).toBe(true);

    const attrs = getAttributes(r, divIdx);
    expect(attrs).toHaveLength(1);

    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(1);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles multiple malformed closing tags", () => {
    const source = "<div>one</div<p>two</p<span>three</span>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(3);

    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, nodes[0]))).toBe("div");
    expect(nodes[1].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, nodes[1]))).toBe("p");
    expect(nodes[2].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, nodes[2]))).toBe("span");

    expect(renderDocument(r)).toBe(source);
  });

  it("handles mix of correct and malformed tags", () => {
    const source = "<div>correct</div><p>malformed</p<span>correct</span>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(3);

    for (const node of nodes) {
      expect(node.kind).toBe(NodeKind.Element);
      expect(isPaired(r, indexOf(r, node))).toBe(true);
    }

    expect(renderDocument(r)).toBe(source);
  });

  it("handles malformed tag in nested structure", () => {
    const source = `<div class="container">
    <h1>Title</h1>
    <p>Some content</p
    <footer>End</footer>
</div>`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    const divIdx = indexOf(r, nodes[0]);
    expect(getTagName(r, divIdx)).toBe("div");
    expect(isPaired(r, divIdx)).toBe(true);

    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(7);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles malformed self-closing tags", () => {
    const source = '<img src="test.jpg"';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, nodes[0]))).toBe("img");

    expect(renderDocument(r)).toBe(source);
  });

  it("handles void elements with malformed syntax", () => {
    const source = '<br<hr<input type="text"';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(3);

    expect(getTagName(r, indexOf(r, nodes[0]))).toBe("br");
    expect(getTagName(r, indexOf(r, nodes[1]))).toBe("hr");
    expect(getTagName(r, indexOf(r, nodes[2]))).toBe("input");

    expect(renderDocument(r)).toBe(source);
  });

  it("handles malformed script tag", () => {
    const source = '<script>console.log("test");</script';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    const scriptIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, scriptIdx)).toBe("script");
    expect(isPaired(r, scriptIdx)).toBe(true);

    const scriptChildren = getContentChildren(r, scriptIdx);
    expect(scriptChildren).toHaveLength(1);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles malformed style tag", () => {
    const source = "<style>body { color: red; }</style";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    const styleIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, styleIdx)).toBe("style");
    expect(isPaired(r, styleIdx)).toBe(true);

    expect(renderDocument(r)).toBe(source);
  });
  it("handles unclosed span inside div", () => {
    const source = "<div><span>Text</div> Text2";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(2);

    // div is paired
    const divIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, divIdx)).toBe("div");
    expect(isPaired(r, divIdx)).toBe(true);

    // div has 1 content child: the unpaired span
    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(1);

    const spanIdx = indexOf(r, divChildren[0]);
    expect(divChildren[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, spanIdx)).toBe("span");
    expect(isPaired(r, spanIdx)).toBe(false);

    // span has text child "Text"
    const spanChildren = getContentChildren(r, spanIdx);
    expect(spanChildren).toHaveLength(1);
    expect(spanChildren[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, spanChildren[0]).trim()).toBe("Text");

    // root text node " Text2"
    expect(nodes[1].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[1]).trim()).toBe("Text2");

    expect(renderDocument(r)).toBe(source);
  });

  it("handles unpaired closing span after div", () => {
    const source = "<div><span>Text</div></span> Text2";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(3);

    // First: paired div
    const divIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, divIdx)).toBe("div");
    expect(isPaired(r, divIdx)).toBe(true);

    // Second: UnpairedClosingTag for span
    expect(nodes[1].kind).toBe(NodeKind.UnpairedClosingTag);
    expect(getUnpairedTagName(r, nodes[1])).toBe("span");

    // Third: text
    expect(nodes[2].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[2]).trim()).toBe("Text2");

    expect(renderDocument(r)).toBe(source);
  });

  it("handles multiple nested unclosed elements", () => {
    const source = "<div><p><span>Text</div> More text";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(2);

    // div is paired
    const divIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, divIdx)).toBe("div");
    expect(isPaired(r, divIdx)).toBe(true);

    // div has 1 content child: p (unpaired)
    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(1);

    const pIdx = indexOf(r, divChildren[0]);
    expect(divChildren[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, pIdx)).toBe("p");
    expect(isPaired(r, pIdx)).toBe(false);

    // p has 1 content child: span (unpaired)
    const pChildren = getContentChildren(r, pIdx);
    expect(pChildren).toHaveLength(1);

    const spanIdx = indexOf(r, pChildren[0]);
    expect(pChildren[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, spanIdx)).toBe("span");
    expect(isPaired(r, spanIdx)).toBe(false);

    // span has text "Text"
    const spanChildren = getContentChildren(r, spanIdx);
    expect(spanChildren).toHaveLength(1);
    expect(spanChildren[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, spanChildren[0]).trim()).toBe("Text");

    // root text " More text"
    expect(nodes[1].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[1]).trim()).toBe("More text");

    expect(renderDocument(r)).toBe(source);
  });

  it("handles correct nesting after malformed section", () => {
    const source = "<div><span>Text</div><p>Valid paragraph</p>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(2);

    // div is paired
    const divIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(isPaired(r, divIdx)).toBe(true);

    // p is paired
    const pIdx = indexOf(r, nodes[1]);
    expect(nodes[1].kind).toBe(NodeKind.Element);
    expect(getTagName(r, pIdx)).toBe("p");
    expect(isPaired(r, pIdx)).toBe(true);

    const pChildren = getContentChildren(r, pIdx);
    expect(pChildren).toHaveLength(1);
    expect(pChildren[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, pChildren[0]).trim()).toBe("Valid paragraph");

    expect(renderDocument(r)).toBe(source);
  });

  it("handles malformed HTML with only whitespace content", () => {
    const source = "<div><span>   </div>   ";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(2);

    // div element
    const divIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(1);

    // span inside div
    const spanIdx = indexOf(r, divChildren[0]);
    expect(divChildren[0].kind).toBe(NodeKind.Element);

    const spanChildren = getContentChildren(r, spanIdx);
    expect(spanChildren).toHaveLength(1);
    expect(spanChildren[0].kind).toBe(NodeKind.Text);

    // trailing whitespace text
    expect(nodes[1].kind).toBe(NodeKind.Text);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles empty malformed elements", () => {
    const source = "<div><span></div>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    const divIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(1);

    const spanIdx = indexOf(r, divChildren[0]);
    expect(divChildren[0].kind).toBe(NodeKind.Element);
    expect(isPaired(r, spanIdx)).toBe(false);

    const spanChildren = getContentChildren(r, spanIdx);
    expect(spanChildren).toHaveLength(0);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles malformed HTML at document root", () => {
    const source = "<span>Root content</div>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    const spanIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, spanIdx)).toBe("span");
    expect(isPaired(r, spanIdx)).toBe(false);

    const spanChildren = getContentChildren(r, spanIdx);
    expect(spanChildren).toHaveLength(2);
    expect(spanChildren[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, spanChildren[0])).toBe("Root content");
    expect(spanChildren[1].kind).toBe(NodeKind.UnpairedClosingTag);
    expect(getUnpairedTagName(r, spanChildren[1])).toBe("div");

    expect(renderDocument(r)).toBe(source);
  });
  it("handles malformed HTML inside if directive", () => {
    const source = "@if ($count > 5)<div><span>Text</div></span> Text2 @endif";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    expect(blockChildren).toHaveLength(2);

    // @if directive
    const startDirective = blockChildren[0];
    expect(startDirective.kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, startDirective)).toBe("if");

    // @endif directive
    const endDirective = blockChildren[1];
    expect(endDirective.kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, endDirective)).toBe("endif");

    // @if children: div element, UnpairedClosingTag (span), text
    const ifContent = childrenOf(r, indexOf(r, startDirective));
    expect(ifContent).toHaveLength(3);

    expect(ifContent[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, ifContent[0]))).toBe("div");

    expect(ifContent[1].kind).toBe(NodeKind.UnpairedClosingTag);
    expect(getUnpairedTagName(r, ifContent[1])).toBe("span");

    expect(ifContent[2].kind).toBe(NodeKind.Text);
    expect(nodeText(r, ifContent[2]).trim()).toBe("Text2");

    expect(renderDocument(r)).toBe(source);
  });

  it("handles malformed HTML across directive boundaries", () => {
    const source = "<div>@if ($condition)<span>Text @endif</div>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    // div is paired
    const divIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(isPaired(r, divIdx)).toBe(true);

    // div has 1 content child: the DirectiveBlock
    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(1);
    expect(divChildren[0].kind).toBe(NodeKind.DirectiveBlock);

    const ifBlockChildren = childrenOf(r, indexOf(r, divChildren[0]));
    expect(ifBlockChildren).toHaveLength(2);

    const startDirective = ifBlockChildren[0];
    expect(startDirective.kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, startDirective)).toBe("if");

    const endDirective = ifBlockChildren[1];
    expect(endDirective.kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, endDirective)).toBe("endif");

    // span is unpaired inside @if
    const startDirectiveChildren = childrenOf(r, indexOf(r, startDirective));
    expect(startDirectiveChildren).toHaveLength(1);

    const spanIdx = indexOf(r, startDirectiveChildren[0]);
    expect(startDirectiveChildren[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, spanIdx)).toBe("span");
    expect(isPaired(r, spanIdx)).toBe(false);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles malformed HTML with Blade echoes", () => {
    const source = "<div><span>{{ $name }}</div> {{ $other }}";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(3);

    // div element
    const divIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(1);

    // span inside div
    const spanIdx = indexOf(r, divChildren[0]);
    expect(divChildren[0].kind).toBe(NodeKind.Element);

    const spanChildren = getContentChildren(r, spanIdx);
    expect(spanChildren).toHaveLength(1);
    expect(spanChildren[0].kind).toBe(NodeKind.Echo);

    // text node
    expect(nodes[1].kind).toBe(NodeKind.Text);

    // echo node
    expect(nodes[2].kind).toBe(NodeKind.Echo);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles malformed HTML with attributes", () => {
    const source = '<div class="container"><span id="test">Content</div>';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    const divIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const divAttrs = getAttributes(r, divIdx);
    expect(divAttrs).toHaveLength(1);
    expect(getAttributeName(r, divAttrs[0])).toBe("class");

    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(1);

    const spanIdx = indexOf(r, divChildren[0]);
    expect(divChildren[0].kind).toBe(NodeKind.Element);

    const spanAttrs = getAttributes(r, spanIdx);
    expect(spanAttrs).toHaveLength(1);
    expect(getAttributeName(r, spanAttrs[0])).toBe("id");

    expect(renderDocument(r)).toBe(source);
  });
  it("handles self-closing tags in malformed context", () => {
    const source = "<div><br/><span>Text</div>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    const divIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(2);

    // br is self-closing
    const brIdx = indexOf(r, divChildren[0]);
    expect(divChildren[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, brIdx)).toBe("br");
    expect(isSelfClosing(divChildren[0])).toBe(true);

    // span is unpaired
    const spanIdx = indexOf(r, divChildren[1]);
    expect(divChildren[1].kind).toBe(NodeKind.Element);
    expect(isPaired(r, spanIdx)).toBe(false);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles void elements in malformed context", () => {
    const source = '<div><img src="test.jpg"><span>Text</div>';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    const divIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(2);

    // img is void (not paired, not self-closing)
    const imgIdx = indexOf(r, divChildren[0]);
    expect(divChildren[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, imgIdx)).toBe("img");
    expect(isPaired(r, imgIdx)).toBe(false);
    expect(isSelfClosing(divChildren[0])).toBe(false);

    // span is unpaired
    const spanIdx = indexOf(r, divChildren[1]);
    expect(divChildren[1].kind).toBe(NodeKind.Element);
    expect(isPaired(r, spanIdx)).toBe(false);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles deeply nested malformed structure", () => {
    const source = "<div><section><article><header><h1>Title</header></article><p>Text</div>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    // div is paired
    const divIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(isPaired(r, divIdx)).toBe(true);

    // div has 1 content child: section (unpaired)
    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(1);

    const sectionIdx = indexOf(r, divChildren[0]);
    expect(divChildren[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, sectionIdx)).toBe("section");
    expect(isPaired(r, sectionIdx)).toBe(false);

    // section has 2 content children: article (paired) and p (unpaired)
    const sectionChildren = getContentChildren(r, sectionIdx);
    expect(sectionChildren).toHaveLength(2);

    const articleIdx = indexOf(r, sectionChildren[0]);
    expect(sectionChildren[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, articleIdx)).toBe("article");
    expect(isPaired(r, articleIdx)).toBe(true);

    const pIdx = indexOf(r, sectionChildren[1]);
    expect(sectionChildren[1].kind).toBe(NodeKind.Element);
    expect(getTagName(r, pIdx)).toBe("p");
    expect(isPaired(r, pIdx)).toBe(false);

    // article has 1 content child: header (paired)
    const articleChildren = getContentChildren(r, articleIdx);
    expect(articleChildren).toHaveLength(1);

    const headerIdx = indexOf(r, articleChildren[0]);
    expect(articleChildren[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, headerIdx)).toBe("header");
    expect(isPaired(r, headerIdx)).toBe(true);

    // header has 1 content child: h1 (unpaired)
    const headerChildren = getContentChildren(r, headerIdx);
    expect(headerChildren).toHaveLength(1);

    const h1Idx = indexOf(r, headerChildren[0]);
    expect(headerChildren[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, h1Idx)).toBe("h1");
    expect(isPaired(r, h1Idx)).toBe(false);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles malformed HTML with multiple text nodes", () => {
    const source = "<div>Start<span>Middle</div>End<p>Final</p>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(3);

    // div
    const divIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(2);
    expect(divChildren[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, divChildren[0]).trim()).toBe("Start");

    const spanIdx = indexOf(r, divChildren[1]);
    expect(divChildren[1].kind).toBe(NodeKind.Element);
    expect(isPaired(r, spanIdx)).toBe(false);

    // text "End"
    expect(nodes[1].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[1]).trim()).toBe("End");

    // p paired
    const pIdx = indexOf(r, nodes[2]);
    expect(nodes[2].kind).toBe(NodeKind.Element);
    expect(isPaired(r, pIdx)).toBe(true);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles alternating malformed and correct elements", () => {
    const source = "<div><span>Bad</div><section><p>Good</p></section><article><h1>Bad</article>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(3);

    // div paired
    const divIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, divIdx)).toBe("div");
    expect(isPaired(r, divIdx)).toBe(true);

    // section paired
    const sectionIdx = indexOf(r, nodes[1]);
    expect(nodes[1].kind).toBe(NodeKind.Element);
    expect(getTagName(r, sectionIdx)).toBe("section");
    expect(isPaired(r, sectionIdx)).toBe(true);

    const sectionChildren = getContentChildren(r, sectionIdx);
    expect(sectionChildren).toHaveLength(1);
    const innerPIdx = indexOf(r, sectionChildren[0]);
    expect(sectionChildren[0].kind).toBe(NodeKind.Element);
    expect(isPaired(r, innerPIdx)).toBe(true);

    // article paired
    const articleIdx = indexOf(r, nodes[2]);
    expect(nodes[2].kind).toBe(NodeKind.Element);
    expect(getTagName(r, articleIdx)).toBe("article");
    expect(isPaired(r, articleIdx)).toBe(true);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles malformed HTML inside script tags", () => {
    const source = '<script><div><span>alert("test")</div></script>';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    const scriptIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, scriptIdx)).toBe("script");
    expect(isPaired(r, scriptIdx)).toBe(true);

    const scriptChildren = getContentChildren(r, scriptIdx);
    expect(scriptChildren).toHaveLength(1);
    expect(scriptChildren[0].kind).toBe(NodeKind.Text);

    expect(renderDocument(r)).toBe(source);
  });

  it("handles malformed HTML inside style tags", () => {
    const source = "<style><div> { color: red; }</div></style>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    const styleIdx = indexOf(r, nodes[0]);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, styleIdx)).toBe("style");
    expect(isPaired(r, styleIdx)).toBe(true);

    const styleChildren = getContentChildren(r, styleIdx);
    expect(styleChildren).toHaveLength(1);
    expect(styleChildren[0].kind).toBe(NodeKind.Text);

    expect(renderDocument(r)).toBe(source);
  });
  it("round-trips truncated comment", () => {
    const source = "<!-- comment --";
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("round-trips Map<R as two elements", () => {
    const source = "<Map<R";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(2);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, nodes[0]))).toBe("map");
    expect(nodes[1].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, nodes[1]))).toBe("r");

    expect(renderDocument(r)).toBe(source);
  });
});
