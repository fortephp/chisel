import { describe, it } from "vitest";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { formatEqual } from "../helpers.js";

const withPhp = {
  plugins: [bladePlugin, phpPlugin],
};

describe("html/php-embedding", () => {
  it("keeps current non-php-delegated behavior when bladePhpFormatting is off", async () => {
    const input = "{{$a+$b}}\n";
    const expected = "{{$a+$b}}\n";

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "off",
    });
  });

  it("formats echo expressions with canonical spaced delimiters", async () => {
    const input = "{{$a+$b}}\n";
    const expected = "{{ $a + $b }}\n";

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });

  it("formats raw echo expressions", async () => {
    const input = "{!!$a+$b!!}\n";
    const expected = "{!! $a + $b !!}\n";
    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });

  it("formats triple echo expressions", async () => {
    const input = "{{{$c+$d}}}\n";
    const expected = "{{{ $c + $d }}}\n";

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });

  it("formats directive arguments for call-like directives", async () => {
    const input = "@blaze(fold:true,deep:fn($x)=>$x+1)\n";
    const expected = "@blaze (fold: true, deep: fn($x) => $x + 1)\n";

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });

  it("formats directive arguments for control-flow directives", async () => {
    const input = "@for($i=0;$i<10;$i++)@endfor\n";
    const expected = "@for ($i = 0; $i < 10; $i++)@endfor\n";

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });

  it("formats @php ... @endphp blocks", async () => {
    const input = "@php\n$x=1+2;\n$y=$x*3;\n@endphp\n";
    const expected = "@php\n  $x = 1 + 2;\n  $y = $x * 3;\n@endphp\n";

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });

  it("keeps inline @php ... @endphp when body is one line", async () => {
    const input = "@php $x=1+2; @endphp\n";
    const expected = "@php $x = 1 + 2; @endphp\n";

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });

  it("formats <?php ?> tags", async () => {
    const input = "<?php $x=1+2;?>\n";
    const expected = "<?php $x = 1 + 2; ?>\n";

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });

  it("compensates inline echo wrapper width inside html text contexts", async () => {
    const input = "<title>{{ $title ?? 'Formatter Playground - Forte' }}</title>\n";
    const expected = '<title>{{ $title ?? "Formatter Playground - Forte" }}</title>\n';

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
      printWidth: 80,
    });
  });

  it("keeps short inline text-content echoes from breaking due to wrapper overhead", async () => {
    const input = `<p class="mt-10 text-center text-sm text-slate-500 dark:text-slate-500">&copy; {{ date('Y') }} Forte. Open source under the MIT License.</p>\n`;
    const expected = `<p class="mt-10 text-center text-sm text-slate-500 dark:text-slate-500">\n  &copy; {{ date("Y") }} Forte. Open source under the MIT License.\n</p>\n`;

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
      printWidth: 80,
    });
  });

  it("does not apply inline-text echo compensation inside style tags", async () => {
    const input = `<style>
.thing { background-color: {{ $color + $something + $otherThing }}; }
</style>
`;
    const expected = `<style>
  .thing {
    background-color: {{
    $color +
      $something +
      $otherThing
  }};
  }
</style>
`;

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
      printWidth: 80,
    });
  });

  it("falls back to original text when php parsing fails", async () => {
    const input = "{{$a + }}\n@blaze($x + )\n";
    const expected = "{{$a + }}\n@blaze ($x + )\n";

    await formatEqual(input, expected, {
      ...withPhp,
      bladePhpFormatting: "safe",
    });
  });
});
