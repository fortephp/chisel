import { describe, expect, it } from "vitest";
import { formatEqual, formatWithPasses, wrapInDiv } from "../helpers.js";

describe("html/inline-intent-tags", () => {
  it("keeps long single-line paragraphs on one line while formatting internals", async () => {
    const input = `<p id="alpha" data-one="1" data-two="2" data-three="3" data-four="4" data-five="5" data-six="6" data-seven="7" data-eight="8">Hello {{   $name   }} this is a long inline paragraph that should remain on one line.</p>
`;

    const expected = `<p id="alpha" data-one="1" data-two="2" data-three="3" data-four="4" data-five="5" data-six="6" data-seven="7" data-eight="8">Hello {{ $name }} this is a long inline paragraph that should remain on one line.</p>
`;

    await formatEqual(input, expected, {
      printWidth: 40,
      bladePhpFormatting: "safe",
      bladeEchoSpacing: "space",
      bladeInlineIntentElements: ["p", "svg", "svg:*"],
    });
  });

  it("keeps long single-line svg tags on one line while formatting internals", async () => {
    const input = `<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 2L3 4L5 6L7 8L9 10L11 12L13 14L15 16L17 18L19 20L21 22L23 24L25 26L27 28L29 30"/></svg>
`;

    const expected = `<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 2L3 4L5 6L7 8L9 10L11 12L13 14L15 16L17 18L19 20L21 22L23 24L25 26L27 28L29 30" /></svg>
`;

    await formatEqual(input, expected, { printWidth: 50 });
  });

  it("does not inject spaces before nested inline tag closers in inline-intent paragraphs", async () => {
    const input = `<p>Hi <strong>there</strong> <a href="/x">x</a>.</p>
`;

    const expected = `<p>Hi <strong>there</strong> <a href="/x">x</a>.</p>
`;

    await formatEqual(input, expected, {
      printWidth: 120,
      bladeInlineIntentElements: ["p", "svg", "svg:*"],
    });
  });

  it("is idempotent for inline-intent svg tags containing blade directive blocks across nesting depths", async () => {
    const snippet = `<svg><g>@if($x)<text>{{ $a }}</text>@else<text>{{ $b }}</text>@endif</g></svg>
`;

    for (let depth = 0; depth <= 3; depth++) {
      const input = depth === 0 ? snippet : wrapInDiv(snippet, depth);
      const output = await formatWithPasses(
        input,
        {
          bladePhpFormatting: "safe",
          bladeInlineIntentElements: ["p", "svg", "svg:*"],
        },
        {
          passes: 4,
          assertIdempotent: true,
        },
      );

      expect(output).toContain("@if ($x)");
      expect(output).toContain("@else");
      expect(output).toContain("@endif");
      expect(output).toContain("<svg>");
      expect(output).toContain("<g>");
    }
  });
});
