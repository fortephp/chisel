import { describe, it, expect } from "vitest";
import { format } from "./helpers.js";

async function expectIdempotent(input: string): Promise<void> {
  const first = await format(input);
  const second = await format(first);
  expect(second).toBe(first);
}

describe("formatter", () => {
  describe("HTML elements", () => {
    it("keeps short div with text flat (fits on line)", async () => {
      // Prettier keeps content flat when it fits within print width.
      // forceBreakContent is false for div with only text child.
      const result = await format("<div>hello</div>");
      expect(result).toBe("<div>hello</div>\n");
    });

    it("formats an empty div", async () => {
      const result = await format("<div></div>");
      expect(result).toBe("<div></div>\n");
    });

    it("formats a void element", async () => {
      const result = await format("<br>");
      expect(result).toBe("<br />\n");
    });

    it("formats self-closing element", async () => {
      const result = await format("<input />");
      expect(result).toBe("<input />\n");
    });

    it("keeps nested block elements flat when they fit", async () => {
      // forceBreakContent(div) = false: p's only child is text, so
      // hasNonTextChild(p) = false. Content fits on one line.
      const result = await format("<div><p>hello</p></div>");
      expect(result).toBe("<div><p>hello</p></div>\n");
    });

    it("keeps inline element inside block flat when it fits", async () => {
      const result = await format("<div><span>hello</span></div>");
      expect(result).toBe("<div><span>hello</span></div>\n");
    });

    it("breaks when content has non-text grandchildren", async () => {
      // forceBreakContent(div) = true: p has non-text child (span),
      // so hasNonTextChild(p) = true.
      const result = await format("<div><p><span>x</span></p></div>");
      expect(result).toMatch(/^<div>\n/);
    });
  });

  describe("force-break elements", () => {
    it("ul always breaks children", async () => {
      const result = await format("<ul><li>one</li><li>two</li></ul>");
      expect(result).toContain("\n");
    });

    it("ol always breaks children", async () => {
      const result = await format("<ol><li>one</li><li>two</li></ol>");
      expect(result).toContain("\n");
    });

    it("select always breaks children", async () => {
      const result = await format(
        '<select><option value="a">A</option><option value="b">B</option></select>',
      );
      expect(result).toContain("\n");
    });

    it("table always breaks children", async () => {
      const result = await format("<table><tr><td>cell</td></tr></table>");
      expect(result).toContain("\n");
    });
  });

  describe("attributes", () => {
    it("keeps single attribute on block element flat when it fits", async () => {
      const result = await format('<div class="foo">hello</div>');
      expect(result).toBe('<div class="foo">hello</div>\n');
    });

    it("keeps multiple attributes on block element flat when it fits", async () => {
      const result = await format('<div class="foo" id="bar">hello</div>');
      expect(result).toBe('<div class="foo" id="bar">hello</div>\n');
    });

    it("formats boolean attribute", async () => {
      const result = await format("<input disabled />");
      expect(result).toBe("<input disabled />\n");
    });
  });

  describe("Blade echoes", () => {
    it("formats echo", async () => {
      const result = await format("{{ $name }}");
      expect(result).toBe("{{ $name }}\n");
    });

    it("preserves compact echo whitespace", async () => {
      const result = await format("{{$name}}");
      expect(result).toBe("{{$name}}\n");
    });

    it("formats raw echo", async () => {
      const result = await format("{!! $html !!}");
      expect(result).toBe("{!! $html !!}\n");
    });
  });

  describe("Blade directives", () => {
    it("formats standalone directive", async () => {
      const result = await format("@csrf");
      expect(result).toBe("@csrf\n");
    });

    it("formats directive with args", async () => {
      const result = await format("@include('header')");
      expect(result).toBe("@include ('header')\n");
    });

    it("formats directive block", async () => {
      const result = await format("@if($show) <p>hello</p> @endif");
      expect(result).toContain("@if ($show)");
      expect(result).toContain("@endif");
    });
  });

  describe("Blade comments", () => {
    it("preserves blade comment", async () => {
      const result = await format("{{-- This is a comment --}}");
      expect(result).toBe("{{-- This is a comment --}}\n");
    });
  });

  describe("mixed content", () => {
    it("formats HTML with blade echo inside", async () => {
      const result = await format("<div>{{ $name }}</div>");
      expect(result).toContain("{{ $name }}");
      expect(result).toContain("<div>");
      expect(result).toContain("</div>");
    });

    it("formats directive wrapping HTML", async () => {
      const result = await format("@if($show) <div>content</div> @endif");
      expect(result).toContain("@if ($show)");
      expect(result).toContain("<div>");
      expect(result).toContain("@endif");
    });
  });

  describe("idempotency", () => {
    it("is idempotent on simple HTML", async () => {
      await expectIdempotent("<div><p>hello</p></div>");
    });

    it("is idempotent on directive blocks", async () => {
      await expectIdempotent("@if($show) <p>hello</p> @endif");
    });

    it("is idempotent on mixed content", async () => {
      await expectIdempotent("<div>{{ $name }}</div>");
    });

    it("is idempotent on inline elements", async () => {
      await expectIdempotent("<p><strong>bold</strong> text</p>");
    });
  });
});
