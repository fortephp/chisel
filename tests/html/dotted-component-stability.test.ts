import { describe, expect, it } from "vitest";
import { formatWithPasses } from "../helpers.js";

describe("html/dotted-component-stability", () => {
  const cases = [
    ["an echo", "{{ __('Terms of service') }}"],
    ["text", "Terms of service"],
  ];

  it.each(cases)("is idempotent for a wrapped dotted component hugging %s", async (_, child) => {
    const input = `<x-ui.link tone="quiet" href="https://example.com/terms" target="_blank">${child}</x-ui.link>\n`;

    await formatWithPasses(input, {}, { passes: 3, assertIdempotent: true });
  });

  it.each(cases)("formats a dotted component hugging %s like an undotted one", async (_, child) => {
    const dotted = `<x-ui.link tone="quiet" href="https://example.com/terms" target="_blank">${child}</x-ui.link>\n`;
    const undotted = dotted.replaceAll("x-ui.link", "x-ui-link");

    const output = await formatWithPasses(dotted, {}, { passes: 1, assertIdempotent: false });
    const expected = await formatWithPasses(undotted, {}, { passes: 1, assertIdempotent: false });

    expect(output).toBe(expected.replaceAll("x-ui-link", "x-ui.link"));
  });
});
