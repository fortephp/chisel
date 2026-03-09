import { describe, it, expect } from "vitest";
import { NodeKind } from "../../src/tree/types.js";
import {
  parse,
  rootChildren,
  childrenOf,
  nodeText,
  indexOf,
  isPaired,
  renderDocument,
} from "./helpers.js";

function getClosingNameText(source: string): string | null {
  const r = parse(source);
  const root = rootChildren(r);
  const elementIdx = indexOf(r, root[0]);
  const closing = childrenOf(r, elementIdx).find(
    (child) => child.kind === NodeKind.ClosingElementName,
  );
  return closing ? nodeText(r, closing) : null;
}

describe("Parser - Compound Element Names", () => {
  it("pairs matching multipart element names", () => {
    const source = "<my-{{ $el }}>hello</my-{{ $el }}>";
    const r = parse(source);
    const root = rootChildren(r);

    expect(root).toHaveLength(1);
    expect(isPaired(r, indexOf(r, root[0]))).toBe(true);
    expect(getClosingNameText(source)).toBe("my-{{ $el }}");
    expect(renderDocument(r)).toBe(source);
  });

  it("does not false-match differing multipart closing names", () => {
    const source = "<my-{{ $el }}>hello</my-{{ $other }}>";
    const r = parse(source);
    const root = rootChildren(r);

    expect(root).toHaveLength(1);
    expect(isPaired(r, indexOf(r, root[0]))).toBe(false);
    expect(getClosingNameText(source)).toBeNull();
    expect(renderDocument(r)).toBe(source);
  });

  it("pairs fully dynamic multipart names", () => {
    const source = "<{{ $prefix }}-<?php echo $x; ?>>x</{{ $prefix }}-<?php echo $x; ?>>";
    const r = parse(source);
    const root = rootChildren(r);

    expect(root).toHaveLength(1);
    expect(isPaired(r, indexOf(r, root[0]))).toBe(true);
    expect(getClosingNameText(source)).toBe("{{ $prefix }}-<?php echo $x; ?>");
    expect(renderDocument(r)).toBe(source);
  });
});
