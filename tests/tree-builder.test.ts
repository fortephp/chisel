import { describe, it, expect } from "vitest";
import { tokenize } from "../src/lexer/lexer.js";
import { buildTree } from "../src/tree/tree-builder.js";
import { NodeKind, NONE, type FlatNode, type BuildResult } from "../src/tree/types.js";
import { Directives } from "../src/tree/directives.js";
function parse(source: string, directives?: Directives): BuildResult {
  const { tokens } = tokenize(source);
  return buildTree(tokens, source, directives);
}

function rootChildren(result: BuildResult): FlatNode[] {
  const root = result.nodes[0];
  const children: FlatNode[] = [];
  let idx = root.firstChild;
  while (idx !== NONE) {
    children.push(result.nodes[idx]);
    idx = result.nodes[idx].nextSibling;
  }
  return children;
}

function childrenOf(result: BuildResult, nodeIdx: number): FlatNode[] {
  const node = result.nodes[nodeIdx];
  const children: FlatNode[] = [];
  let idx = node.firstChild;
  while (idx !== NONE) {
    children.push(result.nodes[idx]);
    idx = result.nodes[idx].nextSibling;
  }
  return children;
}

function findByKind(result: BuildResult, kind: number): FlatNode[] {
  return result.nodes.filter((n) => n.kind === kind);
}

function indexOf(result: BuildResult, node: FlatNode): number {
  return result.nodes.indexOf(node);
}
describe("text", () => {
  it("parses plain text", () => {
    const r = parse("Hello world");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Text);
  });

  it("merges consecutive text tokens", () => {
    const r = parse("Hello world foo bar");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Text);
  });

  it("handles empty input", () => {
    const r = parse("");
    expect(r.nodes).toHaveLength(1);
    expect(r.nodes[0].kind).toBe(NodeKind.Root);
    expect(r.nodes[0].firstChild).toBe(NONE);
  });
});
describe("elements", () => {
  it("parses open and close tag", () => {
    const r = parse("<div></div>");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Element);
  });

  it("creates ElementName child", () => {
    const r = parse("<div></div>");
    const element = rootChildren(r)[0];
    const elIdx = indexOf(r, element);
    const kids = childrenOf(r, elIdx);
    // Should have ElementName and ClosingElementName
    const elementName = kids.find((n) => n.kind === NodeKind.ElementName);
    const closingName = kids.find((n) => n.kind === NodeKind.ClosingElementName);
    expect(elementName).toBeDefined();
    expect(closingName).toBeDefined();
  });

  it("parses self-closing element", () => {
    const r = parse("<br/>");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Element);
    expect(children[0].data).toBe(1); // selfClosing flag
  });

  it("auto-closes void elements", () => {
    const r = parse("<br><p>text</p>");
    const children = rootChildren(r);
    // <br> should be auto-closed, not parent of <p>
    expect(children.length).toBeGreaterThanOrEqual(2);
    expect(children[0].kind).toBe(NodeKind.Element); // br
    expect(children[1].kind).toBe(NodeKind.Element); // p
  });

  it("handles nested elements", () => {
    const r = parse("<div><span>text</span></div>");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);

    const divIdx = indexOf(r, children[0]);
    const divKids = childrenOf(r, divIdx);
    // ElementName, span Element, ClosingElementName
    const spanElement = divKids.find((n) => n.kind === NodeKind.Element);
    expect(spanElement).toBeDefined();
  });

  it("handles unpaired closing tag", () => {
    const r = parse("</span>");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.UnpairedClosingTag);
  });

  it("handles component tag names", () => {
    const r = parse("<x-alert></x-alert>");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Element);
  });

  it("matches x-slot closing tag with x-slot:name", () => {
    const r = parse("<x-slot:header>content</x-slot>");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Element);
    // Should be matched (not unpaired)
    const unpaired = findByKind(r, NodeKind.UnpairedClosingTag);
    expect(unpaired).toHaveLength(0);
  });

  it("bare < treated as text when no tag name follows", () => {
    const r = parse("a < b");
    const children = rootChildren(r);
    // Should be text nodes
    const allText = children.every((c) => c.kind === NodeKind.Text);
    expect(allText).toBe(true);
  });
});
describe("attributes", () => {
  it("parses quoted attribute", () => {
    const r = parse('<div class="foo"></div>');
    const attrs = findByKind(r, NodeKind.Attribute);
    expect(attrs.length).toBeGreaterThanOrEqual(1);
  });

  it("creates AttributeName and AttributeValue children", () => {
    const r = parse('<div class="foo"></div>');
    const attrNames = findByKind(r, NodeKind.AttributeName);
    const attrValues = findByKind(r, NodeKind.AttributeValue);
    expect(attrNames.length).toBeGreaterThanOrEqual(1);
    expect(attrValues.length).toBeGreaterThanOrEqual(1);
  });

  it("parses boolean attribute", () => {
    const r = parse("<input disabled>");
    const attrs = findByKind(r, NodeKind.Attribute);
    expect(attrs.length).toBeGreaterThanOrEqual(1);
  });

  it("parses multiple attributes", () => {
    const r = parse('<div class="a" id="b"></div>');
    const attrs = findByKind(r, NodeKind.Attribute);
    expect(attrs.length).toBeGreaterThanOrEqual(2);
  });

  it("emits whitespace between attributes", () => {
    const r = parse('<div class="a" id="b"></div>');
    const ws = findByKind(r, NodeKind.AttributeWhitespace);
    expect(ws.length).toBeGreaterThanOrEqual(1);
  });

  it("handles blade echo in attribute value", () => {
    const r = parse('<div class="{{ $class }}"></div>');
    const echoes = findByKind(r, NodeKind.Echo);
    expect(echoes.length).toBeGreaterThanOrEqual(1);
  });

  it("handles raw echo in attribute value", () => {
    const r = parse('<div class="{!! $class !!}"></div>');
    const rawEchoes = findByKind(r, NodeKind.RawEcho);
    expect(rawEchoes.length).toBeGreaterThanOrEqual(1);
  });
});
describe("echoes", () => {
  it("parses echo", () => {
    const r = parse("{{ $name }}");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Echo);
  });

  it("parses raw echo", () => {
    const r = parse("{!! $html !!}");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.RawEcho);
  });

  it("parses triple echo", () => {
    const r = parse("{{{ $escaped }}}");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.TripleEcho);
  });

  it("echo mixed with text", () => {
    const r = parse("Hello {{ $name }}!");
    const children = rootChildren(r);
    expect(children.length).toBeGreaterThanOrEqual(2);
    const kinds = children.map((c) => c.kind);
    expect(kinds).toContain(NodeKind.Text);
    expect(kinds).toContain(NodeKind.Echo);
  });
});
describe("comments", () => {
  it("parses blade comment", () => {
    const r = parse("{{-- comment --}}");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.BladeComment);
  });

  it("parses HTML comment", () => {
    const r = parse("<!-- comment -->");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Comment);
  });
});
describe("doctype", () => {
  it("parses doctype", () => {
    const r = parse("<!DOCTYPE html>");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Doctype);
  });
});
describe("standalone directives", () => {
  it("parses @csrf", () => {
    const r = parse("@csrf");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Directive);
  });

  it("parses directive with args", () => {
    const r = parse("@method('PUT')");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Directive);
  });

  it("parses @include", () => {
    const r = parse("@include('partial')");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Directive);
  });
});
describe("escaped blade", () => {
  it("@@if becomes NonOutput", () => {
    const r = parse("@@if");
    const children = rootChildren(r);
    const nonOutput = children.find((c) => c.kind === NodeKind.NonOutput);
    expect(nonOutput).toBeDefined();
  });
});
describe("paired directives", () => {
  it("parses @foreach..@endforeach", () => {
    const r = parse("@foreach($items as $item) content @endforeach");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockIdx = indexOf(r, children[0]);
    const blockKids = childrenOf(r, blockIdx);
    const directives = blockKids.filter((n) => n.kind === NodeKind.Directive);
    // opening + closing = 2 directives
    expect(directives.length).toBeGreaterThanOrEqual(2);
  });

  it("parses @for..@endfor", () => {
    const r = parse("@for($i = 0; $i < 10; $i++){{ $i }}@endfor");
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);
  });

  it("parses @push..@endpush", () => {
    const r = parse("@push('scripts') content @endpush");
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);
  });

  it("content between paired directives is child of opening directive", () => {
    const r = parse("@foreach($items as $item) <li>{{ $item }}</li> @endforeach");
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);
  });
});
describe("condition directives", () => {
  it("parses @if..@endif", () => {
    const r = parse("@if($x) content @endif");
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);
  });

  it("parses @if..@else..@endif", () => {
    const r = parse("@if($x) yes @else no @endif");
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const blockIdx = indexOf(r, blocks[0]);
    const blockKids = childrenOf(r, blockIdx);
    const directives = blockKids.filter((n) => n.kind === NodeKind.Directive);
    // @if, @else, @endif = 3
    expect(directives.length).toBeGreaterThanOrEqual(3);
  });

  it("parses @if..@elseif..@else..@endif", () => {
    const r = parse("@if($a) A @elseif($b) B @else C @endif");
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const blockIdx = indexOf(r, blocks[0]);
    const blockKids = childrenOf(r, blockIdx);
    const directives = blockKids.filter((n) => n.kind === NodeKind.Directive);
    // @if, @elseif, @else, @endif = 4
    expect(directives.length).toBeGreaterThanOrEqual(4);
  });

  it("parses @unless..@endunless", () => {
    const r = parse("@unless($disabled) content @endunless");
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);
  });

  it("parses @isset..@endIsset", () => {
    const r = parse("@isset($record) content @endIsset");
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);
  });
});
describe("switch directives", () => {
  it("parses @switch..@case..@break..@endswitch", () => {
    const r = parse(
      "@switch($type) @case(1) one @break @case(2) two @break @default default @break @endswitch",
    );
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);
  });
});
describe("forelse", () => {
  it("parses @forelse..@empty..@endforelse", () => {
    const r = parse("@forelse($items as $item) {{ $item }} @empty No items @endforelse");
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);
  });
});
describe("nested directives", () => {
  it("handles @if inside @foreach", () => {
    const r = parse(
      "@foreach($items as $item) @if($item->active) {{ $item->name }} @endif @endforeach",
    );
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks.length).toBeGreaterThanOrEqual(2);
  });

  it("closing tag cannot cross directive boundary", () => {
    // <div> opened inside @if should not match </div> outside @if
    const r = parse("@if($x) <div> @endif</div>");
    const unpaired = findByKind(r, NodeKind.UnpairedClosingTag);
    expect(unpaired).toHaveLength(1);
  });
});
describe("verbatim", () => {
  it("parses @verbatim..@endverbatim as block", () => {
    const r = parse("@verbatim {{ $raw }} @endverbatim");
    const children = rootChildren(r);
    expect(children).toHaveLength(1);
    expect(children[0].kind).toBe(NodeKind.Verbatim);
  });
});
describe("php blocks", () => {
  it("parses @php..@endphp as block", () => {
    const r = parse("@php $x = 1; @endphp");
    const blocks = findByKind(r, NodeKind.PhpBlock);
    expect(blocks).toHaveLength(1);
  });

  it("orphan @endphp becomes directive", () => {
    const r = parse("@endphp");
    const directives = findByKind(r, NodeKind.Directive);
    expect(directives.length).toBeGreaterThanOrEqual(1);
  });
});
describe("conditional pairing", () => {
  it("@section with 2 args is standalone", () => {
    const r = parse("@section('title', 'My Page')");
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(0);
    const directives = findByKind(r, NodeKind.Directive);
    expect(directives.length).toBeGreaterThanOrEqual(1);
  });

  it("@section with 1 arg is paired when @endsection exists", () => {
    const r = parse("@section('sidebar') content @endsection");
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);
  });
});
describe("optional tag auto-closing", () => {
  it("auto-closes <li> when sibling <li> appears", () => {
    const r = parse("<ul><li>First<li>Second</ul>");
    const elements = findByKind(r, NodeKind.Element);
    // ul and two li elements
    expect(elements.length).toBeGreaterThanOrEqual(3);
    // Both <li> should be children of <ul>, not nested
    const ulIdx = indexOf(
      r,
      elements.find((e) => {
        const name = r.source.slice(
          r.tokens[e.tokenStart + 1].start,
          r.tokens[e.tokenStart + 1].end,
        );
        return name === "ul";
      })!,
    );
    const ulKids = childrenOf(r, ulIdx);
    const liElements = ulKids.filter((n) => n.kind === NodeKind.Element);
    expect(liElements.length).toBeGreaterThanOrEqual(2);
  });

  it("auto-closes <td> when sibling <td> appears", () => {
    const r = parse("<table><tr><td>A<td>B</tr></table>");
    const elements = findByKind(r, NodeKind.Element);
    expect(elements.length).toBeGreaterThanOrEqual(4);
  });

  it("auto-closes <p> when block element appears", () => {
    // <p> needs a parent element for sibling-only rules to apply
    const r = parse("<section><p>text<div>block</div></section>");
    const elements = findByKind(r, NodeKind.Element);
    expect(elements.length).toBeGreaterThanOrEqual(3);
    // <div> should NOT be child of <p>, both should be children of <section>
    const sectionEl = elements.find((e) => {
      const tIdx = e.tokenStart + 1;
      if (tIdx >= r.tokens.length) return false;
      return r.source.slice(r.tokens[tIdx].start, r.tokens[tIdx].end) === "section";
    });
    expect(sectionEl).toBeDefined();
    const sectionIdx = indexOf(r, sectionEl!);
    const sectionKids = childrenOf(r, sectionIdx);
    const childElements = sectionKids.filter((n) => n.kind === NodeKind.Element);
    // Both <p> and <div> should be direct children of <section>
    expect(childElements.length).toBeGreaterThanOrEqual(2);
  });
});
describe("unclosed elements", () => {
  it("extends tokenCount for unclosed elements at EOF", () => {
    const r = parse("<div>unclosed");
    const elements = findByKind(r, NodeKind.Element);
    expect(elements).toHaveLength(1);
    // tokenCount should extend to end
    expect(elements[0].tokenCount).toBeGreaterThan(0);
  });
});
describe("directive training", () => {
  it("discovers custom paired directives via train()", () => {
    const source = "@mycustom content @endmycustom";
    const { tokens } = tokenize(source);
    const directives = Directives.withDefaults();
    directives.train(tokens, source);

    const r = buildTree(tokens, source, directives);
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);
  });
});
describe("mixed template", () => {
  it("parses a realistic Blade template", () => {
    const source = `<!DOCTYPE html>
<html>
<head>
    <title>{{ $title }}</title>
</head>
<body>
    {{-- Navigation --}}
    <nav>
        @auth
            <a href="/dashboard">Dashboard</a>
        @else
            <a href="/login">Login</a>
        @endauth
    </nav>

    <main>
        @if($showContent)
            @foreach($items as $item)
                <div class="{{ $item->class }}">
                    {{ $item->name }}
                </div>
            @endforeach
        @endif
    </main>

    @csrf
    @include('footer')
</body>
</html>`;

    const r = parse(source);

    // Should have a root with children
    expect(r.nodes[0].kind).toBe(NodeKind.Root);
    expect(r.nodes[0].firstChild).not.toBe(NONE);

    // Should contain various node types
    const doctypes = findByKind(r, NodeKind.Doctype);
    expect(doctypes.length).toBeGreaterThanOrEqual(1);

    const elements = findByKind(r, NodeKind.Element);
    expect(elements.length).toBeGreaterThanOrEqual(5);

    const echoes = findByKind(r, NodeKind.Echo);
    expect(echoes.length).toBeGreaterThanOrEqual(2);

    const comments = findByKind(r, NodeKind.BladeComment);
    expect(comments.length).toBeGreaterThanOrEqual(1);

    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks.length).toBeGreaterThanOrEqual(2);

    const standaloneDirectives = findByKind(r, NodeKind.Directive);
    expect(standaloneDirectives.length).toBeGreaterThanOrEqual(2);
  });
});
describe("depth limits", () => {
  it("throws on excessive element nesting", () => {
    const deep = "<div>".repeat(600);
    expect(() => parse(deep)).toThrow(/depth/i);
  });
});
