import { describe, it, expect } from "vitest";
import { tokenize } from "../../src/lexer/lexer.js";
import { buildTree } from "../../src/tree/tree-builder.js";
import { Directives } from "../../src/tree/directives.js";
import { NodeKind, type BuildResult } from "../../src/tree/types.js";
import {
  parse,
  rootChildren,
  childrenOf,
  findByKind,
  indexOf,
  renderDocument,
  getDirectiveName,
} from "./helpers.js";
function parseWithTraining(source: string): BuildResult {
  const { tokens } = tokenize(source);
  const directives = Directives.withDefaults();
  directives.train(tokens, source);
  return buildTree(tokens, source, directives);
}

function parseWithHint(hintSource: string, targetSource: string): BuildResult {
  const directives = Directives.withDefaults();
  const { tokens: hintTokens } = tokenize(hintSource);
  directives.train(hintTokens, hintSource);
  const { tokens } = tokenize(targetSource);
  return buildTree(tokens, targetSource, directives);
}

function blockDirectives(
  r: BuildResult,
  blockNode: { kind: number },
): ReturnType<typeof childrenOf> {
  return childrenOf(r, indexOf(r, blockNode)).filter((c) => c.kind === NodeKind.Directive);
}
describe("Built-in condition pairing completeness", () => {
  it("pairs @auth/@elseauth/@endauth", () => {
    const source = "@auth('admin') Admin panel @elseauth Guest view @endauth";
    const r = parse(source);
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(3);
    expect(getDirectiveName(r, directives[0])).toBe("auth");
    expect(getDirectiveName(r, directives[1])).toBe("elseauth");
    expect(getDirectiveName(r, directives[2])).toBe("endauth");
    expect(renderDocument(r)).toBe(source);
  });

  it("pairs @auth/@else/@endauth", () => {
    const source = "@auth Logged in @else Guest @endauth";
    const r = parse(source);
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(3);
    expect(getDirectiveName(r, directives[0])).toBe("auth");
    expect(getDirectiveName(r, directives[1])).toBe("else");
    expect(getDirectiveName(r, directives[2])).toBe("endauth");
    expect(renderDocument(r)).toBe(source);
  });

  it("pairs @can/@elsecan/@else/@endcan", () => {
    const source = '@can("edit", $post) Edit @elsecan("view", $post) View @else Nothing @endcan';
    const r = parse(source);
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(4);
    expect(getDirectiveName(r, directives[0])).toBe("can");
    expect(getDirectiveName(r, directives[1])).toBe("elsecan");
    expect(getDirectiveName(r, directives[2])).toBe("else");
    expect(getDirectiveName(r, directives[3])).toBe("endcan");
    expect(renderDocument(r)).toBe(source);
  });

  it("pairs @guest/@elseguest/@endguest", () => {
    const source = "@guest Please login @elseguest('admin') Admin guest @endguest";
    const r = parse(source);
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(3);
    expect(getDirectiveName(r, directives[0])).toBe("guest");
    expect(getDirectiveName(r, directives[1])).toBe("elseguest");
    expect(getDirectiveName(r, directives[2])).toBe("endguest");
    expect(renderDocument(r)).toBe(source);
  });

  it("pairs @env/@elseenv/@endenv", () => {
    const source = "@env('local') Debug info @elseenv('staging') Staging @endenv";
    const r = parse(source);
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(3);
    expect(getDirectiveName(r, directives[0])).toBe("env");
    expect(getDirectiveName(r, directives[1])).toBe("elseenv");
    expect(getDirectiveName(r, directives[2])).toBe("endenv");
    expect(renderDocument(r)).toBe(source);
  });

  it("pairs @production/@elseproduction/@endproduction (no-arg condition)", () => {
    const source = "@production Minified @elseproduction Dev build @endproduction";
    const r = parse(source);
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(3);
    expect(getDirectiveName(r, directives[0])).toBe("production");
    expect(getDirectiveName(r, directives[1])).toBe("elseproduction");
    expect(getDirectiveName(r, directives[2])).toBe("endproduction");
    expect(renderDocument(r)).toBe(source);
  });

  it("pairs @isset with @elseif branch and @endIsset closer", () => {
    const source = "@isset($record) Found @elseif($fallback) Fallback @endIsset";
    const r = parse(source);
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(3);
    expect(getDirectiveName(r, directives[0])).toBe("isset");
    expect(getDirectiveName(r, directives[1])).toBe("elseif");
    expect(getDirectiveName(r, directives[2])).toBe("endisset");
    expect(renderDocument(r)).toBe(source);
  });

  it("pairs @pushIf/@endPushIf", () => {
    const source = "@pushIf($shouldPush, 'scripts') <script src=\"app.js\"></script> @endPushIf";
    const r = parse(source);
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(2);
    expect(getDirectiveName(r, directives[0])).toBe("pushif");
    expect(getDirectiveName(r, directives[1])).toBe("endpushif");
    expect(renderDocument(r)).toBe(source);
  });
});
describe("Custom directive training — condition pattern", () => {
  it("discovers @disk/@elsedisk/@enddisk as a condition via training", () => {
    const source = "@disk('local') Local storage @elsedisk Global storage @enddisk";
    const r = parseWithTraining(source);

    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(3);
    expect(getDirectiveName(r, directives[0])).toBe("disk");
    expect(getDirectiveName(r, directives[1])).toBe("elsedisk");
    expect(getDirectiveName(r, directives[2])).toBe("enddisk");

    // disk and elsedisk should have text children
    expect(childrenOf(r, indexOf(r, directives[0])).length).toBeGreaterThan(0);
    expect(childrenOf(r, indexOf(r, directives[1])).length).toBeGreaterThan(0);
    // enddisk should have no children
    expect(childrenOf(r, indexOf(r, directives[2]))).toHaveLength(0);

    expect(renderDocument(r)).toBe(source);
  });

  it("registers @disk as a condition after training", () => {
    const source = "@disk('local') A @elsedisk B @enddisk";
    const { tokens } = tokenize(source);
    const directives = Directives.withDefaults();
    directives.train(tokens, source);

    expect(directives.isCondition("disk")).toBe(true);
    expect(directives.getTerminators("disk")).toContain("enddisk");
    expect(directives.getTerminators("disk")).toContain("elsedisk");
  });

  it("trains multiple custom conditions simultaneously", () => {
    const source = "@disk('local') A @elsedisk B @enddisk @cache('key') C @elsecache D @endcache";
    const r = parseWithTraining(source);

    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(2);

    const diskDirectives = blockDirectives(r, blocks[0]);
    expect(getDirectiveName(r, diskDirectives[0])).toBe("disk");
    expect(getDirectiveName(r, diskDirectives[2])).toBe("enddisk");

    const cacheDirectives = blockDirectives(r, blocks[1]);
    expect(getDirectiveName(r, cacheDirectives[0])).toBe("cache");
    expect(getDirectiveName(r, cacheDirectives[2])).toBe("endcache");

    expect(renderDocument(r)).toBe(source);
  });

  it("does not corrupt existing built-in conditions during training", () => {
    const source = "@if($a) A @elseif($b) B @endif";

    // Parse with training (should not change @if behavior)
    const r = parseWithTraining(source);
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(3);
    expect(getDirectiveName(r, directives[0])).toBe("if");
    expect(getDirectiveName(r, directives[1])).toBe("elseif");
    expect(getDirectiveName(r, directives[2])).toBe("endif");

    // Compare with non-trained parse
    const r2 = parse(source);
    const blocks2 = findByKind(r2, NodeKind.DirectiveBlock);
    expect(blocks2).toHaveLength(1);
    expect(blockDirectives(r2, blocks2[0])).toHaveLength(3);
  });
});
describe("Custom directive training — pair pattern", () => {
  it("discovers @widget/@endwidget as a paired directive", () => {
    const source = "@widget Content inside @endwidget";
    const r = parseWithTraining(source);

    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(2);
    expect(getDirectiveName(r, directives[0])).toBe("widget");
    expect(getDirectiveName(r, directives[1])).toBe("endwidget");

    expect(renderDocument(r)).toBe(source);
  });

  it("registers pair from @endfoo even without @foo token in source", () => {
    const source = "@endwidget";
    const { tokens } = tokenize(source);
    const directives = Directives.withDefaults();
    directives.train(tokens, source);

    // Training still registers the pair (since @widget is not already registered)
    expect(directives.isPaired("widget")).toBe(true);

    // But since there's no @widget opener, @endwidget is standalone
    const r = buildTree(tokens, source, directives);
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(0);
  });

  it("does not overwrite built-in pairs during training", () => {
    const source = "@foreach($items as $item) {{ $item }} @endforeach";
    const r = parseWithTraining(source);

    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(2);
    expect(getDirectiveName(r, directives[0])).toBe("foreach");
    expect(getDirectiveName(r, directives[1])).toBe("endforeach");
    expect(renderDocument(r)).toBe(source);
  });
});
describe("Mixed custom/built-in terminators", () => {
  it("@disk with @elseif branch and @endif closer", () => {
    // Train on hint with @elsedisk to register @disk as condition,
    // then parse source using built-in @elseif/@endif terminators.
    const r = parseWithHint(
      "@disk @elsedisk",
      "@disk('local') Local storage @elseif($other) Other @endif",
    );

    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(3);
    expect(getDirectiveName(r, directives[0])).toBe("disk");
    expect(getDirectiveName(r, directives[1])).toBe("elseif");
    expect(getDirectiveName(r, directives[2])).toBe("endif");
  });

  it("@disk with @else branch and @endif closer", () => {
    const r = parseWithHint("@disk @elsedisk", "@disk('s3') S3 storage @else Fallback @endif");

    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(3);
    expect(getDirectiveName(r, directives[0])).toBe("disk");
    expect(getDirectiveName(r, directives[1])).toBe("else");
    expect(getDirectiveName(r, directives[2])).toBe("endif");
  });

  it("@disk with @elsedisk branch and @endif closer", () => {
    const source = "@disk('local') Local @elsedisk Global @endif";
    const r = parseWithTraining(source);

    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(3);
    expect(getDirectiveName(r, directives[0])).toBe("disk");
    expect(getDirectiveName(r, directives[1])).toBe("elsedisk");
    expect(getDirectiveName(r, directives[2])).toBe("endif");
  });

  it("@disk with @else and @enddisk keeps a single block without opening stray @else blocks", () => {
    const source = "@disk('s3') Content @else Fallback @enddisk";
    const r = parseWithTraining(source);

    // Training only sees @enddisk (no @elsedisk), so Pattern 2 triggers:
    // @enddisk → addPairedDirective("disk", "enddisk") — a PAIR, not a condition.
    // @else must remain inside the @disk body and must not open an unrelated
    // fallback block.
    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const diskDirectives = blockDirectives(r, blocks[0]);
    expect(getDirectiveName(r, diskDirectives[0])).toBe("disk");
    expect(getDirectiveName(r, diskDirectives[1])).toBe("enddisk");
  });

  it("@disk with @else and @enddisk when trained as condition", () => {
    // When trained as a condition (via @elsedisk hint), @else + @enddisk work
    const r = parseWithHint("@disk @elsedisk", "@disk('s3') Content @else Fallback @enddisk");

    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(3);
    expect(getDirectiveName(r, directives[0])).toBe("disk");
    expect(getDirectiveName(r, directives[1])).toBe("else");
    expect(getDirectiveName(r, directives[2])).toBe("enddisk");
  });
});
describe("Cross-condition termination", () => {
  it("@auth closed by @endif", () => {
    const source = "@auth Content @endif";
    const r = parse(source);

    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(2);
    expect(getDirectiveName(r, directives[0])).toBe("auth");
    expect(getDirectiveName(r, directives[1])).toBe("endif");
    expect(renderDocument(r)).toBe(source);
  });

  it("@unless with @elsecan branch and @endauth closer", () => {
    const source = '@unless($banned) Allowed @elsecan("admin") Admin @endauth';
    const r = parse(source);

    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(3);
    expect(getDirectiveName(r, directives[0])).toBe("unless");
    expect(getDirectiveName(r, directives[1])).toBe("elsecan");
    expect(getDirectiveName(r, directives[2])).toBe("endauth");
    expect(renderDocument(r)).toBe(source);
  });

  it("@can with @elseif branch", () => {
    const source = '@can("edit", $post) Edit @elseif($fallback) Fallback @endcan';
    const r = parse(source);

    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(3);
    expect(getDirectiveName(r, directives[0])).toBe("can");
    expect(getDirectiveName(r, directives[1])).toBe("elseif");
    expect(getDirectiveName(r, directives[2])).toBe("endcan");
    expect(renderDocument(r)).toBe(source);
  });

  it("nested conditions with cross-termination", () => {
    const source = "@if($a) Outer @auth Inner @endunless Back @endif";
    const r = parse(source);
    const nodes = rootChildren(r);

    // Outer @if block
    const outerBlocks = nodes.filter((n) => n.kind === NodeKind.DirectiveBlock);
    expect(outerBlocks).toHaveLength(1);

    const outerDirectives = blockDirectives(r, outerBlocks[0]);
    expect(getDirectiveName(r, outerDirectives[0])).toBe("if");
    expect(getDirectiveName(r, outerDirectives[outerDirectives.length - 1])).toBe("endif");

    // Inner @auth block closed by @endunless should be nested inside @if's content
    const ifChildren = childrenOf(r, indexOf(r, outerDirectives[0]));
    const innerBlocks = ifChildren.filter((n) => n.kind === NodeKind.DirectiveBlock);
    expect(innerBlocks).toHaveLength(1);

    const innerDirectives = blockDirectives(r, innerBlocks[0]);
    expect(getDirectiveName(r, innerDirectives[0])).toBe("auth");
    expect(getDirectiveName(r, innerDirectives[innerDirectives.length - 1])).toBe("endunless");

    expect(renderDocument(r)).toBe(source);
  });
});
describe("Nested custom + built-in conditions", () => {
  it("custom @disk inside @if", () => {
    const r = parseWithHint("@disk @elsedisk", "@if($show) @disk('local') Local @enddisk @endif");

    const outerBlocks = rootChildren(r).filter((n) => n.kind === NodeKind.DirectiveBlock);
    expect(outerBlocks).toHaveLength(1);

    const outerDirectives = blockDirectives(r, outerBlocks[0]);
    expect(getDirectiveName(r, outerDirectives[0])).toBe("if");
    expect(getDirectiveName(r, outerDirectives[outerDirectives.length - 1])).toBe("endif");

    // @disk block nested inside @if
    const ifChildren = childrenOf(r, indexOf(r, outerDirectives[0]));
    const innerBlocks = ifChildren.filter((n) => n.kind === NodeKind.DirectiveBlock);
    expect(innerBlocks).toHaveLength(1);

    const innerDirectives = blockDirectives(r, innerBlocks[0]);
    expect(getDirectiveName(r, innerDirectives[0])).toBe("disk");
    expect(getDirectiveName(r, innerDirectives[innerDirectives.length - 1])).toBe("enddisk");
  });

  it("@if inside custom @disk", () => {
    const r = parseWithHint(
      "@disk @elsedisk",
      "@disk('local') @if($debug) Debug @endif Storage @enddisk",
    );

    const outerBlocks = rootChildren(r).filter((n) => n.kind === NodeKind.DirectiveBlock);
    expect(outerBlocks).toHaveLength(1);

    const outerDirectives = blockDirectives(r, outerBlocks[0]);
    expect(getDirectiveName(r, outerDirectives[0])).toBe("disk");
    expect(getDirectiveName(r, outerDirectives[outerDirectives.length - 1])).toBe("enddisk");

    // @if block nested inside @disk
    const diskChildren = childrenOf(r, indexOf(r, outerDirectives[0]));
    const innerBlocks = diskChildren.filter((n) => n.kind === NodeKind.DirectiveBlock);
    expect(innerBlocks).toHaveLength(1);

    const innerDirectives = blockDirectives(r, innerBlocks[0]);
    expect(getDirectiveName(r, innerDirectives[0])).toBe("if");
    expect(getDirectiveName(r, innerDirectives[innerDirectives.length - 1])).toBe("endif");
  });

  it("@disk with branches nested inside @if with branches", () => {
    const source = `@if($a)
    @disk('local')
        Local content
    @elsedisk
        Fallback content
    @enddisk
@else
    No disk needed
@endif`;
    const r = parseWithTraining(source);

    const outerBlocks = rootChildren(r).filter((n) => n.kind === NodeKind.DirectiveBlock);
    expect(outerBlocks).toHaveLength(1);

    const outerDirectives = blockDirectives(r, outerBlocks[0]);
    expect(getDirectiveName(r, outerDirectives[0])).toBe("if");
    expect(getDirectiveName(r, outerDirectives[outerDirectives.length - 1])).toBe("endif");

    // @disk block should be inside the @if branch
    const ifChildren = childrenOf(r, indexOf(r, outerDirectives[0]));
    const innerBlocks = ifChildren.filter((n) => n.kind === NodeKind.DirectiveBlock);
    expect(innerBlocks).toHaveLength(1);

    const diskDirectives = blockDirectives(r, innerBlocks[0]);
    expect(getDirectiveName(r, diskDirectives[0])).toBe("disk");
    expect(getDirectiveName(r, diskDirectives[1])).toBe("elsedisk");
    expect(getDirectiveName(r, diskDirectives[2])).toBe("enddisk");

    expect(renderDocument(r)).toBe(source);
  });

  it("three levels: @if > @disk > @auth", () => {
    const r = parseWithHint(
      "@disk @elsedisk",
      "@if($a) @disk('s3') @auth Admin @endauth Storage @enddisk Outer @endif",
    );

    // Outermost: @if block
    const outerBlocks = rootChildren(r).filter((n) => n.kind === NodeKind.DirectiveBlock);
    expect(outerBlocks).toHaveLength(1);
    expect(getDirectiveName(r, blockDirectives(r, outerBlocks[0])[0])).toBe("if");

    // Middle: @disk block inside @if
    const ifChildren = childrenOf(r, indexOf(r, blockDirectives(r, outerBlocks[0])[0]));
    const midBlocks = ifChildren.filter((n) => n.kind === NodeKind.DirectiveBlock);
    expect(midBlocks).toHaveLength(1);
    expect(getDirectiveName(r, blockDirectives(r, midBlocks[0])[0])).toBe("disk");

    // Innermost: @auth block inside @disk
    const diskChildren = childrenOf(r, indexOf(r, blockDirectives(r, midBlocks[0])[0]));
    const innerBlocks = diskChildren.filter((n) => n.kind === NodeKind.DirectiveBlock);
    expect(innerBlocks).toHaveLength(1);
    expect(getDirectiveName(r, blockDirectives(r, innerBlocks[0])[0])).toBe("auth");
  });
});
describe("Training gap edge cases", () => {
  it("@disk with only built-in branches is NOT detected as condition", () => {
    // When only @disk + @elseif + @endif appear (no @elsedisk or @enddisk),
    // training cannot detect @disk as a condition. This is a known limitation.
    const source = "@disk('local') Content @elseif($other) Other @endif";
    const { tokens } = tokenize(source);
    const directives = Directives.withDefaults();
    directives.train(tokens, source);

    // @disk is not recognized as a condition
    expect(directives.isCondition("disk")).toBe(false);
  });

  it("@disk works correctly when pre-trained as condition", () => {
    // Same source as above, but with @disk pre-trained via hint.
    // Proves the gap is purely a detection issue — the system handles it
    // correctly once the directive is registered.
    const r = parseWithHint(
      "@disk @elsedisk",
      "@disk('local') Content @elseif($other) Other @endif",
    );

    const blocks = findByKind(r, NodeKind.DirectiveBlock);
    expect(blocks).toHaveLength(1);

    const directives = blockDirectives(r, blocks[0]);
    expect(directives).toHaveLength(3);
    expect(getDirectiveName(r, directives[0])).toBe("disk");
    expect(getDirectiveName(r, directives[1])).toBe("elseif");
    expect(getDirectiveName(r, directives[2])).toBe("endif");
  });
});
