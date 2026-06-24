import { describe, expect, it } from "vitest";
import { getCanonicalDirectiveName } from "../../src/lexer/directives.js";
import { Directives } from "../../src/tree/directives.js";
import { ArgumentRequirement, StructureRole } from "../../src/tree/types.js";
import { formatEqual } from "../helpers.js";

const LARAVEL_VIEW_COMPILER_DIRECTIVES = [
  "append",
  "auth",
  "aware",
  "bool",
  "break",
  "can",
  "canany",
  "cannot",
  "case",
  "checked",
  "choice",
  "class",
  "component",
  "componentFirst",
  "context",
  "continue",
  "csrf",
  "dd",
  "default",
  "disabled",
  "dump",
  "each",
  "else",
  "elseAuth",
  "elsecan",
  "elsecanany",
  "elsecannot",
  "elseGuest",
  "elseif",
  "elsePush",
  "elsePushIf",
  "empty",
  "endAuth",
  "endcan",
  "endcanany",
  "endcannot",
  "endComponent",
  "endComponentClass",
  "endComponentFirst",
  "endcontext",
  "endEmpty",
  "endEnv",
  "enderror",
  "endfor",
  "endforeach",
  "endforelse",
  "endfragment",
  "endGuest",
  "endif",
  "endIsset",
  "endlang",
  "endOnce",
  "endprepend",
  "endprependOnce",
  "endProduction",
  "endpush",
  "endPushIf",
  "endpushOnce",
  "endsection",
  "endsession",
  "endSlot",
  "endSwitch",
  "endunless",
  "endwhile",
  "env",
  "error",
  "extends",
  "extendsFirst",
  "fonts",
  "for",
  "foreach",
  "forelse",
  "fragment",
  "guest",
  "hasSection",
  "hasStack",
  "if",
  "include",
  "includeFirst",
  "includeIf",
  "includeIsolated",
  "includeUnless",
  "includeWhen",
  "inject",
  "isset",
  "js",
  "json",
  "lang",
  "method",
  "once",
  "overwrite",
  "parent",
  "php",
  "prepend",
  "prependOnce",
  "production",
  "props",
  "push",
  "pushIf",
  "pushOnce",
  "readonly",
  "required",
  "section",
  "sectionMissing",
  "selected",
  "session",
  "show",
  "slot",
  "stack",
  "stop",
  "style",
  "switch",
  "unless",
  "unset",
  "use",
  "vite",
  "viteReactRefresh",
  "while",
  "yield",
] as const;

const OPTIONAL_ARGUMENT_DIRECTIVES = [
  "auth",
  "elseAuth",
  "guest",
  "elseGuest",
  "once",
  "break",
  "continue",
  "php",
  "vite",
  "fonts",
] as const;

const REQUIRED_ARGUMENT_DIRECTIVES = ["use"] as const;
const NO_ARGUMENT_DIRECTIVES = ["parent"] as const;
const EXISTING_COMPATIBILITY_DIRECTIVES = [
  "elseenv",
  "elseproduction",
  "endhasSection",
  "endsectionMissing",
  "livewire",
  "livewireStyles",
  "livewireScripts",
  "entangle",
  "this",
  "persist",
  "endpersist",
  "teleport",
  "endteleport",
  "volt",
  "role",
  "endrole",
  "hasrole",
  "endhasrole",
  "feature",
  "endfeature",
  "featureany",
  "endfeatureany",
  "inertia",
  "inertiaHead",
  "filamentStyles",
  "filamentScripts",
  "svg",
  "paddleJS",
] as const;

describe("directives/laravel-view-compiler-audit", () => {
  it("registers every audited Laravel View compiler directive in tree metadata", () => {
    const directives = Directives.withDefaults();
    const registered = new Set(
      directives.getRegisteredDirectives().map((directive) => directive.name.toLowerCase()),
    );

    const missing = LARAVEL_VIEW_COMPILER_DIRECTIVES.filter(
      (directive) => !registered.has(directive.toLowerCase()),
    );

    expect(missing).toEqual([]);
  });

  it("keeps existing third-party and compatibility directives registered", () => {
    const directives = Directives.withDefaults();

    for (const directiveName of EXISTING_COMPATIBILITY_DIRECTIVES) {
      expect(directives.isDirective(directiveName), directiveName).toBe(true);
      expect(getCanonicalDirectiveName(directiveName), directiveName).not.toBeNull();
    }
  });

  it("tracks Laravel compiler argument requirements for overloaded and optional helpers", () => {
    const directives = Directives.withDefaults();

    for (const directiveName of OPTIONAL_ARGUMENT_DIRECTIVES) {
      expect(directives.getDirective(directiveName)?.args, directiveName).toBe(
        ArgumentRequirement.Optional,
      );
    }

    for (const directiveName of REQUIRED_ARGUMENT_DIRECTIVES) {
      expect(directives.getDirective(directiveName)?.args, directiveName).toBe(
        ArgumentRequirement.Required,
      );
    }

    for (const directiveName of NO_ARGUMENT_DIRECTIVES) {
      expect(directives.getDirective(directiveName)?.args, directiveName).toBe(
        ArgumentRequirement.NotAllowed,
      );
    }
  });

  it("keeps Laravel conditional helpers tied to generic compiled endif semantics", () => {
    const directives = Directives.withDefaults();

    for (const directiveName of ["hasSection", "hasStack", "sectionMissing", "once"] as const) {
      const directive = directives.getDirective(directiveName);

      expect(directive?.role, directiveName).toBe(StructureRole.Opening);
      expect(directive?.isCondition, directiveName).toBe(true);
      expect(directive?.terminators, directiveName).toContain("endif");
    }
  });

  it("exposes canonical lexer names for Laravel directives not covered by lowercase spelling", () => {
    const missingLexerNames = LARAVEL_VIEW_COMPILER_DIRECTIVES.filter(
      (directiveName) => getCanonicalDirectiveName(directiveName) === null,
    );

    expect(missingLexerNames).toEqual([]);
    expect(getCanonicalDirectiveName("hasstack")).toBe("hasStack");
    expect(getCanonicalDirectiveName("elsepush")).toBe("elsePush");
    expect(getCanonicalDirectiveName("endhassection")).toBe("endhasSection");
    expect(getCanonicalDirectiveName("endsectionmissing")).toBe("endsectionMissing");
    expect(getCanonicalDirectiveName("fonts")).toBe("fonts");
  });

  it("formats Laravel conditional helpers with generic compiled endif branches", async () => {
    const input = [
      "@hasstack('scripts')",
      '    <script src="/app.js"></script>',
      "@else",
      '    <script src="/fallback.js"></script>',
      "@endif",
      "",
      "@sectionMissing('navigation')",
      '    <nav class="fallback"></nav>',
      "@endif",
      "",
    ].join("\n");

    const expected = [
      "@hasStack ('scripts')",
      '  <script src="/app.js"></script>',
      "@else",
      '  <script src="/fallback.js"></script>',
      "@endif",
      "",
      "@sectionMissing ('navigation')",
      '  <nav class="fallback"></nav>',
      "@endif",
      "",
    ].join("\n");

    await formatEqual(input, expected, { bladeDirectiveCase: "canonical" });
  });

  it("formats optional Laravel helper arguments and inline php shorthand idempotently", async () => {
    const input = [
      "@fonts",
      "@vite",
      "@auth",
      "    <span>Signed in</span>",
      "@elseAuth('admin')",
      "    <span>Admin fallback</span>",
      "@endauth",
      "",
      "@once",
      "    @php($value=1+2)",
      "@endonce",
      "",
      "@switch($level)",
      "    @case(1)",
      "        @break(2)",
      "    @default",
      "        @continue($skip)",
      "@endswitch",
      "",
    ].join("\n");

    const expected = [
      "@fonts",
      "@vite",
      "@auth",
      "  <span>Signed in</span>",
      "@elseAuth ('admin')",
      "  <span>Admin fallback</span>",
      "@endauth",
      "",
      "@once",
      "  @php ($value = 1 + 2)",
      "@endonce",
      "",
      "@switch ($level)",
      "  @case (1)",
      "    @break (2)",
      "  @default",
      "    @continue ($skip)",
      "@endswitch",
      "",
    ].join("\n");

    await formatEqual(input, expected, {
      bladeDirectiveCase: "canonical",
      bladePhpFormatting: "safe",
      singleQuote: true,
    });
  });
});
