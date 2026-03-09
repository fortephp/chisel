import { describe, it, expect } from "vitest";
import { NodeKind } from "../../src/tree/types.js";
import {
  parse,
  rootChildren,
  childrenOf,
  indexOf,
  findByKind,
  renderDocument,
  getTagName,
  getDirectiveName,
  isPaired,
} from "./helpers.js";

function elementChildren(result: ReturnType<typeof parse>, elementIdx: number) {
  return childrenOf(result, elementIdx).filter((node) => node.kind === NodeKind.Element);
}

describe("Parser - Slot Variants", () => {
  it("pairs colon-slot with shorthand </x-slot> closing", () => {
    const source = "<x-card><x-slot:title>Title</x-slot></x-card>";
    const r = parse(source);
    const root = rootChildren(r);

    expect(root).toHaveLength(1);
    const cardIdx = indexOf(r, root[0]);
    expect(getTagName(r, cardIdx)).toBe("x-card");

    const slots = elementChildren(r, cardIdx);
    expect(slots).toHaveLength(1);

    const slotIdx = indexOf(r, slots[0]);
    expect(getTagName(r, slotIdx)).toBe("x-slot:title");
    expect(isPaired(r, slotIdx)).toBe(true);
    expect(findByKind(r, NodeKind.UnpairedClosingTag)).toHaveLength(0);
    expect(renderDocument(r)).toBe(source);
  });

  it("pairs bracket-slot with shorthand </x-slot> closing", () => {
    const source = "<x-card><x-slot[title]>Title</x-slot></x-card>";
    const r = parse(source);
    const root = rootChildren(r);

    expect(root).toHaveLength(1);
    const cardIdx = indexOf(r, root[0]);
    const slots = elementChildren(r, cardIdx);
    expect(slots).toHaveLength(1);

    const slotIdx = indexOf(r, slots[0]);
    expect(getTagName(r, slotIdx)).toBe("x-slot[title]");
    expect(isPaired(r, slotIdx)).toBe(true);
    expect(findByKind(r, NodeKind.UnpairedClosingTag)).toHaveLength(0);
    expect(renderDocument(r)).toBe(source);
  });

  it("supports multiple same-name colon slots as siblings", () => {
    const source = "<x-card><x-slot:title>First</x-slot><x-slot:title>Second</x-slot></x-card>";
    const r = parse(source);
    const root = rootChildren(r);
    const cardIdx = indexOf(r, root[0]);
    const slots = elementChildren(r, cardIdx);

    expect(slots).toHaveLength(2);
    expect(getTagName(r, indexOf(r, slots[0]))).toBe("x-slot:title");
    expect(getTagName(r, indexOf(r, slots[1]))).toBe("x-slot:title");
    expect(isPaired(r, indexOf(r, slots[0]))).toBe(true);
    expect(isPaired(r, indexOf(r, slots[1]))).toBe(true);
    expect(findByKind(r, NodeKind.UnpairedClosingTag)).toHaveLength(0);
    expect(renderDocument(r)).toBe(source);
  });

  it("matches nested same-name colon slots in LIFO order", () => {
    const source = "<x-slot:title>Outer<x-slot:title>Inner</x-slot></x-slot>";
    const r = parse(source);
    const root = rootChildren(r);

    expect(root).toHaveLength(1);
    const outerIdx = indexOf(r, root[0]);
    expect(getTagName(r, outerIdx)).toBe("x-slot:title");
    expect(isPaired(r, outerIdx)).toBe(true);

    const nested = elementChildren(r, outerIdx);
    expect(nested).toHaveLength(1);
    const innerIdx = indexOf(r, nested[0]);
    expect(getTagName(r, innerIdx)).toBe("x-slot:title");
    expect(isPaired(r, innerIdx)).toBe(true);
    expect(findByKind(r, NodeKind.UnpairedClosingTag)).toHaveLength(0);
    expect(renderDocument(r)).toBe(source);
  });

  it("requires exact dynamic name match for dynamic slot tags", () => {
    const source = "<x-slot:{{ $name }}>Body</x-slot:{{ $name }}>";
    const r = parse(source);
    const root = rootChildren(r);

    expect(root).toHaveLength(1);
    const slotIdx = indexOf(r, root[0]);
    expect(isPaired(r, slotIdx)).toBe(true);
    expect(findByKind(r, NodeKind.UnpairedClosingTag)).toHaveLength(0);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses repeated @slot/@endslot blocks with the same slot name", () => {
    const source = "@slot('title')A @endslot @slot('title')B @endslot";
    const r = parse(source);
    const blocks = findByKind(r, NodeKind.DirectiveBlock);

    expect(blocks).toHaveLength(2);

    for (const block of blocks) {
      const blockIdx = indexOf(r, block);
      const directives = childrenOf(r, blockIdx).filter((node) => node.kind === NodeKind.Directive);
      expect(directives).toHaveLength(2);
      expect(getDirectiveName(r, directives[0])).toBe("slot");
      expect(getDirectiveName(r, directives[1])).toBe("endslot");
    }

    expect(renderDocument(r)).toBe(source);
  });

  it("pairs colon-bracket dynamic expression slot with </x-slot>", () => {
    const source = "<x-card><x-slot:[items]>Content</x-slot></x-card>";
    const r = parse(source);
    const root = rootChildren(r);

    expect(root).toHaveLength(1);
    const cardIdx = indexOf(r, root[0]);
    const slots = elementChildren(r, cardIdx);
    expect(slots).toHaveLength(1);

    const slotIdx = indexOf(r, slots[0]);
    expect(getTagName(r, slotIdx)).toBe("x-slot:[items]");
    expect(isPaired(r, slotIdx)).toBe(true);
    expect(findByKind(r, NodeKind.UnpairedClosingTag)).toHaveLength(0);
    expect(renderDocument(r)).toBe(source);
  });

  it("pairs variadic-style slot names with </x-slot> and supports repeated base name", () => {
    const source = "<x-list><x-slot:items[]>One</x-slot><x-slot:items[]>Two</x-slot></x-list>";
    const r = parse(source);
    const root = rootChildren(r);

    expect(root).toHaveLength(1);
    const listIdx = indexOf(r, root[0]);
    const slots = elementChildren(r, listIdx);
    expect(slots).toHaveLength(2);

    const firstIdx = indexOf(r, slots[0]);
    const secondIdx = indexOf(r, slots[1]);
    expect(getTagName(r, firstIdx)).toBe("x-slot:items[]");
    expect(getTagName(r, secondIdx)).toBe("x-slot:items[]");
    expect(isPaired(r, firstIdx)).toBe(true);
    expect(isPaired(r, secondIdx)).toBe(true);
    expect(findByKind(r, NodeKind.UnpairedClosingTag)).toHaveLength(0);
    expect(renderDocument(r)).toBe(source);
  });
});
