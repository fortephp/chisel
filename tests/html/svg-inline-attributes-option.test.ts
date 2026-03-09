import { describe, expect, it } from "vitest";
import { format } from "../helpers.js";

function getOpeningTag(output: string, tagName: string): string {
  const match = output.match(new RegExp(`<${tagName}\\b[\\s\\S]*?>`, "u"));
  return match?.[0] ?? "";
}

describe("html/svg-inline-attributes-option", () => {
  const inlinePathInput =
    '<svg><path d="M0 0 L10 10 L20 20 L30 30 L40 40" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" fill="none" vector-effect="non-scaling-stroke" /></svg>\n';

  it("preserves inline svg attributes by default when source opening tag is single-line", async () => {
    const output = await format(inlinePathInput, {
      printWidth: 40,
      singleAttributePerLine: true,
    });

    const pathOpening = getOpeningTag(output, "path");
    expect(pathOpening).not.toBe("");
    expect(pathOpening.includes("\n")).toBe(false);
  });

  it("wraps svg child attributes when svg namespace inline intent is removed", async () => {
    const output = await format(inlinePathInput, {
      printWidth: 40,
      singleAttributePerLine: true,
      bladeInlineIntentElements: ["svg"],
    });

    const pathOpening = getOpeningTag(output, "path");
    expect(pathOpening).not.toBe("");
    expect(pathOpening.includes("\n")).toBe(true);
  });

  it("can keep svg child attributes inline while breaking the svg container", async () => {
    const output = await format(inlinePathInput, {
      printWidth: 40,
      singleAttributePerLine: true,
      bladeInlineIntentElements: ["svg:*"],
    });

    const pathOpening = getOpeningTag(output, "path");
    expect(output).toContain("<svg>\n");
    expect(pathOpening).not.toBe("");
    expect(pathOpening.includes("\n")).toBe(false);
  });

  it("does not force-inline when source svg opening tag is already multiline", async () => {
    const input = `<svg><path
  d="M0 0 L10 10"
  stroke="currentColor"
  stroke-width="2"
  fill="none"
/></svg>
`;
    const output = await format(input, {
      printWidth: 40,
      singleAttributePerLine: true,
    });

    const pathOpening = getOpeningTag(output, "path");
    expect(pathOpening).not.toBe("");
    expect(pathOpening.includes("\n")).toBe(true);
  });

  it("keeps inline svg containers single-line regardless of printWidth", async () => {
    const output = await format(inlinePathInput, {
      printWidth: 10,
      singleAttributePerLine: true,
    });

    expect(output.trimEnd()).toBe(
      '<svg><path d="M0 0 L10 10 L20 20 L30 30 L40 40" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" fill="none" vector-effect="non-scaling-stroke" /></svg>',
    );
  });

  it("keeps single-line svg child style attributes inline when inline svg preservation is enabled", async () => {
    const input =
      '<svg><line x1="18%" y1="28%" x2="8%" y2="19%" class="stroke-white/8 line-breathe" stroke-width="1" style="animation-delay: 0s" /></svg>\n';

    const output = await format(input, {
      printWidth: 40,
      singleAttributePerLine: true,
    });

    expect(output.trimEnd()).toBe(
      '<svg><line x1="18%" y1="28%" x2="8%" y2="19%" class="stroke-white/8 line-breathe" stroke-width="1" style="animation-delay: 0s" /></svg>',
    );
  });
});
