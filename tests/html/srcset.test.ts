// Auto-generated from Prettier HTML snapshot: srcset/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/srcset", () => {
  it("invalid.html", async () => {
    const input = `<img src="a"
srcset="
 should-not-format  400w 100h,
       should-not-format  500w 200h
"
 alt=""/>

<img src="a"
srcset="
 should-not-format ,, should-not-format 0q,,,
"
 alt=""/>

<img src="a"
srcset=",,,"/>

<img src="a"
srcset="   "/>
`;
    const expected = `<img
  src="a"
  srcset="
 should-not-format  400w 100h,
       should-not-format  500w 200h
"
  alt=""
/>

<img
  src="a"
  srcset="
 should-not-format ,, should-not-format 0q,,,
"
  alt=""
/>

<img src="a" srcset=",,," />

<img src="a" srcset="   " />
`;
    await formatEqual(input, expected);
  });
});
