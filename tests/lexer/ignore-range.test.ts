import { describe, expect, it } from "vitest";
import { reconstructFromTokens, tokenize } from "../../src/lexer/lexer.js";
import { collectIgnoreRanges } from "../../src/lexer/index.js";
import { State, TokenType } from "../../src/lexer/types.js";

describe("lexer/ignore-range", () => {
  it("collects sorted, non-overlapping outermost ranges", () => {
    const source = `{{-- format-ignore-start --}}A{{-- prettier-ignore-start --}}B{{-- prettier-ignore-end --}}C{{-- format-ignore-end --}}x<!-- format-ignore-start -->y<!-- format-ignore-end -->`;
    const firstSlice =
      "{{-- format-ignore-start --}}A{{-- prettier-ignore-start --}}B{{-- prettier-ignore-end --}}C{{-- format-ignore-end --}}";
    const secondSlice = "<!-- format-ignore-start -->y<!-- format-ignore-end -->";
    const ranges = collectIgnoreRanges(source);

    expect(ranges).toHaveLength(2);
    expect(source.slice(ranges[0].start, ranges[0].end)).toBe(firstSlice);
    expect(source.slice(ranges[1].start, ranges[1].end)).toBe(secondSlice);
    expect(ranges[0].end).toBeLessThan(ranges[1].start);
  });

  it.each([
    {
      label: "Blade start to HTML end",
      source: "{{-- format-ignore-start --}}x<!-- format-ignore-end -->",
    },
    {
      label: "HTML start to Blade end",
      source: "<!-- format-ignore-start -->x{{-- format-ignore-end --}}",
    },
  ])("pairs mixed wrapper markers for $label", ({ source }) => {
    const ranges = collectIgnoreRanges(source);

    expect(ranges).toHaveLength(1);
    expect(source.slice(ranges[0].start, ranges[0].end)).toBe(source);
  });

  it("preserves unmatched ranges through eof", () => {
    const source = `<div>alpha</div>
{{-- format-ignore-start --}}
tail
`;
    const ranges = collectIgnoreRanges(source);

    expect(ranges).toHaveLength(1);
    expect(ranges[0].end).toBe(source.length);
    expect(source.slice(ranges[0].start, ranges[0].end)).toBe(
      `{{-- format-ignore-start --}}
tail
`,
    );
  });

  it("does not activate range markers inside quoted attribute values", () => {
    expect(
      collectIgnoreRanges(
        `<div data-note="{{-- format-ignore-start --}} nope {{-- format-ignore-end --}}"></div>`,
      ),
    ).toHaveLength(0);
    expect(
      collectIgnoreRanges(
        `<div data-note="<!-- format-ignore-start --> nope <!-- format-ignore-end -->"></div>`,
      ),
    ).toHaveLength(0);
  });

  it("allows Blade markers in raw-text states and blocks HTML markers there", () => {
    const bladeSource = `<script>
{{-- format-ignore-start --}}
const   x = { foo:  1 };
{{-- format-ignore-end --}}
</script>`;
    const htmlSource = `<script>
<!-- format-ignore-start -->
const   x = { foo:  1 };
<!-- format-ignore-end -->
</script>`;

    const bladeRanges = collectIgnoreRanges(bladeSource);

    expect(bladeRanges).toHaveLength(1);
    expect(bladeRanges[0].resume.state).toBe(State.RawText);
    expect(collectIgnoreRanges(htmlSource)).toHaveLength(0);
  });

  it.each([
    {
      label: "HTML markers inside malformed opening tags",
      source: `<div <!-- format-ignore-start --> class="x"   >a</div><!-- format-ignore-end -->`,
    },
    {
      label: "Blade markers inside malformed opening tags",
      source: `<div {{-- format-ignore-start --}} class="x"   >a</div>{{-- format-ignore-end --}}`,
    },
  ])("snaps ignored ranges back to the tag-open boundary for $label", ({ source }) => {
    const ranges = collectIgnoreRanges(source);

    expect(ranges).toHaveLength(1);
    expect(ranges[0].start).toBe(source.indexOf("<div"));
  });

  it("emits IgnoreRange tokens and resumes lexing after the matched end marker", () => {
    const source = `{{-- format-ignore-start --}}<x-slot:foo>{{-- format-ignore-end --}}tail<div   class="x"   ></div>`;
    const ignoreRanges = collectIgnoreRanges(source);
    const { tokens } = tokenize(source, undefined, { ignoreRanges });
    const ignoreIndex = tokens.findIndex((token) => token.type === TokenType.IgnoreRange);

    expect(reconstructFromTokens(tokens, source)).toBe(source);
    expect(ignoreIndex).toBeGreaterThanOrEqual(0);
    expect(source.slice(tokens[ignoreIndex].start, tokens[ignoreIndex].end)).toBe(
      "{{-- format-ignore-start --}}<x-slot:foo>{{-- format-ignore-end --}}",
    );
    expect(tokens[ignoreIndex + 1].type).toBe(TokenType.Text);
    expect(source.slice(tokens[ignoreIndex + 1].start, tokens[ignoreIndex + 1].end)).toBe("tail");
    expect(tokens[ignoreIndex + 2].type).toBe(TokenType.LessThan);
  });
});
