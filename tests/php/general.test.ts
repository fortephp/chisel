import { describe, it } from "vitest";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { formatEqual } from "../helpers.js";

const withPhp = {
  plugins: [bladePlugin, phpPlugin],
  bladePhpFormatting: "safe" as const,
};

describe("php/general", () => {
  it("formats all echo delimiter variants", async () => {
    await formatEqual("{{$a+$b}}\n", "{{ $a + $b }}\n", withPhp);
    await formatEqual("{!!$c+$d!!}\n", "{!! $c + $d !!}\n", withPhp);
    await formatEqual("{{{$e+$f}}}\n", "{{{ $e + $f }}}\n", withPhp);
  });

  it("formats shorthand and standard php tags", async () => {
    const input = "<?= $a+$b ?>\n<?php for($i=0;$i<3;$i++){echo $i;} ?>\n";
    const expected = "<?= $a + $b ?>\n<?php for ($i = 0; $i < 3; $i++) {\n  echo $i;\n} ?>\n";

    await formatEqual(input, expected, withPhp);
  });

  it("formats call-like directive arguments with php syntax", async () => {
    const input = "@blaze(fold:true,deep:fn($x)=>$x+1)\n";
    const expected = "@blaze (fold: true, deep: fn($x) => $x + 1)\n";

    await formatEqual(input, expected, withPhp);
  });

  it("keeps multiline directive arg closers aligned with directive start", async () => {
    const input = `@class([
            'filament antialiased min-h-screen js-focus-visible',
            'dark' => filament()->hasDarkModeForced(),
        ])
`;
    const expected = `@class ([
  "filament antialiased min-h-screen js-focus-visible",
  "dark" => filament()->hasDarkModeForced()
])
`;

    await formatEqual(input, expected, withPhp);
  });

  it("preserves source-authored trailing commas in directive array args", async () => {
    const input = `@props ([
    'type' => 'button',
    'size' => 'base',
    'style' => 'tertiary',
    'href' => '#',
])
`;
    const expected = `@props ([
  "type" => "button",
  "size" => "base",
  "style" => "tertiary",
  "href" => "#",
])
`;

    await formatEqual(input, expected, {
      ...withPhp,
      trailingComma: "all",
    });
  });

  it("allows trailingCommaPHP=false to remove directive array trailing commas", async () => {
    const input = `@props ([
    'type' => 'button',
    'size' => 'base',
    'style' => 'tertiary',
    'href' => '#',
])
`;
    const expected = `@props ([
  "type" => "button",
  "size" => "base",
  "style" => "tertiary",
  "href" => "#"
])
`;

    await formatEqual(input, expected, {
      ...withPhp,
      trailingComma: "all",
      trailingCommaPHP: false,
    });
  });

  it("does not add directive array trailing commas when the source omitted them", async () => {
    const input = `@props ([
    'type' => 'button',
    'href' => '#'
])
`;
    const expected = `@props ([
  "type" => "button",
  "href" => "#"
])
`;

    await formatEqual(input, expected, {
      ...withPhp,
      trailingComma: "all",
    });
  });

  it("preserves wrapped multiline @if directive args layout while formatting php", async () => {
    const input = `@if (
    $something ||
    $this->thing ||
    $that->otherThing()
)
    <p>Hi!</p>
@endif
`;
    const expected = `@if (
  $something ||
  $this->thing ||
  $that->otherThing()
)
  <p>Hi!</p>
@endif
`;

    await formatEqual(input, expected, withPhp);
  });

  it("indents multiline echo bodies and aligns closing delimiters", async () => {
    const input = "{{ ['alpha' => 1, 'beta' => ['gamma' => 3]] }}\n";
    const expected = `{{
  [
    "alpha" => 1,
    "beta" => [
      "gamma" => 3,
    ],
  ]
}}\n`;

    await formatEqual(input, expected, {
      ...withPhp,
      printWidth: 20,
    });
  });

  it("formats nullsafe operators in all echo delimiter variants without leaking wrapper syntax", async () => {
    await formatEqual("{{ user()?->name }}\n", "{{ user()?->name }}\n", withPhp);
    await formatEqual("{!! user()?->name !!}\n", "{!! user()?->name !!}\n", withPhp);
    await formatEqual("{{{ user()?->name }}}\n", "{{{ user()?->name }}}\n", withPhp);

    await formatEqual(
      "{{ user()?->profile()?->displayName() }}\n",
      `{{
  user()
    ?->profile()
    ?->displayName()
}}
`,
      {
        ...withPhp,
        printWidth: 20,
      },
    );
  });

  it("preserves leading echo-like string literals when unwrapping delegated echo formatting", async () => {
    await formatEqual("{{ '   echo' }}\n", '{{ "   echo" }}\n', withPhp);
    await formatEqual("{!! 'echo' !!}\n", '{!! "echo" !!}\n', withPhp);
    await formatEqual(
      "{{{ 'echo' . $suffix }}}\n",
      `{{{
  "echo" .
    $suffix
}}}
`,
      {
        ...withPhp,
        printWidth: 14,
      },
    );
  });

  it("keeps invalid php fragments unchanged as fallback", async () => {
    const input = "{{$a + }}\n@blaze($x + )\n";
    const expected = "{{$a + }}\n@blaze ($x + )\n";

    await formatEqual(input, expected, withPhp);
  });
});
