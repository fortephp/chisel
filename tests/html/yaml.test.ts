// Auto-generated from Prettier HTML snapshot: yaml/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/yaml", () => {
  it("invalid.html", async () => {
    const input = `---
[
    ! should NOT format !
because: 
this is INVALID yaml
---

<html><head></head><body></body></html>
`;
    const expected = `---
[
    ! should NOT format !
because: 
this is INVALID yaml
---

<html>
  <head></head>
  <body></body>
</html>
`;
    await formatEqual(input, expected);
  });

  it("yaml.html", async () => {
    const input = `---
hello:     world
---






<html><head></head><body></body></html>
`;
    const expected = `---
hello: world
---

<html>
  <head></head>
  <body></body>
</html>
`;
    await formatEqual(input, expected);
  });
});
