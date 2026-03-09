import { describe, it, expect } from "vitest";
import { NodeKind } from "../../src/tree/types.js";
import { parse, rootChildren, nodeText, renderDocument } from "./helpers.js";

describe("DOCTYPE Parsing", () => {
  it.each([
    ["HTML5", "<!DOCTYPE html>"],
    ["HTML5 self-closing", "<!DOCTYPE html />"],
    [
      "HTML 4.01 Strict",
      '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">',
    ],
    [
      "HTML 4.01 Transitional",
      '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">',
    ],
    [
      "HTML 4.01 Frameset",
      '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd">',
    ],
    [
      "XHTML 1.0 Strict",
      '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">',
    ],
    [
      "XHTML 1.0 Transitional",
      '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
    ],
    [
      "XHTML 1.0 Frameset",
      '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">',
    ],
    [
      "XHTML 1.1",
      '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">',
    ],
    [
      "SVG 1.1",
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    ],
    [
      "SVG 1.0",
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.0//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">',
    ],
    ["MathML", '<!DOCTYPE math SYSTEM "http://www.w3.org/Math/DTD/mathml2/mathml2.dtd">'],
    ["HTML 3.2", '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">'],
    ["IETF HTML", '<!DOCTYPE html PUBLIC "-//IETF//DTD HTML//EN">'],
  ])("parses and renders %s doctype: %s", (_label, doctype) => {
    const r = parse(doctype);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Doctype);
    expect(renderDocument(r)).toBe(doctype);
  });

  it("preserves original casing", () => {
    const source = "<!DocType html>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Doctype);
    expect(nodeText(r, nodes[0])).toBe(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("preserves unclosed doctype", () => {
    const source = "<!DocType svg PUBLIC";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Doctype);
    expect(nodeText(r, nodes[0])).toBe(source);
    expect(renderDocument(r)).toBe(source);
  });
});
