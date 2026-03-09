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
  isSelfClosing,
  isPaired,
} from "./helpers.js";
import { VOID_ELEMENTS } from "../../src/tree/void-elements.js";

describe("Basic Elements", () => {
  it("parses a simple paired element", () => {
    const source = "<div>content</div>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    const idx = indexOf(r, nodes[0]);
    expect(getTagName(r, idx)).toBe("div");
    expect(isPaired(r, idx)).toBe(true);
    expect(isSelfClosing(nodes[0])).toBe(false);

    const children = getContentChildren(r, idx);
    expect(children).toHaveLength(1);
    expect(nodeText(r, children[0])).toBe("content");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses nested elements with attributes", () => {
    const source = '<div class="outer">\n    <span class="inner">Content</span>\n</div>';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const divIdx = indexOf(r, nodes[0]);
    expect(getTagName(r, divIdx)).toBe("div");
    expect(isPaired(r, divIdx)).toBe(true);

    const attrs = getAttributes(r, divIdx);
    expect(attrs).toHaveLength(1);
    expect(getAttributeName(r, attrs[0])).toBe("class");

    const divChildren = getContentChildren(r, divIdx);
    expect(divChildren).toHaveLength(3); // text, span, text

    const spanIdx = indexOf(r, divChildren[1]);
    expect(getTagName(r, spanIdx)).toBe("span");
    expect(isPaired(r, spanIdx)).toBe(true);
    expect(renderDocument(r)).toBe(source);
  });

  it.each([...VOID_ELEMENTS])("parses void element <%s>", (tag) => {
    const source = `<${tag} class="void-class" disabled>`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    const idx = indexOf(r, nodes[0]);
    expect(getTagName(r, idx)).toBe(tag);
    expect(isPaired(r, idx)).toBe(false);
    expect(isSelfClosing(nodes[0])).toBe(false);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles self-closing syntax", () => {
    const source = '<img src="test.jpg" />';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const idx = indexOf(r, nodes[0]);
    expect(getTagName(r, idx)).toBe("img");
    expect(isSelfClosing(nodes[0])).toBe(true);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses script tags with html-like strings", () => {
    const source =
      '<script>\n  var x = "<div>not a tag</div>";\n  var y = "<scr" + "ipt>";\n</script>';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const idx = indexOf(r, nodes[0]);
    expect(getTagName(r, idx)).toBe("script");
    expect(isPaired(r, idx)).toBe(true);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses style tags with html-like strings", () => {
    const source = '<style>.icon::before { content: "<div>"; }</style>';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const idx = indexOf(r, nodes[0]);
    expect(getTagName(r, idx)).toBe("style");
    expect(isPaired(r, idx)).toBe(true);
    expect(renderDocument(r)).toBe(source);
  });

  it("uppercase void elements are recognized", () => {
    const source = "<BR>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(getTagName(r, indexOf(r, nodes[0]))).toBe("br");
    expect(renderDocument(r)).toBe(source);
  });

  it("mixed case void elements are recognized", () => {
    const source = '<Br><Hr><Img src="test.jpg">';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("deeply nested elements do not cause stack overflow", () => {
    const open = "<div>".repeat(100);
    const close = "</div>".repeat(100);
    const source = `${open}{{ $content }}${close}`;
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("many attributes parse efficiently", () => {
    const attrs = Array.from({ length: 100 }, (_, i) => `data-a${i}="v${i}"`).join(" ");
    const source = `<div ${attrs}>content</div>`;
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("multibyte characters in elements", () => {
    const source = '<div class="日本語">{{ $中文 }}</div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles ambiguous void element pairings", () => {
    const source = "<Br></Br>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const idx = indexOf(r, nodes[0]);
    expect(getTagName(r, idx)).toBe("br");
    expect(isPaired(r, idx)).toBe(true);
  });

  it("parses attributes without quotes", () => {
    const source = "<script src=assets/js.js></script>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const idx = indexOf(r, nodes[0]);
    expect(getTagName(r, idx)).toBe("script");
    expect(renderDocument(r)).toBe(source);
  });

  it("handles whitespace before > in self-closing tags", () => {
    const source = '<img src="test.jpg" />';
    const r = parse(source);
    expect(isSelfClosing(rootChildren(r)[0])).toBe(true);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles whitespace before > in closing tags", () => {
    const source = "<span\n>content</span\n>";
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });
});
