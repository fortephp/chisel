import { describe, it, expect } from "vitest";
import { NodeKind } from "../../src/tree/types.js";
import {
  parse,
  rootChildren,
  indexOf,
  renderDocument,
  getTagName,
  isPaired,
  getAttributes,
  getAttributeName,
  getContentChildren,
} from "./helpers.js";

describe("Script Tags", () => {
  it("preserves script content with nested closing tags", () => {
    const source = '<script>document.write("</span>");</script>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("script with multiple fake closing tags", () => {
    const source = '<script>var html = "</div></span></p>";</script>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles script tag with complex JavaScript", () => {
    const source = `        <script type="text/javascript">
        const template = \`<div class="test">Hello \${'world'}</div>\`;
        const regex = /<script.*?<\\/script>/gi;
        document.innerHTML = '<span>Test</span>';
        </script>`;
    const r = parse(source);
    const nodes = rootChildren(r);

    // There may be a leading text node due to leading whitespace
    const scriptNode = nodes.find(
      (n) => n.kind === NodeKind.Element && getTagName(r, indexOf(r, n)) === "script",
    );
    expect(scriptNode).toBeDefined();
    const scriptIdx = indexOf(r, scriptNode!);
    expect(getTagName(r, scriptIdx)).toBe("script");
    expect(isPaired(r, scriptIdx)).toBe(true);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses script tags with html-like concat strings", () => {
    const source = "<script>\nfunc(`<script> (async () => {` + `</scr` + `ipt>'\";``);\n</script>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    const idx = indexOf(r, nodes[0]);
    expect(isPaired(r, idx)).toBe(true);

    const contentChildren = getContentChildren(r, idx);
    expect(contentChildren).toHaveLength(1);
    expect(contentChildren[0].kind).toBe(NodeKind.Text);

    expect(renderDocument(r)).toBe(source);
  });

  it("recovers from missing > on closing script tag", () => {
    const source = '<script src="script.js"></script';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    const idx = indexOf(r, nodes[0]);
    expect(getTagName(r, idx)).toBe("script");

    const attrs = getAttributes(r, idx);
    expect(attrs).toHaveLength(1);

    expect(renderDocument(r)).toBe(source);
  });

  it("parses unquoted attribute on script tag", () => {
    const source = "<script src=assets/js.js></script>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    const idx = indexOf(r, nodes[0]);

    const attrs = getAttributes(r, idx);
    expect(attrs).toHaveLength(1);
    expect(getAttributeName(r, attrs[0])).toBe("src");

    expect(renderDocument(r)).toBe(source);
  });
});
