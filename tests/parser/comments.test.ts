import { describe, it, expect } from "vitest";
import { NodeKind } from "../../src/tree/types.js";
import { parse, rootChildren, nodeText, renderDocument, getContentChildren } from "./helpers.js";

describe("Comment Parsing", () => {
  it("parses basic HTML comment", () => {
    const source = "<!-- test -->";
    const r = parse(source);
    const children = rootChildren(r);

    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Comment);
    expect(nodeText(r, children[0])).toBe(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses empty HTML comment", () => {
    const source = "<!---->";
    const r = parse(source);
    const children = rootChildren(r);

    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Comment);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses Blade comment", () => {
    const source = "{{-- test comment --}}";
    const r = parse(source);
    const children = rootChildren(r);

    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.BladeComment);
    expect(nodeText(r, children[0])).toBe(source);
  });

  it("parses empty Blade comment", () => {
    const source = "{{----}}";
    const r = parse(source);
    const children = rootChildren(r);

    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.BladeComment);
  });

  it("parses HTML comment with mixed content", () => {
    const source = "Text before <!-- comment --> text after";
    const r = parse(source);
    const children = rootChildren(r);

    expect(children).toHaveLength(3);
    expect(children[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, children[0])).toBe("Text before ");
    expect(children[1].kind).toBe(NodeKind.Comment);
    expect(children[2].kind).toBe(NodeKind.Text);
    expect(nodeText(r, children[2])).toBe(" text after");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses multiline HTML comment", () => {
    const source = "<!--\n    This is a\n    multiline comment\n-->";
    const r = parse(source);
    const children = rootChildren(r);

    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Comment);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses multiline Blade comment", () => {
    const source = "{{--\n    This is a\n    multiline Blade comment\n--}}";
    const r = parse(source);
    const children = rootChildren(r);

    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.BladeComment);
    expect(renderDocument(r)).toBe(source);
  });

  it("preserves sibling nodes after Blade comment with multiple echo braces", () => {
    const source =
      "<div>\n<h1></h1>\n{{-- {{ }} {{ }} --}}\n<div><span></span></div>\n<h2></h2>\n</div>";
    const r = parse(source);
    const children = rootChildren(r);

    // Root has one <div> element
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Element);

    // The <div> must have all content children: <h1>, comment, inner <div>, <h2>
    const divIdx = r.nodes.indexOf(children[0]);
    const divContent = getContentChildren(r, divIdx);
    expect(divContent.some((c) => c.kind === NodeKind.BladeComment)).toBe(true);

    // Must have 3 Element children (<h1>, <div>, <h2>) — none dropped
    const elements = divContent.filter((c) => c.kind === NodeKind.Element);
    expect(elements).toHaveLength(3);
    expect(renderDocument(r)).toBe(source);
  });

  it("detects conditional comments", () => {
    const source = "<!--[if IE]>content<![endif]-->";
    const r = parse(source);
    const children = rootChildren(r);

    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.ConditionalComment);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses bogus comment", () => {
    const source = "<!x>";
    const r = parse(source);
    const children = rootChildren(r);

    // Bogus comment parsing depends on lexer; just ensure it doesn't crash
    expect(children.length).toBeGreaterThanOrEqual(1);
    expect(renderDocument(r)).toBe(source);
  });
});
