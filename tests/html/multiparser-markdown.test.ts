// Auto-generated from Prettier HTML snapshot: multiparser/markdown/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/multiparser-markdown", () => {
  it("html-with-markdown-script.html", async () => {
    const input = `<!DOCTYPE html>
<html lang="en">
<head>
    <script type="text/markdown">
        # hello
        + **foo**
        + __bar__
    </script>
</head>
<body></body>
</html>

`;
    const expected = `<!doctype html>
<html lang="en">
  <head>
    <script type="text/markdown">
      # hello

      - **foo**
      - **bar**
    </script>
  </head>
  <body></body>
</html>
`;
    await formatEqual(input, expected);
  });
});
