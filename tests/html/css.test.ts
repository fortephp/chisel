// Auto-generated from Prettier HTML snapshot: css/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/css", () => {
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
});
