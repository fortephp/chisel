import { describe, expect, it } from "vitest";
import { bladeParser } from "../../src/parser.js";
import { formatDirectiveNodeArgs } from "../../src/print/embed/php.js";
import {
  DIRECTIVE_PHP_FORMAT_ARGS_PLACEHOLDER,
  type BladeSyntaxPlugin,
} from "../../src/plugins/types.js";
import type { WrappedNode } from "../../src/types.js";

const loopFormatterPlugin: BladeSyntaxPlugin = {
  name: "fixtures/loop-formatter",
  lexerDirectives: [],
  treeDirectives: [],
  verbatimStartDirectives: [],
  verbatimEndDirectives: [],
  getDirectivePhpFormatTemplates(directiveName) {
    if (directiveName !== "wloop") {
      return [];
    }

    return [
      {
        key: "foreach",
        template: `<?php foreach (${DIRECTIVE_PHP_FORMAT_ARGS_PLACEHOLDER}) {}`,
      },
    ];
  },
};

describe("plugins/directive php format hooks", () => {
  it("lets syntax plugins format directive args with custom wrapper templates", async () => {
    const input = "@wloop($items as $index=>$item)\n";
    const root = bladeParser.parse(input) as WrappedNode;
    const rootWithPlugin = bladeParser.parse(input, {
      bladeSyntaxPlugins: [loopFormatterPlugin],
    }) as WrappedNode;
    const node = root.children[0];
    const nodeWithPlugin = rootWithPlugin.children[0];

    const withoutPlugin = await formatDirectiveNodeArgs(node, {
      bladePhpFormatting: "safe",
    });
    const withPlugin = await formatDirectiveNodeArgs(nodeWithPlugin, {
      bladePhpFormatting: "safe",
      bladeSyntaxPlugins: [loopFormatterPlugin],
    });

    expect(withoutPlugin).toBeNull();
    expect(withPlugin).toBe("@wloop ($items as $index => $item)");
  });
});
