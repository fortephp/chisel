import { describe, expect, it } from "vitest";
import { format } from "../helpers.js";

describe("html/inline-intent-elements-option", () => {
  it("preserves inline svg intent when configured", async () => {
    const input =
      '<svg><path d="M0 0 L10 10 L20 20 L30 30 L40 40" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" fill="none" vector-effect="non-scaling-stroke" /></svg>\n';

    const output = await format(input, {
      printWidth: 10,
      singleAttributePerLine: true,
      bladeInlineIntentElements: ["svg", "svg:*"],
    });

    expect(output.trimEnd()).toBe(
      '<svg><path d="M0 0 L10 10 L20 20 L30 30 L40 40" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" fill="none" vector-effect="non-scaling-stroke" /></svg>',
    );
  });

  it("can disable inline svg intent by removing svg entries", async () => {
    const input =
      '<svg><path d="M0 0 L10 10 L20 20 L30 30 L40 40" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" fill="none" vector-effect="non-scaling-stroke" /></svg>\n';

    const output = await format(input, {
      printWidth: 10,
      singleAttributePerLine: true,
      bladeInlineIntentElements: ["p"],
    });

    expect(output).toContain("<svg>");
    expect(output).toContain("<path\n");
    expect(output).toContain("</svg>");
  });

  it("does not force long paragraph inline intent when p is removed", async () => {
    const input = `<p id="alpha" data-one="1" data-two="2" data-three="3" data-four="4" data-five="5" data-six="6" data-seven="7" data-eight="8">Hello {{   $name   }} this is a long inline paragraph that should remain on one line.</p>
`;

    const output = await format(input, {
      printWidth: 40,
      bladePhpFormatting: "safe",
      bladeEchoSpacing: "space",
      bladeInlineIntentElements: [],
    });

    expect(output).toContain("<p\n");
    expect(output).toContain("Hello {{ $name }} this is a long");
  });

  it("does not force long svg inline intent when svg is removed", async () => {
    const input = `<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 2L3 4L5 6L7 8L9 10L11 12L13 14L15 16L17 18L19 20L21 22L23 24L25 26L27 28L29 30" stroke="currentColor" stroke-width="2" /></svg>
`;

    const output = await format(input, {
      printWidth: 40,
      bladeInlineIntentElements: [],
    });

    expect(output).toContain("<svg\n");
    expect(output).toContain("<path\n");
  });

  it("respects disabled paragraph inline intent inside conditional comments", async () => {
    const input = `<!--[if lte IE 9]>
<p id="alpha" data-one="1" data-two="2" data-three="3" data-four="4" data-five="5" data-six="6" data-seven="7" data-eight="8">Hello {{   $name   }} this is a long inline paragraph that should remain on one line.</p>
<![endif]-->
`;

    const output = await format(input, {
      printWidth: 40,
      bladePhpFormatting: "safe",
      bladeEchoSpacing: "space",
      bladeInlineIntentElements: [],
    });

    expect(output).toContain("<p\n");
    expect(output).toContain("Hello {{ $name }} this is a long");
  });
});
