import { describe, it } from "vitest";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { formatEqual } from "../helpers.js";

describe("php/shorthand-tags", () => {
  it("indents html and echo content inside php shorthand if branches", async () => {
    const input = `<?php if ($loading): ?>
<div class="absolute inset-0"></div>
<?php elseif ($iconLeading): ?>
{{ $iconLeading }}
<?php else: ?>
<span>{{ $slot }}</span>
<?php endif; ?>
`;

    const expected = `<?php if ($loading): ?>
  <div class="absolute inset-0"></div>
<?php elseif ($iconLeading): ?>
  {{ $iconLeading }}
<?php else: ?>
  <span>{{ $slot }}</span>
<?php endif; ?>
`;

    await formatEqual(input, expected);
  });

  it("preserves nesting indentation when shorthand php tags are inside elements", async () => {
    const input = `<div>
<?php if ($loading): ?>
<span>{{ $slot }}</span>
<?php endif; ?>
</div>
`;

    const expected = `<div>
  <?php if ($loading): ?>
    <span>{{ $slot }}</span>
  <?php endif; ?>
</div>
`;

    await formatEqual(input, expected);
  });

  it("supports shorthand foreach / endforeach indentation", async () => {
    const input = `<?php foreach ($items as $item): ?>
<span>{{ $item }}</span>
<?php endforeach; ?>
`;

    const expected = `<?php foreach ($items as $item): ?>
  <span>{{ $item }}</span>
<?php endforeach; ?>
`;

    await formatEqual(input, expected);
  });

  it("supports shorthand for/endfor and while/endwhile indentation", async () => {
    const input = `<?php for ($i = 0; $i < 2; $i++): ?>
<span>{{ $i }}</span>
<?php endfor; ?>

<?php while ($ready): ?>
<div>Ready</div>
<?php endwhile; ?>
`;

    const expected = `<?php for ($i = 0; $i < 2; $i++): ?>
  <span>{{ $i }}</span>
<?php endfor; ?>

<?php while ($ready): ?>
  <div>Ready</div>
<?php endwhile; ?>
`;

    await formatEqual(input, expected);
  });

  it("supports shorthand declare/enddeclare indentation", async () => {
    const input = `<?php declare(strict_types=1): ?>
<div>Body</div>
<?php enddeclare; ?>
`;

    const expected = `<?php declare(strict_types=1): ?>
  <div>Body</div>
<?php enddeclare; ?>
`;

    await formatEqual(input, expected);
  });

  it("does not inject whitespace between switch opener and first case", async () => {
    const input = `<?php switch ($status): ?><?php case 1: ?>
<span>One</span>
<?php default: ?>
<span>Other</span>
<?php endswitch; ?>
`;

    const expected = `<?php switch ($status): ?><?php case 1: ?>
  <span>One</span>
<?php default: ?>
  <span>Other</span>
<?php endswitch; ?>
`;

    await formatEqual(input, expected);
  });

  it("keeps shorthand branch indentation stable when php formatting is enabled", async () => {
    const input = `<?php if($loading&&$ready):?>
<div>Ready</div>
<?php else:?>
<div>Wait</div>
<?php endif;?>
`;

    const expected = `<?php if($loading&&$ready):?>
  <div>Ready</div>
<?php else:?>
  <div>Wait</div>
<?php endif;?>
`;

    await formatEqual(input, expected, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
    });
  });
});
