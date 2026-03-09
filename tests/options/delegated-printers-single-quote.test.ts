import { describe, expect, it } from "vitest";
import * as prettierStandalone from "prettier/standalone";
import htmlPlugin from "prettier/plugins/html";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { format } from "../helpers.js";

describe("options/delegated-printers-single-quote", () => {
  it("formats JS with singleQuote even when bladePhpFormatting is off, while php constructs stay unchanged", async () => {
    const input = [
      '@if($user->isAdmin(""))',
      "@endif",
      '{{ "abc" }}',
      '<script>var hello = "world";</script>',
      "",
    ].join("\n");

    const off = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      singleQuote: true,
      bladePhpFormatting: "off",
      bladeDirectiveArgSpacing: "space",
    });
    const safe = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      singleQuote: true,
      bladePhpFormatting: "safe",
      bladeDirectiveArgSpacing: "space",
    });

    // JS delegate is active regardless of Blade PHP mode.
    expect(off).toContain("var hello = 'world';");
    expect(safe).toContain("var hello = 'world';");

    // Blade PHP constructs only use PHP quoting when Blade PHP formatting is enabled.
    expect(off).toContain('@if ($user->isAdmin(""))');
    expect(off).toContain('{{ "abc" }}');
    expect(safe).toContain("@if ($user->isAdmin(''))");
    expect(safe).toContain("{{ 'abc' }}");
  });

  it("passes singleQuote to script tag embedding", async () => {
    const input = '<script>const label = "hello"</script>\n';

    const single = await format(input, { singleQuote: true });
    const double = await format(input, { singleQuote: false });

    expect(single).toContain("const label = 'hello';");
    expect(double).toContain('const label = "hello";');
  });

  it("passes singleQuote to style tag embedding", async () => {
    const input = '<style>.a::before{content:"hello"}</style>\n';

    const single = await format(input, { singleQuote: true });
    const double = await format(input, { singleQuote: false });

    expect(single).toContain("content: 'hello';");
    expect(double).toContain('content: "hello";');
  });

  it("delegates inline event handler attributes to JS formatter", async () => {
    const input = '<button onclick="return foo(&quot;hello&quot;);"></button>\n';

    const single = await format(input, { singleQuote: true });
    const double = await format(input, { singleQuote: false });

    expect(single).toContain("foo('hello')");
    // Prettier prefers single quotes in HTML attributes here to avoid
    // heavy escaping even when singleQuote=false.
    expect(double).toContain("foo('hello')");
  });

  it("delegates Alpine attributes to JS formatter", async () => {
    const input = '<div x-data="{ foo: &quot;hello&quot; }"></div>\n';

    const single = await format(input, { singleQuote: true });
    const double = await format(input, { singleQuote: false });

    expect(single).toContain("{ foo: 'hello' }");
    // Same escaping-minimizing behavior applies in this attribute context.
    expect(double).toContain("{ foo: 'hello' }");
  });

  it("passes trailingComma to inline event handler embedding", async () => {
    const input = '<button onclick="run({ alpha: 1, beta: 2, gamma: 3, longKey: 4 })"></button>\n';

    const withTrailing = await format(input, {
      printWidth: 40,
      trailingComma: "all",
    });
    const withoutTrailing = await format(input, {
      printWidth: 40,
      trailingComma: "none",
    });

    expect(withTrailing).toContain("longKey: 4,");
    expect(withoutTrailing).toContain("longKey: 4");
    expect(withoutTrailing).not.toContain("longKey: 4,");
  });

  it("passes trailingComma to Alpine attribute embedding", async () => {
    const input = '<div x-data="{ alpha: 1, beta: 2, gamma: 3, longKey: 4 }"></div>\n';

    const withTrailing = await format(input, {
      printWidth: 40,
      trailingComma: "all",
    });
    const withoutTrailing = await format(input, {
      printWidth: 40,
      trailingComma: "none",
    });

    expect(withTrailing).toContain("longKey: 4,");
    expect(withoutTrailing).toContain("longKey: 4");
    expect(withoutTrailing).not.toContain("longKey: 4,");
  });

  it("passes singleQuote through mixed raw-content script embedding", async () => {
    const input = `<script>
const greeting = "hello";
@if ($ready)
console.log("ready");
@endif
</script>
`;

    const single = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      singleQuote: true,
    });
    const double = await format(input, {
      plugins: [bladePlugin, phpPlugin],
      bladePhpFormatting: "safe",
      singleQuote: false,
    });

    expect(single).toContain("const greeting = 'hello';");
    expect(single).toContain("console.log('ready');");
    expect(double).toContain('const greeting = "hello";');
    expect(double).toContain('console.log("ready");');
  });

  it("auto-loads embedded parser plugins in standalone for script/style formatting", async () => {
    const input = '<style>.a{content:"hello"}</style>\n<script>const label="hello"</script>\n';

    const single = await prettierStandalone.format(input, {
      parser: "blade",
      plugins: [htmlPlugin, phpPlugin, bladePlugin],
      singleQuote: true,
    });
    const double = await prettierStandalone.format(input, {
      parser: "blade",
      plugins: [htmlPlugin, phpPlugin, bladePlugin],
      singleQuote: false,
    });

    expect(single).toContain("content: 'hello';");
    expect(single).toContain("const label = 'hello';");

    expect(double).toContain('content: "hello";');
    expect(double).toContain('const label = "hello";');
  });
});
