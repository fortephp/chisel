import { describe, it } from "vitest";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { formatEqual, wrapInDiv } from "../helpers.js";

const INPUT = `<x-select
class="mb-2"
name="search_column"
:options="[
'name' => __('Name'),
'email' => __('Email'),
]"
x-model="params.search_column"
:selected="request()->query('search_column')"
/>
`;

const EXPECTED = `<x-select
    class="mb-2"
    name="search_column"
    :options="[
        'name' => __('Name'),
        'email' => __('Email'),
    ]"
    x-model="params.search_column"
    :selected="request()->query('search_column')"
/>
`;

describe("options/php-bound-attribute-layout", () => {
  it.each([
    { bladePhpFormatting: "off", printWidth: 120 },
    { bladePhpFormatting: "safe", printWidth: 120 },
    { bladePhpFormatting: "aggressive", printWidth: 120 },
    { bladePhpFormatting: "safe", printWidth: 80 },
    { bladePhpFormatting: "off", printWidth: 320 },
    { bladePhpFormatting: "safe", printWidth: 320 },
  ] as const)(
    "keeps multiline component attributes expanded with $bladePhpFormatting at width $printWidth (issue #190)",
    async ({ bladePhpFormatting, printWidth }) => {
      await formatEqual(INPUT, EXPECTED, {
        plugins: [bladePlugin, phpPlugin],
        bladePhpFormatting,
        tabWidth: 4,
        printWidth,
      });
    },
  );

  it.each([
    { tabWidth: 2, useTabs: false, depth: 0 },
    { tabWidth: 2, useTabs: false, depth: 2 },
    { tabWidth: 4, useTabs: false, depth: 2 },
    { tabWidth: 4, useTabs: true, depth: 2 },
  ])(
    "indents formatted arrays with tabWidth=$tabWidth, useTabs=$useTabs at depth $depth",
    async ({ tabWidth, useTabs, depth }) => {
      const indent = useTabs ? "\t" : " ".repeat(tabWidth);
      const input = wrapInDiv(INPUT.replaceAll(" => ", "=>"), depth);
      let expected = EXPECTED.replaceAll("    ", indent);
      for (let i = 0; i < depth; i++) {
        expected = `<div>\n${expected
          .trimEnd()
          .split("\n")
          .map((line) => indent + line)
          .join("\n")}\n</div>\n`;
      }

      await formatEqual(input, expected, {
        plugins: [bladePlugin, phpPlugin],
        bladePhpFormatting: "safe",
        tabWidth,
        useTabs,
        printWidth: 120,
      });
    },
  );

  it("keeps short PHP arrays inline", async () => {
    await formatEqual(
      `<x-select class="mb-2" :options="['name'=>__('Name')]" />\n`,
      `<x-select class="mb-2" :options="['name' => __('Name')]" />\n`,
      { plugins: [bladePlugin, phpPlugin], bladePhpFormatting: "safe" },
    );
  });

  it("honors the PHP trailing comma option while retaining multiline layout", async () => {
    await formatEqual(INPUT, EXPECTED.replace("__('Email'),", "__('Email')"), {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      trailingCommaPHP: false,
      tabWidth: 4,
    });
  });
});
