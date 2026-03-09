import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("directives/format-ignore", () => {
  it("treats Blade format-ignore-start/end as range ignore markers", async () => {
    const input = `{{-- format-ignore-start --}}
<div   class="x"   ><span> hi </span></div>
{{-- format-ignore-end --}}
<div   class="x"   ><span> hi </span></div>
`;

    const expected = `{{-- format-ignore-start --}}
<div   class="x"   ><span> hi </span></div>
{{-- format-ignore-end --}}
<div class="x"><span> hi </span></div>
`;

    await formatEqual(input, expected);
  });

  it("supports inline Blade range ignore markers", async () => {
    const input = `{{-- format-ignore-start --}}<div   class="x"   ></div>{{-- format-ignore-end --}}
<div   class="x"   ></div>
`;

    const expected = `{{-- format-ignore-start --}}
<div   class="x"   ></div>
{{-- format-ignore-end --}}
<div class="x"></div>
`;

    await formatEqual(input, expected);
  });

  it("works when format-ignore-end is at end of file", async () => {
    const input = `<div>
    text A</div>
{{-- format-ignore-start --}}
<div>
    text B</div>
{{-- format-ignore-end --}}
`;

    const expected = `<div>text A</div>
{{-- format-ignore-start --}}
<div>
    text B</div>
{{-- format-ignore-end --}}
`;

    await formatEqual(input, expected);
  });

  it("works when format-ignore-start has no matching end", async () => {
    const input = `<div>
    text A</div>
{{-- format-ignore-start --}}
<div>
    text B</div>
`;

    const expected = `<div>text A</div>
{{-- format-ignore-start --}}
<div>
    text B</div>
`;

    await formatEqual(input, expected);
  });

  it("accepts prettier-ignore-start/end inside Blade comments", async () => {
    const input = `{{-- prettier-ignore-start --}}
<div   class="x"   ><span> hi </span></div>
{{-- prettier-ignore-end --}}
<div   class="x"   ><span> hi </span></div>
`;

    const expected = `{{-- prettier-ignore-start --}}
<div   class="x"   ><span> hi </span></div>
{{-- prettier-ignore-end --}}
<div class="x"><span> hi </span></div>
`;

    await formatEqual(input, expected);
  });
});
