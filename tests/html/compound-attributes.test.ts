import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/compound-attributes", () => {
  it("preserves multipart attribute names with echo parts", async () => {
    const input = `<div data-{{ $value }}-thing="{{ $thing }}"></div>
`;
    const expected = `<div data-{{ $value }}-thing="{{ $thing }}"></div>
`;
    await formatEqual(input, expected);
  });

  it("preserves boolean multipart attribute names", async () => {
    const input = `<div data-{{ $value }}-thing></div>
`;
    const expected = `<div data-{{ $value }}-thing></div>
`;
    await formatEqual(input, expected);
  });

  it("does not apply class-value embedding to dynamic class-like names", async () => {
    const input = `<div class{{ $suffix }}="  foo   bar  "></div>
`;
    const expected = `<div class{{ $suffix }}="  foo   bar  "></div>
`;
    await formatEqual(input, expected);
  });

  it("does not apply alpine embedding to dynamic alpine-like names", async () => {
    const input = `<div x-data{{ $suffix }}="{foo:  1}"></div>
`;
    const expected = `<div x-data{{ $suffix }}="{foo:  1}"></div>
`;
    await formatEqual(input, expected);
  });
});
