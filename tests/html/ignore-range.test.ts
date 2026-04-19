import { describe, expect, it } from "vitest";
import {
  expectIgnoreRangesUnchanged,
  formatEqual,
} from "../helpers.js";

async function formatRangeEqual(input: string, expected: string, options = {}) {
  const output = await formatEqual(input, expected, options);
  expectIgnoreRangesUnchanged(input, output, "html/ignore-range", options);
  return output;
}

describe("html/ignore-range", () => {
  for (const ignoreLabel of ["format-ignore", "prettier-ignore"] as const) {
    it(`preserves HTML comment ${ignoreLabel} ranges`, async () => {
      const input = `<!-- ${ignoreLabel}-start -->
<div   class="x"   ></div>
<!-- ${ignoreLabel}-end -->
<div   class="x"   ></div>
`;

      const expected = `<!-- ${ignoreLabel}-start -->
<div   class="x"   ></div>
<!-- ${ignoreLabel}-end -->
<div class="x"></div>
`;

      await formatRangeEqual(input, expected);
    });

    it(`pairs Blade start with HTML end for ${ignoreLabel} ranges`, async () => {
      const input = `{{-- ${ignoreLabel}-start --}}
<div   class="x"   ></div>
<!-- ${ignoreLabel}-end -->
<div   class="x"   ></div>
`;

      const expected = `{{-- ${ignoreLabel}-start --}}
<div   class="x"   ></div>
<!-- ${ignoreLabel}-end -->
<div class="x"></div>
`;

      await formatRangeEqual(input, expected);
    });

    it(`pairs HTML start with Blade end for ${ignoreLabel} ranges`, async () => {
      const input = `<!-- ${ignoreLabel}-start -->
<div   class="x"   ></div>
{{-- ${ignoreLabel}-end --}}
<div   class="x"   ></div>
`;

      const expected = `<!-- ${ignoreLabel}-start -->
<div   class="x"   ></div>
{{-- ${ignoreLabel}-end --}}
<div class="x"></div>
`;

      await formatRangeEqual(input, expected);
    });

    it(`preserves unmatched HTML ${ignoreLabel} ranges to eof`, async () => {
      const input = `<div>
  text A</div>
<!-- ${ignoreLabel}-start -->
<div>
    text B</div>
`;

      const expected = `<div>text A</div>
<!-- ${ignoreLabel}-start -->
<div>
    text B</div>
`;

      await formatRangeEqual(input, expected);
    });

    it(`preserves Blade ${ignoreLabel} ranges inside raw-text elements`, async () => {
      const input = `<script>
{{-- ${ignoreLabel}-start --}}
const   x = { foo:  1 };
{{-- ${ignoreLabel}-end --}}
</script>
<div   class="x"   ></div>
`;

      const expected = `<script>
  {{-- ${ignoreLabel}-start --}}
const   x = { foo:  1 };
{{-- ${ignoreLabel}-end --}}
</script>
<div class="x"></div>
`;

      await formatRangeEqual(input, expected);
    });

    it(`preserves malformed HTML-start ${ignoreLabel} ranges inside opening tags`, async () => {
      const input = `@if($x)
<div <!-- ${ignoreLabel}-start --> class="x"   >a</div><!-- ${ignoreLabel}-end -->
@endif
`;

      const expected = `@if ($x)
  <div <!-- ${ignoreLabel}-start --> class="x"   >a</div><!-- ${ignoreLabel}-end -->
@endif
`;

      await formatRangeEqual(input, expected);
    });

    it(`preserves nested mixed-wrapper ${ignoreLabel} ranges`, async () => {
      const input = `<!-- ${ignoreLabel}-start -->
<div   class="x"   ></div>
{{-- ${ignoreLabel}-start --}}
<span   class="y"   ></span>
<!-- ${ignoreLabel}-end -->
<p   class="z"   ></p>
{{-- ${ignoreLabel}-end --}}
<section   class="q"   ></section>
`;

      const expected = `<!-- ${ignoreLabel}-start -->
<div   class="x"   ></div>
{{-- ${ignoreLabel}-start --}}
<span   class="y"   ></span>
<!-- ${ignoreLabel}-end -->
<p   class="z"   ></p>
{{-- ${ignoreLabel}-end --}}
<section class="q"></section>
`;

      await formatRangeEqual(input, expected);
    });
  }

  it("does not activate Blade range markers inside quoted attribute values", async () => {
    const input = `<div data-note="{{-- format-ignore-start --}} nope {{-- format-ignore-end --}}"><span   class="x"   ></span></div>
`;

    const expected = `<div data-note="{{-- format-ignore-start --}} nope {{-- format-ignore-end --}}">
  <span class="x"></span>
</div>
`;

    await formatEqual(input, expected);
  });

  it("does not activate HTML range markers inside quoted attribute values", async () => {
    const input = `<div data-note="<!-- format-ignore-start --> nope <!-- format-ignore-end -->"><span   class="x"   ></span></div>
`;

    const expected = `<div data-note="<!-- format-ignore-start --> nope <!-- format-ignore-end -->">
  <span class="x"></span>
</div>
`;

    await formatEqual(input, expected);
  });

  it("does not activate HTML range markers inside raw-text elements", async () => {
    const input = `<script>
const   x = "<!-- format-ignore-start -->";
</script>
<div   class="x"   ></div>
`;

    const expected = `<script>
  const x = "<!-- format-ignore-start -->";
</script>
<div class="x"></div>
`;

    await formatEqual(input, expected);
  });
});
