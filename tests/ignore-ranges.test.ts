import { describe, expect, it } from "vitest";
import { getBladeIgnoreRanges } from "../src/index.js";

describe("getBladeIgnoreRanges", () => {
  it("returns offsets into the original source", () => {
    const source =
      '\uFEFF<div>\r\n  😀\r\n  {{-- format-ignore-start --}}\r\n  <span   class="x"></span>\r\n  {{-- format-ignore-end --}}\r\n</div>\r\n';

    const ranges = getBladeIgnoreRanges(source);

    expect(ranges).toHaveLength(1);
    expect(source.slice(ranges[0].start, ranges[0].end)).toBe(
      '{{-- format-ignore-start --}}\r\n  <span   class="x"></span>\r\n  {{-- format-ignore-end --}}',
    );
  });

  it("uses configured verbatim directives when collecting ranges", () => {
    const source = `---
title: Example
---
@literal
{{-- format-ignore-start --}}
<span   class="x"></span>
{{-- format-ignore-end --}}
@endliteral
`;

    expect(getBladeIgnoreRanges(source)).toHaveLength(1);

    const ranges = getBladeIgnoreRanges(source, {
      bladeSyntaxPlugins: [
        {
          name: "test",
          lexerDirectives: [],
          treeDirectives: [],
          verbatimStartDirectives: ["literal"],
          verbatimEndDirectives: ["endliteral"],
        },
      ],
    });

    expect(ranges).toHaveLength(0);
  });

  it("ignores markers in BOM-prefixed front matter without shifting body ranges", () => {
    for (const frontMatter of [
      "title: {{-- format-ignore-start --}}\n{{-- format-ignore-end --}}",
      "title: {{-- format-ignore-start --}}",
    ]) {
      const source = `\uFEFF---
${frontMatter}
---
<div>before</div>
{{-- format-ignore-start --}}
<span   class="x"></span>
{{-- format-ignore-end --}}
`;

      const ranges = getBladeIgnoreRanges(source);

      expect(ranges).toHaveLength(1);
      expect(source.slice(ranges[0].start, ranges[0].end)).toBe(
        `{{-- format-ignore-start --}}
<span   class="x"></span>
{{-- format-ignore-end --}}`,
      );
    }
  });
});
