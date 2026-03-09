// Auto-generated from Prettier HTML snapshot: bracket-same-line/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/bracket-same-line", () => {
  it('block.html {"bracketSameLine":false}', async () => {
    const input = `<div long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
text
</div>
<div long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value"></div>
<div class="a">
text
</div>
<div class="a">text</div>
`;
    const expected = `<div
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value"
>
  text
</div>
<div
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value"
></div>
<div class="a">text</div>
<div class="a">text</div>
`;
    await formatEqual(input, expected, { bracketSameLine: false });
  });

  it('block.html {"bracketSameLine":true}', async () => {
    const input = `<div long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
text
</div>
<div long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value"></div>
<div class="a">
text
</div>
<div class="a">text</div>
`;
    const expected = `<div
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
  text
</div>
<div
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value"></div>
<div class="a">text</div>
<div class="a">text</div>
`;
    await formatEqual(input, expected, { bracketSameLine: true });
  });

  it('embed.html {"bracketSameLine":false}', async () => {
    const input = `<script long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
alert(1)</script>
<style long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
.a{color: #f00}</style>
<script>
alert(1)</script>
<style>
.a{color: #f00}</style>
`;
    const expected = `<script
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value"
>
  alert(1);
</script>
<style
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value"
>
  .a {
    color: #f00;
  }
</style>
<script>
  alert(1);
</script>
<style>
  .a {
    color: #f00;
  }
</style>
`;
    await formatEqual(input, expected, { bracketSameLine: false });
  });

  it('embed.html {"bracketSameLine":true}', async () => {
    const input = `<script long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
alert(1)</script>
<style long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
.a{color: #f00}</style>
<script>
alert(1)</script>
<style>
.a{color: #f00}</style>
`;
    const expected = `<script
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
  alert(1);
</script>
<style
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
  .a {
    color: #f00;
  }
</style>
<script>
  alert(1);
</script>
<style>
  .a {
    color: #f00;
  }
</style>
`;
    await formatEqual(input, expected, { bracketSameLine: true });
  });

  it('inline.html {"bracketSameLine":false}', async () => {
    const input = `
<span long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
text
</span>
<span long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value"></span>
<span  class="a">text</span>
<span long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
text
</span>
<span  class="a">text</span><span long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
text
</span>
<span  class="a">text</span><span  class="a">text</span><span  class="a">text</span><span  class="a">text</span><span  class="a">text</span>
`;
    const expected = `<span
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value"
>
  text
</span>
<span
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value"
></span>
<span class="a">text</span>
<span
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value"
>
  text
</span>
<span class="a">text</span
><span
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value"
>
  text
</span>
<span class="a">text</span><span class="a">text</span><span class="a">text</span
><span class="a">text</span><span class="a">text</span>
`;
    await formatEqual(input, expected, { bracketSameLine: false });
  });

  it('inline.html {"bracketSameLine":true}', async () => {
    const input = `
<span long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
text
</span>
<span long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value"></span>
<span  class="a">text</span>
<span long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
text
</span>
<span  class="a">text</span><span long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
text
</span>
<span  class="a">text</span><span  class="a">text</span><span  class="a">text</span><span  class="a">text</span><span  class="a">text</span>
`;
    const expected = `<span
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
  text
</span>
<span
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value"></span>
<span class="a">text</span>
<span
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
  text
</span>
<span class="a">text</span
><span
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value">
  text
</span>
<span class="a">text</span><span class="a">text</span><span class="a">text</span
><span class="a">text</span><span class="a">text</span>
`;
    await formatEqual(input, expected, { bracketSameLine: true });
  });

  it('void-elements.html {"bracketSameLine":false}', async () => {
    const input = `<img long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value" src="./1.jpg"/>
<img src="./1.jpg"/><img src="./1.jpg"/><img src="./1.jpg"/><img src="./1.jpg"/><img src="./1.jpg"/>
`;
    const expected = `<img
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value"
  src="./1.jpg"
/>
<img src="./1.jpg" /><img src="./1.jpg" /><img src="./1.jpg" /><img
  src="./1.jpg"
/><img src="./1.jpg" />
`;
    await formatEqual(input, expected, { bracketSameLine: false });
  });

  it('void-elements.html {"bracketSameLine":true}', async () => {
    const input = `<img long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value" src="./1.jpg"/>
<img src="./1.jpg"/><img src="./1.jpg"/><img src="./1.jpg"/><img src="./1.jpg"/><img src="./1.jpg"/>
`;
    const expected = `<img
  long_long_attribute="long_long_long_long_long_long_long_long_long_long_long_value"
  src="./1.jpg" />
<img src="./1.jpg" /><img src="./1.jpg" /><img src="./1.jpg" /><img
  src="./1.jpg" /><img src="./1.jpg" />
`;
    await formatEqual(input, expected, { bracketSameLine: true });
  });
});
