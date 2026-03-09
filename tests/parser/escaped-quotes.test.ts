import { describe, it, expect } from "vitest";
import { parse, renderDocument } from "./helpers.js";

describe("Escaped Quotes", () => {
  it("handles escaped double quotes in double-quoted attribute", () => {
    const source = '<div data-value="hello \\"world\\" goodbye"></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles escaped single quotes in single-quoted attribute", () => {
    const source = "<div data-value='hello \\'world\\' goodbye'></div>";
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles multiple trailing backslashes", () => {
    const source = '<div data-value="hello\\\\\\\\">after</div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles odd trailing backslashes before quote", () => {
    const source = '<div data-value="hello\\\\\\\\\\\\">world"></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles many trailing backslashes", () => {
    const source = '<div data-value="test\\\\\\\\\\\\\\\\">after</div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles single backslash before closing quote", () => {
    const source = '<div data-value="\\\\">test"></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles multiple escaped quotes in attribute value", () => {
    const source = '<div data-value="a\\"b\\"c\\"d"></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles unclosed quote with escape", () => {
    const source = '<div data-value="test\\"';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles escaped quote as only attribute content", () => {
    const source = '<div data-value="\\""></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles escaped quotes in middle attribute", () => {
    const source = '<input type="text" value="say \\"hello\\"" class="btn">';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles escaped quotes with blade interpolation", () => {
    const source = '<div data-config="{ \\"key\\": {{ $value }} }"></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });
});
