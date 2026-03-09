import { describe, expect, it } from "vitest";
import {
  getDirectivePhpWrapperKind,
  getDirectivePhpWrapperKinds,
} from "../../src/lexer/directives.js";
import { tokenize } from "../../src/lexer/lexer.js";
import { Directives as TrainedDirectives } from "../../src/tree/directives.js";

describe("directive registry php wrapper metadata", () => {
  it("classifies known control directives", () => {
    expect(getDirectivePhpWrapperKind("for")).toBe("for");
    expect(getDirectivePhpWrapperKind("forelse")).toBe("foreach");
    expect(getDirectivePhpWrapperKind("while")).toBe("while");
    expect(getDirectivePhpWrapperKind("switch")).toBe("switch");
    expect(getDirectivePhpWrapperKind("case")).toBe("case");
    expect(getDirectivePhpWrapperKind("if")).toBe("if");
    expect(getDirectivePhpWrapperKind("pushIf")).toBe("if");
  });

  it("falls back unknown directives to call wrapper", () => {
    expect(getDirectivePhpWrapperKind("blaze")).toBe("call");
  });

  it("returns safe wrapper order", () => {
    expect(getDirectivePhpWrapperKinds("if", "safe")).toEqual(["if", "call"]);
    expect(getDirectivePhpWrapperKinds("blaze", "safe")).toEqual(["call"]);
  });

  it("returns aggressive wrapper order with uniqueness", () => {
    expect(getDirectivePhpWrapperKinds("for", "aggressive")).toEqual([
      "for",
      "if",
      "while",
      "switch",
      "foreach",
      "case",
      "call",
    ]);

    expect(getDirectivePhpWrapperKinds("blaze", "aggressive")).toEqual([
      "call",
      "if",
      "while",
      "switch",
      "foreach",
      "for",
      "case",
    ]);
  });

  it("detects custom condition-like wrappers from trained directives", () => {
    const source = "@disk($name) A @elsedisk($fallback) B @enddisk";
    const { tokens } = tokenize(source);
    const trained = TrainedDirectives.withDefaults();
    trained.train(tokens, source);

    const context = {
      hasDirective: (name: string) => trained.isDirective(name),
      isConditionLikeDirective: (name: string) => trained.isCondition(name),
    };

    expect(getDirectivePhpWrapperKind("disk", context)).toBe("if");
    expect(getDirectivePhpWrapperKind("elsedisk", context)).toBe("if");
    expect(getDirectivePhpWrapperKinds("disk", "safe", context)).toEqual([
      "if",
      "call",
    ]);
  });
});
