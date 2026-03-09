import { describe, it, expect } from "vitest";
import { NodeKind } from "../../src/tree/types.js";
import {
  parse,
  rootChildren,
  nodeText,
  indexOf,
  renderDocument,
  getTagName,
  getContentChildren,
  getAttributes,
  getAttributeName,
  getAttributeValue,
  isSelfClosing,
  isPaired,
} from "./helpers.js";

describe("General AST Structure", () => {
  it("parses complete HTML structure with precise assertions", () => {
    const source =
      "<!doctype html>\n<html>\n    <head>\n        <title> Some Text </title>\n    </head>\n</html>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(3);

    // Doctype
    expect(nodes[0].kind).toBe(NodeKind.Doctype);
    expect(nodeText(r, nodes[0])).toBe("<!doctype html>");

    // Whitespace between doctype and html
    expect(nodes[1].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[1])).toBe("\n");

    // HTML element
    expect(nodes[2].kind).toBe(NodeKind.Element);
    const htmlIdx = indexOf(r, nodes[2]);
    expect(getTagName(r, htmlIdx)).toBe("html");
    expect(isSelfClosing(nodes[2])).toBe(false);
    expect(isPaired(r, htmlIdx)).toBe(true);

    const htmlChildren = getContentChildren(r, htmlIdx);
    expect(htmlChildren).toHaveLength(3);

    expect(htmlChildren[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, htmlChildren[0])).toBe("\n    ");

    expect(htmlChildren[1].kind).toBe(NodeKind.Element);
    const headIdx = indexOf(r, htmlChildren[1]);
    expect(getTagName(r, headIdx)).toBe("head");
    expect(isPaired(r, headIdx)).toBe(true);

    expect(htmlChildren[2].kind).toBe(NodeKind.Text);
    expect(nodeText(r, htmlChildren[2])).toBe("\n");

    const headChildren = getContentChildren(r, headIdx);
    expect(headChildren).toHaveLength(3);

    expect(headChildren[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, headChildren[0])).toBe("\n        ");

    expect(headChildren[1].kind).toBe(NodeKind.Element);
    const titleIdx = indexOf(r, headChildren[1]);
    expect(getTagName(r, titleIdx)).toBe("title");
    expect(isPaired(r, titleIdx)).toBe(true);

    const titleChildren = getContentChildren(r, titleIdx);
    expect(titleChildren).toHaveLength(1);
    expect(nodeText(r, titleChildren[0])).toBe(" Some Text ");

    expect(renderDocument(r)).toBe(source);
  });

  it("preserves exact whitespace in text nodes", () => {
    const source = "<div>\n\t\tindented\n</div>";
    const r = parse(source);
    const nodes = rootChildren(r);

    const divIdx = indexOf(r, nodes[0]);
    const divChildren = getContentChildren(r, divIdx);

    expect(divChildren).toHaveLength(1);
    expect(nodeText(r, divChildren[0])).toBe("\n\t\tindented\n");
  });

  it("handles elements with attributes in structure", () => {
    const source = '<div class="foo" id="bar">content</div>';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const divIdx = indexOf(r, nodes[0]);
    expect(getTagName(r, divIdx)).toBe("div");
    expect(isPaired(r, divIdx)).toBe(true);

    const attrs = getAttributes(r, divIdx);
    expect(attrs).toHaveLength(2);
    expect(getAttributeName(r, attrs[0])).toBe("class");
    expect(getAttributeValue(r, attrs[0])).toContain("foo");
    expect(getAttributeName(r, attrs[1])).toBe("id");
    expect(getAttributeValue(r, attrs[1])).toContain("bar");

    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(1);
    expect(nodeText(r, divChildren[0])).toBe("content");
  });

  it("handles self-closing elements correctly", () => {
    const source = '<div><br /><img src="test.jpg" /></div>';
    const r = parse(source);
    const nodes = rootChildren(r);

    const divIdx = indexOf(r, nodes[0]);
    const divChildren = getContentChildren(r, divIdx);

    expect(divChildren).toHaveLength(2);

    const brIdx = indexOf(r, divChildren[0]);
    expect(getTagName(r, brIdx)).toBe("br");
    expect(isSelfClosing(divChildren[0])).toBe(true);
    expect(isPaired(r, brIdx)).toBe(false);

    const imgIdx = indexOf(r, divChildren[1]);
    expect(getTagName(r, imgIdx)).toBe("img");
    expect(isSelfClosing(divChildren[1])).toBe(true);
    expect(isPaired(r, imgIdx)).toBe(false);
  });

  it("handles void elements without explicit self-close", () => {
    const source = '<div><br><hr><input type="text"></div>';
    const r = parse(source);
    const nodes = rootChildren(r);

    const divIdx = indexOf(r, nodes[0]);
    const divChildren = getContentChildren(r, divIdx);

    expect(divChildren).toHaveLength(3);

    expect(getTagName(r, indexOf(r, divChildren[0]))).toBe("br");
    expect(isSelfClosing(divChildren[0])).toBe(false);
    expect(isPaired(r, indexOf(r, divChildren[0]))).toBe(false);

    expect(getTagName(r, indexOf(r, divChildren[1]))).toBe("hr");
    expect(getTagName(r, indexOf(r, divChildren[2]))).toBe("input");
  });

  it("correctly indexes sibling relationships", () => {
    const source = "<ul><li>1</li><li>2</li><li>3</li></ul>";
    const r = parse(source);
    const nodes = rootChildren(r);

    const ulIdx = indexOf(r, nodes[0]);
    const items = getContentChildren(r, ulIdx);

    expect(items).toHaveLength(3);

    expect(nodeText(r, getContentChildren(r, indexOf(r, items[0]))[0])).toBe("1");
    expect(nodeText(r, getContentChildren(r, indexOf(r, items[1]))[0])).toBe("2");
    expect(nodeText(r, getContentChildren(r, indexOf(r, items[2]))[0])).toBe("3");
  });

  it("handles deeply nested structures", () => {
    const source = "<div><span><a><strong>deep</strong></a></span></div>";
    const r = parse(source);

    const div = rootChildren(r)[0];
    const divIdx = indexOf(r, div);
    expect(getTagName(r, divIdx)).toBe("div");

    const span = getContentChildren(r, divIdx)[0];
    const spanIdx = indexOf(r, span);
    expect(getTagName(r, spanIdx)).toBe("span");

    const a = getContentChildren(r, spanIdx)[0];
    const aIdx = indexOf(r, a);
    expect(getTagName(r, aIdx)).toBe("a");

    const strong = getContentChildren(r, aIdx)[0];
    const strongIdx = indexOf(r, strong);
    expect(getTagName(r, strongIdx)).toBe("strong");

    const text = getContentChildren(r, strongIdx)[0];
    expect(nodeText(r, text)).toBe("deep");

    // Verify parent chain
    expect(strong.parent).toBe(aIdx);
    expect(a.parent).toBe(spanIdx);
    expect(span.parent).toBe(divIdx);
    expect(div.parent).toBe(0);
  });

  it("renders document back to exact source", () => {
    const source =
      "<!doctype html>\n<html>\n    <head>\n        <title> Some Text </title>\n    </head>\n</html>";
    expect(renderDocument(parse(source))).toBe(source);
  });

  it("validates token ranges are contiguous", () => {
    const source = '<div class="foo">bar</div>';
    const r = parse(source);

    const div = rootChildren(r)[0];

    // Element should span the entire source
    const startToken = r.tokens[div.tokenStart];
    const endToken = r.tokens[div.tokenStart + div.tokenCount - 1];
    expect(startToken.start).toBe(0);
    expect(endToken.end).toBe(source.length);
  });
});
