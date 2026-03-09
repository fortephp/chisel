import { describe, expect, it } from "vitest";
import { format } from "../helpers.js";

describe("html/large-style-skip", () => {
  it("keeps large style content unparsed by css embedding", async () => {
    const chunk = ".x{color:red}.y{display:flex}.z{font-weight:700}";
    const rawCss = chunk.repeat(600);
    const input = `<style>${rawCss}</style>
`;

    const output = await format(input);
    const outputLineCount = output.split(/\r?\n/u).length;

    expect(output).toContain(rawCss);
    expect(output.includes("color: red;")).toBe(false);
    expect(outputLineCount).toBe(4);
  });
});
