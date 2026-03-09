import { describe, it } from "vitest";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { formatEqual } from "../helpers.js";

const withPhp = {
  plugins: [bladePlugin, phpPlugin],
};

describe("php/blocks", () => {
  it("keeps @php blocks unchanged when bladePhpFormatting is off", async () => {
    const input = "@php $x=1+2; @endphp\n";
    const expected = "@php $x=1+2; @endphp\n";

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "off",
    });
  });

  it("formats @php blocks in safe mode", async () => {
    const input = "@php $x=1+2; @endphp\n";
    const expected = "@php $x = 1 + 2; @endphp\n";

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });

  it("formats @php blocks in aggressive mode", async () => {
    const input = "@php $x=1+2; @endphp\n";
    const expected = "@php $x = 1 + 2; @endphp\n";

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "aggressive",
    });
  });

  it("formats multiline @php blocks in safe and aggressive modes", async () => {
    const input = "@php\n$x=1+2;\nif($x){$y=$x*3;}\n@endphp\n";
    const expected =
      "@php\n  $x = 1 + 2;\n  if ($x) {\n    $y = $x * 3;\n  }\n@endphp\n";

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "aggressive",
    });
  });

  it("indents multiline @php blocks correctly inside HTML", async () => {
    const input = "<div>\n@php\nif($x){$y=2;}\n@endphp\n</div>\n";
    const expected =
      "<div>\n  @php\n    if ($x) {\n      $y = 2;\n    }\n  @endphp\n</div>\n";

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });

  it("indents multiline <?php ?> tags correctly inside HTML", async () => {
    const input = "<div>\n<?php if($x){$y=2;} ?>\n</div>\n";
    const expected = "<div>\n  <?php if ($x) {\n    $y = 2;\n  } ?>\n</div>\n";

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });

  it("normalizes PHPDoc indentation in root @php blocks", async () => {
    const input = `@php
    /**
    * @deprecated Override \`logo.blade.php\` instead.
    */
@endphp
`;
    const expected = `@php
  /**
   * @deprecated Override \`logo.blade.php\` instead.
   */
@endphp
`;

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });

  it("normalizes PHPDoc indentation in nested @php blocks", async () => {
    const input = `<div>
@php
/**
* @deprecated Override \`logo.blade.php\` instead.
*/
$x=1+2;
@endphp
</div>
`;
    const expected = `<div>
  @php
    /**
     * @deprecated Override \`logo.blade.php\` instead.
     */
    $x = 1 + 2;
  @endphp
</div>
`;

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });

  it("formats HEREDOC in @php blocks with block-relative indentation", async () => {
    const input = `@php
$template=<<<HTML
<section>
  <p>Hello</p>
</section>
HTML;
@endphp
`;
    const expected = `@php
  $template = <<<HTML
<section>
  <p>Hello</p>
</section>
HTML;
@endphp
`;

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });

  it("formats NOWDOC in @php blocks with block-relative indentation", async () => {
    const input = `@php
$template=<<<'HTML'
<section>
  <p>Hello</p>
</section>
HTML;
@endphp
`;
    const expected = `@php
  $template = <<<'HTML'
<section>
  <p>Hello</p>
</section>
HTML;
@endphp
`;

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });

  it("formats HEREDOC in <?php ?> tags", async () => {
    const input = `<?php
$template=<<<HTML
<section>
  <p>Hello</p>
</section>
HTML;
?>
`;
    const expected = `<?php
$template = <<<HTML
<section>
  <p>Hello</p>
</section>
HTML;
?>
`;

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });

  it("formats NOWDOC in <?php ?> tags", async () => {
    const input = `<?php
$template=<<<'HTML'
<section>
  <p>Hello</p>
</section>
HTML;
?>
`;
    const expected = `<?php
$template = <<<'HTML'
<section>
  <p>Hello</p>
</section>
HTML;
?>
`;

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });
});
