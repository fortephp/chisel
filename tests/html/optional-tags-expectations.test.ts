import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/optional-tags-expectations", () => {
  it("preserves omitted non-optional closing tags by default", async () => {
    await formatEqual("<div>\n\n<script>\n\n</script>\n", "<div>\n  <script></script>\n");
  });

  it("inserts omitted non-optional closing tags when enabled", async () => {
    await formatEqual("<div>\n\n<script>\n\n</script>\n", "<div>\n  <script></script>\n</div>\n", {
      bladeInsertOptionalClosingTags: true,
    });
  });

  it("preserves list-item omissions by default", async () => {
    await formatEqual("<ul><li>one<li>two</ul>\n", "<ul>\n  <li>one\n  <li>two\n</ul>\n");
  });

  it("auto-closes list items on sibling <li> when enabled", async () => {
    await formatEqual(
      "<ul><li>one<li>two</ul>\n",
      "<ul>\n  <li>one</li>\n  <li>two</li>\n</ul>\n",
      { bladeInsertOptionalClosingTags: true },
    );
  });

  it("preserves dt/dd omissions by default", async () => {
    await formatEqual(
      "<dl><dt>term<dd>definition<dt>term2</dl>\n",
      "<dl>\n  <dt>term\n  <dd>definition\n  <dt>term2\n</dl>\n",
    );
  });

  it("auto-closes dt/dd when enabled", async () => {
    await formatEqual(
      "<dl><dt>term<dd>definition<dt>term2</dl>\n",
      "<dl>\n  <dt>term</dt>\n  <dd>definition</dd>\n  <dt>term2</dt>\n</dl>\n",
      { bladeInsertOptionalClosingTags: true },
    );
  });

  it("preserves omitted paragraph closing before block content by default", async () => {
    await formatEqual("<p>intro<div>block</div>\n", "<p>intro\n<div>block</div>\n");
  });

  it("auto-closes paragraph before block content when enabled", async () => {
    await formatEqual("<p>intro<div>block</div>\n", "<p>intro</p>\n<div>block</div>\n", {
      bladeInsertOptionalClosingTags: true,
    });
  });

  it("preserves omitted option closing tags by default", async () => {
    await formatEqual(
      "<select><option>a<option>b</select>\n",
      "<select>\n  <option>a\n  <option>b\n</select>\n",
    );
  });

  it("auto-closes option elements in select when enabled", async () => {
    await formatEqual(
      "<select><option>a<option>b</select>\n",
      "<select>\n  <option>a</option>\n  <option>b</option>\n</select>\n",
      { bladeInsertOptionalClosingTags: true },
    );
  });

  it("auto-closes table cells on sibling td when enabled", async () => {
    await formatEqual(
      "<table><tr><td>a<td>b</table>\n",
      "<table>\n  <tr>\n    <td>a</td>\n    <td>b</td>\n  </tr>\n</table>\n",
      { bladeInsertOptionalClosingTags: true },
    );
  });

  it("preserves omitted li closing at parent end by default", async () => {
    await formatEqual("<menu><li>one</menu>\n", "<menu><li>one</menu>\n");
  });

  it("auto-closes li at parent end when enabled", async () => {
    await formatEqual("<menu><li>one</menu>\n", "<menu><li>one</li></menu>\n", {
      bladeInsertOptionalClosingTags: true,
    });
  });

  it("auto-closes option at optgroup end when enabled", async () => {
    await formatEqual(
      '<select><optgroup label="x"><option>a</optgroup></select>\n',
      '<select>\n  <optgroup label="x"><option>a</option></optgroup>\n</select>\n',
      { bladeInsertOptionalClosingTags: true },
    );
  });

  it("auto-closes td at row end when enabled", async () => {
    await formatEqual(
      "<table><tr><td>x</tr></table>\n",
      "<table>\n  <tr>\n    <td>x</td>\n  </tr>\n</table>\n",
      { bladeInsertOptionalClosingTags: true },
    );
  });

  it("auto-close behavior is preserved inside directive wrappers when enabled", async () => {
    await formatEqual(
      "@if($show)\n<ul><li>{{ $one }}<li>{{ $two }}</ul>\n@endif\n",
      "@if ($show)\n  <ul>\n    <li>{{ $one }}</li>\n    <li>{{ $two }}</li>\n  </ul>\n@endif\n",
      { bladeInsertOptionalClosingTags: true },
    );
  });
});
