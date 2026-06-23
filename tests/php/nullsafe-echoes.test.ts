import { describe, expect, it } from "vitest";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { formatEqual } from "../helpers.js";

const withPhp = {
  plugins: [bladePlugin, phpPlugin],
  bladePhpFormatting: "safe" as const,
};

function expectNoEchoWrapperArtifacts(output: string): void {
  expect(output).not.toContain("__prettier_blade_echo__");
  expect(output).not.toContain("/*__BLADE_PHP_FMT_START__*/");
  expect(output).not.toContain("/*__BLADE_PHP_FMT_END__*/");
  expect(output).not.toMatch(/\{\{[\s\r\n]*=/u);
  expect(output).not.toMatch(/\{!![\s\r\n]*=/u);
  expect(output).not.toMatch(/\{\{\{[\s\r\n]*=/u);
}

describe("php/nullsafe-echoes", () => {
  it("formats tight nullsafe echoes without leaking wrapper syntax", async () => {
    const output = await formatEqual("{{ $user?->name }}\n", "{{$user?->name}}\n", {
      ...withPhp,
      bladeEchoSpacing: "tight",
    });
    expectNoEchoWrapperArtifacts(output);
  });

  it("formats raw and triple nullsafe chains across line breaks", async () => {
    const raw = await formatEqual(
      "{!! $user?->teams()?->first()?->name !!}\n",
      `{!!\n  $user\n    ?->teams()\n    ?->first()\n    ?->name\n!!}\n`,
      {
        ...withPhp,
        printWidth: 20,
      },
    );
    const triple = await formatEqual(
      "{{{ $user?->teams()?->first()?->name }}}\n",
      `{{{\n  $user\n    ?->teams()\n    ?->first()\n    ?->name\n}}}\n`,
      {
        ...withPhp,
        printWidth: 20,
      },
    );
    expectNoEchoWrapperArtifacts(raw);
    expectNoEchoWrapperArtifacts(triple);
  });

  it("formats nullsafe chains mixed with array access and coalescing", async () => {
    const output = await formatEqual(
      "{{ $user?->teams()[0]?->owner?->name ?? 'guest' }}\n",
      `{{\n  $user?->teams()[0]\n    ?->owner?->name ??\n    "guest"\n}}\n`,
      {
        ...withPhp,
        printWidth: 28,
      },
    );
    expectNoEchoWrapperArtifacts(output);
  });

  it("formats nullsafe chains inside inline text runs", async () => {
    const output = await formatEqual(
      "<p>Hello {{ auth()->user()?->profile()?->displayName() }} world</p>\n",
      "<p>\n  Hello {{\n    auth()\n      ->user()\n      ?->profile()\n      ?->displayName()\n  }} world\n</p>\n",
      {
        ...withPhp,
        printWidth: 36,
      },
    );
    expectNoEchoWrapperArtifacts(output);
  });

  it("formats title-only nullsafe echoes", async () => {
    const output = await formatEqual(
      "<title>{{ auth()->user()?->profile()?->displayName() }}</title>\n",
      "<title>\n  {{\n    auth()\n      ->user()\n      ?->profile()\n      ?->displayName()\n  }}\n</title>\n",
      {
        ...withPhp,
        printWidth: 36,
      },
    );
    expectNoEchoWrapperArtifacts(output);
  });

  it("formats nullsafe echoes in aggressive mode and echo-only target mode", async () => {
    const aggressive = await formatEqual(
      "{{ auth()->user()?->profile()?->displayName() }}\n",
      "{{\n  auth()\n    ->user()\n    ?->profile()\n    ?->displayName()\n}}\n",
      {
        plugins: [bladePlugin, phpPlugin],
        bladePhpFormatting: "aggressive",
        printWidth: 24,
      },
    );
    const echoOnly = await formatEqual(
      "{{ auth()->user()?->name }}\n",
      "{{\n  auth()->user()\n    ?->name\n}}\n",
      {
        ...withPhp,
        bladePhpFormattingTargets: ["echo"],
        printWidth: 24,
      },
    );
    expectNoEchoWrapperArtifacts(aggressive);
    expectNoEchoWrapperArtifacts(echoOnly);
  });
});
