import { describe, it, expect } from "vitest";
import { NodeKind } from "../../src/tree/types.js";
import {
  parse,
  rootChildren,
  childrenOf,
  indexOf,
  renderDocument,
  getDirectiveName,
  getDirectiveArgs,
} from "./helpers.js";

describe("Switch Directive", () => {
  it("parses switch statement structure", () => {
    const source = `@switch($i)
    @case(1)
        First case...
        @break

    @case(2)
        Second case...
        @break

    @default
        Default case...
@endswitch`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    expect(blockChildren).toHaveLength(2);

    const switchDirective = blockChildren[0];
    expect(switchDirective.kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, switchDirective)).toBe("switch");
    expect(getDirectiveArgs(r, switchDirective)).toBe("($i)");

    const endSwitch = blockChildren[1];
    expect(endSwitch.kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, endSwitch)).toBe("endswitch");
    expect(getDirectiveArgs(r, endSwitch)).toBeNull();

    // Switch directive children: text, case(1), case(2), default
    const switchChildren = childrenOf(r, indexOf(r, switchDirective));
    expect(switchChildren).toHaveLength(4);

    // First case
    const case1 = switchChildren[1];
    expect(case1.kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, case1)).toBe("case");
    expect(getDirectiveArgs(r, case1)).toBe("(1)");

    const case1Children = childrenOf(r, indexOf(r, case1));
    expect(case1Children).toHaveLength(3); // text, @break, text
    expect(case1Children[1].kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, case1Children[1])).toBe("break");

    // Second case
    const case2 = switchChildren[2];
    expect(case2.kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, case2)).toBe("case");
    expect(getDirectiveArgs(r, case2)).toBe("(2)");

    // Default
    const defaultCase = switchChildren[3];
    expect(defaultCase.kind).toBe(NodeKind.Directive);
    expect(getDirectiveName(r, defaultCase)).toBe("default");
    expect(getDirectiveArgs(r, defaultCase)).toBeNull();

    const defaultChildren = childrenOf(r, indexOf(r, defaultCase));
    expect(defaultChildren).toHaveLength(1);
    expect(defaultChildren[0].kind).toBe(NodeKind.Text);

    expect(renderDocument(r)).toBe(source);
  });

  it("parses nested switch statements", () => {
    const source = `@switch($i)
    @case(1)
        First case...
            @switch($i)
                @case(1)
                    Nested First case...
                    @break

                @case(2)
                    Nested Second case...
                    @break

                @default
                    Nested Default case...

                    @switch($i)
                        @case(1)
                            Nested Two First case...
                            @break

                        @case(2)
                            Nested Two Second case...
                            @break

                        @default
                            Nested Two Default case...
                    @endswitch
            @endswitch
        @break

    @case(2)
        Second case...
        @break

    @default
        Default case...
@endswitch`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    expect(blockChildren).toHaveLength(2);
    expect(getDirectiveName(r, blockChildren[0])).toBe("switch");
    expect(getDirectiveName(r, blockChildren[1])).toBe("endswitch");

    expect(renderDocument(r)).toBe(source);
  });

  it("basic switch with single case has structure", () => {
    const source = `@switch($value)
    @case(1)
        First case
        @break
@endswitch`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    const directives = blockChildren.filter((c) => c.kind === NodeKind.Directive);
    expect(getDirectiveName(r, directives[0])).toBe("switch");
    expect(getDirectiveName(r, directives[directives.length - 1])).toBe("endswitch");

    expect(renderDocument(r)).toBe(source);
  });

  it("handles switch with multiple cases", () => {
    const source = `@switch($type)
    @case('admin')
        Admin view
        @break
    @case('user')
        User view
        @break
@endswitch`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);
    expect(renderDocument(r)).toBe(source);
  });

  it("switch with default case", () => {
    const source = `@switch($status)
    @case('active')
        Active
        @break
    @default
        Default value
@endswitch`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);
    expect(renderDocument(r)).toBe(source);
  });

  it("switch with only default case", () => {
    const source = `@switch($value)
    @default
        Default only
@endswitch`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);
    expect(renderDocument(r)).toBe(source);
  });

  it("switch without any cases", () => {
    const source = `@switch($value)
@endswitch`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);
    expect(renderDocument(r)).toBe(source);
  });

  it("switch with blade expressions in cases", () => {
    const source = `@switch($user->role)
    @case('admin')
        Hello {{ $user->name }}
        @break
    @case('guest')
        Welcome, guest!
        @break
@endswitch`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);
    expect(renderDocument(r)).toBe(source);
  });

  it("switch with nested HTML", () => {
    const source = `@switch($layout)
    @case('grid')
        <div class="grid">Content</div>
        @break
    @case('list')
        <ul><li>Item</li></ul>
        @break
@endswitch`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles switch with multiple statements in case", () => {
    const source = `@switch($value)
    @case(1)
        First line
        Second line
        {{ $variable }}
        @break
@endswitch`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);
    expect(renderDocument(r)).toBe(source);
  });

  it("switch with complex expressions", () => {
    const source = `@switch(getType($item))
    @case($item->getType())
        Complex case
        @break
@endswitch`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);
    expect(renderDocument(r)).toBe(source);
  });

  it("switch with all features combined", () => {
    const source = `@switch($priority)
    @case('high')
        <span class="badge-red">{{ $title }}</span>
        @break
    @case('medium')
        <span class="badge-yellow">{{ $title }}</span>
        @break
    @case('low')
        <span class="badge-green">{{ $title }}</span>
        @break
    @default
        <span class="badge-gray">{{ $title }}</span>
@endswitch`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].kind).toBe(NodeKind.DirectiveBlock);

    const blockChildren = childrenOf(r, indexOf(r, nodes[0]));
    expect(blockChildren).toHaveLength(2);
    expect(getDirectiveName(r, blockChildren[0])).toBe("switch");
    expect(getDirectiveName(r, blockChildren[1])).toBe("endswitch");

    expect(renderDocument(r)).toBe(source);
  });

  it("leading whitespace between @switch and first @case", () => {
    const source = `@switch($value)
    @case(1)
        First case
        @break
@endswitch`;
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("no leading content (case immediately after @switch)", () => {
    const source = `@switch($value)
@case(1)
First case
@break
@endswitch`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(renderDocument(r)).toBe(source);
  });

  it("leading content with nested switch structures", () => {
    const source = `@switch($outer)
    Outer leading text
    @case(1)
        @switch($inner)
            Inner leading text
            @case('a')
                Inner case content
                @break
        @endswitch
        @break
@endswitch`;
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(renderDocument(r)).toBe(source);
  });
});
