import { describe, expect, it } from "vitest";
import * as prettierStandalone from "prettier/standalone";
import htmlPlugin from "prettier/plugins/html";
import * as phpPlugin from "@prettier/plugin-php";
import * as tailwindPlugin from "prettier-plugin-tailwindcss";
import bladePlugin from "../../src/index.js";

const INPUT = `<div class="z-10 font-bold bg-red-500" x-data="{ greeting: &quot;hello&quot; }" onclick="return run({ alpha: 1, beta: 2, longKey: 3 })"></div>
@if($x=="y")
<x-admin-panel :user="$user" />
@endif
{{ "abc" }}
@php($y=1+2)
<script>var hello = "world";</script>
<style>.a::before{content:"hello"}</style>
`;

async function formatWithPlugins(plugins: unknown[]) {
  return prettierStandalone.format(INPUT, {
    parser: "blade",
    plugins,
    bladePhpFormatting: "safe",
    singleQuote: true,
    trailingComma: "all",
    printWidth: 60,
  });
}

describe("options/plugin-order-consistency", () => {
  it("produces equivalent output across blade/html/php plugin orderings", async () => {
    const orders = [
      [htmlPlugin, phpPlugin, bladePlugin],
      [bladePlugin, htmlPlugin, phpPlugin],
      [phpPlugin, bladePlugin, htmlPlugin],
    ];

    const outputs = await Promise.all(orders.map((plugins) => formatWithPlugins(plugins)));
    for (let i = 1; i < outputs.length; i++) {
      expect(outputs[i]).toBe(outputs[0]);
    }

    expect(outputs[0]).toContain("@if ($x == 'y')");
    expect(outputs[0]).toContain("{{ 'abc' }}");
    expect(outputs[0]).toContain("var hello = 'world';");
    expect(outputs[0]).toContain("content: 'hello';");
  });

  it("stays equivalent across plugin orderings when tailwind plugin is present", async () => {
    const orders = [
      [htmlPlugin, phpPlugin, bladePlugin, tailwindPlugin],
      [tailwindPlugin, bladePlugin, phpPlugin, htmlPlugin],
      [bladePlugin, tailwindPlugin, htmlPlugin, phpPlugin],
    ];

    const outputs = await Promise.all(orders.map((plugins) => formatWithPlugins(plugins)));
    for (let i = 1; i < outputs.length; i++) {
      expect(outputs[i]).toBe(outputs[0]);
    }

    expect(outputs[0]).toContain('class="z-10 bg-red-500 font-bold"');
  });
});
