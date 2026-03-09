import { describe, it } from "vitest";
import { formatEqual, formatEqualToPrettierHtml } from "../helpers.js";

describe("html/options", () => {
  it("supports htmlWhitespaceSensitivity values", async () => {
    const input = "<div> <span>foo</span> </div>\n";

    await formatEqual(input, "<div><span>foo</span></div>\n", {
      htmlWhitespaceSensitivity: "css",
    });

    await formatEqual(input, "<div> <span>foo</span> </div>\n", {
      htmlWhitespaceSensitivity: "strict",
    });

    await formatEqual(input, "<div><span>foo</span></div>\n", {
      htmlWhitespaceSensitivity: "ignore",
    });
  });

  it("accepts vueIndentScriptAndStyle without changing HTML/Blade output", async () => {
    const input = "<style>\n.a{color:red}\n</style>\n";
    const expected = `<style>
  .a {
    color: red;
  }
</style>
`;

    await formatEqual(input, expected, {
      vueIndentScriptAndStyle: false,
    });

    await formatEqual(input, expected, {
      vueIndentScriptAndStyle: true,
    });
  });

  it("supports embeddedLanguageFormatting for script/style blocks", async () => {
    const input = "<style>\n.a{color:red}\n</style>\n";

    await formatEqualToPrettierHtml(input, {
      embeddedLanguageFormatting: "auto",
    });

    await formatEqualToPrettierHtml(input, {
      embeddedLanguageFormatting: "off",
    });
  });

  it("matches prettier-html behavior across all html options", async () => {
    const input = '<div data-a="1" data-b="2"><span> foo </span></div>\n';

    const optionSets = [
      {
        bracketSameLine: false,
        singleAttributePerLine: false,
        htmlWhitespaceSensitivity: "css" as const,
        vueIndentScriptAndStyle: false,
      },
      {
        bracketSameLine: true,
        singleAttributePerLine: true,
        htmlWhitespaceSensitivity: "strict" as const,
        vueIndentScriptAndStyle: true,
      },
      {
        bracketSameLine: false,
        singleAttributePerLine: true,
        htmlWhitespaceSensitivity: "ignore" as const,
        vueIndentScriptAndStyle: false,
      },
    ];

    for (const opts of optionSets) {
      await formatEqualToPrettierHtml(input, opts);
    }
  });
});
