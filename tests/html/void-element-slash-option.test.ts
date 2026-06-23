import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/void-element-slash-option", () => {
  it("prints standard HTML void elements with slashes by default", async () => {
    const input = `<div><meta charset="utf-8"><br></div>
`;
    const expected = `<div><meta charset="utf-8" /><br /></div>
`;

    await formatEqual(input, expected);
  });

  it("can omit slashes from standard HTML void elements", async () => {
    const input = `<div><meta charset="utf-8"><input type="text" /><br></div>
`;
    const expected = `<div><meta charset="utf-8"><input type="text"><br></div>
`;

    await formatEqual(input, expected, { bladeVoidElementSlash: "never" });
  });

  it("applies the slash option when void element markers are borrowed by text", async () => {
    const input = `<p>Test<wbr>content</p>
`;
    const expected = `<p>Test<wbr>content</p>
`;

    await formatEqual(input, expected, { bladeVoidElementSlash: "never" });
  });

  it("can preserve source slashes on standard HTML void elements", async () => {
    const input = `<div><meta charset="utf-8"><input type="text" /><br/></div>
`;
    const expected = `<div><meta charset="utf-8"><input type="text" /><br /></div>
`;

    await formatEqual(input, expected, { bladeVoidElementSlash: "preserve" });
  });

  it("keeps non-void self-closing tags and Blade components self-closing", async () => {
    const input = `<div><section /><custom-element /><x-button /></div>
`;
    const expected = `<div>
  <section />
  <custom-element /><x-button />
</div>
`;

    await formatEqual(input, expected, { bladeVoidElementSlash: "never" });
  });
});
