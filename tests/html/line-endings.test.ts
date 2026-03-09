import { describe, expect, it } from "vitest";
import { format, formatEqualToPrettierHtml } from "../helpers.js";

function assertOnlyLf(text: string): void {
  expect(text.includes("\r")).toBe(false);
}

function assertOnlyCrlf(text: string): void {
  expect(text.includes("\r\n")).toBe(true);
  expect(text.replaceAll("\r\n", "").includes("\n")).toBe(false);
}

function assertOnlyCr(text: string): void {
  expect(text.includes("\r")).toBe(true);
  expect(text.includes("\n")).toBe(false);
}

describe("html/line-endings", () => {
  it("normalizes to LF with endOfLine=lf", async () => {
    const input = "<div>\r\n@if($x)\r\n<span>{{$x}}</span>\r\n@endif\r\n</div>\r\n";
    const output = await format(input, { endOfLine: "lf" });

    assertOnlyLf(output);
  });

  it("normalizes to CRLF with endOfLine=crlf", async () => {
    const input = "<div>\n@if($x)\n<span>{{$x}}</span>\n@endif\n</div>\n";
    const output = await format(input, { endOfLine: "crlf" });

    assertOnlyCrlf(output);
  });

  it("preserves LF input with endOfLine=auto", async () => {
    const input = "<div>\n@if($x)\n<span>{{$x}}</span>\n@endif\n</div>\n";
    const output = await format(input, { endOfLine: "auto" });

    assertOnlyLf(output);
  });

  it("preserves CRLF input with endOfLine=auto", async () => {
    const input = "<div>\r\n@if($x)\r\n<span>{{$x}}</span>\r\n@endif\r\n</div>\r\n";
    const output = await format(input, { endOfLine: "auto" });

    assertOnlyCrlf(output);
  });

  it("supports CR with endOfLine=cr", async () => {
    const input = "<div>\n@if($x)\n<span>{{$x}}</span>\n@endif\n</div>\n";
    const output = await format(input, { endOfLine: "cr" });

    assertOnlyCr(output);
  });

  it("matches prettier-html for endOfLine options", async () => {
    const input = "<div> <span>foo</span> </div>\r\n";

    await formatEqualToPrettierHtml(input, { endOfLine: "lf" });
    await formatEqualToPrettierHtml(input, { endOfLine: "crlf" });
    await formatEqualToPrettierHtml(input, { endOfLine: "auto" });
    await formatEqualToPrettierHtml(input, { endOfLine: "cr" });
  });
});
