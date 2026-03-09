import { describe, expect, it } from "vitest";
import { format } from "../helpers.js";

type OptionalCase = {
  name: string;
  element: string;
  minOpens: number;
  input: string;
};

const siblingAutoCloseCases: OptionalCase[] = [
  { name: "li on li sibling", element: "li", minOpens: 2, input: "<ul><li>one<li>two</ul>\n" },
  {
    name: "dt on dd sibling",
    element: "dt",
    minOpens: 1,
    input: "<dl><dt>term<dd>definition</dl>\n",
  },
  {
    name: "dd on dt sibling",
    element: "dd",
    minOpens: 1,
    input: "<dl><dt>term<dd>definition<dt>term2</dl>\n",
  },
  { name: "p on block sibling", element: "p", minOpens: 1, input: "<p>intro<div>block</div>\n" },
  {
    name: "option on option sibling",
    element: "option",
    minOpens: 2,
    input: "<select><option>a<option>b</select>\n",
  },
  {
    name: "optgroup on optgroup sibling",
    element: "optgroup",
    minOpens: 2,
    input:
      '<select><optgroup label="a"><option>x</option><optgroup label="b"><option>y</option></select>\n',
  },
  {
    name: "rt on rp sibling",
    element: "rt",
    minOpens: 1,
    input: "<ruby><rb>a</rb><rt>b<rp>(</rp></ruby>\n",
  },
  {
    name: "rp on rt sibling",
    element: "rp",
    minOpens: 1,
    input: "<ruby><rb>a</rb><rp>(<rt>b</rt></ruby>\n",
  },
  { name: "rb on rt sibling", element: "rb", minOpens: 1, input: "<ruby><rb>a<rt>b</ruby>\n" },
  {
    name: "caption on colgroup sibling",
    element: "caption",
    minOpens: 1,
    input: "<table><caption>cap</caption><colgroup><col /></colgroup></table>\n",
  },
  {
    name: "colgroup on thead sibling",
    element: "colgroup",
    minOpens: 2,
    input:
      "<table><colgroup><col /></colgroup><colgroup><col /></colgroup><thead><tr><th>x</th></tr></thead></table>\n",
  },
  {
    name: "thead on tbody sibling",
    element: "thead",
    minOpens: 1,
    input: "<table><thead><tr><th>x</th></tr><tbody><tr><td>y</td></tr></table>\n",
  },
  {
    name: "tbody on tfoot sibling",
    element: "tbody",
    minOpens: 1,
    input: "<table><tbody><tr><td>x</td></tr><tfoot><tr><td>y</td></tr></table>\n",
  },
  {
    name: "tr on tr sibling",
    element: "tr",
    minOpens: 2,
    input: "<table><tbody><tr><td>a</td><tr><td>b</td></tbody></table>\n",
  },
  {
    name: "td on th sibling",
    element: "td",
    minOpens: 1,
    input: "<table><tr><td>a<th>b</th></tr></table>\n",
  },
  {
    name: "th on td sibling",
    element: "th",
    minOpens: 1,
    input: "<table><tr><th>a<td>b</td></tr></table>\n",
  },
];

const parentEndAutoCloseCases: OptionalCase[] = [
  { name: "li in ul", element: "li", minOpens: 1, input: "<ul><li>one</ul>\n" },
  { name: "li in ol", element: "li", minOpens: 1, input: "<ol><li>one</ol>\n" },
  { name: "li in menu", element: "li", minOpens: 1, input: "<menu><li>one</menu>\n" },
  { name: "dt in dl", element: "dt", minOpens: 1, input: "<dl><dt>term<dd>desc</dd></dl>\n" },
  { name: "dd in dl", element: "dd", minOpens: 1, input: "<dl><dt>term</dt><dd>desc</dl>\n" },
  {
    name: "option in select",
    element: "option",
    minOpens: 1,
    input: "<select><option>a</select>\n",
  },
  {
    name: "option in datalist",
    element: "option",
    minOpens: 1,
    input: "<datalist><option>a</datalist>\n",
  },
  {
    name: "option in optgroup",
    element: "option",
    minOpens: 1,
    input: '<select><optgroup label="x"><option>a</optgroup></select>\n',
  },
  {
    name: "optgroup in select",
    element: "optgroup",
    minOpens: 1,
    input: '<select><optgroup label="x"><option>a</option></select>\n',
  },
  { name: "rt in ruby", element: "rt", minOpens: 1, input: "<ruby><rb>a</rb><rt>b</ruby>\n" },
  { name: "rt in rtc", element: "rt", minOpens: 1, input: "<ruby><rtc><rt>a</rt></rtc></ruby>\n" },
  { name: "rp in ruby", element: "rp", minOpens: 1, input: "<ruby><rb>a</rb><rp>(</ruby>\n" },
  { name: "rp in rtc", element: "rp", minOpens: 1, input: "<ruby><rtc><rp>(</rp></rtc></ruby>\n" },
  { name: "rb in ruby", element: "rb", minOpens: 1, input: "<ruby><rb>a</ruby>\n" },
  {
    name: "caption in table",
    element: "caption",
    minOpens: 1,
    input: "<table><caption>cap</caption><tbody><tr><td>x</td></tr></tbody></table>\n",
  },
  {
    name: "colgroup in table",
    element: "colgroup",
    minOpens: 1,
    input: "<table><colgroup><col /></colgroup><tbody><tr><td>x</td></tr></tbody></table>\n",
  },
  {
    name: "thead in table",
    element: "thead",
    minOpens: 1,
    input: "<table><thead><tr><th>x</th></tr></thead><tbody><tr><td>y</td></tr></tbody></table>\n",
  },
  {
    name: "tbody in table",
    element: "tbody",
    minOpens: 1,
    input: "<table><tbody><tr><td>x</td></tr></table>\n",
  },
  {
    name: "tfoot in table",
    element: "tfoot",
    minOpens: 1,
    input: "<table><tfoot><tr><td>x</td></tr></table>\n",
  },
  { name: "tr in table", element: "tr", minOpens: 1, input: "<table><tr><td>x</table>\n" },
  {
    name: "tr in thead",
    element: "tr",
    minOpens: 1,
    input: "<table><thead><tr><th>x</thead></table>\n",
  },
  {
    name: "tr in tbody",
    element: "tr",
    minOpens: 1,
    input: "<table><tbody><tr><td>x</tbody></table>\n",
  },
  {
    name: "tr in tfoot",
    element: "tr",
    minOpens: 1,
    input: "<table><tfoot><tr><td>x</tfoot></table>\n",
  },
  { name: "td in tr", element: "td", minOpens: 1, input: "<table><tr><td>x</tr></table>\n" },
  { name: "th in tr", element: "th", minOpens: 1, input: "<table><tr><th>x</tr></table>\n" },
];

function countTagOpen(text: string, tag: string): number {
  return (text.match(new RegExp(`<${tag}(?=\\s|>)`, "g")) ?? []).length;
}

function countTagClose(text: string, tag: string): number {
  return (text.match(new RegExp(`</${tag}>`, "g")) ?? []).length;
}

function assertBalancedTag(output: string, element: string, minOpens: number): void {
  const openCount = countTagOpen(output, element);
  const closeCount = countTagClose(output, element);

  expect(openCount, `expected at least ${minOpens} <${element}> tags`).toBeGreaterThanOrEqual(
    minOpens,
  );
  expect(closeCount, `unbalanced optional tag </${element}>`).toBe(openCount);
}

describe("html/optional-tags", () => {
  it("preserves omitted non-optional closing tags by default", async () => {
    const output = await format("<div>\n\n<script>\n\n</script>\n");
    expect(output).toContain("<script></script>");
    expect(output).not.toContain("</div>");
    expect(output.endsWith("\n\n")).toBe(false);
  });

  it("preserves omitted optional closing tags by default", async () => {
    const output = await format("<ul><li>one<li>two</ul>\n");
    expect(output).toContain("<li>one\n");
    expect(output).toContain("<li>two\n");
    expect(output).not.toContain("</li>");
  });

  for (const c of siblingAutoCloseCases) {
    it(`formats sibling auto-close case (${c.name})`, async () => {
      const output = await format(c.input, {
        bladeInsertOptionalClosingTags: true,
      });
      assertBalancedTag(output, c.element, c.minOpens);
    });
  }

  for (const c of parentEndAutoCloseCases) {
    it(`formats parent-end auto-close case (${c.name})`, async () => {
      const output = await format(c.input, {
        bladeInsertOptionalClosingTags: true,
      });
      assertBalancedTag(output, c.element, c.minOpens);
    });
  }

  it("is stable with optional tags inside directive wrappers", async () => {
    const output = await format(
      [
        "@if($show)",
        "<ul><li>{{ $one }}<li>{{ $two }}</ul>",
        "<table><tr><td>{{ $a }}<td>{{ $b }}</table>",
        "@endif",
        "",
      ].join("\n"),
      {
        bladeDirectiveBlockStyle: "multiline",
        bladeInsertOptionalClosingTags: true,
      },
    );

    assertBalancedTag(output, "li", 2);
    assertBalancedTag(output, "td", 2);
    assertBalancedTag(output, "tr", 1);
  });
});
