import { describe, it, expect } from "vitest";
import { NodeKind } from "../../src/tree/types.js";
import { parse, rootChildren, nodeText, renderDocument, getEchoContent } from "./helpers.js";

describe("Echo Parsing", () => {
  it("parses regular echo {{ }}", () => {
    const source = "{{ $name }}";
    const r = parse(source);
    const children = rootChildren(r);

    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Echo);
    expect(getEchoContent(r, children[0])).toBe(" $name ");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses raw echo {!! !!}", () => {
    const source = "{!! $html !!}";
    const r = parse(source);
    const children = rootChildren(r);

    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.RawEcho);
    expect(getEchoContent(r, children[0])).toBe(" $html ");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses triple echo {{{ }}}", () => {
    const source = "{{{ $escaped }}}";
    const r = parse(source);
    const children = rootChildren(r);

    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.TripleEcho);
    expect(getEchoContent(r, children[0])).toBe(" $escaped ");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses multiple echos in sequence", () => {
    const source = "{{ $a }} {!! $b !!} {{{ $c }}}";
    const r = parse(source);
    const children = rootChildren(r);

    expect(children).toHaveLength(5);
    expect(children[0].kind).toBe(NodeKind.Echo);
    expect(children[1].kind).toBe(NodeKind.Text);
    expect(children[2].kind).toBe(NodeKind.RawEcho);
    expect(children[3].kind).toBe(NodeKind.Text);
    expect(children[4].kind).toBe(NodeKind.TripleEcho);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses neighboring echos without text", () => {
    const source = "{{ $one }}{{ $two }}{{ $three }}";
    const r = parse(source);
    const children = rootChildren(r);

    expect(children).toHaveLength(3);
    expect(children[0].kind).toBe(NodeKind.Echo);
    expect(getEchoContent(r, children[0]).trim()).toBe("$one");
    expect(children[1].kind).toBe(NodeKind.Echo);
    expect(getEchoContent(r, children[1]).trim()).toBe("$two");
    expect(children[2].kind).toBe(NodeKind.Echo);
    expect(getEchoContent(r, children[2]).trim()).toBe("$three");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses echo with text surrounding", () => {
    const source = "The current UNIX timestamp is {{ time() }}.";
    const r = parse(source);
    const children = rootChildren(r);

    expect(children).toHaveLength(3);
    expect(children[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, children[0])).toBe("The current UNIX timestamp is ");
    expect(children[1].kind).toBe(NodeKind.Echo);
    expect(getEchoContent(r, children[1]).trim()).toBe("time()");
    expect(children[2].kind).toBe(NodeKind.Text);
    expect(nodeText(r, children[2])).toBe(".");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses raw echo with text surrounding", () => {
    const source = "Hello, {!! $name !!}.";
    const r = parse(source);
    const children = rootChildren(r);

    expect(children).toHaveLength(3);
    expect(children[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, children[0])).toBe("Hello, ");
    expect(children[1].kind).toBe(NodeKind.RawEcho);
    expect(getEchoContent(r, children[1]).trim()).toBe("$name");
    expect(children[2].kind).toBe(NodeKind.Text);
    expect(nodeText(r, children[2])).toBe(".");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses echo spanning multiple lines", () => {
    const source = "{{\n         $name\n }}";
    const r = parse(source);
    const children = rootChildren(r);

    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Echo);
    expect(getEchoContent(r, children[0]).trim()).toBe("$name");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses echo with complex expression", () => {
    const source = `{{ $attributes->merge(['class' => 'bg-'.$color.'-200']) }}`;
    const r = parse(source);
    const children = rootChildren(r);

    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Echo);
    expect(renderDocument(r)).toBe(source);
  });
});
