// Auto-generated from Prettier HTML snapshot: multiparser/css/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/multiparser-css", () => {
  it("html-with-css-style.html", async () => {
    const input = `<!DOCTYPE html>
<html lang="en">
<head>
    <style>
    blink{

        display:  none ;}
    </style>
</head>
<body></body>
</html>

`;
    const expected = `<!doctype html>
<html lang="en">
  <head>
    <style>
      blink {
        display: none;
      }
    </style>
  </head>
  <body></body>
</html>
`;
    await formatEqual(input, expected);
  });
});
