// Auto-generated from Prettier HTML snapshot: multiparser/unknown/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/multiparser-unknown", () => {
  it("unknown-lang.html", async () => {
    const input = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <style lang="unknown">
.prettier {
content:
"awesome"
          }
</style>

<script lang="unknown">
prettier.is
                  .awesome(
)
</script>

<script type="unknown">
prettier.is
                  .awesome(
)
</script>

<script type="unknown" lang="unknown">
prettier.is
                  .awesome(
)
</script>
</body>
</html>
`;
    const expected = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <style lang="unknown">
      .prettier {
      content:
      "awesome"
                }
    </style>

    <script lang="unknown">
      prettier.is
                        .awesome(
      )
    </script>

    <script type="unknown">
      prettier.is
                        .awesome(
      )
    </script>

    <script type="unknown" lang="unknown">
      prettier.is
                        .awesome(
      )
    </script>
  </body>
</html>
`;
    await formatEqual(input, expected);
  });
});
