// Auto-generated from Prettier HTML snapshot: multiparser/ts/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/multiparser-ts", () => {
  it("html-with-ts-script.html", async () => {
    const input = `<!DOCTYPE html>
<html lang="en">
<head>
    <script lang="ts">
    type X = { [
        K in keyof Y
    ]: Partial < K >  } ;

    class   Foo< T >{

        constructor ( private foo: keyof Apple ){


        }
    }
    </script>
</head>
<body></body>
</html>

`;
    const expected = `<!doctype html>
<html lang="en">
  <head>
    <script lang="ts">
      type X = { [K in keyof Y]: Partial<K> };

      class Foo<T> {
        constructor(private foo: keyof Apple) {}
      }
    </script>
  </head>
  <body></body>
</html>
`;
    await formatEqual(input, expected);
  });
});
