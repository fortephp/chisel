import { describe, it, expect } from "vitest";
import { NodeKind } from "../../src/tree/types.js";
import {
  parse,
  rootChildren,
  indexOf,
  renderDocument,
  getTagName,
  isPaired,
  getContentChildren,
} from "./helpers.js";

describe("Nested HTML Elements", () => {
  it("parses nested unordered list structure", () => {
    const source = `<ul id="list">
  <li>Item 1</li>
  <li>Item 2
    <ul class="inner">
      <li>Child A</li>
      <li>Child B</li>
    </ul>
  </li>
  <li>Item 3</li>
</ul>`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const ulIdx = indexOf(r, nodes[0]);
    expect(getTagName(r, ulIdx)).toBe("ul");
    expect(isPaired(r, ulIdx)).toBe(true);

    const children = getContentChildren(r, ulIdx);
    expect(children).toHaveLength(7); // text, li, text, li, text, li, text

    expect(children[0].kind).toBe(NodeKind.Text);
    expect(getTagName(r, indexOf(r, children[1]))).toBe("li");
    expect(children[2].kind).toBe(NodeKind.Text);
    expect(getTagName(r, indexOf(r, children[3]))).toBe("li");
    expect(children[4].kind).toBe(NodeKind.Text);
    expect(getTagName(r, indexOf(r, children[5]))).toBe("li");
    expect(children[6].kind).toBe(NodeKind.Text);

    // Second li has an inner ul child
    const secondLiIdx = indexOf(r, children[3]);
    const secondLiChildren = getContentChildren(r, secondLiIdx);
    expect(secondLiChildren).toHaveLength(3);
    expect(getTagName(r, indexOf(r, secondLiChildren[1]))).toBe("ul");

    expect(renderDocument(r)).toBe(source);
  });

  it("parses table with thead tbody tfoot", () => {
    const source = `<table class="data">
  <thead>
    <tr><th>H1</th><th>H2</th></tr>
  </thead>
  <tbody>
    <tr><td>A1</td><td>A2</td></tr>
    <tr><td>B1</td><td>B2</td></tr>
  </tbody>
  <tfoot>
    <tr><td>T1</td><td>T2</td></tr>
  </tfoot>
</table>`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const tableIdx = indexOf(r, nodes[0]);
    expect(getTagName(r, tableIdx)).toBe("table");
    expect(isPaired(r, tableIdx)).toBe(true);

    const sections = getContentChildren(r, tableIdx);
    expect(sections).toHaveLength(7); // text, thead, text, tbody, text, tfoot, text

    expect(sections[0].kind).toBe(NodeKind.Text);
    expect(getTagName(r, indexOf(r, sections[1]))).toBe("thead");
    expect(sections[2].kind).toBe(NodeKind.Text);
    expect(getTagName(r, indexOf(r, sections[3]))).toBe("tbody");
    expect(sections[4].kind).toBe(NodeKind.Text);
    expect(getTagName(r, indexOf(r, sections[5]))).toBe("tfoot");
    expect(sections[6].kind).toBe(NodeKind.Text);

    expect(renderDocument(r)).toBe(source);
  });

  it("parses form with various inputs and selects", () => {
    const source = `<form method="post" action="/submit">
  <input type="text" name="a" value="x">
  <input type="checkbox" name="c" checked>
  <select name="s">
    <option value="1">One</option>
    <option value="2">Two</option>
  </select>
  <textarea name="t">Hello</textarea>
  <button type="submit">Go</button>
</form>`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const formIdx = indexOf(r, nodes[0]);
    expect(getTagName(r, formIdx)).toBe("form");
    expect(isPaired(r, formIdx)).toBe(true);

    const tags = getContentChildren(r, formIdx);
    expect(tags).toHaveLength(11); // alternating text and elements

    // text, input, text, input, text, select, text, textarea, text, button, text
    expect(tags[0].kind).toBe(NodeKind.Text);
    expect(tags[1].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, tags[1]))).toBe("input");
    expect(tags[2].kind).toBe(NodeKind.Text);
    expect(tags[3].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, tags[3]))).toBe("input");
    expect(tags[4].kind).toBe(NodeKind.Text);
    expect(tags[5].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, tags[5]))).toBe("select");
    expect(tags[6].kind).toBe(NodeKind.Text);
    expect(tags[7].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, tags[7]))).toBe("textarea");
    expect(tags[8].kind).toBe(NodeKind.Text);
    expect(tags[9].kind).toBe(NodeKind.Element);
    expect(getTagName(r, indexOf(r, tags[9]))).toBe("button");
    expect(tags[10].kind).toBe(NodeKind.Text);

    expect(renderDocument(r)).toBe(source);
  });
});
