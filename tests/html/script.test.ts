// Auto-generated from Prettier HTML snapshot: script/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/script", () => {
  it("babel.html", async () => {
    const input = `<script type="text/babel" data-presets="react" data-type="module">
import { h, 
         render } from 'https://unpkg.com/preact?module';
render(
<h1>Hello World!</h1>,
         document.body
);
</script>

<script type="text/jsx" data-presets="react" data-type="module">
import { h, 
         render } from 'https://unpkg.com/preact?module';
render(
<h1>Hello World!</h1>,
         document.body
);
</script>

<script type="text/babel">
<!--
alert(1)
-->
</script>
`;
    const expected = `<script type="text/babel" data-presets="react" data-type="module">
  import { h, render } from "https://unpkg.com/preact?module";
  render(<h1>Hello World!</h1>, document.body);
</script>

<script type="text/jsx" data-presets="react" data-type="module">
  import { h, render } from "https://unpkg.com/preact?module";
  render(<h1>Hello World!</h1>, document.body);
</script>

<script type="text/babel">
  <!--
  alert(1);
  -->
</script>
`;
    await formatEqual(input, expected);
  });

  it("script-comments.html", async () => {
    const input = `
<script>
<!--
alert(1)
-->
</script>

<script>
<!--
alert(2)
//-->
</script>
`;
    const expected = `<script>
  <!--
  alert(1);
  -->
</script>

<script>
  <!--
  alert(2);
  //-->
</script>
`;
    await formatEqual(input, expected);
  });

  it("module.html", async () => {
    const input = `<script type="module">
import prettier from "prettier/standalone";
import parserGraphql from "prettier/parser-graphql";

prettier.format("query { }", {
                      parser: "graphql",
  plugins: [
parserGraphql],
});
</script>

<script type="module">
async function foo() {
  let x=10;while(x-->0)console.log(x)
  await(import('mod'))
}
</script>
`;
    const expected = `<script type="module">
  import prettier from "prettier/standalone";
  import parserGraphql from "prettier/parser-graphql";

  prettier.format("query { }", {
    parser: "graphql",
    plugins: [parserGraphql],
  });
</script>

<script type="module">
  async function foo() {
    let x = 10;
    while (x-- > 0) console.log(x);
    await import("mod");
  }
</script>
`;
    await formatEqual(input, expected);
  });

  it("module-attributes.html", async () => {
    const input = `<script src="foo.wasm" type="module" withtype="webassembly"></script>
`;
    const expected = `<script src="foo.wasm" type="module" withtype="webassembly"></script>
`;
    await formatEqual(input, expected);
  });

  it("script.html", async () => {
    const input = `<script type="application/ld+json">
  {   "json": true }
</script>
<script type="application/json">
  {   "json":true  }
</script>
<script type="importmap">
  {   "json":true  }
</script>
<script type="systemjs-importmap">
  {   "json":true  }
</script><script type="invalid">
  {   "json":false  }
</script>
<script type="text/html">
  <div>
  <p>foo</p>
  </div>
</script>

<script
  async=""
  id=""
  src="/_next/static/development/pages/_app.js?ts=1565732195968"
></script><script></script>

<!-- #8147 -->
<script lang="vbscript">
Function hello()
End Function
</script>

<script lang="unknown">
</script>

<script type="speculationrules">
  {
   "prerender": [
  {"source": "list", "urls": ["https://a.test/foo"]}
  ]
  }
  </script>
`;
    const expected = `<script type="application/ld+json">
  { "json": true }
</script>
<script type="application/json">
  { "json": true }
</script>
<script type="importmap">
  { "json": true }
</script>
<script type="systemjs-importmap">
  { "json": true }
</script>
<script type="invalid">
  {   "json":false  }
</script>
<script type="text/html">
  <div>
    <p>foo</p>
  </div>
</script>

<script
  async=""
  id=""
  src="/_next/static/development/pages/_app.js?ts=1565732195968"
></script>
<script></script>

<!-- #8147 -->
<script lang="vbscript">
  Function hello()
  End Function
</script>

<script lang="unknown"></script>

<script type="speculationrules">
  {
    "prerender": [{ "source": "list", "urls": ["https://a.test/foo"] }]
  }
</script>
`;
    await formatEqual(input, expected);
  });
});
