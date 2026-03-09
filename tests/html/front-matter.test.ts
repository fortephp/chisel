// Auto-generated from Prettier HTML snapshot: front-matter/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/front-matter", () => {
  it("custom-parser.html", async () => {
    const input = `---mycustomparser
  
title: Hello
slug: home

---

<h1>
  Hello world!</h1>
`;
    const expected = `---mycustomparser
  
title: Hello
slug: home

---

<h1>Hello world!</h1>
`;
    await formatEqual(input, expected);
  });

  it("empty.html", async () => {
    const input = `---
---

<h1>
  Hello world!</h1>
`;
    const expected = `---
---

<h1>Hello world!</h1>
`;
    await formatEqual(input, expected);
  });

  it("empty2.html", async () => {
    const input = `---
---

<div>
---
</div>
`;
    const expected = `---
---

<div>---</div>
`;
    await formatEqual(input, expected);
  });

  it("issue-9042.html", async () => {
    const input = `---
layout: foo
---

Test <a
href="https://prettier.io">abc</a>.
`;
    const expected = `---
layout: foo
---

Test <a href="https://prettier.io">abc</a>.
`;
    await formatEqual(input, expected);
  });

  it("issue-9042-no-empty-line.html", async () => {
    const input = `---
layout: foo
---
Test <a
href="https://prettier.io">abc</a>.
`;
    const expected = `---
layout: foo
---

Test <a href="https://prettier.io">abc</a>.
`;
    await formatEqual(input, expected);
  });

  it("unicode.html", async () => {
    const input = `---
title: "ABC 漢字 🇯🇵"
---

<!-- this is a comment -->
`;
    const expected = `---
title: "ABC 漢字 🇯🇵"
---

<!-- this is a comment -->
`;
    await formatEqual(input, expected);
  });

  it("supports front matter with CRLF line endings", async () => {
    const input = [
      "---",
      "layout: foo",
      "---",
      "Test <a",
      'href="https://prettier.io">abc</a>.',
      "",
    ].join("\r\n");

    const expected = [
      "---",
      "layout: foo",
      "---",
      "",
      'Test <a href="https://prettier.io">abc</a>.',
      "",
    ].join("\r\n");

    await formatEqual(input, expected, { endOfLine: "crlf" });
  });

  it("supports front matter with CR line endings", async () => {
    const input = [
      "---",
      "layout: foo",
      "---",
      "Test <a",
      'href="https://prettier.io">abc</a>.',
      "",
    ].join("\r");

    const expected = [
      "---",
      "layout: foo",
      "---",
      "",
      'Test <a href="https://prettier.io">abc</a>.',
      "",
    ].join("\r");

    await formatEqual(input, expected, { endOfLine: "cr" });
  });
});
