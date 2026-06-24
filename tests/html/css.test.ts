// Auto-generated from Prettier HTML snapshot: css/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import {
  LARGE_STYLE_EMBED_CHAR_THRESHOLD,
  LARGE_STYLE_EMBED_LINE_THRESHOLD,
} from "../../src/print/embed/raw-content.js";
import { formatEqual } from "../helpers.js";

describe("html/css", () => {
  it("formats short CSS property rules through CSS embedding", async () => {
    const input = `<style>
@property --tw-ring-color{syntax:"<color>";inherits:false;initial-value:#0000}
@property --tw-content{syntax:"*";inherits:false;initial-value:""}
.ring { color: var(--tw-ring-color); }
</style>
`;
    const expected = `<style>
  @property --tw-ring-color {
    syntax: "<color>";
    inherits: false;
    initial-value: #0000;
  }
  @property --tw-content {
    syntax: "*";
    inherits: false;
    initial-value: "";
  }
  .ring {
    color: var(--tw-ring-color);
  }
</style>
`;

    await formatEqual(input, expected);
  });

  it("keeps framework and preprocessor at-rules in CSS formatting", async () => {
    const input = `<style>
@tailwind base;
@tailwind components;
@tailwind utilities;
.btn{@apply font-bold text-white}
@theme{--color-brand:#123456}
@custom-media --narrow (width <= 30em);
@mixin card { border-radius: .5rem; }
</style>
`;
    const expected = `<style>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  .btn {
    @apply font-bold text-white;
  }
  @theme {
    --color-brand: #123456;
  }
  @custom-media --narrow (width <= 30em);
  @mixin card {
    border-radius: 0.5rem;
  }
</style>
`;

    await formatEqual(input, expected);
  });

  it("preserves large inline style at-rules without treating them as Blade directives", async () => {
    const utilityRuleCount = LARGE_STYLE_EMBED_LINE_THRESHOLD + 2;
    const utilityRules = Array.from(
      { length: utilityRuleCount },
      (_, index) => `.u-${index}{color:red;}`,
    ).join("\n");
    const indentedUtilityRules = utilityRules
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");

    const input = `<style>
@property --tw-ring-color { syntax: "*"; inherits: false; initial-value: #0000; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (min-width: 768px) { .md\\:block { display: block; } }
${utilityRules}
</style>
`;

    const expected = `<style>
  @property --tw-ring-color { syntax: "*"; inherits: false; initial-value: #0000; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (min-width: 768px) { .md\\:block { display: block; } }
${indentedUtilityRules}
</style>
`;

    await formatEqual(input, expected);
  });

  it("preserves byte-large inline style at-rules without falling back to Blade directive printing", async () => {
    const banner = `/* ${"x".repeat(LARGE_STYLE_EMBED_CHAR_THRESHOLD + 1)} */`;
    const input = `<style>
${banner}
@property --tw-ring-color { syntax: "*"; inherits: false; initial-value: #0000; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
`;

    const expected = `<style>
  ${banner}
  @property --tw-ring-color { syntax: "*"; inherits: false; initial-value: #0000; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
`;

    await formatEqual(input, expected);
  });

  it("preserves style at-rules when CSS parser embedding is bypassed", async () => {
    const input = `<style>
@property --tw-ring-color { syntax: "*"; }
.icon { content: "/foo\\ //"; }
</style>
`;
    const expected = `<style>
  @property --tw-ring-color { syntax: "*"; }
  .icon { content: "/foo\\ //"; }
</style>
`;

    await formatEqual(input, expected);
  });

  it("empty.html", async () => {
    const input = `<style></style>
`;
    const expected = `<style></style>
`;
    await formatEqual(input, expected);
  });

  it("less.html", async () => {
    const input = `<style type="text/less">
  @nice-blue: #5B83AD;
  @light-blue: @nice-blue + #111;

  #header {
    color: @light-blue;
  }
</style>

<style lang="less">
  @nice-blue: #5B83AD;
  @light-blue: @nice-blue + #111;

  #header {
    color: @light-blue;
  }
</style>
`;
    const expected = `<style type="text/less">
  @nice-blue: #5B83AD;
  @light-blue: @nice-blue + #111;

  #header {
    color: @light-blue;
  }
</style>

<style lang="less">
  @nice-blue: #5b83ad;
  @light-blue: @nice-blue + #111;

  #header {
    color: @light-blue;
  }
</style>
`;
    await formatEqual(input, expected);
  });

  it("mj-style.html", async () => {
    const input = `<mjml>

<mj-style> .should-not-format{
  as: 'css'
}</mj-style>

</mjml>
`;
    const expected = `<mjml>
  <mj-style> .should-not-format{ as: 'css' }</mj-style>
</mjml>
`;
    await formatEqual(input, expected);
  });

  it("postcss.html", async () => {
    const input = `<style type="text/css">
  body { background: navy; color: yellow; }
</style>

<style lang="postcss">
  body { background: navy; color: yellow; }
</style>
`;
    const expected = `<style type="text/css">
  body {
    background: navy;
    color: yellow;
  }
</style>

<style lang="postcss">
  body {
    background: navy;
    color: yellow;
  }
</style>
`;
    await formatEqual(input, expected);
  });

  it("scss.html", async () => {
    const input = `<style type="text/x-scss">
  $font-stack:    Helvetica, sans-serif;
  $primary-color: #333;

  body {
    font: 100% $font-stack;
    color: $primary-color;
  }
</style>

<style lang="scss">
  $font-stack:    Helvetica, sans-serif;
  $primary-color: #333;

  body {
    font: 100% $font-stack;
    color: $primary-color;
  }
</style>

<style lang="scss">
.someElement {
    @include bp-medium {
      display: flex;
    }
    
    @include bp-large {
      margin-top: 10px;
      margin-bottom: 10px;
    }
}
</style>
`;
    const expected = `<style type="text/x-scss">
  $font-stack: Helvetica, sans-serif;
  $primary-color: #333;

  body {
    font: 100% $font-stack;
    color: $primary-color;
  }
</style>

<style lang="scss">
  $font-stack: Helvetica, sans-serif;
  $primary-color: #333;

  body {
    font: 100% $font-stack;
    color: $primary-color;
  }
</style>

<style lang="scss">
  .someElement {
    @include bp-medium {
      display: flex;
    }

    @include bp-large {
      margin-top: 10px;
      margin-bottom: 10px;
    }
  }
</style>
`;
    await formatEqual(input, expected);
  });

  it("simple.html", async () => {
    const input = `<!DOCTYPE html>
<html>
  <head>
    <title>Sample styled page</title>
    <style>a { color: red; }</style>
    <style>
      body { background: navy; color: yellow; }
    </style>
  </head>
  <body>
    <h1>Sample styled page</h1>
    <p>This page is just a demo.</p>
  </body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <head>
    <title>Sample styled page</title>
    <style>
      a {
        color: red;
      }
    </style>
    <style>
      body {
        background: navy;
        color: yellow;
      }
    </style>
  </head>
  <body>
    <h1>Sample styled page</h1>
    <p>This page is just a demo.</p>
  </body>
</html>
`;
    await formatEqual(input, expected);
  });

  it("single-style.html", async () => {
    const input = `<style>a { color: red; }</style>
<style>
  h1 {
    font-size: 120%;
    font-family: Verdana, Arial, Helvetica, sans-serif;
    color: #333366;
  }
</style>
`;
    const expected = `<style>
  a {
    color: red;
  }
</style>
<style>
  h1 {
    font-size: 120%;
    font-family: Verdana, Arial, Helvetica, sans-serif;
    color: #333366;
  }
</style>
`;
    await formatEqual(input, expected);
  });

  it("preserves closing tags when php blocks appear in style values", async () => {
    const input = `<html>
<body>
<p>{{ $name }}</p>
<style>
.brand { color: @php echo $brand; @endphp; }
</style>
</body>
</html>
`;
    const expected = `<html>
    <body>
        <p>{{ $name }}</p>
        <style>
            .brand {
                color: @php echo $brand; @endphp;
            }
        </style>
    </body>
</html>
`;
    await formatEqual(input, expected, {
      singleQuote: true,
      htmlWhitespaceSensitivity: "css",
      printWidth: 120,
      tabWidth: 4,
      bladePhpFormatting: "safe",
      bladePhpFormattingTargets: ["directiveArgs", "phpBlock", "phpTag"],
      bladeDirectiveArgSpacing: "none",
      bladeEchoSpacing: "space",
    });
  });

  it("preserves declarations after php blocks in style values", async () => {
    const input = `<style>
.brand { color: @php echo $brand; @endphp; background: red; }
</style>
`;
    const expected = `<style>
  .brand {
    color: @php echo $brand; @endphp;
    background: red;
  }
</style>
`;
    await formatEqual(input, expected);
  });
});
