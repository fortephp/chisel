import { describe, it, expect } from "vitest";
import { NodeKind } from "../../src/tree/types.js";
import {
  parse,
  rootChildren,
  nodeText,
  indexOf,
  renderDocument,
  getTagName,
  getRawTagName,
  getContentChildren,
  getAttributes,
  getAttributeName,
  isPaired,
} from "./helpers.js";

describe("Void Element Behavior", () => {
  it("treats uppercase BR as void element", () => {
    const source = "<BR>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const idx = indexOf(r, nodes[0]);
    expect(getRawTagName(r, idx)).toBe("BR");
    expect(isPaired(r, idx)).toBe(false);
    expect(getContentChildren(r, idx)).toHaveLength(0);
    expect(renderDocument(r)).toBe(source);
  });

  it("treats uppercase HR as void element", () => {
    const source = "<HR>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const idx = indexOf(r, nodes[0]);
    expect(getRawTagName(r, idx)).toBe("HR");
    expect(isPaired(r, idx)).toBe(false);
    expect(getContentChildren(r, idx)).toHaveLength(0);
    expect(renderDocument(r)).toBe(source);
  });

  it("treats mixed case IMG as void element with attribute", () => {
    const source = '<Img src="test.jpg">';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const idx = indexOf(r, nodes[0]);
    expect(getRawTagName(r, idx)).toBe("Img");
    expect(isPaired(r, idx)).toBe(false);
    expect(getContentChildren(r, idx)).toHaveLength(0);
    expect(renderDocument(r)).toBe(source);
  });

  it.each([
    "BR",
    "Hr",
    "IMG",
    "Input",
    "META",
    "Link",
    "AREA",
    "Base",
    "COL",
    "Embed",
    "PARAM",
    "Source",
    "TRACK",
    "WBR",
  ])("treats all standard void elements as void regardless of case: <%s>", (tag) => {
    const source = `<${tag}>`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const idx = indexOf(r, nodes[0]);
    expect(getRawTagName(r, idx)).toBe(tag);
    expect(getTagName(r, idx)).toBe(tag.toLowerCase());
    expect(isPaired(r, idx)).toBe(false);
    expect(getContentChildren(r, idx)).toHaveLength(0);
    expect(renderDocument(r)).toBe(source);
  });

  it("allows closing tag for lowercase void elements", () => {
    const source = "<br></br>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const idx = indexOf(r, nodes[0]);
    expect(getRawTagName(r, idx)).toBe("br");
    expect(isPaired(r, idx)).toBe(true);
    expect(getContentChildren(r, idx)).toHaveLength(0);
    expect(renderDocument(r)).toBe(source);
  });

  it("allows JSX-style closing for uppercase void elements", () => {
    const source = "<BR></BR>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const idx = indexOf(r, nodes[0]);
    expect(getRawTagName(r, idx)).toBe("BR");
    expect(isPaired(r, idx)).toBe(true);
    expect(getContentChildren(r, idx)).toHaveLength(0);
    expect(renderDocument(r)).toBe(source);
  });

  it("allows JSX-style closing for mixed case void elements", () => {
    const source = "<Br></Br>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const idx = indexOf(r, nodes[0]);
    expect(getRawTagName(r, idx)).toBe("Br");
    expect(isPaired(r, idx)).toBe(true);
    expect(getContentChildren(r, idx)).toHaveLength(0);
    expect(renderDocument(r)).toBe(source);
  });

  it("allows closing tag for lowercase void elements with attributes", () => {
    const source = '<img src="test.jpg"></img>';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const idx = indexOf(r, nodes[0]);
    expect(getRawTagName(r, idx)).toBe("img");
    expect(isPaired(r, idx)).toBe(true);
    expect(getContentChildren(r, idx)).toHaveLength(0);

    const attrs = getAttributes(r, idx);
    expect(attrs).toHaveLength(1);
    expect(getAttributeName(r, attrs[0])).toBe("src");
    expect(renderDocument(r)).toBe(source);
  });

  it("allows JSX-style closing for uppercase void elements with attributes", () => {
    const source = '<IMG src="test.jpg"></IMG>';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const idx = indexOf(r, nodes[0]);
    expect(getRawTagName(r, idx)).toBe("IMG");
    expect(isPaired(r, idx)).toBe(true);
    expect(getContentChildren(r, idx)).toHaveLength(0);
    expect(renderDocument(r)).toBe(source);
  });

  it("treats uppercase void element in container as void", () => {
    const source = "<div><BR>text</div>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    const divIdx = indexOf(r, nodes[0]);
    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(2);

    // BR is void — not paired, no children
    expect(divChildren[0].kind).toBe(NodeKind.Element);
    const brIdx = indexOf(r, divChildren[0]);
    expect(getRawTagName(r, brIdx)).toBe("BR");
    expect(isPaired(r, brIdx)).toBe(false);
    expect(getContentChildren(r, brIdx)).toHaveLength(0);

    // Text is a sibling, not a child of BR
    expect(divChildren[1].kind).toBe(NodeKind.Text);
    expect(nodeText(r, divChildren[1])).toBe("text");
    expect(renderDocument(r)).toBe(source);
  });

  it("does not treat text after void element as child", () => {
    const source = "<BR>should not be child";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(2);

    // BR is void
    expect(nodes[0].kind).toBe(NodeKind.Element);
    const brIdx = indexOf(r, nodes[0]);
    expect(getRawTagName(r, brIdx)).toBe("BR");
    expect(isPaired(r, brIdx)).toBe(false);
    expect(getContentChildren(r, brIdx)).toHaveLength(0);

    // Text is a sibling at root level
    expect(nodes[1].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[1])).toBe("should not be child");
    expect(renderDocument(r)).toBe(source);
  });

  it("handles multiple uppercase void elements in sequence", () => {
    const source = '<BR><HR><IMG src="test.jpg">';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(3);

    for (const node of nodes) {
      expect(node.kind).toBe(NodeKind.Element);
      const idx = indexOf(r, node);
      expect(isPaired(r, idx)).toBe(false);
      expect(getContentChildren(r, idx)).toHaveLength(0);
    }

    expect(getRawTagName(r, indexOf(r, nodes[0]))).toBe("BR");
    expect(getRawTagName(r, indexOf(r, nodes[1]))).toBe("HR");
    expect(getRawTagName(r, indexOf(r, nodes[2]))).toBe("IMG");
    expect(renderDocument(r)).toBe(source);
  });

  it("handles mixed case void elements in container", () => {
    const source = "<div><br><BR><Br></div>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    const divIdx = indexOf(r, nodes[0]);
    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(3);

    for (const child of divChildren) {
      expect(child.kind).toBe(NodeKind.Element);
      const idx = indexOf(r, child);
      expect(isPaired(r, idx)).toBe(false);
      expect(getContentChildren(r, idx)).toHaveLength(0);
    }

    expect(getRawTagName(r, indexOf(r, divChildren[0]))).toBe("br");
    expect(getRawTagName(r, indexOf(r, divChildren[1]))).toBe("BR");
    expect(getRawTagName(r, indexOf(r, divChildren[2]))).toBe("Br");
    expect(renderDocument(r)).toBe(source);
  });

  it("handles uppercase void element with mismatched closing tag", () => {
    const source = "<div><BR></span></div>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    const divIdx = indexOf(r, nodes[0]);
    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(2);

    // BR is void
    expect(divChildren[0].kind).toBe(NodeKind.Element);
    const brIdx = indexOf(r, divChildren[0]);
    expect(getRawTagName(r, brIdx)).toBe("BR");
    expect(isPaired(r, brIdx)).toBe(false);

    // Mismatched </span> becomes an UnpairedClosingTag
    expect(divChildren[1].kind).toBe(NodeKind.UnpairedClosingTag);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles uppercase void element in complex nested structure", () => {
    const source = "<div><p>Text <BR> more text</p></div>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);

    const divIdx = indexOf(r, nodes[0]);
    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(1);

    const pIdx = indexOf(r, divChildren[0]);
    const pChildren = getContentChildren(r, pIdx);
    expect(pChildren).toHaveLength(3);

    expect(pChildren[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, pChildren[0])).toBe("Text ");

    expect(pChildren[1].kind).toBe(NodeKind.Element);
    const brIdx = indexOf(r, pChildren[1]);
    expect(getRawTagName(r, brIdx)).toBe("BR");
    expect(isPaired(r, brIdx)).toBe(false);

    expect(pChildren[2].kind).toBe(NodeKind.Text);
    expect(nodeText(r, pChildren[2])).toBe(" more text");
    expect(renderDocument(r)).toBe(source);
  });
});
