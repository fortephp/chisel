// Auto-generated from Prettier HTML snapshot: cdata/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/cdata", () => {
  it("example.html", async () => {
    const input = `<span><![CDATA[<sender>John Smith</sender>]]></span>

<span><![CDATA[1]]> a <![CDATA[2]]></span>
<span><![CDATA[1]]> <br> <![CDATA[2]]></span>
`;
    const expected = `<span><![CDATA[<sender>John Smith</sender>]]></span>

<span><![CDATA[1]]> a <![CDATA[2]]></span>
<span
  ><![CDATA[1]]> <br />
  <![CDATA[2]]></span
>
`;
    await formatEqual(input, expected);
  });
});
