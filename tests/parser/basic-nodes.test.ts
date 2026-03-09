import { describe, it, expect } from "vitest";
import { NodeKind } from "../../src/tree/types.js";
import {
  parse,
  rootChildren,
  childrenOf,
  nodeText,
  indexOf,
  renderDocument,
  getTagName,
  getContentChildren,
  getEchoContent,
  getDirectiveName,
  getDirectiveArgs,
} from "./helpers.js";

const SIMPLE_DIRECTIVES = ["csrf", "dd", "dump", "method", "stack"];

describe("Basic Nodes", () => {
  it("parses literal documents", () => {
    const source = "Hello World";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[0])).toBe("Hello World");
    expect(renderDocument(r)).toBe(source);
  });

  it.each(SIMPLE_DIRECTIVES)("parses basic directive @%s", (directive) => {
    const source = `Start @${directive} End`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(3);
    expect(nodes[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[0])).toBe("Start ");
    expect(nodes[1].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, nodes[1])).toBe(directive.toLowerCase());
    expect(nodes[2].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[2])).toBe(" End");
    expect(renderDocument(r)).toBe(source);
  });

  it.each(SIMPLE_DIRECTIVES)(
    "parses basic directive @%s with multibyte characters",
    (directive) => {
      const source = `🐘 @${directive} 🐘`;
      const r = parse(source);
      const nodes = rootChildren(r);

      expect(nodes).toHaveLength(3);
      expect(nodes[0].kind).toBe(NodeKind.Text);
      expect(nodeText(r, nodes[0])).toBe("🐘 ");
      expect(nodes[1].kind).toBe(NodeKind.Directive);
      expect(getDirectiveName(r, nodes[1])).toBe(directive.toLowerCase());
      expect(nodes[2].kind).toBe(NodeKind.Text);
      expect(nodeText(r, nodes[2])).toBe(" 🐘");
      expect(renderDocument(r)).toBe(source);
    },
  );

  it("parses directives with arguments", () => {
    const source = "Start @can ('do something') End";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(2);
    expect(nodes[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[0])).toBe("Start ");
    // @can is a paired (condition) directive -> DirectiveBlock
    expect(nodes[1].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[1]));
    const openDirective = blockChildren[0];
    expect(openDirective.kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, openDirective)).toBe("can");
    expect(getDirectiveArgs(r, openDirective)).toBe("('do something')");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses neighboring echo nodes", () => {
    const source = "{{ $one }}{{ $two }}{{ $three }}";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(3);
    expect(nodes[0].kind).toBe(NodeKind.Echo);
    expect(getEchoContent(r, nodes[0])).toBe(" $one ");
    expect(nodes[1].kind).toBe(NodeKind.Echo);
    expect(getEchoContent(r, nodes[1])).toBe(" $two ");
    expect(nodes[2].kind).toBe(NodeKind.Echo);
    expect(getEchoContent(r, nodes[2])).toBe(" $three ");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses components with multibyte characters", () => {
    const source = "<x-alert>🐘🐘🐘🐘</x-alert>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    const elementIdx = indexOf(r, nodes[0]);
    expect(getTagName(r, elementIdx)).toBe("x-alert");

    const children = getContentChildren(r, elementIdx);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, children[0])).toBe("🐘🐘🐘🐘");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses neighboring echo nodes with literals", () => {
    const source = "a{{ $one }}b{{ $two }}c{{ $three }}d";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(7);
    expect(nodes[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[0])).toBe("a");
    expect(nodes[1].kind).toBe(NodeKind.Echo);
    expect(getEchoContent(r, nodes[1])).toBe(" $one ");
    expect(nodes[2].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[2])).toBe("b");
    expect(nodes[3].kind).toBe(NodeKind.Echo);
    expect(getEchoContent(r, nodes[3])).toBe(" $two ");
    expect(nodes[4].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[4])).toBe("c");
    expect(nodes[5].kind).toBe(NodeKind.Echo);
    expect(getEchoContent(r, nodes[5])).toBe(" $three ");
    expect(nodes[6].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[6])).toBe("d");
    expect(renderDocument(r)).toBe(source);
  });

  it("handles escaped nodes (@@)", () => {
    const source = "@@unless\n@{{ $variable }}\n@{!! $variable }}";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(6);
    expect(nodes[0].kind).toBe(NodeKind.NonOutput);
    expect(nodes[1].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[1])).toBe("@unless\n");
    expect(nodes[2].kind).toBe(NodeKind.NonOutput);
    expect(nodes[3].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[3])).toBe("{{ $variable }}\n");
    expect(nodes[4].kind).toBe(NodeKind.NonOutput);
    expect(nodes[5].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[5])).toBe("{!! $variable }}");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses @@if as escape + text", () => {
    const source = "@@if";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(2);
    expect(nodes[0].kind).toBe(NodeKind.NonOutput);
    expect(nodes[1].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[1])).toBe("@if");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses escaped echo", () => {
    const source = "{{ $name }}";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Echo);
    expect(getEchoContent(r, nodes[0])).toBe(" $name ");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses raw echo", () => {
    const source = "Hello, {!! $name !!}.";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(3);
    expect(nodes[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[0])).toBe("Hello, ");
    expect(nodes[1].kind).toBe(NodeKind.RawEcho);
    expect(getEchoContent(r, nodes[1])).toBe(" $name ");
    expect(nodes[2].kind).toBe(NodeKind.Text);
    expect(nodeText(r, nodes[2])).toBe(".");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses triple echo", () => {
    const source = "{{{ $name }}}";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.TripleEcho);
    expect(getEchoContent(r, nodes[0])).toBe(" $name ");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses echo spanning multiple lines", () => {
    const source = "{{\n         $name\n }}";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Echo);
    expect(getEchoContent(r, nodes[0])).toBe("\n         $name\n ");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses verbatim blocks", () => {
    const source =
      '@verbatim\n<div class="container">\n    Hello, {{ name }}.\n</div>\n@endverbatim';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Verbatim);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses @if/@elseif/@else/@endif", () => {
    const source =
      "@if (count($records) === 1)\nI have one record!\n@elseif (count($records) > 1)\nI have multiple records!\n@else\nI don't have any records!\n@endif";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    expect(blockChildren).toHaveLength(4);

    expect(getDirectiveName(r, blockChildren[0])).toBe("if");
    expect(getDirectiveArgs(r, blockChildren[0])).toBe("(count($records) === 1)");
    expect(getDirectiveName(r, blockChildren[1])).toBe("elseif");
    expect(getDirectiveArgs(r, blockChildren[1])).toBe("(count($records) > 1)");
    expect(getDirectiveName(r, blockChildren[2])).toBe("else");
    expect(getDirectiveArgs(r, blockChildren[2])).toBeNull();
    expect(getDirectiveName(r, blockChildren[3])).toBe("endif");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses @unless/@endunless", () => {
    const source = "@unless (Auth::check())\nYou are not signed in.\n@endunless";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    expect(blockChildren).toHaveLength(2);
    expect(getDirectiveName(r, blockChildren[0])).toBe("unless");
    expect(getDirectiveArgs(r, blockChildren[0])).toBe("(Auth::check())");
    expect(getDirectiveName(r, blockChildren[1])).toBe("endunless");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses @isset/@endisset", () => {
    const source = "@isset($records)\n// $records is defined and is not null...\n@endisset";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    expect(blockChildren).toHaveLength(2);
    expect(getDirectiveName(r, blockChildren[0])).toBe("isset");
    expect(getDirectiveArgs(r, blockChildren[0])).toBe("($records)");
    expect(getDirectiveName(r, blockChildren[1])).toBe("endisset");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses many mixed nodes", () => {
    const source = `start
    {{-- comment!!! --}}3
    s1@props_two(['color' => (true ?? 'gray')])
    s2@directive
    @directive something
    s3@props_three  (['color' => (true ?? 'gray')])
    @props(['color' => 'gray'])
 {!! $dooblyDoo !!}1
<ul {{ $attributes->merge(['class' => 'bg-'.$color.'-200']) }}>
    {{ $slot }}
</ul>`;
    const r = parse(source);
    const nodes = rootChildren(r);

    // Text, BladeComment, Text, Directive, Text, Directive, Text, RawEcho, Text, Element
    expect(nodes).toHaveLength(10);
    expect(nodes[0].kind).toBe(NodeKind.Text);
    expect(nodes[1].kind).toBe(NodeKind.BladeComment);
    expect(nodes[2].kind).toBe(NodeKind.Text);
    expect(nodes[3].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, nodes[3])).toBe("directive");
    expect(nodes[4].kind).toBe(NodeKind.Text);
    expect(nodes[5].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, nodes[5])).toBe("props");
    expect(getDirectiveArgs(r, nodes[5])).toBe("(['color' => 'gray'])");
    expect(nodes[6].kind).toBe(NodeKind.Text);
    expect(nodes[7].kind).toBe(NodeKind.RawEcho);
    expect(getEchoContent(r, nodes[7])).toBe(" $dooblyDoo ");
    expect(nodes[8].kind).toBe(NodeKind.Text);

    // Element
    expect(nodes[9].kind).toBe(NodeKind.Element);
    const elIdx = indexOf(r, nodes[9]);
    expect(getTagName(r, elIdx)).toBe("ul");
    // Standalone echo in attribute position becomes an Echo child (not Attribute).
    // Content children include: Echo (attr), Text, Echo ($slot), Text
    const elChildren = getContentChildren(r, elIdx);
    expect(elChildren).toHaveLength(4);
    expect(elChildren[0].kind).toBe(NodeKind.Echo); // attribute echo
    expect(elChildren[1].kind).toBe(NodeKind.Text);
    expect(elChildren[2].kind).toBe(NodeKind.Echo); // {{ $slot }}
    expect(getEchoContent(r, elChildren[2])).toBe(" $slot ");
    expect(elChildren[3].kind).toBe(NodeKind.Text);

    expect(renderDocument(r)).toBe(source);
  });

  it("parses script with echo inside", () => {
    const source = "<script>\nvar app = {{ Illuminate\\Support\\Js::from($array) }};\n</script>";
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.Element);
    const elIdx = indexOf(r, nodes[0]);
    expect(getTagName(r, elIdx)).toBe("script");

    const children = getContentChildren(r, elIdx);
    expect(children).toHaveLength(3);
    expect(children[0].kind).toBe(NodeKind.Text);
    expect(nodeText(r, children[0])).toBe("\nvar app = ");
    expect(children[1].kind).toBe(NodeKind.Echo);
    expect(children[2].kind).toBe(NodeKind.Text);
    expect(nodeText(r, children[2])).toBe(";\n");
    expect(renderDocument(r)).toBe(source);
  });
});
