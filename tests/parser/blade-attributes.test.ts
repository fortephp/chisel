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
  getEchoContent,
} from "./helpers.js";

describe("Blade Attributes - Standalone Echo", () => {
  it("parses standalone echo attribute", () => {
    const source = "<div {{ $attrs }}></div>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const elIdx = indexOf(r, nodes[0]);
    expect(getTagName(r, elIdx)).toBe("div");

    // Standalone echo in attribute position becomes an Echo child
    const content = getContentChildren(r, elIdx);
    const echos = content.filter((c) => c.kind === NodeKind.Echo);
    expect(echos.length).toBeGreaterThanOrEqual(1);
    expect(getEchoContent(r, echos[0])).toBe(" $attrs ");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses standalone raw echo attribute", () => {
    const source = "<div {!! $attrs !!}></div>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const elIdx = indexOf(r, nodes[0]);

    const content = getContentChildren(r, elIdx);
    const rawEchos = content.filter((c) => c.kind === NodeKind.RawEcho);
    expect(rawEchos.length).toBeGreaterThanOrEqual(1);
    expect(getEchoContent(r, rawEchos[0])).toBe(" $attrs ");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses standalone triple echo attribute", () => {
    const source = "<div {{{ $attrs }}}></div>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const elIdx = indexOf(r, nodes[0]);

    const content = getContentChildren(r, elIdx);
    const tripleEchos = content.filter((c) => c.kind === NodeKind.TripleEcho);
    expect(tripleEchos.length).toBeGreaterThanOrEqual(1);
    expect(renderDocument(r)).toBe(source);
  });
});

describe("Blade Attributes - Multiple Echoes", () => {
  it("parses multiple standalone echo attributes", () => {
    const source = "<div {{ $a }} {{ $b }}></div>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const elIdx = indexOf(r, nodes[0]);

    const content = getContentChildren(r, elIdx);
    const echos = content.filter((c) => c.kind === NodeKind.Echo);
    expect(echos.length).toBeGreaterThanOrEqual(2);
    expect(getEchoContent(r, echos[0])).toBe(" $a ");
    expect(getEchoContent(r, echos[1])).toBe(" $b ");
    expect(renderDocument(r)).toBe(source);
  });
});

describe("Blade Attributes - Mixed with Traditional", () => {
  it("parses mixed traditional and echo attributes", () => {
    const source = '<div class="static" {{ $attrs }}></div>';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const elIdx = indexOf(r, nodes[0]);

    // Should have a static attribute
    const attrs = getAttributes(r, elIdx);
    expect(attrs).toHaveLength(1);
    expect(getAttributeName(r, attrs[0])).toBe("class");

    // And an echo in content children
    const content = getContentChildren(r, elIdx);
    const echos = content.filter((c) => c.kind === NodeKind.Echo);
    expect(echos.length).toBeGreaterThanOrEqual(1);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses echo before traditional attribute", () => {
    const source = '<div {{ $attrs }} class="static"></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });
});

describe("Blade Attributes - Complex Expressions", () => {
  it("parses complex echo with method calls", () => {
    const source = "<ul {{ $attributes->merge(['class' => 'bg-'.$color.'-200']) }}></ul>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const elIdx = indexOf(r, nodes[0]);
    expect(getTagName(r, elIdx)).toBe("ul");

    const content = getContentChildren(r, elIdx);
    const echos = content.filter((c) => c.kind === NodeKind.Echo);
    expect(echos.length).toBeGreaterThanOrEqual(1);
    expect(getEchoContent(r, echos[0])).toBe(
      " $attributes->merge(['class' => 'bg-'.$color.'-200']) ",
    );
    expect(renderDocument(r)).toBe(source);
  });

  it("parses echo with ternary operator", () => {
    const source = '<div {{ $active ? "active" : "" }}></div>';
    const r = parse(source);

    const content = getContentChildren(r, indexOf(r, rootChildren(r)[0]));
    const echos = content.filter((c) => c.kind === NodeKind.Echo);
    expect(echos.length).toBeGreaterThanOrEqual(1);
    expect(renderDocument(r)).toBe(source);
  });
});

describe("Blade Attributes - Rendering", () => {
  it("renders element with standalone echo attribute correctly", () => {
    const source = "<div {{ $attrs }}></div>";
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("renders element with multiple echo attributes correctly", () => {
    const source = "<div {{ $a }} {{ $b }}></div>";
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("renders mixed traditional and echo attributes correctly", () => {
    const source = '<div class="test" {{ $attrs }} id="main"></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("renders raw echo attribute correctly", () => {
    const source = "<div {!! $attrs !!}></div>";
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });
});
