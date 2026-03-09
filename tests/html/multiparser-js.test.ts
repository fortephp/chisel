// Auto-generated from Prettier HTML snapshot: multiparser/js/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/multiparser-js", () => {
  it("html-with-js-script.html", async () => {
    const input = `<!DOCTYPE html>
<html lang="en">
<head>
    <script type="text/javascript">
    hello( 'world'
    )
    </script>
</head>
<body></body>
</html>

`;
    const expected = `<!doctype html>
<html lang="en">
  <head>
    <script type="text/javascript">
      hello("world");
    </script>
  </head>
  <body></body>
</html>
`;
    await formatEqual(input, expected);
  });

  it("script-tag-escaping.html", async () => {
    const input =
      "<script>\n  document.write(/* HTML */ `\n    <script>\n      document.write(/* HTML */ \\`\n        <!-- foo1 -->\n        <script>\n          document.write(/* HTML */ \\\\\\`<!-- bar1 --> bar <!-- bar2 -->\\\\\\`);\n        <\\\\/script>\n        <!-- foo2 -->\n      \\`);\n    <\\/script>\n  `);\n</script>\n";
    const expected =
      "<script>\n  document.write(/* HTML */ `\n    <script>\n      document.write(/* HTML */ \\`\n        <!-- foo1 -->\n        <script>\n          document.write(\n            /* HTML */ \\\\\\`<!-- bar1 -->\n              bar\n              <!-- bar2 -->\\\\\\`,\n          );\n        <\\\\/script>\n        <!-- foo2 -->\n      \\`);\n    <\\/script>\n  `);\n</script>\n";
    await formatEqual(input, expected);
  });
});
