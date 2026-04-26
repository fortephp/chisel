import { describe, expect, it } from "vitest";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { format } from "../helpers.js";

const opts = {
  plugins: [bladePlugin, phpPlugin],
  bladePhpFormatting: "safe" as const,
  singleQuote: false,
};

describe("options/component-open-tag-echo-quotes", () => {
  it("forces single quotes inside echo in Blade component open tag", async () => {
    const out = await format(
      `<x-web.section {{ $attributes->class('min-h-dvh dark:bg-blue-grey-950') }}></x-web.section>\n`,
      opts,
    );
    expect(out).toMatchInlineSnapshot(`
      "<x-web.section
        {{
          $attributes->class(
            'min-h-dvh dark:bg-blue-grey-950',
          )
        }}
      ></x-web.section>
      "
    `);
  });

  it("applies to colon-namespaced component prefixes (livewire:, s:)", async () => {
    const livewire = await format(
      `<livewire:foo {{ $attributes->class('a b') }}></livewire:foo>\n`,
      opts,
    );
    expect(livewire).toContain("'a b'");
    expect(livewire).not.toContain('"a b"');

    const sNs = await format(`<s:card {{ $attributes->class('a b') }}></s:card>\n`, opts);
    expect(sNs).toContain("'a b'");
    expect(sNs).not.toContain('"a b"');
  });

  it("applies to raw and triple echoes in component open tags", async () => {
    const raw = await format(`<x-card {!! $attributes->class('a b') !!}></x-card>\n`, opts);
    expect(raw).toContain("'a b'");
    expect(raw).not.toContain('"a b"');

    const triple = await format(`<x-card {{{ $attributes->class('a b') }}}></x-card>\n`, opts);
    expect(triple).toContain("'a b'");
    expect(triple).not.toContain('"a b"');
  });

  it("does not affect echoes in component body content", async () => {
    const out = await format(`<x-card>{{ $foo->bar('baz') }}</x-card>\n`, opts);
    // singleQuote: false → PHP formatter switches to double quotes inside body echoes.
    expect(out).toContain('"baz"');
  });

  it("respects user singleQuote: true (no regression)", async () => {
    const out = await format(`<x-card>{{ $foo->bar('baz') }}</x-card>\n`, {
      ...opts,
      singleQuote: true,
    });
    expect(out).toContain("'baz'");
    expect(out).not.toContain('"baz"');
  });
});
