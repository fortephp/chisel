import { describe, expect, it } from "vitest";
import plugin from "../../src/index.js";
import { formatEqual } from "../helpers.js";
import * as tailwindPlugin from "prettier-plugin-tailwindcss";

const sortedClasses = "z-10 bg-red-500 font-bold";

const throwingTailwindPlugin = {
  options: {
    tailwindConfig: {
      type: "string",
      category: "Tailwind CSS",
      description: "Path to Tailwind configuration file",
    },
  },
  parsers: {
    html: {
      parse() {
        throw new Error("failed to parse");
      },
    },
  },
};

describe("html/tailwind-integration", () => {
  it("uses the real tailwind plugin parser for class sorting", async () => {
    const input = `<div class="z-10 font-bold bg-red-500"></div>
`;
    const expected = `<div class="z-10 bg-red-500 font-bold"></div>
`;

    await formatEqual(input, expected, {
      plugins: [plugin, tailwindPlugin],
    });
  });

  it("uses the real tailwind plugin parser for jsx-style className sorting", async () => {
    const input = `<div className="z-10 font-bold bg-red-500"></div>
`;
    const expected = `<div className="z-10 bg-red-500 font-bold"></div>
`;

    await formatEqual(input, expected, {
      plugins: [plugin, tailwindPlugin],
    });
  });

  it("supports tailwind parser objects", async () => {
    let parseCalls = 0;
    const parserObjectTailwindPlugin = {
      name: "prettier-plugin-tailwindcss",
      parsers: {
        html: {
          parse(text: string, options: { parser?: string }) {
            parseCalls++;
            expect(text).toContain('<div class="');
            expect(options.parser).toBe("html");
            return { attrs: [{ name: "class", value: sortedClasses }] };
          },
        },
      },
    };

    const input = `<div class="z-10 font-bold bg-red-500"></div>
`;
    const expected = `<div class="z-10 bg-red-500 font-bold"></div>
`;

    await formatEqual(input, expected, {
      plugins: [plugin, parserObjectTailwindPlugin],
    });
    expect(parseCalls).toBeGreaterThan(0);
  });

  it("supports tailwind parser factories", async () => {
    let factoryCalls = 0;
    let parseCalls = 0;
    const parserFactoryTailwindPlugin = {
      name: "prettier-plugin-tailwindcss",
      parsers: {
        html: async () => {
          factoryCalls++;
          return {
            parse(text: string, options: { parser?: string }) {
              parseCalls++;
              expect(text).toContain('<div class="');
              expect(options.parser).toBe("html");
              return { attrs: [{ name: "class", value: sortedClasses }] };
            },
          };
        },
      },
    };

    const input = `<div class="z-10 font-bold bg-red-500"></div>
`;
    const expected = `<div class="z-10 bg-red-500 font-bold"></div>
`;

    await formatEqual(input, expected, {
      plugins: [plugin, parserFactoryTailwindPlugin],
    });
    expect(factoryCalls).toBeGreaterThan(0);
    expect(parseCalls).toBeGreaterThan(0);
  });

  it("falls back to default class normalization when tailwind parser fails", async () => {
    const input = `<div class="z-10   font-bold   bg-red-500"></div>
`;
    const expected = `<div class="z-10 font-bold bg-red-500"></div>
`;

    await formatEqual(input, expected, {
      plugins: [plugin, throwingTailwindPlugin],
    });
  });

  it("falls back to default className normalization when tailwind parser fails", async () => {
    const input = `<div className="z-10   font-bold   bg-red-500"></div>
`;
    const expected = `<div className="z-10 font-bold bg-red-500"></div>
`;

    await formatEqual(input, expected, {
      plugins: [plugin, throwingTailwindPlugin],
    });
  });
});
