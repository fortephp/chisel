import { describe, it, expect } from "vitest";
import { NodeKind } from "../../src/tree/types.js";
import {
  parse,
  rootChildren,
  indexOf,
  renderDocument,
  getTagName,
  getContentChildren,
  getAttributes,
  getAttributeName,
  isSelfClosing,
  isPaired,
} from "./helpers.js";

describe("Blade Components", () => {
  it("parses basic self-closing component", () => {
    const source = '<x-alert type="success" message="Saved" />';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const elIdx = indexOf(r, nodes[0]);
    expect(getTagName(r, elIdx)).toBe("x-alert");
    expect(isSelfClosing(nodes[0])).toBe(true);

    const attrs = getAttributes(r, elIdx);
    expect(attrs).toHaveLength(2);
    expect(getAttributeName(r, attrs[0])).toBe("type");
    expect(getAttributeName(r, attrs[1])).toBe("message");

    expect(renderDocument(r)).toBe(source);
  });

  it("parses component with tag pair and children", () => {
    const source = '<x-alert type="error"><span>Oops</span></x-alert>';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);

    const elIdx = indexOf(r, nodes[0]);
    expect(getTagName(r, elIdx)).toBe("x-alert");
    expect(isPaired(r, elIdx)).toBe(true);
    expect(isSelfClosing(nodes[0])).toBe(false);

    // Check child span element
    const content = getContentChildren(r, elIdx);
    const elements = content.filter((c) => c.kind === NodeKind.Element);
    expect(elements).toHaveLength(1);
    expect(getTagName(r, indexOf(r, elements[0]))).toBe("span");
    expect(isPaired(r, indexOf(r, elements[0]))).toBe(true);

    expect(renderDocument(r)).toBe(source);
  });

  it("parses component with named slot using name attribute", () => {
    const source = '<x-card><x-slot name="title">Title</x-slot><p>Body</p></x-card>';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const cardIdx = indexOf(r, nodes[0]);
    expect(getTagName(r, cardIdx)).toBe("x-card");
    expect(isPaired(r, cardIdx)).toBe(true);

    const content = getContentChildren(r, cardIdx);
    const elements = content.filter((c) => c.kind === NodeKind.Element);
    expect(elements).toHaveLength(2);

    // x-slot
    const slotIdx = indexOf(r, elements[0]);
    expect(getTagName(r, slotIdx)).toBe("x-slot");

    const slotAttrs = getAttributes(r, slotIdx);
    expect(slotAttrs).toHaveLength(1);
    expect(getAttributeName(r, slotAttrs[0])).toBe("name");

    // p
    expect(getTagName(r, indexOf(r, elements[1]))).toBe("p");

    expect(renderDocument(r)).toBe(source);
  });

  it("parses component with shorthand named slot tag", () => {
    const source = "<x-card><x-slot:title>Title</x-slot:title><div>Body</div></x-card>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const cardIdx = indexOf(r, nodes[0]);
    expect(getTagName(r, cardIdx)).toBe("x-card");

    const content = getContentChildren(r, cardIdx);
    const elements = content.filter((c) => c.kind === NodeKind.Element);
    expect(elements).toHaveLength(2);

    // x-slot:title
    expect(getTagName(r, indexOf(r, elements[0]))).toBe("x-slot:title");

    // div
    expect(getTagName(r, indexOf(r, elements[1]))).toBe("div");

    expect(renderDocument(r)).toBe(source);
  });

  it("parses nested components", () => {
    const source = "<x-card><x-button>Go</x-button></x-card>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const cardIdx = indexOf(r, nodes[0]);
    expect(getTagName(r, cardIdx)).toBe("x-card");

    const content = getContentChildren(r, cardIdx);
    const childComponents = content.filter((c) => c.kind === NodeKind.Element);
    expect(childComponents).toHaveLength(1);
    expect(getTagName(r, indexOf(r, childComponents[0]))).toBe("x-button");

    expect(renderDocument(r)).toBe(source);
  });

  it("parses dynamic component tag with bound component attribute", () => {
    const source = '<x-dynamic-component :component="$cmp" class="p-4">Body</x-dynamic-component>';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const elIdx = indexOf(r, nodes[0]);
    expect(getTagName(r, elIdx)).toBe("x-dynamic-component");
    expect(isPaired(r, elIdx)).toBe(true);

    const attrs = getAttributes(r, elIdx);
    expect(attrs).toHaveLength(2);
    expect(getAttributeName(r, attrs[0])).toBe(":component");
    expect(getAttributeName(r, attrs[1])).toBe("class");

    expect(renderDocument(r)).toBe(source);
  });

  it("parses namespaced/dotted anonymous component names", () => {
    const source = "<x-admin.alert/><x-admin.card>Body</x-admin.card>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(2);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    expect(nodes[1].kind).toBe(NodeKind.Element);

    const c1Idx = indexOf(r, nodes[0]);
    expect(getTagName(r, c1Idx)).toBe("x-admin.alert");
    expect(isSelfClosing(nodes[0])).toBe(true);

    const c2Idx = indexOf(r, nodes[1]);
    expect(getTagName(r, c2Idx)).toBe("x-admin.card");
    expect(isPaired(r, c2Idx)).toBe(true);

    expect(renderDocument(r)).toBe(source);
  });
});
