import { describe, expect, it } from "vitest";
import type { Options } from "prettier";
import {
  DEFAULT_DIRECTIVE_ARG_SPACING_OVERRIDES,
  getDirectiveArgSpacingOverrides,
  resolveDirectiveArgSpacingRule,
} from "../../src/print/blade-options.js";

describe("options/directive-spacing-resolution", () => {
  it("seeds overrides with the built-in directive spacing defaults", () => {
    const overrides = getDirectiveArgSpacingOverrides({} satisfies Options);

    expect(Object.fromEntries(overrides)).toEqual(
      DEFAULT_DIRECTIVE_ARG_SPACING_OVERRIDES,
    );
  });

  it("parses array override tokens, normalizes directive names, and ignores invalid entries", () => {
    const options = {
      bladeDirectiveArgSpacingOverrides: [
        "@IF",
        " can = space ",
        "AUTH=preserve",
        "if=0",
        "bad=-1",
        "weird=1.5",
        "=",
      ],
    } satisfies Options;

    const overrides = getDirectiveArgSpacingOverrides(options);

    expect(overrides.get("if")).toBe(0);
    expect(overrides.get("can")).toBe("space");
    expect(overrides.get("auth")).toBe("preserve");
    expect(overrides.has("bad")).toBe(false);
    expect(overrides.has("weird")).toBe(false);
    expect(overrides.has("switch")).toBe(false);
  });

  it("resolves fallback spacing correctly when user tokens replace built-in defaults", () => {
    const options = {
      bladeDirectiveArgSpacing: "none",
      bladeDirectiveArgSpacingOverrides: [
        "@if=2",
        "@can=space",
        "section=preserve",
        "bad=-1",
        "float=1.5",
      ],
    } satisfies Options;

    expect(resolveDirectiveArgSpacingRule("@if", options)).toBe(2);
    expect(resolveDirectiveArgSpacingRule("@switch", options)).toBe("none");
    expect(resolveDirectiveArgSpacingRule("@can", options)).toBe("space");
    expect(resolveDirectiveArgSpacingRule("@section", options)).toBe(
      "preserve",
    );
    expect(resolveDirectiveArgSpacingRule("@auth", options)).toBe("none");
    expect(resolveDirectiveArgSpacingRule("@section", options, true)).toBe(0);
  });
});
