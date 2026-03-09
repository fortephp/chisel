import { describe, expect, it } from "vitest";
import { NodeKind } from "../../src/tree/types.js";
import { parse, childrenOf, findByKind, indexOf, nodeText } from "./helpers.js";

function phpTagBranches(result: ReturnType<typeof parse>) {
  const blocks = findByKind(result, NodeKind.DirectiveBlock);
  if (blocks.length === 0) return [];

  return childrenOf(result, indexOf(result, blocks[0])).filter(
    (node) => node.kind === NodeKind.PhpTag,
  );
}

describe("parser/php-tag-shorthand", () => {
  it("builds a branch block for php shorthand if/elseif/else/endif tags", () => {
    const source = `<?php if ($loading): ?>
<div>One</div>
<?php elseif ($ready): ?>
{{ $slot }}
<?php else: ?>
<span>Fallback</span>
<?php endif; ?>`;

    const result = parse(source);
    const branches = phpTagBranches(result);

    expect(findByKind(result, NodeKind.DirectiveBlock)).toHaveLength(1);
    expect(branches).toHaveLength(4);
    expect(nodeText(result, branches[0])).toContain("<?php if ($loading): ?>");
    expect(nodeText(result, branches[1])).toContain("<?php elseif ($ready): ?>");
    expect(nodeText(result, branches[2])).toContain("<?php else: ?>");
    expect(nodeText(result, branches[3])).toContain("<?php endif; ?>");
  });

  it("keeps non-shorthand php tags as standalone PhpTag nodes", () => {
    const source = `<?php $x = 1; ?>
<div>Ok</div>
`;
    const result = parse(source);

    expect(findByKind(result, NodeKind.DirectiveBlock)).toHaveLength(0);
    expect(findByKind(result, NodeKind.PhpTag)).toHaveLength(1);
  });

  it("builds a branch block for php shorthand switch/case/default/endswitch tags", () => {
    const source = `<?php switch ($status): ?><?php case 1: ?>
<span>One</span>
<?php default: ?>
<span>Other</span>
<?php endswitch; ?>`;

    const result = parse(source);
    const branches = phpTagBranches(result);

    expect(findByKind(result, NodeKind.DirectiveBlock)).toHaveLength(1);
    expect(branches).toHaveLength(4);
    expect(nodeText(result, branches[0])).toContain("<?php switch ($status): ?>");
    expect(nodeText(result, branches[1])).toContain("<?php case 1: ?>");
    expect(nodeText(result, branches[2])).toContain("<?php default: ?>");
    expect(nodeText(result, branches[3])).toContain("<?php endswitch; ?>");
  });

  it("builds a block for php shorthand declare/enddeclare tags", () => {
    const source = `<?php declare(strict_types=1): ?>
<div>Body</div>
<?php enddeclare; ?>`;

    const result = parse(source);
    const branches = phpTagBranches(result);

    expect(findByKind(result, NodeKind.DirectiveBlock)).toHaveLength(1);
    expect(branches).toHaveLength(2);
    expect(nodeText(result, branches[0])).toContain("<?php declare(strict_types=1): ?>");
    expect(nodeText(result, branches[1])).toContain("<?php enddeclare; ?>");
  });
});
