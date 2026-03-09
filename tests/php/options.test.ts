import { describe, expect, it } from "vitest";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { format, formatEqual } from "../helpers.js";

const withPhp = {
  plugins: [bladePlugin, phpPlugin],
  bladePhpFormatting: "safe" as const,
};

describe("php/options", () => {
  it("applies bladeDirectiveArgSpacing for @php directive args in safe mode", async () => {
    await formatEqual("@php($a+$b)\n", "@php($a + $b)\n", {
      ...withPhp,
      bladeDirectiveArgSpacing: "none",
    });

    await formatEqual("@php($a+$b)\n", "@php ($a + $b)\n", {
      ...withPhp,
      bladeDirectiveArgSpacing: "space",
    });

    await formatEqual("@php ($a+$b)\n", "@php ($a + $b)\n", {
      ...withPhp,
      bladeDirectiveArgSpacing: "preserve",
    });
  });

  it("applies bladeDirectiveArgSpacing for @php directive args in aggressive mode", async () => {
    await formatEqual("@php($a+$b)\n", "@php($a + $b)\n", {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "aggressive",
      bladeDirectiveArgSpacing: "none",
    });

    await formatEqual("@php($a+$b)\n", "@php ($a + $b)\n", {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "aggressive",
      bladeDirectiveArgSpacing: "space",
    });

    await formatEqual("@php ($a+$b)\n", "@php ($a + $b)\n", {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "aggressive",
      bladeDirectiveArgSpacing: "preserve",
    });
  });

  it("passes singleQuote to php formatting", async () => {
    const input = '@blaze("alpha"."beta")\n';

    await formatEqual(input, "@blaze ('alpha' . 'beta')\n", {
      ...withPhp,
      singleQuote: true,
    });

    await formatEqual(input, '@blaze ("alpha" . "beta")\n', {
      ...withPhp,
      singleQuote: false,
    });
  });

  it("uses extra wrapper attempts in aggressive mode for custom directive args", async () => {
    const input = "@custom($a;$b;$c)\n";

    await formatEqual(input, "@custom ($a;$b;$c)\n", {
      ...withPhp,
      bladePhpFormatting: "safe",
    });

    await formatEqual(input, "@custom ($a; $b; $c)\n", {
      ...withPhp,
      bladePhpFormatting: "aggressive",
    });
  });

  it("passes trailingCommaPHP to php formatting", async () => {
    const input = "@php\n$y=['a'=>1,'b'=>2,'long_key'=>3];\n@endphp\n";

    await formatEqual(
      input,
      '@php\n  $y = [\n    "a" => 1,\n    "b" => 2,\n    "long_key" => 3,\n  ];\n@endphp\n',
      {
        ...withPhp,
        printWidth: 30,
        trailingCommaPHP: true,
      },
    );

    await formatEqual(
      input,
      '@php\n  $y = [\n    "a" => 1,\n    "b" => 2,\n    "long_key" => 3\n  ];\n@endphp\n',
      {
        ...withPhp,
        printWidth: 30,
        trailingCommaPHP: false,
      },
    );
  });

  it("passes useTabs to php formatting indentation", async () => {
    const input = "@php\nif($x){$y=['a'=>1,'b'=>2,'long_key'=>3];}\n@endphp\n";
    const output = await format(input, {
      ...withPhp,
      printWidth: 40,
      useTabs: true,
      tabWidth: 4,
    });

    expect(output).toContain("\n\t\t$y = [");
    expect(output).toContain('\n\t\t\t"a" => 1,');
  });

  it("passes tabWidth to php formatting indentation", async () => {
    const input = "@php\nif($x){$y=['a'=>1,'b'=>2,'long_key'=>3];}\n@endphp\n";
    const output = await format(input, {
      ...withPhp,
      printWidth: 40,
      useTabs: false,
      tabWidth: 4,
    });

    expect(output).toContain("\n        $y = [");
    expect(output).toContain('\n            "a" => 1,');
  });

  it("supports bladePhpFormattingTargets=none", async () => {
    await formatEqual("{{$a+$b}}\n@blaze(a:1+2)\n", "{{$a+$b}}\n@blaze (a:1+2)\n", {
      ...withPhp,
      bladePhpFormattingTargets: [],
    });
  });

  it("supports bladePhpFormattingTargets=echo", async () => {
    await formatEqual("{{$a+$b}}\n@blaze(a:1+2)\n", "{{ $a + $b }}\n@blaze (a:1+2)\n", {
      ...withPhp,
      bladePhpFormattingTargets: ["echo"],
    });
  });

  it("supports bladePhpFormattingTargets=directiveArgs", async () => {
    await formatEqual(
      "{{$a+$b}}\n@blaze(a:1+2)\n",
      "{{$a+$b}}\n@blaze (a: 1 + 2)\n",
      {
        ...withPhp,
        bladePhpFormattingTargets: ["directiveArgs"],
      },
    );
  });

  it("supports bladePhpFormattingTargets for phpBlock/phpTag", async () => {
    await formatEqual(
      "@php $x=1+2; @endphp\n<?php $y=2+3; ?>\n",
      "@php $x = 1 + 2; @endphp\n<?php $y = 2 + 3; ?>\n",
      {
        ...withPhp,
        bladePhpFormattingTargets: ["phpBlock", "phpTag"],
      },
    );
  });

  it("respects bladeEchoSpacing=tight when php echo formatting is enabled", async () => {
    await formatEqual(
      "{{$a+$b}}\n<div @if($x)wire:key=\"{{ $x->id }}\"@endif></div>\n",
      "{{$a + $b}}\n<div @if ($x) wire:key=\"{{$x->id}}\"@endif></div>\n",
      {
        ...withPhp,
        bladeEchoSpacing: "tight",
      },
    );
  });

  it("still formats normally when php formatting is enabled without explicitly loading the php plugin", async () => {
    await formatEqual(
      "@if($user->isAdmin())\n<p>Hi</p>\n@endif\n",
      "@if ($user->isAdmin())\n  <p>Hi</p>\n@endif\n",
      {
        plugins: [bladePlugin],
        bladePhpFormatting: "safe",
        bladeDirectiveArgSpacing: "space",
      },
    );
  });
});
