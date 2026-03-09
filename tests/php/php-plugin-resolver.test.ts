import { describe, expect, it } from "vitest";
import type { Options } from "prettier";
import {
  resolvePhpPlugins,
  resetPhpPluginResolverForTests,
  setPhpPluginModuleImporterForTests,
} from "../../src/print/embed/php-plugin.js";

function asOptions(plugins: unknown[]): Options {
  return { plugins } as Options;
}

describe("php/php-plugin-resolver", () => {
  it("detects php parser object plugins", async () => {
    const phpPlugin = {
      parsers: {
        php: {
          parse: () => ({}),
          astFormat: "php",
          locStart: () => 0,
          locEnd: () => 0,
        },
      },
    };

    const resolved = await resolvePhpPlugins(asOptions([phpPlugin]));
    expect(resolved).not.toBeNull();
    expect(resolved?.some((plugin) => plugin === phpPlugin)).toBe(true);
  });

  it("detects php parser function plugins", async () => {
    const phpPlugin = {
      parsers: {
        php: () => ({
          parse: () => ({}),
          astFormat: "php",
          locStart: () => 0,
          locEnd: () => 0,
        }),
      },
    };

    const resolved = await resolvePhpPlugins(asOptions([phpPlugin]));
    expect(resolved).not.toBeNull();
    expect(resolved?.some((plugin) => plugin === phpPlugin)).toBe(true);
  });

  it("detects default-export wrapped php parser function plugins", async () => {
    const phpPlugin = {
      default: {
        parsers: {
          php: () => ({
            parse: () => ({}),
            astFormat: "php",
            locStart: () => 0,
            locEnd: () => 0,
          }),
        },
      },
    };

    const resolved = await resolvePhpPlugins(asOptions([phpPlugin]));
    expect(resolved).not.toBeNull();
    expect(
      resolved?.some(
        (plugin) => plugin === phpPlugin.default,
      ),
    ).toBe(true);
  });

  it("loads php plugin from known module ids when options.plugins is empty", async () => {
    const resolved = await resolvePhpPlugins({} as Options);
    expect(resolved).not.toBeNull();
    expect(
      resolved?.some((plugin) => {
        if (!plugin || typeof plugin !== "object") return false;
        const parser = (plugin as { parsers?: Record<string, unknown> }).parsers
          ?.php;
        return !!parser;
      }),
    ).toBe(true);
  });

  it("returns null when php plugin modules are unavailable", async () => {
    setPhpPluginModuleImporterForTests(async () => {
      throw new Error("module not found");
    });

    try {
      const resolved = await resolvePhpPlugins({} as Options);
      expect(resolved).toBeNull();
    } finally {
      resetPhpPluginResolverForTests();
    }
  });
});
