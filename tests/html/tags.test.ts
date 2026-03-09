// Auto-generated from Prettier HTML snapshot: tags/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/tags", () => {
  it('case-sensitive.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<CaseSensitive CaseSensitive="true">hello world</CaseSensitive>
`;
    const expected = `<CaseSensitive CaseSensitive="true">hello world</CaseSensitive>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('case-sensitive.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<CaseSensitive CaseSensitive="true">hello world</CaseSensitive>
`;
    const expected = `<CaseSensitive CaseSensitive="true">hello world</CaseSensitive>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('case-sensitive.html {"printWidth":"Infinity"}', async () => {
    const input = `<CaseSensitive CaseSensitive="true">hello world</CaseSensitive>
`;
    const expected = `<CaseSensitive CaseSensitive="true">hello world</CaseSensitive>
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('case-sensitive.html {"printWidth":1}', async () => {
    const input = `<CaseSensitive CaseSensitive="true">hello world</CaseSensitive>
`;
    const expected = `<CaseSensitive
  CaseSensitive="true"
  >hello
  world</CaseSensitive
>
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("case-sensitive.html", async () => {
    const input = `<CaseSensitive CaseSensitive="true">hello world</CaseSensitive>
`;
    const expected = `<CaseSensitive CaseSensitive="true">hello world</CaseSensitive>
`;
    await formatEqual(input, expected);
  });

  it('closing-at-start.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<div>
    aaaaaaaaaa
    <a
      href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
      >bbbbbbbbbb</a
    >
    cccccccccc
</div>
<div>
    aaaaaaaaaa
    <a
      href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
      >bbbbbbbbbb</a
    >cccccccccc
</div>
`;
    const expected = `<div>
  aaaaaaaaaa
  <a
    href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
  >
    bbbbbbbbbb
  </a>
  cccccccccc
</div>
<div>
  aaaaaaaaaa
  <a
    href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
  >
    bbbbbbbbbb
  </a>
  cccccccccc
</div>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('closing-at-start.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<div>
    aaaaaaaaaa
    <a
      href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
      >bbbbbbbbbb</a
    >
    cccccccccc
</div>
<div>
    aaaaaaaaaa
    <a
      href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
      >bbbbbbbbbb</a
    >cccccccccc
</div>
`;
    const expected = `<div>
  aaaaaaaaaa
  <a
    href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
    >bbbbbbbbbb</a
  >
  cccccccccc
</div>
<div>
  aaaaaaaaaa
  <a
    href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
    >bbbbbbbbbb</a
  >cccccccccc
</div>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('closing-at-start.html {"printWidth":"Infinity"}', async () => {
    const input = `<div>
    aaaaaaaaaa
    <a
      href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
      >bbbbbbbbbb</a
    >
    cccccccccc
</div>
<div>
    aaaaaaaaaa
    <a
      href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
      >bbbbbbbbbb</a
    >cccccccccc
</div>
`;
    const expected = `<div>
  aaaaaaaaaa
  <a href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong">bbbbbbbbbb</a>
  cccccccccc
</div>
<div>
  aaaaaaaaaa
  <a href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong">bbbbbbbbbb</a>cccccccccc
</div>
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('closing-at-start.html {"printWidth":1}', async () => {
    const input = `<div>
    aaaaaaaaaa
    <a
      href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
      >bbbbbbbbbb</a
    >
    cccccccccc
</div>
<div>
    aaaaaaaaaa
    <a
      href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
      >bbbbbbbbbb</a
    >cccccccccc
</div>
`;
    const expected = `<div>
  aaaaaaaaaa
  <a
    href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
    >bbbbbbbbbb</a
  >
  cccccccccc
</div>
<div>
  aaaaaaaaaa
  <a
    href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
    >bbbbbbbbbb</a
  >cccccccccc
</div>
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("closing-at-start.html", async () => {
    const input = `<div>
    aaaaaaaaaa
    <a
      href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
      >bbbbbbbbbb</a
    >
    cccccccccc
</div>
<div>
    aaaaaaaaaa
    <a
      href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
      >bbbbbbbbbb</a
    >cccccccccc
</div>
`;
    const expected = `<div>
  aaaaaaaaaa
  <a
    href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
    >bbbbbbbbbb</a
  >
  cccccccccc
</div>
<div>
  aaaaaaaaaa
  <a
    href="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
    >bbbbbbbbbb</a
  >cccccccccc
</div>
`;
    await formatEqual(input, expected);
  });

  it('custom-element.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<app-foo></app-foo>
<app-bar></app-bar>
`;
    const expected = `<app-foo></app-foo>
<app-bar></app-bar>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('custom-element.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<app-foo></app-foo>
<app-bar></app-bar>
`;
    const expected = `<app-foo></app-foo>
<app-bar></app-bar>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('custom-element.html {"printWidth":"Infinity"}', async () => {
    const input = `<app-foo></app-foo>
<app-bar></app-bar>
`;
    const expected = `<app-foo></app-foo>
<app-bar></app-bar>
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('custom-element.html {"printWidth":1}', async () => {
    const input = `<app-foo></app-foo>
<app-bar></app-bar>
`;
    const expected = `<app-foo></app-foo>
<app-bar></app-bar>
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("custom-element.html", async () => {
    const input = `<app-foo></app-foo>
<app-bar></app-bar>
`;
    const expected = `<app-foo></app-foo>
<app-bar></app-bar>
`;
    await formatEqual(input, expected);
  });

  it('marquee.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<marquee>This text will scroll from right to left</marquee>

<marquee direction="up">This text will scroll from bottom to top</marquee>

<marquee
  direction="down"
  width="250"
  height="200"
  behavior="alternate"
  style="border:solid">
  <marquee behavior="alternate"> This text will bounce </marquee>
</marquee>
`;
    const expected = `<marquee>This text will scroll from right to left</marquee>

<marquee direction="up">This text will scroll from bottom to top</marquee>

<marquee
  direction="down"
  width="250"
  height="200"
  behavior="alternate"
  style="border: solid"
>
  <marquee behavior="alternate">This text will bounce</marquee>
</marquee>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('marquee.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<marquee>This text will scroll from right to left</marquee>

<marquee direction="up">This text will scroll from bottom to top</marquee>

<marquee
  direction="down"
  width="250"
  height="200"
  behavior="alternate"
  style="border:solid">
  <marquee behavior="alternate"> This text will bounce </marquee>
</marquee>
`;
    const expected = `<marquee>This text will scroll from right to left</marquee>

<marquee direction="up">This text will scroll from bottom to top</marquee>

<marquee
  direction="down"
  width="250"
  height="200"
  behavior="alternate"
  style="border: solid"
>
  <marquee behavior="alternate"> This text will bounce </marquee>
</marquee>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('marquee.html {"printWidth":"Infinity"}', async () => {
    const input = `<marquee>This text will scroll from right to left</marquee>

<marquee direction="up">This text will scroll from bottom to top</marquee>

<marquee
  direction="down"
  width="250"
  height="200"
  behavior="alternate"
  style="border:solid">
  <marquee behavior="alternate"> This text will bounce </marquee>
</marquee>
`;
    const expected = `<marquee>This text will scroll from right to left</marquee>

<marquee direction="up">This text will scroll from bottom to top</marquee>

<marquee direction="down" width="250" height="200" behavior="alternate" style="border: solid">
  <marquee behavior="alternate">This text will bounce</marquee>
</marquee>
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('marquee.html {"printWidth":1}', async () => {
    const input = `<marquee>This text will scroll from right to left</marquee>

<marquee direction="up">This text will scroll from bottom to top</marquee>

<marquee
  direction="down"
  width="250"
  height="200"
  behavior="alternate"
  style="border:solid">
  <marquee behavior="alternate"> This text will bounce </marquee>
</marquee>
`;
    const expected = `<marquee>
  This
  text
  will
  scroll
  from
  right
  to
  left
</marquee>

<marquee
  direction="up"
>
  This
  text
  will
  scroll
  from
  bottom
  to
  top
</marquee>

<marquee
  direction="down"
  width="250"
  height="200"
  behavior="alternate"
  style="
    border: solid;
  "
>
  <marquee
    behavior="alternate"
  >
    This
    text
    will
    bounce
  </marquee>
</marquee>
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("marquee.html", async () => {
    const input = `<marquee>This text will scroll from right to left</marquee>

<marquee direction="up">This text will scroll from bottom to top</marquee>

<marquee
  direction="down"
  width="250"
  height="200"
  behavior="alternate"
  style="border:solid">
  <marquee behavior="alternate"> This text will bounce </marquee>
</marquee>
`;
    const expected = `<marquee>This text will scroll from right to left</marquee>

<marquee direction="up">This text will scroll from bottom to top</marquee>

<marquee
  direction="down"
  width="250"
  height="200"
  behavior="alternate"
  style="border: solid"
>
  <marquee behavior="alternate">This text will bounce</marquee>
</marquee>
`;
    await formatEqual(input, expected);
  });

  it('menu.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<menu>
  <li><button onclick="copy()">Copy</button></li>
  <li><button onclick="cut()">Cut</button></li>
  <li><button onclick="paste()">Paste</button></li>
</menu>
`;
    const expected = `<menu>
  <li><button onclick="copy()">Copy</button></li>
  <li><button onclick="cut()">Cut</button></li>
  <li><button onclick="paste()">Paste</button></li>
</menu>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('menu.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<menu>
  <li><button onclick="copy()">Copy</button></li>
  <li><button onclick="cut()">Cut</button></li>
  <li><button onclick="paste()">Paste</button></li>
</menu>
`;
    const expected = `<menu>
  <li><button onclick="copy()">Copy</button></li>
  <li><button onclick="cut()">Cut</button></li>
  <li><button onclick="paste()">Paste</button></li>
</menu>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('menu.html {"printWidth":"Infinity"}', async () => {
    const input = `<menu>
  <li><button onclick="copy()">Copy</button></li>
  <li><button onclick="cut()">Cut</button></li>
  <li><button onclick="paste()">Paste</button></li>
</menu>
`;
    const expected = `<menu>
  <li><button onclick="copy()">Copy</button></li>
  <li><button onclick="cut()">Cut</button></li>
  <li><button onclick="paste()">Paste</button></li>
</menu>
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('menu.html {"printWidth":1}', async () => {
    const input = `<menu>
  <li><button onclick="copy()">Copy</button></li>
  <li><button onclick="cut()">Cut</button></li>
  <li><button onclick="paste()">Paste</button></li>
</menu>
`;
    const expected = `<menu>
  <li>
    <button
      onclick="
        copy()
      "
    >
      Copy
    </button>
  </li>
  <li>
    <button
      onclick="
        cut()
      "
    >
      Cut
    </button>
  </li>
  <li>
    <button
      onclick="
        paste()
      "
    >
      Paste
    </button>
  </li>
</menu>
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("menu.html", async () => {
    const input = `<menu>
  <li><button onclick="copy()">Copy</button></li>
  <li><button onclick="cut()">Cut</button></li>
  <li><button onclick="paste()">Paste</button></li>
</menu>
`;
    const expected = `<menu>
  <li><button onclick="copy()">Copy</button></li>
  <li><button onclick="cut()">Cut</button></li>
  <li><button onclick="paste()">Paste</button></li>
</menu>
`;
    await formatEqual(input, expected);
  });

  it('openging-at-end.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<p
  >Want to write us a letter? Use our<a
    ><b
      ><a>mailing address</a></b
    ></a
  >.</p
>

<p
  >Want to write us a letter? Use our<a
  href="contacts.html#Mailing_address"
    ><b
      ><a>mailing address</a></b
    ></a
  >.</p
>

<p
  >Want to write us a letter? Use our<a
  href="contacts.html#Mailing_address"
  href1="contacts.html#Mailing_address"
  href2="contacts.html#Mailing_address"
  href3="contacts.html#Mailing_address"
  href4="contacts.html#Mailing_address"
    ><b
      ><a>mailing address</a></b
    ></a
  >.</p
>
`;
    const expected = `<p>
  Want to write us a letter? Use our
  <a>
    <b><a>mailing address</a></b>
  </a>
  .
</p>

<p>
  Want to write us a letter? Use our
  <a href="contacts.html#Mailing_address">
    <b><a>mailing address</a></b>
  </a>
  .
</p>

<p>
  Want to write us a letter? Use our
  <a
    href="contacts.html#Mailing_address"
    href1="contacts.html#Mailing_address"
    href2="contacts.html#Mailing_address"
    href3="contacts.html#Mailing_address"
    href4="contacts.html#Mailing_address"
  >
    <b><a>mailing address</a></b>
  </a>
  .
</p>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('openging-at-end.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<p
  >Want to write us a letter? Use our<a
    ><b
      ><a>mailing address</a></b
    ></a
  >.</p
>

<p
  >Want to write us a letter? Use our<a
  href="contacts.html#Mailing_address"
    ><b
      ><a>mailing address</a></b
    ></a
  >.</p
>

<p
  >Want to write us a letter? Use our<a
  href="contacts.html#Mailing_address"
  href1="contacts.html#Mailing_address"
  href2="contacts.html#Mailing_address"
  href3="contacts.html#Mailing_address"
  href4="contacts.html#Mailing_address"
    ><b
      ><a>mailing address</a></b
    ></a
  >.</p
>
`;
    const expected = `<p
  >Want to write us a letter? Use our<a
    ><b><a>mailing address</a></b></a
  >.</p
>

<p
  >Want to write us a letter? Use our<a href="contacts.html#Mailing_address"
    ><b><a>mailing address</a></b></a
  >.</p
>

<p
  >Want to write us a letter? Use our<a
    href="contacts.html#Mailing_address"
    href1="contacts.html#Mailing_address"
    href2="contacts.html#Mailing_address"
    href3="contacts.html#Mailing_address"
    href4="contacts.html#Mailing_address"
    ><b><a>mailing address</a></b></a
  >.</p
>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('openging-at-end.html {"printWidth":"Infinity"}', async () => {
    const input = `<p
  >Want to write us a letter? Use our<a
    ><b
      ><a>mailing address</a></b
    ></a
  >.</p
>

<p
  >Want to write us a letter? Use our<a
  href="contacts.html#Mailing_address"
    ><b
      ><a>mailing address</a></b
    ></a
  >.</p
>

<p
  >Want to write us a letter? Use our<a
  href="contacts.html#Mailing_address"
  href1="contacts.html#Mailing_address"
  href2="contacts.html#Mailing_address"
  href3="contacts.html#Mailing_address"
  href4="contacts.html#Mailing_address"
    ><b
      ><a>mailing address</a></b
    ></a
  >.</p
>
`;
    const expected = `<p>
  Want to write us a letter? Use our<a
    ><b><a>mailing address</a></b></a
  >.
</p>

<p>
  Want to write us a letter? Use our<a href="contacts.html#Mailing_address"
    ><b><a>mailing address</a></b></a
  >.
</p>

<p>
  Want to write us a letter? Use our<a href="contacts.html#Mailing_address" href1="contacts.html#Mailing_address" href2="contacts.html#Mailing_address" href3="contacts.html#Mailing_address" href4="contacts.html#Mailing_address"
    ><b><a>mailing address</a></b></a
  >.
</p>
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('openging-at-end.html {"printWidth":1}', async () => {
    const input = `<p
  >Want to write us a letter? Use our<a
    ><b
      ><a>mailing address</a></b
    ></a
  >.</p
>

<p
  >Want to write us a letter? Use our<a
  href="contacts.html#Mailing_address"
    ><b
      ><a>mailing address</a></b
    ></a
  >.</p
>

<p
  >Want to write us a letter? Use our<a
  href="contacts.html#Mailing_address"
  href1="contacts.html#Mailing_address"
  href2="contacts.html#Mailing_address"
  href3="contacts.html#Mailing_address"
  href4="contacts.html#Mailing_address"
    ><b
      ><a>mailing address</a></b
    ></a
  >.</p
>
`;
    const expected = `<p>
  Want
  to
  write
  us
  a
  letter?
  Use
  our<a
    ><b
      ><a
        >mailing
        address</a
      ></b
    ></a
  >.
</p>

<p>
  Want
  to
  write
  us
  a
  letter?
  Use
  our<a
    href="contacts.html#Mailing_address"
    ><b
      ><a
        >mailing
        address</a
      ></b
    ></a
  >.
</p>

<p>
  Want
  to
  write
  us
  a
  letter?
  Use
  our<a
    href="contacts.html#Mailing_address"
    href1="contacts.html#Mailing_address"
    href2="contacts.html#Mailing_address"
    href3="contacts.html#Mailing_address"
    href4="contacts.html#Mailing_address"
    ><b
      ><a
        >mailing
        address</a
      ></b
    ></a
  >.
</p>
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("openging-at-end.html", async () => {
    const input = `<p
  >Want to write us a letter? Use our<a
    ><b
      ><a>mailing address</a></b
    ></a
  >.</p
>

<p
  >Want to write us a letter? Use our<a
  href="contacts.html#Mailing_address"
    ><b
      ><a>mailing address</a></b
    ></a
  >.</p
>

<p
  >Want to write us a letter? Use our<a
  href="contacts.html#Mailing_address"
  href1="contacts.html#Mailing_address"
  href2="contacts.html#Mailing_address"
  href3="contacts.html#Mailing_address"
  href4="contacts.html#Mailing_address"
    ><b
      ><a>mailing address</a></b
    ></a
  >.</p
>
`;
    const expected = `<p>
  Want to write us a letter? Use our<a
    ><b><a>mailing address</a></b></a
  >.
</p>

<p>
  Want to write us a letter? Use our<a href="contacts.html#Mailing_address"
    ><b><a>mailing address</a></b></a
  >.
</p>

<p>
  Want to write us a letter? Use our<a
    href="contacts.html#Mailing_address"
    href1="contacts.html#Mailing_address"
    href2="contacts.html#Mailing_address"
    href3="contacts.html#Mailing_address"
    href4="contacts.html#Mailing_address"
    ><b><a>mailing address</a></b></a
  >.
</p>
`;
    await formatEqual(input, expected);
  });

  it('option.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<select><option>Blue</option><option>Green</option><optgroup label="Darker"><option>Dark Blue</option><option>Dark Green</option></optgroup></select>
<input list=colors>
<datalist id=colors><option>Blue</option><option>Green</option></datalist>
`;
    const expected = `<select>
  <option>Blue</option>
  <option>Green</option>
  <optgroup label="Darker">
    <option>Dark Blue</option>
    <option>Dark Green</option>
  </optgroup>
</select>
<input list="colors" />
<datalist id="colors">
  <option>Blue</option>
  <option>Green</option>
</datalist>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('option.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<select><option>Blue</option><option>Green</option><optgroup label="Darker"><option>Dark Blue</option><option>Dark Green</option></optgroup></select>
<input list=colors>
<datalist id=colors><option>Blue</option><option>Green</option></datalist>
`;
    const expected = `<select
  ><option>Blue</option
  ><option>Green</option
  ><optgroup label="Darker"
    ><option>Dark Blue</option><option>Dark Green</option></optgroup
  ></select
>
<input list="colors" />
<datalist id="colors"><option>Blue</option><option>Green</option></datalist>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('option.html {"printWidth":"Infinity"}', async () => {
    const input = `<select><option>Blue</option><option>Green</option><optgroup label="Darker"><option>Dark Blue</option><option>Dark Green</option></optgroup></select>
<input list=colors>
<datalist id=colors><option>Blue</option><option>Green</option></datalist>
`;
    const expected = `<select>
  <option>Blue</option>
  <option>Green</option>
  <optgroup label="Darker">
    <option>Dark Blue</option>
    <option>Dark Green</option>
  </optgroup>
</select>
<input list="colors" />
<datalist id="colors">
  <option>Blue</option>
  <option>Green</option>
</datalist>
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('option.html {"printWidth":1}', async () => {
    const input = `<select><option>Blue</option><option>Green</option><optgroup label="Darker"><option>Dark Blue</option><option>Dark Green</option></optgroup></select>
<input list=colors>
<datalist id=colors><option>Blue</option><option>Green</option></datalist>
`;
    const expected = `<select>
  <option>
    Blue
  </option>
  <option>
    Green
  </option>
  <optgroup
    label="Darker"
  >
    <option>
      Dark
      Blue
    </option>
    <option>
      Dark
      Green
    </option>
  </optgroup>
</select>
<input
  list="colors"
/>
<datalist
  id="colors"
>
  <option>
    Blue
  </option>
  <option>
    Green
  </option>
</datalist>
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("option.html", async () => {
    const input = `<select><option>Blue</option><option>Green</option><optgroup label="Darker"><option>Dark Blue</option><option>Dark Green</option></optgroup></select>
<input list=colors>
<datalist id=colors><option>Blue</option><option>Green</option></datalist>
`;
    const expected = `<select>
  <option>Blue</option>
  <option>Green</option>
  <optgroup label="Darker">
    <option>Dark Blue</option>
    <option>Dark Green</option>
  </optgroup>
</select>
<input list="colors" />
<datalist id="colors">
  <option>Blue</option>
  <option>Green</option>
</datalist>
`;
    await formatEqual(input, expected);
  });

  it('pre.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<pre>
--------------------------------------------------------------------------------


                                      *         *       *
                                     **        **      ***
                                     **        **       *
   ****    ***  ****               ********  ********                   ***  ****
  * ***  *  **** **** *    ***    ********  ********  ***        ***     **** **** *
 *   ****    **   ****    * ***      **        **      ***      * ***     **   ****
**    **     **          *   ***     **        **       **     *   ***    **
**    **     **         **    ***    **        **       **    **    ***   **
**    **     **         ********     **        **       **    ********    **
**    **     **         *******      **        **       **    *******     **
**    **     **         **           **        **       **    **          **
*******      ***        ****    *    **        **       **    ****    *   ***
******        ***        *******      **        **      *** *  *******     ***
**                        *****                          ***    *****
**
**
 **

--------------------------------------------------------------------------------
</pre>
<pre>

        Text in a pre element

    is displayed in a fixed-width

   font, and it preserves

   both             spaces and

   line breaks

</pre>
<pre>     Foo     Bar     </pre>
<pre>
     Foo     Bar
</pre>
<pre>Foo     Bar
</pre>
<pre>
     Foo     Bar</pre>
<figure role="img" aria-labelledby="cow-caption">
  <pre>
___________________________
< I'm an expert in my field. >
---------------------------
     \\\\   ^__^
      \\\\  (oo)\\\\_______
         (__)\\\\       )\\\\/\\\\
             ||----w |
             ||     ||
___________________________
  </pre>
  <figcaption id="cow-caption">
    A cow saying, "I'm an expert in my field." The cow is illustrated using preformatted text characters.
  </figcaption>
</figure>
<pre data-attr-1="foo" data-attr-2="foo" data-attr-3="foo" data-attr-4="foo" data-attr-5="foo" data-attr-6="foo">
     Foo     Bar
</pre>
<div>
  <div>
    <div>
      <div>
        <pre>
          ______
          STRING
          ______
        </pre>
      </div>
    </div>
  </div>
</div>
<pre></pre>

<pre><code #foo></code></pre>

<details>
  <pre><!--Comments-->
  </pre></details>

<details><pre>
  <!--Comments-->
</pre>
</details>

<!-- #6028 -->
<pre><br></pre>
<PRE><HR></PRE>
<pre><br/></pre>
<PRE><HR/></PRE>
<pre><br /></pre>
<PRE><HR /></PRE>
<pre><span></span></pre>
<PRE><DIV></DIV></PRE>
<pre><br/>long long long text long long long text long long long text long long long text <br></pre>
<pre><br>long long long text long long long text long long long text long long long text <BR/></pre>
`;
    const expected = `<pre>
--------------------------------------------------------------------------------


                                      *         *       *
                                     **        **      ***
                                     **        **       *
   ****    ***  ****               ********  ********                   ***  ****
  * ***  *  **** **** *    ***    ********  ********  ***        ***     **** **** *
 *   ****    **   ****    * ***      **        **      ***      * ***     **   ****
**    **     **          *   ***     **        **       **     *   ***    **
**    **     **         **    ***    **        **       **    **    ***   **
**    **     **         ********     **        **       **    ********    **
**    **     **         *******      **        **       **    *******     **
**    **     **         **           **        **       **    **          **
*******      ***        ****    *    **        **       **    ****    *   ***
******        ***        *******      **        **      *** *  *******     ***
**                        *****                          ***    *****
**
**
 **

--------------------------------------------------------------------------------
</pre>
<pre>

        Text in a pre element

    is displayed in a fixed-width

   font, and it preserves

   both             spaces and

   line breaks

</pre>
<pre>     Foo     Bar     </pre>
<pre>
     Foo     Bar
</pre>
<pre>
Foo     Bar
</pre>
<pre>     Foo     Bar</pre>
<figure role="img" aria-labelledby="cow-caption">
  <pre>
___________________________
< I'm an expert in my field. >
---------------------------
     \\\\   ^__^
      \\\\  (oo)\\\\_______
         (__)\\\\       )\\\\/\\\\
             ||----w |
             ||     ||
___________________________
  </pre>
  <figcaption id="cow-caption">
    A cow saying, "I'm an expert in my field." The cow is illustrated using
    preformatted text characters.
  </figcaption>
</figure>
<pre
  data-attr-1="foo"
  data-attr-2="foo"
  data-attr-3="foo"
  data-attr-4="foo"
  data-attr-5="foo"
  data-attr-6="foo"
>
     Foo     Bar
</pre>
<div>
  <div>
    <div>
      <div>
        <pre>
          ______
          STRING
          ______
        </pre>
      </div>
    </div>
  </div>
</div>
<pre></pre>

<pre><code #foo></code></pre>

<details>
  <pre><!--Comments-->
  </pre>
</details>

<details>
  <pre>
  <!--Comments-->
</pre>
</details>

<!-- #6028 -->
<pre><br></pre>
<pre><HR></pre>
<pre><br/></pre>
<pre><HR/></pre>
<pre><br /></pre>
<pre><HR /></pre>
<pre><span></span></pre>
<pre><DIV></DIV></pre>
<pre><br/>long long long text long long long text long long long text long long long text <br></pre>
<pre><br>long long long text long long long text long long long text long long long text <BR/></pre>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('pre.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<pre>
--------------------------------------------------------------------------------


                                      *         *       *
                                     **        **      ***
                                     **        **       *
   ****    ***  ****               ********  ********                   ***  ****
  * ***  *  **** **** *    ***    ********  ********  ***        ***     **** **** *
 *   ****    **   ****    * ***      **        **      ***      * ***     **   ****
**    **     **          *   ***     **        **       **     *   ***    **
**    **     **         **    ***    **        **       **    **    ***   **
**    **     **         ********     **        **       **    ********    **
**    **     **         *******      **        **       **    *******     **
**    **     **         **           **        **       **    **          **
*******      ***        ****    *    **        **       **    ****    *   ***
******        ***        *******      **        **      *** *  *******     ***
**                        *****                          ***    *****
**
**
 **

--------------------------------------------------------------------------------
</pre>
<pre>

        Text in a pre element

    is displayed in a fixed-width

   font, and it preserves

   both             spaces and

   line breaks

</pre>
<pre>     Foo     Bar     </pre>
<pre>
     Foo     Bar
</pre>
<pre>Foo     Bar
</pre>
<pre>
     Foo     Bar</pre>
<figure role="img" aria-labelledby="cow-caption">
  <pre>
___________________________
< I'm an expert in my field. >
---------------------------
     \\\\   ^__^
      \\\\  (oo)\\\\_______
         (__)\\\\       )\\\\/\\\\
             ||----w |
             ||     ||
___________________________
  </pre>
  <figcaption id="cow-caption">
    A cow saying, "I'm an expert in my field." The cow is illustrated using preformatted text characters.
  </figcaption>
</figure>
<pre data-attr-1="foo" data-attr-2="foo" data-attr-3="foo" data-attr-4="foo" data-attr-5="foo" data-attr-6="foo">
     Foo     Bar
</pre>
<div>
  <div>
    <div>
      <div>
        <pre>
          ______
          STRING
          ______
        </pre>
      </div>
    </div>
  </div>
</div>
<pre></pre>

<pre><code #foo></code></pre>

<details>
  <pre><!--Comments-->
  </pre></details>

<details><pre>
  <!--Comments-->
</pre>
</details>

<!-- #6028 -->
<pre><br></pre>
<PRE><HR></PRE>
<pre><br/></pre>
<PRE><HR/></PRE>
<pre><br /></pre>
<PRE><HR /></PRE>
<pre><span></span></pre>
<PRE><DIV></DIV></PRE>
<pre><br/>long long long text long long long text long long long text long long long text <br></pre>
<pre><br>long long long text long long long text long long long text long long long text <BR/></pre>
`;
    const expected = `<pre>
--------------------------------------------------------------------------------


                                      *         *       *
                                     **        **      ***
                                     **        **       *
   ****    ***  ****               ********  ********                   ***  ****
  * ***  *  **** **** *    ***    ********  ********  ***        ***     **** **** *
 *   ****    **   ****    * ***      **        **      ***      * ***     **   ****
**    **     **          *   ***     **        **       **     *   ***    **
**    **     **         **    ***    **        **       **    **    ***   **
**    **     **         ********     **        **       **    ********    **
**    **     **         *******      **        **       **    *******     **
**    **     **         **           **        **       **    **          **
*******      ***        ****    *    **        **       **    ****    *   ***
******        ***        *******      **        **      *** *  *******     ***
**                        *****                          ***    *****
**
**
 **

--------------------------------------------------------------------------------
</pre>
<pre>

        Text in a pre element

    is displayed in a fixed-width

   font, and it preserves

   both             spaces and

   line breaks

</pre>
<pre>     Foo     Bar     </pre>
<pre>
     Foo     Bar
</pre>
<pre>
Foo     Bar
</pre>
<pre>     Foo     Bar</pre>
<figure role="img" aria-labelledby="cow-caption">
  <pre>
___________________________
< I'm an expert in my field. >
---------------------------
     \\\\   ^__^
      \\\\  (oo)\\\\_______
         (__)\\\\       )\\\\/\\\\
             ||----w |
             ||     ||
___________________________
  </pre>
  <figcaption id="cow-caption">
    A cow saying, "I'm an expert in my field." The cow is illustrated using
    preformatted text characters.
  </figcaption>
</figure>
<pre
  data-attr-1="foo"
  data-attr-2="foo"
  data-attr-3="foo"
  data-attr-4="foo"
  data-attr-5="foo"
  data-attr-6="foo"
>
     Foo     Bar
</pre>
<div>
  <div>
    <div>
      <div>
        <pre>
          ______
          STRING
          ______
        </pre>
      </div>
    </div>
  </div>
</div>
<pre></pre>

<pre><code #foo></code></pre>

<details>
  <pre><!--Comments-->
  </pre>
</details>

<details>
  <pre>
  <!--Comments-->
</pre>
</details>

<!-- #6028 -->
<pre><br></pre>
<pre><HR></pre>
<pre><br/></pre>
<pre><HR/></pre>
<pre><br /></pre>
<pre><HR /></pre>
<pre><span></span></pre>
<pre><DIV></DIV></pre>
<pre><br/>long long long text long long long text long long long text long long long text <br></pre>
<pre><br>long long long text long long long text long long long text long long long text <BR/></pre>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('pre.html {"printWidth":"Infinity"}', async () => {
    const input = `<pre>
--------------------------------------------------------------------------------


                                      *         *       *
                                     **        **      ***
                                     **        **       *
   ****    ***  ****               ********  ********                   ***  ****
  * ***  *  **** **** *    ***    ********  ********  ***        ***     **** **** *
 *   ****    **   ****    * ***      **        **      ***      * ***     **   ****
**    **     **          *   ***     **        **       **     *   ***    **
**    **     **         **    ***    **        **       **    **    ***   **
**    **     **         ********     **        **       **    ********    **
**    **     **         *******      **        **       **    *******     **
**    **     **         **           **        **       **    **          **
*******      ***        ****    *    **        **       **    ****    *   ***
******        ***        *******      **        **      *** *  *******     ***
**                        *****                          ***    *****
**
**
 **

--------------------------------------------------------------------------------
</pre>
<pre>

        Text in a pre element

    is displayed in a fixed-width

   font, and it preserves

   both             spaces and

   line breaks

</pre>
<pre>     Foo     Bar     </pre>
<pre>
     Foo     Bar
</pre>
<pre>Foo     Bar
</pre>
<pre>
     Foo     Bar</pre>
<figure role="img" aria-labelledby="cow-caption">
  <pre>
___________________________
< I'm an expert in my field. >
---------------------------
     \\\\   ^__^
      \\\\  (oo)\\\\_______
         (__)\\\\       )\\\\/\\\\
             ||----w |
             ||     ||
___________________________
  </pre>
  <figcaption id="cow-caption">
    A cow saying, "I'm an expert in my field." The cow is illustrated using preformatted text characters.
  </figcaption>
</figure>
<pre data-attr-1="foo" data-attr-2="foo" data-attr-3="foo" data-attr-4="foo" data-attr-5="foo" data-attr-6="foo">
     Foo     Bar
</pre>
<div>
  <div>
    <div>
      <div>
        <pre>
          ______
          STRING
          ______
        </pre>
      </div>
    </div>
  </div>
</div>
<pre></pre>

<pre><code #foo></code></pre>

<details>
  <pre><!--Comments-->
  </pre></details>

<details><pre>
  <!--Comments-->
</pre>
</details>

<!-- #6028 -->
<pre><br></pre>
<PRE><HR></PRE>
<pre><br/></pre>
<PRE><HR/></PRE>
<pre><br /></pre>
<PRE><HR /></PRE>
<pre><span></span></pre>
<PRE><DIV></DIV></PRE>
<pre><br/>long long long text long long long text long long long text long long long text <br></pre>
<pre><br>long long long text long long long text long long long text long long long text <BR/></pre>
`;
    const expected = `<pre>
--------------------------------------------------------------------------------


                                      *         *       *
                                     **        **      ***
                                     **        **       *
   ****    ***  ****               ********  ********                   ***  ****
  * ***  *  **** **** *    ***    ********  ********  ***        ***     **** **** *
 *   ****    **   ****    * ***      **        **      ***      * ***     **   ****
**    **     **          *   ***     **        **       **     *   ***    **
**    **     **         **    ***    **        **       **    **    ***   **
**    **     **         ********     **        **       **    ********    **
**    **     **         *******      **        **       **    *******     **
**    **     **         **           **        **       **    **          **
*******      ***        ****    *    **        **       **    ****    *   ***
******        ***        *******      **        **      *** *  *******     ***
**                        *****                          ***    *****
**
**
 **

--------------------------------------------------------------------------------
</pre>
<pre>

        Text in a pre element

    is displayed in a fixed-width

   font, and it preserves

   both             spaces and

   line breaks

</pre>
<pre>     Foo     Bar     </pre>
<pre>
     Foo     Bar
</pre>
<pre>
Foo     Bar
</pre>
<pre>     Foo     Bar</pre>
<figure role="img" aria-labelledby="cow-caption">
  <pre>
___________________________
< I'm an expert in my field. >
---------------------------
     \\\\   ^__^
      \\\\  (oo)\\\\_______
         (__)\\\\       )\\\\/\\\\
             ||----w |
             ||     ||
___________________________
  </pre>
  <figcaption id="cow-caption">A cow saying, "I'm an expert in my field." The cow is illustrated using preformatted text characters.</figcaption>
</figure>
<pre data-attr-1="foo" data-attr-2="foo" data-attr-3="foo" data-attr-4="foo" data-attr-5="foo" data-attr-6="foo">
     Foo     Bar
</pre>
<div>
  <div>
    <div>
      <div>
        <pre>
          ______
          STRING
          ______
        </pre>
      </div>
    </div>
  </div>
</div>
<pre></pre>

<pre><code #foo></code></pre>

<details>
  <pre><!--Comments-->
  </pre>
</details>

<details>
  <pre>
  <!--Comments-->
</pre>
</details>

<!-- #6028 -->
<pre><br></pre>
<pre><HR></pre>
<pre><br/></pre>
<pre><HR/></pre>
<pre><br /></pre>
<pre><HR /></pre>
<pre><span></span></pre>
<pre><DIV></DIV></pre>
<pre><br/>long long long text long long long text long long long text long long long text <br></pre>
<pre><br>long long long text long long long text long long long text long long long text <BR/></pre>
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('pre.html {"printWidth":1}', async () => {
    const input = `<pre>
--------------------------------------------------------------------------------


                                      *         *       *
                                     **        **      ***
                                     **        **       *
   ****    ***  ****               ********  ********                   ***  ****
  * ***  *  **** **** *    ***    ********  ********  ***        ***     **** **** *
 *   ****    **   ****    * ***      **        **      ***      * ***     **   ****
**    **     **          *   ***     **        **       **     *   ***    **
**    **     **         **    ***    **        **       **    **    ***   **
**    **     **         ********     **        **       **    ********    **
**    **     **         *******      **        **       **    *******     **
**    **     **         **           **        **       **    **          **
*******      ***        ****    *    **        **       **    ****    *   ***
******        ***        *******      **        **      *** *  *******     ***
**                        *****                          ***    *****
**
**
 **

--------------------------------------------------------------------------------
</pre>
<pre>

        Text in a pre element

    is displayed in a fixed-width

   font, and it preserves

   both             spaces and

   line breaks

</pre>
<pre>     Foo     Bar     </pre>
<pre>
     Foo     Bar
</pre>
<pre>Foo     Bar
</pre>
<pre>
     Foo     Bar</pre>
<figure role="img" aria-labelledby="cow-caption">
  <pre>
___________________________
< I'm an expert in my field. >
---------------------------
     \\\\   ^__^
      \\\\  (oo)\\\\_______
         (__)\\\\       )\\\\/\\\\
             ||----w |
             ||     ||
___________________________
  </pre>
  <figcaption id="cow-caption">
    A cow saying, "I'm an expert in my field." The cow is illustrated using preformatted text characters.
  </figcaption>
</figure>
<pre data-attr-1="foo" data-attr-2="foo" data-attr-3="foo" data-attr-4="foo" data-attr-5="foo" data-attr-6="foo">
     Foo     Bar
</pre>
<div>
  <div>
    <div>
      <div>
        <pre>
          ______
          STRING
          ______
        </pre>
      </div>
    </div>
  </div>
</div>
<pre></pre>

<pre><code #foo></code></pre>

<details>
  <pre><!--Comments-->
  </pre></details>

<details><pre>
  <!--Comments-->
</pre>
</details>

<!-- #6028 -->
<pre><br></pre>
<PRE><HR></PRE>
<pre><br/></pre>
<PRE><HR/></PRE>
<pre><br /></pre>
<PRE><HR /></PRE>
<pre><span></span></pre>
<PRE><DIV></DIV></PRE>
<pre><br/>long long long text long long long text long long long text long long long text <br></pre>
<pre><br>long long long text long long long text long long long text long long long text <BR/></pre>
`;
    const expected = `<pre>
--------------------------------------------------------------------------------


                                      *         *       *
                                     **        **      ***
                                     **        **       *
   ****    ***  ****               ********  ********                   ***  ****
  * ***  *  **** **** *    ***    ********  ********  ***        ***     **** **** *
 *   ****    **   ****    * ***      **        **      ***      * ***     **   ****
**    **     **          *   ***     **        **       **     *   ***    **
**    **     **         **    ***    **        **       **    **    ***   **
**    **     **         ********     **        **       **    ********    **
**    **     **         *******      **        **       **    *******     **
**    **     **         **           **        **       **    **          **
*******      ***        ****    *    **        **       **    ****    *   ***
******        ***        *******      **        **      *** *  *******     ***
**                        *****                          ***    *****
**
**
 **

--------------------------------------------------------------------------------
</pre>
<pre>

        Text in a pre element

    is displayed in a fixed-width

   font, and it preserves

   both             spaces and

   line breaks

</pre>
<pre>
     Foo     Bar     </pre
>
<pre>
     Foo     Bar
</pre>
<pre>
Foo     Bar
</pre>
<pre>
     Foo     Bar</pre
>
<figure
  role="img"
  aria-labelledby="cow-caption"
>
  <pre>
___________________________
< I'm an expert in my field. >
---------------------------
     \\\\   ^__^
      \\\\  (oo)\\\\_______
         (__)\\\\       )\\\\/\\\\
             ||----w |
             ||     ||
___________________________
  </pre>
  <figcaption
    id="cow-caption"
  >
    A
    cow
    saying,
    "I'm
    an
    expert
    in
    my
    field."
    The
    cow
    is
    illustrated
    using
    preformatted
    text
    characters.
  </figcaption>
</figure>
<pre
  data-attr-1="foo"
  data-attr-2="foo"
  data-attr-3="foo"
  data-attr-4="foo"
  data-attr-5="foo"
  data-attr-6="foo"
>
     Foo     Bar
</pre>
<div>
  <div>
    <div>
      <div>
        <pre>
          ______
          STRING
          ______
        </pre>
      </div>
    </div>
  </div>
</div>
<pre></pre>

<pre><code #foo></code></pre>

<details>
  <pre><!--Comments-->
  </pre>
</details>

<details>
  <pre>
  <!--Comments-->
</pre>
</details>

<!-- #6028 -->
<pre><br></pre>
<pre><HR></pre>
<pre><br/></pre>
<pre><HR/></pre>
<pre><br /></pre>
<pre><HR /></pre>
<pre><span></span></pre>
<pre><DIV></DIV></pre>
<pre><br/>long long long text long long long text long long long text long long long text <br></pre>
<pre><br>long long long text long long long text long long long text long long long text <BR/></pre>
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("pre.html", async () => {
    const input = `<pre>
--------------------------------------------------------------------------------


                                      *         *       *
                                     **        **      ***
                                     **        **       *
   ****    ***  ****               ********  ********                   ***  ****
  * ***  *  **** **** *    ***    ********  ********  ***        ***     **** **** *
 *   ****    **   ****    * ***      **        **      ***      * ***     **   ****
**    **     **          *   ***     **        **       **     *   ***    **
**    **     **         **    ***    **        **       **    **    ***   **
**    **     **         ********     **        **       **    ********    **
**    **     **         *******      **        **       **    *******     **
**    **     **         **           **        **       **    **          **
*******      ***        ****    *    **        **       **    ****    *   ***
******        ***        *******      **        **      *** *  *******     ***
**                        *****                          ***    *****
**
**
 **

--------------------------------------------------------------------------------
</pre>
<pre>

        Text in a pre element

    is displayed in a fixed-width

   font, and it preserves

   both             spaces and

   line breaks

</pre>
<pre>     Foo     Bar     </pre>
<pre>
     Foo     Bar
</pre>
<pre>Foo     Bar
</pre>
<pre>
     Foo     Bar</pre>
<figure role="img" aria-labelledby="cow-caption">
  <pre>
___________________________
< I'm an expert in my field. >
---------------------------
     \\\\   ^__^
      \\\\  (oo)\\\\_______
         (__)\\\\       )\\\\/\\\\
             ||----w |
             ||     ||
___________________________
  </pre>
  <figcaption id="cow-caption">
    A cow saying, "I'm an expert in my field." The cow is illustrated using preformatted text characters.
  </figcaption>
</figure>
<pre data-attr-1="foo" data-attr-2="foo" data-attr-3="foo" data-attr-4="foo" data-attr-5="foo" data-attr-6="foo">
     Foo     Bar
</pre>
<div>
  <div>
    <div>
      <div>
        <pre>
          ______
          STRING
          ______
        </pre>
      </div>
    </div>
  </div>
</div>
<pre></pre>

<pre><code #foo></code></pre>

<details>
  <pre><!--Comments-->
  </pre></details>

<details><pre>
  <!--Comments-->
</pre>
</details>

<!-- #6028 -->
<pre><br></pre>
<PRE><HR></PRE>
<pre><br/></pre>
<PRE><HR/></PRE>
<pre><br /></pre>
<PRE><HR /></PRE>
<pre><span></span></pre>
<PRE><DIV></DIV></PRE>
<pre><br/>long long long text long long long text long long long text long long long text <br></pre>
<pre><br>long long long text long long long text long long long text long long long text <BR/></pre>
`;
    const expected = `<pre>
--------------------------------------------------------------------------------


                                      *         *       *
                                     **        **      ***
                                     **        **       *
   ****    ***  ****               ********  ********                   ***  ****
  * ***  *  **** **** *    ***    ********  ********  ***        ***     **** **** *
 *   ****    **   ****    * ***      **        **      ***      * ***     **   ****
**    **     **          *   ***     **        **       **     *   ***    **
**    **     **         **    ***    **        **       **    **    ***   **
**    **     **         ********     **        **       **    ********    **
**    **     **         *******      **        **       **    *******     **
**    **     **         **           **        **       **    **          **
*******      ***        ****    *    **        **       **    ****    *   ***
******        ***        *******      **        **      *** *  *******     ***
**                        *****                          ***    *****
**
**
 **

--------------------------------------------------------------------------------
</pre>
<pre>

        Text in a pre element

    is displayed in a fixed-width

   font, and it preserves

   both             spaces and

   line breaks

</pre>
<pre>     Foo     Bar     </pre>
<pre>
     Foo     Bar
</pre>
<pre>
Foo     Bar
</pre>
<pre>     Foo     Bar</pre>
<figure role="img" aria-labelledby="cow-caption">
  <pre>
___________________________
< I'm an expert in my field. >
---------------------------
     \\\\   ^__^
      \\\\  (oo)\\\\_______
         (__)\\\\       )\\\\/\\\\
             ||----w |
             ||     ||
___________________________
  </pre>
  <figcaption id="cow-caption">
    A cow saying, "I'm an expert in my field." The cow is illustrated using
    preformatted text characters.
  </figcaption>
</figure>
<pre
  data-attr-1="foo"
  data-attr-2="foo"
  data-attr-3="foo"
  data-attr-4="foo"
  data-attr-5="foo"
  data-attr-6="foo"
>
     Foo     Bar
</pre>
<div>
  <div>
    <div>
      <div>
        <pre>
          ______
          STRING
          ______
        </pre>
      </div>
    </div>
  </div>
</div>
<pre></pre>

<pre><code #foo></code></pre>

<details>
  <pre><!--Comments-->
  </pre>
</details>

<details>
  <pre>
  <!--Comments-->
</pre>
</details>

<!-- #6028 -->
<pre><br></pre>
<pre><HR></pre>
<pre><br/></pre>
<pre><HR/></pre>
<pre><br /></pre>
<pre><HR /></pre>
<pre><span></span></pre>
<pre><DIV></DIV></pre>
<pre><br/>long long long text long long long text long long long text long long long text <br></pre>
<pre><br>long long long text long long long text long long long text long long long text <BR/></pre>
`;
    await formatEqual(input, expected);
  });

  it('seach.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
<header>
  <h1><a href="/">My fancy blog</a></h1>
  ...
  <search>
    <form action="search.php">
      <label for="query">Find an article</label>
      <input id="query" name="q" type="search">
      <button type="submit">Go!</button>
    </form>
  </search>

  <SEARCH></SEARCH>
</header>
</body>
</html>
`;
    const expected = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <header>
      <h1><a href="/">My fancy blog</a></h1>
      ...
      <search>
        <form action="search.php">
          <label for="query">Find an article</label>
          <input id="query" name="q" type="search" />
          <button type="submit">Go!</button>
        </form>
      </search>

      <search></search>
    </header>
  </body>
</html>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('seach.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
<header>
  <h1><a href="/">My fancy blog</a></h1>
  ...
  <search>
    <form action="search.php">
      <label for="query">Find an article</label>
      <input id="query" name="q" type="search">
      <button type="submit">Go!</button>
    </form>
  </search>

  <SEARCH></SEARCH>
</header>
</body>
</html>
`;
    const expected = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <header>
      <h1><a href="/">My fancy blog</a></h1>
      ...
      <search>
        <form action="search.php">
          <label for="query">Find an article</label>
          <input id="query" name="q" type="search" />
          <button type="submit">Go!</button>
        </form>
      </search>

      <search></search>
    </header>
  </body>
</html>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('seach.html {"printWidth":"Infinity"}', async () => {
    const input = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
<header>
  <h1><a href="/">My fancy blog</a></h1>
  ...
  <search>
    <form action="search.php">
      <label for="query">Find an article</label>
      <input id="query" name="q" type="search">
      <button type="submit">Go!</button>
    </form>
  </search>

  <SEARCH></SEARCH>
</header>
</body>
</html>
`;
    const expected = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <header>
      <h1><a href="/">My fancy blog</a></h1>
      ...
      <search>
        <form action="search.php">
          <label for="query">Find an article</label>
          <input id="query" name="q" type="search" />
          <button type="submit">Go!</button>
        </form>
      </search>

      <search></search>
    </header>
  </body>
</html>
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('seach.html {"printWidth":1}', async () => {
    const input = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
<header>
  <h1><a href="/">My fancy blog</a></h1>
  ...
  <search>
    <form action="search.php">
      <label for="query">Find an article</label>
      <input id="query" name="q" type="search">
      <button type="submit">Go!</button>
    </form>
  </search>

  <SEARCH></SEARCH>
</header>
</body>
</html>
`;
    const expected = `<!doctype html>
<html
  lang="en"
>
  <head>
    <meta
      charset="UTF-8"
    />
    <meta
      http-equiv="X-UA-Compatible"
      content="IE=edge"
    />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />
    <title>
      Document
    </title>
  </head>
  <body>
    <header>
      <h1>
        <a
          href="/"
          >My
          fancy
          blog</a
        >
      </h1>
      ...
      <search>
        <form
          action="search.php"
        >
          <label
            for="query"
            >Find
            an
            article</label
          >
          <input
            id="query"
            name="q"
            type="search"
          />
          <button
            type="submit"
          >
            Go!
          </button>
        </form>
      </search>

      <search></search>
    </header>
  </body>
</html>
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("seach.html", async () => {
    const input = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
<header>
  <h1><a href="/">My fancy blog</a></h1>
  ...
  <search>
    <form action="search.php">
      <label for="query">Find an article</label>
      <input id="query" name="q" type="search">
      <button type="submit">Go!</button>
    </form>
  </search>

  <SEARCH></SEARCH>
</header>
</body>
</html>
`;
    const expected = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <header>
      <h1><a href="/">My fancy blog</a></h1>
      ...
      <search>
        <form action="search.php">
          <label for="query">Find an article</label>
          <input id="query" name="q" type="search" />
          <button type="submit">Go!</button>
        </form>
      </search>

      <search></search>
    </header>
  </body>
</html>
`;
    await formatEqual(input, expected);
  });

  it('tags.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<br/>
<br />
<br  />
<br
/>
<br attribute-a />
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute />
<br attribute-a="value" />
<br
  attribute-a="value"
/>
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value" />
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value" />
<br attribute-a="value" attribute-b="value" attribute-c="value" attribute-d="value" attribute-e="value" attribute-f="value" />
<div>string</div>
<div>very very very very very very very very very very very very very very very very long string</div>
<div very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute>string</div>
<div very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value">string</div>
<div attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value">string</div>
<div attribute="value">very very very very very very very very very very very very very very very very long string</div>
<div attribute="value" attributea="value" attributeb="value" attributec="value" attributed="value" attributef="value">string</div>
<div attribute="value" attributea="value" attributeb="value" attributec="value" attributed="value" attributef="value">very very very very very very very very very very very very very very very very long string</div>
<video width="320" height="240" controls>
  <source src="movie.mp4" type="video/mp4">
  <source src="movie.ogg" type="video/ogg">
  Your browser does not support the video tag.
</video>
<div><div>string</div></div>
<div><div>string</div><div>string</div></div>
<div><div><div>string</div></div><div>string</div></div>
<div><div>string</div><div><div>string</div></div></div>
<div><div></div></div>
<div><div></div><div></div></div>
<div><div><div><div><div><div><div>string</div></div></div></div></div></div></div>
<div>
  <div>string</div>
</div>
<div>

  <div>string</div>

</div>
<div>

  <div>string</div>

  <div>string</div>

</div>
<ul
  >123<li
    class="foo"
    id="bar"
  >First</li
  >456<li
    class="baz"
  >Second</li
  >789</ul
>
<span>*<b>200</b></span>
<img src="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong" />123
<div>123<meta attr/>456</div>
<p>x<span a="b"></span></p>
<p>x<meta a></p>
<p>x<meta></p>
<span></span>

<label aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa></label> |
<span></span>
<br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  >12345678901234567890</button
> <br /><br />

<button bind-disabled="isUnchanged" on-click="onSave($event)"
  >Disabled Cancel</button
>
<br /><br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  >12345678901234567890</button
> <br /><br />

<button bind-disabled="isUnchanged" on-click="onSave($event)"
  >Disabled Cancel</button
>
<br /><br />
<p>"<span [innerHTML]="title"></span>" is the <i>property bound</i> title.</p>
<li>12345678901234567890123456789012345678901234567890123456789012345678901234567890</li>
<div>
<app-nav></app-nav>
<router-outlet></router-outlet>
<app-footer></app-footer>

<app-nav [input]="something"></app-nav>
<router-outlet></router-outlet>
<app-footer></app-footer>

<app-primary-navigation></app-primary-navigation>
<router-outlet></router-outlet>
<app-footer [input]="something"></app-footer>
</div>
<x:root><SPAN>tag name in other namespace should also lower cased</SPAN></x:root>
<div>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
  "<strong>seddoeiusmod</strong>".
</div>
<div>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
  <strong>seddoeiusmod</strong>.
</div>
<span>
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
</span>

<!-- #5810 -->
<table><tr>
</tr>
</table><div>Should not insert empty line before this div</div>

<!-- self-closing -->
<span><input type="checkbox"/> </span>
<span><span><input type="checkbox"/></span></span>
<span><input type="checkbox"/></span>
`;
    const expected = `<br />
<br />
<br />
<br />
<br attribute-a />
<br
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute
/>
<br attribute-a="value" />
<br attribute-a="value" />
<br
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value"
/>
<br
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value"
/>
<br
  attribute-a="value"
  attribute-b="value"
  attribute-c="value"
  attribute-d="value"
  attribute-e="value"
  attribute-f="value"
/>
<div>string</div>
<div>
  very very very very very very very very very very very very very very very
  very long string
</div>
<div
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute
>
  string
</div>
<div
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value"
>
  string
</div>
<div
  attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value"
>
  string
</div>
<div attribute="value">
  very very very very very very very very very very very very very very very
  very long string
</div>
<div
  attribute="value"
  attributea="value"
  attributeb="value"
  attributec="value"
  attributed="value"
  attributef="value"
>
  string
</div>
<div
  attribute="value"
  attributea="value"
  attributeb="value"
  attributec="value"
  attributed="value"
  attributef="value"
>
  very very very very very very very very very very very very very very very
  very long string
</div>
<video width="320" height="240" controls>
  <source src="movie.mp4" type="video/mp4" />
  <source src="movie.ogg" type="video/ogg" />
  Your browser does not support the video tag.
</video>
<div><div>string</div></div>
<div>
  <div>string</div>
  <div>string</div>
</div>
<div>
  <div><div>string</div></div>
  <div>string</div>
</div>
<div>
  <div>string</div>
  <div><div>string</div></div>
</div>
<div><div></div></div>
<div>
  <div></div>
  <div></div>
</div>
<div>
  <div>
    <div>
      <div>
        <div>
          <div><div>string</div></div>
        </div>
      </div>
    </div>
  </div>
</div>
<div>
  <div>string</div>
</div>
<div>
  <div>string</div>
</div>
<div>
  <div>string</div>

  <div>string</div>
</div>
<ul>
  123
  <li class="foo" id="bar">First</li>
  456
  <li class="baz">Second</li>
  789
</ul>
<span>
  *
  <b>200</b>
</span>
<img
  src="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
/>
123
<div>
  123
  <meta attr />
  456
</div>
<p>
  x
  <span a="b"></span>
</p>
<p>
  x
  <meta a />
</p>
<p>
  x
  <meta />
</p>
<span></span>

<label
  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
></label>
|
<span></span>
<br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx>12345678901234567890</button>
<br />
<br />

<button bind-disabled="isUnchanged" on-click="onSave($event)">
  Disabled Cancel
</button>
<br />
<br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx>12345678901234567890</button>
<br />
<br />

<button bind-disabled="isUnchanged" on-click="onSave($event)">
  Disabled Cancel
</button>
<br />
<br />
<p>
  "
  <span [innerHTML]="title"></span>
  " is the
  <i>property bound</i>
  title.
</p>
<li>
  12345678901234567890123456789012345678901234567890123456789012345678901234567890
</li>
<div>
  <app-nav></app-nav>
  <router-outlet></router-outlet>
  <app-footer></app-footer>

  <app-nav [input]="something"></app-nav>
  <router-outlet></router-outlet>
  <app-footer></app-footer>

  <app-primary-navigation></app-primary-navigation>
  <router-outlet></router-outlet>
  <app-footer [input]="something"></app-footer>
</div>
<x:root>
  <span>tag name in other namespace should also lower cased</span>
</x:root>
<div>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, "
  <strong>seddoeiusmod</strong>
  ".
</div>
<div>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
  <strong>seddoeiusmod</strong>
  .
</div>
<span>
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
</span>

<!-- #5810 -->
<table><tr></tr></table>
<div>Should not insert empty line before this div</div>

<!-- self-closing -->
<span><input type="checkbox" /></span>
<span>
  <span><input type="checkbox" /></span>
</span>
<span><input type="checkbox" /></span>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('tags.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<br/>
<br />
<br  />
<br
/>
<br attribute-a />
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute />
<br attribute-a="value" />
<br
  attribute-a="value"
/>
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value" />
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value" />
<br attribute-a="value" attribute-b="value" attribute-c="value" attribute-d="value" attribute-e="value" attribute-f="value" />
<div>string</div>
<div>very very very very very very very very very very very very very very very very long string</div>
<div very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute>string</div>
<div very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value">string</div>
<div attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value">string</div>
<div attribute="value">very very very very very very very very very very very very very very very very long string</div>
<div attribute="value" attributea="value" attributeb="value" attributec="value" attributed="value" attributef="value">string</div>
<div attribute="value" attributea="value" attributeb="value" attributec="value" attributed="value" attributef="value">very very very very very very very very very very very very very very very very long string</div>
<video width="320" height="240" controls>
  <source src="movie.mp4" type="video/mp4">
  <source src="movie.ogg" type="video/ogg">
  Your browser does not support the video tag.
</video>
<div><div>string</div></div>
<div><div>string</div><div>string</div></div>
<div><div><div>string</div></div><div>string</div></div>
<div><div>string</div><div><div>string</div></div></div>
<div><div></div></div>
<div><div></div><div></div></div>
<div><div><div><div><div><div><div>string</div></div></div></div></div></div></div>
<div>
  <div>string</div>
</div>
<div>

  <div>string</div>

</div>
<div>

  <div>string</div>

  <div>string</div>

</div>
<ul
  >123<li
    class="foo"
    id="bar"
  >First</li
  >456<li
    class="baz"
  >Second</li
  >789</ul
>
<span>*<b>200</b></span>
<img src="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong" />123
<div>123<meta attr/>456</div>
<p>x<span a="b"></span></p>
<p>x<meta a></p>
<p>x<meta></p>
<span></span>

<label aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa></label> |
<span></span>
<br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  >12345678901234567890</button
> <br /><br />

<button bind-disabled="isUnchanged" on-click="onSave($event)"
  >Disabled Cancel</button
>
<br /><br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  >12345678901234567890</button
> <br /><br />

<button bind-disabled="isUnchanged" on-click="onSave($event)"
  >Disabled Cancel</button
>
<br /><br />
<p>"<span [innerHTML]="title"></span>" is the <i>property bound</i> title.</p>
<li>12345678901234567890123456789012345678901234567890123456789012345678901234567890</li>
<div>
<app-nav></app-nav>
<router-outlet></router-outlet>
<app-footer></app-footer>

<app-nav [input]="something"></app-nav>
<router-outlet></router-outlet>
<app-footer></app-footer>

<app-primary-navigation></app-primary-navigation>
<router-outlet></router-outlet>
<app-footer [input]="something"></app-footer>
</div>
<x:root><SPAN>tag name in other namespace should also lower cased</SPAN></x:root>
<div>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
  "<strong>seddoeiusmod</strong>".
</div>
<div>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
  <strong>seddoeiusmod</strong>.
</div>
<span>
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
</span>

<!-- #5810 -->
<table><tr>
</tr>
</table><div>Should not insert empty line before this div</div>

<!-- self-closing -->
<span><input type="checkbox"/> </span>
<span><span><input type="checkbox"/></span></span>
<span><input type="checkbox"/></span>
`;
    const expected = `<br />
<br />
<br />
<br />
<br attribute-a />
<br
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute
/>
<br attribute-a="value" />
<br attribute-a="value" />
<br
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value"
/>
<br
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value"
/>
<br
  attribute-a="value"
  attribute-b="value"
  attribute-c="value"
  attribute-d="value"
  attribute-e="value"
  attribute-f="value"
/>
<div>string</div>
<div
  >very very very very very very very very very very very very very very very
  very long string</div
>
<div
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute
  >string</div
>
<div
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value"
  >string</div
>
<div
  attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value"
  >string</div
>
<div attribute="value"
  >very very very very very very very very very very very very very very very
  very long string</div
>
<div
  attribute="value"
  attributea="value"
  attributeb="value"
  attributec="value"
  attributed="value"
  attributef="value"
  >string</div
>
<div
  attribute="value"
  attributea="value"
  attributeb="value"
  attributec="value"
  attributed="value"
  attributef="value"
  >very very very very very very very very very very very very very very very
  very long string</div
>
<video width="320" height="240" controls>
  <source src="movie.mp4" type="video/mp4" />
  <source src="movie.ogg" type="video/ogg" />
  Your browser does not support the video tag.
</video>
<div><div>string</div></div>
<div><div>string</div><div>string</div></div>
<div
  ><div><div>string</div></div
  ><div>string</div></div
>
<div
  ><div>string</div><div><div>string</div></div></div
>
<div><div></div></div>
<div><div></div><div></div></div>
<div
  ><div
    ><div
      ><div
        ><div
          ><div><div>string</div></div></div
        ></div
      ></div
    ></div
  ></div
>
<div>
  <div>string</div>
</div>
<div>
  <div>string</div>
</div>
<div>
  <div>string</div>

  <div>string</div>
</div>
<ul
  >123<li class="foo" id="bar">First</li
  >456<li class="baz">Second</li
  >789</ul
>
<span>*<b>200</b></span>
<img
  src="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
/>123
<div>123<meta attr />456</div>
<p>x<span a="b"></span></p>
<p>x<meta a /></p>
<p>x<meta /></p>
<span></span>

<label
  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
></label>
|
<span></span>
<br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx>12345678901234567890</button>
<br /><br />

<button bind-disabled="isUnchanged" on-click="onSave($event)"
  >Disabled Cancel</button
>
<br /><br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx>12345678901234567890</button>
<br /><br />

<button bind-disabled="isUnchanged" on-click="onSave($event)"
  >Disabled Cancel</button
>
<br /><br />
<p>"<span [innerHTML]="title"></span>" is the <i>property bound</i> title.</p>
<li
  >12345678901234567890123456789012345678901234567890123456789012345678901234567890</li
>
<div>
  <app-nav></app-nav>
  <router-outlet></router-outlet>
  <app-footer></app-footer>

  <app-nav [input]="something"></app-nav>
  <router-outlet></router-outlet>
  <app-footer></app-footer>

  <app-primary-navigation></app-primary-navigation>
  <router-outlet></router-outlet>
  <app-footer [input]="something"></app-footer>
</div>
<x:root
  ><span>tag name in other namespace should also lower cased</span></x:root
>
<div>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
  "<strong>seddoeiusmod</strong>".
</div>
<div>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
  <strong>seddoeiusmod</strong>.
</div>
<span>
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
</span>

<!-- #5810 -->
<table><tr> </tr> </table
><div>Should not insert empty line before this div</div>

<!-- self-closing -->
<span><input type="checkbox" /> </span>
<span
  ><span><input type="checkbox" /></span
></span>
<span><input type="checkbox" /></span>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('tags.html {"printWidth":"Infinity"}', async () => {
    const input = `<br/>
<br />
<br  />
<br
/>
<br attribute-a />
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute />
<br attribute-a="value" />
<br
  attribute-a="value"
/>
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value" />
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value" />
<br attribute-a="value" attribute-b="value" attribute-c="value" attribute-d="value" attribute-e="value" attribute-f="value" />
<div>string</div>
<div>very very very very very very very very very very very very very very very very long string</div>
<div very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute>string</div>
<div very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value">string</div>
<div attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value">string</div>
<div attribute="value">very very very very very very very very very very very very very very very very long string</div>
<div attribute="value" attributea="value" attributeb="value" attributec="value" attributed="value" attributef="value">string</div>
<div attribute="value" attributea="value" attributeb="value" attributec="value" attributed="value" attributef="value">very very very very very very very very very very very very very very very very long string</div>
<video width="320" height="240" controls>
  <source src="movie.mp4" type="video/mp4">
  <source src="movie.ogg" type="video/ogg">
  Your browser does not support the video tag.
</video>
<div><div>string</div></div>
<div><div>string</div><div>string</div></div>
<div><div><div>string</div></div><div>string</div></div>
<div><div>string</div><div><div>string</div></div></div>
<div><div></div></div>
<div><div></div><div></div></div>
<div><div><div><div><div><div><div>string</div></div></div></div></div></div></div>
<div>
  <div>string</div>
</div>
<div>

  <div>string</div>

</div>
<div>

  <div>string</div>

  <div>string</div>

</div>
<ul
  >123<li
    class="foo"
    id="bar"
  >First</li
  >456<li
    class="baz"
  >Second</li
  >789</ul
>
<span>*<b>200</b></span>
<img src="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong" />123
<div>123<meta attr/>456</div>
<p>x<span a="b"></span></p>
<p>x<meta a></p>
<p>x<meta></p>
<span></span>

<label aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa></label> |
<span></span>
<br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  >12345678901234567890</button
> <br /><br />

<button bind-disabled="isUnchanged" on-click="onSave($event)"
  >Disabled Cancel</button
>
<br /><br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  >12345678901234567890</button
> <br /><br />

<button bind-disabled="isUnchanged" on-click="onSave($event)"
  >Disabled Cancel</button
>
<br /><br />
<p>"<span [innerHTML]="title"></span>" is the <i>property bound</i> title.</p>
<li>12345678901234567890123456789012345678901234567890123456789012345678901234567890</li>
<div>
<app-nav></app-nav>
<router-outlet></router-outlet>
<app-footer></app-footer>

<app-nav [input]="something"></app-nav>
<router-outlet></router-outlet>
<app-footer></app-footer>

<app-primary-navigation></app-primary-navigation>
<router-outlet></router-outlet>
<app-footer [input]="something"></app-footer>
</div>
<x:root><SPAN>tag name in other namespace should also lower cased</SPAN></x:root>
<div>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
  "<strong>seddoeiusmod</strong>".
</div>
<div>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
  <strong>seddoeiusmod</strong>.
</div>
<span>
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
</span>

<!-- #5810 -->
<table><tr>
</tr>
</table><div>Should not insert empty line before this div</div>

<!-- self-closing -->
<span><input type="checkbox"/> </span>
<span><span><input type="checkbox"/></span></span>
<span><input type="checkbox"/></span>
`;
    const expected = `<br />
<br />
<br />
<br />
<br attribute-a />
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute />
<br attribute-a="value" />
<br attribute-a="value" />
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value" />
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value" />
<br attribute-a="value" attribute-b="value" attribute-c="value" attribute-d="value" attribute-e="value" attribute-f="value" />
<div>string</div>
<div>very very very very very very very very very very very very very very very very long string</div>
<div very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute>string</div>
<div very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value">string</div>
<div attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value">string</div>
<div attribute="value">very very very very very very very very very very very very very very very very long string</div>
<div attribute="value" attributea="value" attributeb="value" attributec="value" attributed="value" attributef="value">string</div>
<div attribute="value" attributea="value" attributeb="value" attributec="value" attributed="value" attributef="value">very very very very very very very very very very very very very very very very long string</div>
<video width="320" height="240" controls>
  <source src="movie.mp4" type="video/mp4" />
  <source src="movie.ogg" type="video/ogg" />
  Your browser does not support the video tag.
</video>
<div><div>string</div></div>
<div>
  <div>string</div>
  <div>string</div>
</div>
<div>
  <div><div>string</div></div>
  <div>string</div>
</div>
<div>
  <div>string</div>
  <div><div>string</div></div>
</div>
<div><div></div></div>
<div>
  <div></div>
  <div></div>
</div>
<div>
  <div>
    <div>
      <div>
        <div>
          <div><div>string</div></div>
        </div>
      </div>
    </div>
  </div>
</div>
<div>
  <div>string</div>
</div>
<div>
  <div>string</div>
</div>
<div>
  <div>string</div>

  <div>string</div>
</div>
<ul>
  123
  <li class="foo" id="bar">First</li>
  456
  <li class="baz">Second</li>
  789
</ul>
<span>*<b>200</b></span>
<img src="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong" />123
<div>123<meta attr />456</div>
<p>x<span a="b"></span></p>
<p>x<meta a /></p>
<p>x<meta /></p>
<span></span>

<label aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa></label> |
<span></span>
<br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx>12345678901234567890</button> <br /><br />

<button bind-disabled="isUnchanged" on-click="onSave($event)">Disabled Cancel</button>
<br /><br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx>12345678901234567890</button> <br /><br />

<button bind-disabled="isUnchanged" on-click="onSave($event)">Disabled Cancel</button>
<br /><br />
<p>"<span [innerHTML]="title"></span>" is the <i>property bound</i> title.</p>
<li>12345678901234567890123456789012345678901234567890123456789012345678901234567890</li>
<div>
  <app-nav></app-nav>
  <router-outlet></router-outlet>
  <app-footer></app-footer>

  <app-nav [input]="something"></app-nav>
  <router-outlet></router-outlet>
  <app-footer></app-footer>

  <app-primary-navigation></app-primary-navigation>
  <router-outlet></router-outlet>
  <app-footer [input]="something"></app-footer>
</div>
<x:root><span>tag name in other namespace should also lower cased</span></x:root>
<div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, "<strong>seddoeiusmod</strong>".</div>
<div>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
  <strong>seddoeiusmod</strong>.
</div>
<span>
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
</span>

<!-- #5810 -->
<table>
  <tr></tr>
</table>
<div>Should not insert empty line before this div</div>

<!-- self-closing -->
<span><input type="checkbox" /> </span>
<span
  ><span><input type="checkbox" /></span
></span>
<span><input type="checkbox" /></span>
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('tags.html {"printWidth":1}', async () => {
    const input = `<br/>
<br />
<br  />
<br
/>
<br attribute-a />
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute />
<br attribute-a="value" />
<br
  attribute-a="value"
/>
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value" />
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value" />
<br attribute-a="value" attribute-b="value" attribute-c="value" attribute-d="value" attribute-e="value" attribute-f="value" />
<div>string</div>
<div>very very very very very very very very very very very very very very very very long string</div>
<div very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute>string</div>
<div very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value">string</div>
<div attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value">string</div>
<div attribute="value">very very very very very very very very very very very very very very very very long string</div>
<div attribute="value" attributea="value" attributeb="value" attributec="value" attributed="value" attributef="value">string</div>
<div attribute="value" attributea="value" attributeb="value" attributec="value" attributed="value" attributef="value">very very very very very very very very very very very very very very very very long string</div>
<video width="320" height="240" controls>
  <source src="movie.mp4" type="video/mp4">
  <source src="movie.ogg" type="video/ogg">
  Your browser does not support the video tag.
</video>
<div><div>string</div></div>
<div><div>string</div><div>string</div></div>
<div><div><div>string</div></div><div>string</div></div>
<div><div>string</div><div><div>string</div></div></div>
<div><div></div></div>
<div><div></div><div></div></div>
<div><div><div><div><div><div><div>string</div></div></div></div></div></div></div>
<div>
  <div>string</div>
</div>
<div>

  <div>string</div>

</div>
<div>

  <div>string</div>

  <div>string</div>

</div>
<ul
  >123<li
    class="foo"
    id="bar"
  >First</li
  >456<li
    class="baz"
  >Second</li
  >789</ul
>
<span>*<b>200</b></span>
<img src="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong" />123
<div>123<meta attr/>456</div>
<p>x<span a="b"></span></p>
<p>x<meta a></p>
<p>x<meta></p>
<span></span>

<label aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa></label> |
<span></span>
<br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  >12345678901234567890</button
> <br /><br />

<button bind-disabled="isUnchanged" on-click="onSave($event)"
  >Disabled Cancel</button
>
<br /><br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  >12345678901234567890</button
> <br /><br />

<button bind-disabled="isUnchanged" on-click="onSave($event)"
  >Disabled Cancel</button
>
<br /><br />
<p>"<span [innerHTML]="title"></span>" is the <i>property bound</i> title.</p>
<li>12345678901234567890123456789012345678901234567890123456789012345678901234567890</li>
<div>
<app-nav></app-nav>
<router-outlet></router-outlet>
<app-footer></app-footer>

<app-nav [input]="something"></app-nav>
<router-outlet></router-outlet>
<app-footer></app-footer>

<app-primary-navigation></app-primary-navigation>
<router-outlet></router-outlet>
<app-footer [input]="something"></app-footer>
</div>
<x:root><SPAN>tag name in other namespace should also lower cased</SPAN></x:root>
<div>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
  "<strong>seddoeiusmod</strong>".
</div>
<div>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
  <strong>seddoeiusmod</strong>.
</div>
<span>
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
</span>

<!-- #5810 -->
<table><tr>
</tr>
</table><div>Should not insert empty line before this div</div>

<!-- self-closing -->
<span><input type="checkbox"/> </span>
<span><span><input type="checkbox"/></span></span>
<span><input type="checkbox"/></span>
`;
    const expected = `<br />
<br />
<br />
<br />
<br
  attribute-a
/>
<br
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute
/>
<br
  attribute-a="value"
/>
<br
  attribute-a="value"
/>
<br
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value"
/>
<br
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value"
/>
<br
  attribute-a="value"
  attribute-b="value"
  attribute-c="value"
  attribute-d="value"
  attribute-e="value"
  attribute-f="value"
/>
<div>
  string
</div>
<div>
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  long
  string
</div>
<div
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute
>
  string
</div>
<div
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value"
>
  string
</div>
<div
  attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value"
>
  string
</div>
<div
  attribute="value"
>
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  long
  string
</div>
<div
  attribute="value"
  attributea="value"
  attributeb="value"
  attributec="value"
  attributed="value"
  attributef="value"
>
  string
</div>
<div
  attribute="value"
  attributea="value"
  attributeb="value"
  attributec="value"
  attributed="value"
  attributef="value"
>
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  very
  long
  string
</div>
<video
  width="320"
  height="240"
  controls
>
  <source
    src="movie.mp4"
    type="video/mp4"
  />
  <source
    src="movie.ogg"
    type="video/ogg"
  />
  Your
  browser
  does
  not
  support
  the
  video
  tag.
</video>
<div>
  <div>
    string
  </div>
</div>
<div>
  <div>
    string
  </div>
  <div>
    string
  </div>
</div>
<div>
  <div>
    <div>
      string
    </div>
  </div>
  <div>
    string
  </div>
</div>
<div>
  <div>
    string
  </div>
  <div>
    <div>
      string
    </div>
  </div>
</div>
<div>
  <div></div>
</div>
<div>
  <div></div>
  <div></div>
</div>
<div>
  <div>
    <div>
      <div>
        <div>
          <div>
            <div>
              string
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<div>
  <div>
    string
  </div>
</div>
<div>
  <div>
    string
  </div>
</div>
<div>
  <div>
    string
  </div>

  <div>
    string
  </div>
</div>
<ul>
  123
  <li
    class="foo"
    id="bar"
  >
    First
  </li>
  456
  <li
    class="baz"
  >
    Second
  </li>
  789
</ul>
<span
  >*<b
    >200</b
  ></span
>
<img
  src="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
/>123
<div>
  123<meta
    attr
  />456
</div>
<p>
  x<span
    a="b"
  ></span>
</p>
<p>
  x<meta
    a
  />
</p>
<p>
  x<meta />
</p>
<span></span>

<label
  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
></label>
|
<span></span>
<br />
<button
  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
>
  12345678901234567890
</button>
<br /><br />

<button
  bind-disabled="isUnchanged"
  on-click="onSave($event)"
>
  Disabled
  Cancel
</button>
<br /><br />
<button
  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
>
  12345678901234567890
</button>
<br /><br />

<button
  bind-disabled="isUnchanged"
  on-click="onSave($event)"
>
  Disabled
  Cancel
</button>
<br /><br />
<p>
  "<span
    [innerHTML]="title"
  ></span
  >"
  is
  the
  <i
    >property
    bound</i
  >
  title.
</p>
<li>
  12345678901234567890123456789012345678901234567890123456789012345678901234567890
</li>
<div>
  <app-nav></app-nav>
  <router-outlet></router-outlet>
  <app-footer></app-footer>

  <app-nav
    [input]="something"
  ></app-nav>
  <router-outlet></router-outlet>
  <app-footer></app-footer>

  <app-primary-navigation></app-primary-navigation>
  <router-outlet></router-outlet>
  <app-footer
    [input]="something"
  ></app-footer>
</div>
<x:root
  ><span
    >tag
    name
    in
    other
    namespace
    should
    also
    lower
    cased</span
  ></x:root
>
<div>
  Lorem
  ipsum
  dolor
  sit
  amet,
  consectetur
  adipiscing
  elit,
  "<strong>seddoeiusmod</strong>".
</div>
<div>
  Lorem
  ipsum
  dolor
  sit
  amet,
  consectetur
  adipiscing
  elit,
  <strong
    >seddoeiusmod</strong
  >.
</div>
<span>
  <i
    class="fa fa-refresh fa-spin"
  />
  <i
    class="fa fa-refresh fa-spin"
  />
  <i
    class="fa fa-refresh fa-spin"
  />
</span>

<!-- #5810 -->
<table>
  <tr></tr>
</table>
<div>
  Should
  not
  insert
  empty
  line
  before
  this
  div
</div>

<!-- self-closing -->
<span
  ><input
    type="checkbox"
  />
</span>
<span
  ><span
    ><input
      type="checkbox" /></span
></span>
<span
  ><input
    type="checkbox"
/></span>
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("tags.html", async () => {
    const input = `<br/>
<br />
<br  />
<br
/>
<br attribute-a />
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute />
<br attribute-a="value" />
<br
  attribute-a="value"
/>
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value" />
<br very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value" />
<br attribute-a="value" attribute-b="value" attribute-c="value" attribute-d="value" attribute-e="value" attribute-f="value" />
<div>string</div>
<div>very very very very very very very very very very very very very very very very long string</div>
<div very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute>string</div>
<div very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value">string</div>
<div attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value">string</div>
<div attribute="value">very very very very very very very very very very very very very very very very long string</div>
<div attribute="value" attributea="value" attributeb="value" attributec="value" attributed="value" attributef="value">string</div>
<div attribute="value" attributea="value" attributeb="value" attributec="value" attributed="value" attributef="value">very very very very very very very very very very very very very very very very long string</div>
<video width="320" height="240" controls>
  <source src="movie.mp4" type="video/mp4">
  <source src="movie.ogg" type="video/ogg">
  Your browser does not support the video tag.
</video>
<div><div>string</div></div>
<div><div>string</div><div>string</div></div>
<div><div><div>string</div></div><div>string</div></div>
<div><div>string</div><div><div>string</div></div></div>
<div><div></div></div>
<div><div></div><div></div></div>
<div><div><div><div><div><div><div>string</div></div></div></div></div></div></div>
<div>
  <div>string</div>
</div>
<div>

  <div>string</div>

</div>
<div>

  <div>string</div>

  <div>string</div>

</div>
<ul
  >123<li
    class="foo"
    id="bar"
  >First</li
  >456<li
    class="baz"
  >Second</li
  >789</ul
>
<span>*<b>200</b></span>
<img src="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong" />123
<div>123<meta attr/>456</div>
<p>x<span a="b"></span></p>
<p>x<meta a></p>
<p>x<meta></p>
<span></span>

<label aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa></label> |
<span></span>
<br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  >12345678901234567890</button
> <br /><br />

<button bind-disabled="isUnchanged" on-click="onSave($event)"
  >Disabled Cancel</button
>
<br /><br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  >12345678901234567890</button
> <br /><br />

<button bind-disabled="isUnchanged" on-click="onSave($event)"
  >Disabled Cancel</button
>
<br /><br />
<p>"<span [innerHTML]="title"></span>" is the <i>property bound</i> title.</p>
<li>12345678901234567890123456789012345678901234567890123456789012345678901234567890</li>
<div>
<app-nav></app-nav>
<router-outlet></router-outlet>
<app-footer></app-footer>

<app-nav [input]="something"></app-nav>
<router-outlet></router-outlet>
<app-footer></app-footer>

<app-primary-navigation></app-primary-navigation>
<router-outlet></router-outlet>
<app-footer [input]="something"></app-footer>
</div>
<x:root><SPAN>tag name in other namespace should also lower cased</SPAN></x:root>
<div>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
  "<strong>seddoeiusmod</strong>".
</div>
<div>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
  <strong>seddoeiusmod</strong>.
</div>
<span>
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
</span>

<!-- #5810 -->
<table><tr>
</tr>
</table><div>Should not insert empty line before this div</div>

<!-- self-closing -->
<span><input type="checkbox"/> </span>
<span><span><input type="checkbox"/></span></span>
<span><input type="checkbox"/></span>
`;
    const expected = `<br />
<br />
<br />
<br />
<br attribute-a />
<br
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute
/>
<br attribute-a="value" />
<br attribute-a="value" />
<br
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value"
/>
<br
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value"
/>
<br
  attribute-a="value"
  attribute-b="value"
  attribute-c="value"
  attribute-d="value"
  attribute-e="value"
  attribute-f="value"
/>
<div>string</div>
<div>
  very very very very very very very very very very very very very very very
  very long string
</div>
<div
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute
>
  string
</div>
<div
  very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-attribute="value"
>
  string
</div>
<div
  attribute="very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-very-long-value"
>
  string
</div>
<div attribute="value">
  very very very very very very very very very very very very very very very
  very long string
</div>
<div
  attribute="value"
  attributea="value"
  attributeb="value"
  attributec="value"
  attributed="value"
  attributef="value"
>
  string
</div>
<div
  attribute="value"
  attributea="value"
  attributeb="value"
  attributec="value"
  attributed="value"
  attributef="value"
>
  very very very very very very very very very very very very very very very
  very long string
</div>
<video width="320" height="240" controls>
  <source src="movie.mp4" type="video/mp4" />
  <source src="movie.ogg" type="video/ogg" />
  Your browser does not support the video tag.
</video>
<div><div>string</div></div>
<div>
  <div>string</div>
  <div>string</div>
</div>
<div>
  <div><div>string</div></div>
  <div>string</div>
</div>
<div>
  <div>string</div>
  <div><div>string</div></div>
</div>
<div><div></div></div>
<div>
  <div></div>
  <div></div>
</div>
<div>
  <div>
    <div>
      <div>
        <div>
          <div><div>string</div></div>
        </div>
      </div>
    </div>
  </div>
</div>
<div>
  <div>string</div>
</div>
<div>
  <div>string</div>
</div>
<div>
  <div>string</div>

  <div>string</div>
</div>
<ul>
  123
  <li class="foo" id="bar">First</li>
  456
  <li class="baz">Second</li>
  789
</ul>
<span>*<b>200</b></span>
<img
  src="longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
/>123
<div>123<meta attr />456</div>
<p>x<span a="b"></span></p>
<p>x<meta a /></p>
<p>x<meta /></p>
<span></span>

<label
  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
></label>
|
<span></span>
<br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx>12345678901234567890</button>
<br /><br />

<button bind-disabled="isUnchanged" on-click="onSave($event)">
  Disabled Cancel
</button>
<br /><br />
<button xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx>12345678901234567890</button>
<br /><br />

<button bind-disabled="isUnchanged" on-click="onSave($event)">
  Disabled Cancel
</button>
<br /><br />
<p>"<span [innerHTML]="title"></span>" is the <i>property bound</i> title.</p>
<li>
  12345678901234567890123456789012345678901234567890123456789012345678901234567890
</li>
<div>
  <app-nav></app-nav>
  <router-outlet></router-outlet>
  <app-footer></app-footer>

  <app-nav [input]="something"></app-nav>
  <router-outlet></router-outlet>
  <app-footer></app-footer>

  <app-primary-navigation></app-primary-navigation>
  <router-outlet></router-outlet>
  <app-footer [input]="something"></app-footer>
</div>
<x:root
  ><span>tag name in other namespace should also lower cased</span></x:root
>
<div>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
  "<strong>seddoeiusmod</strong>".
</div>
<div>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
  <strong>seddoeiusmod</strong>.
</div>
<span>
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
  <i class="fa fa-refresh fa-spin" />
</span>

<!-- #5810 -->
<table>
  <tr></tr>
</table>
<div>Should not insert empty line before this div</div>

<!-- self-closing -->
<span><input type="checkbox" /> </span>
<span
  ><span><input type="checkbox" /></span
></span>
<span><input type="checkbox" /></span>
`;
    await formatEqual(input, expected);
  });

  it('tags2.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<div>before<noscript>noscript long long long long long long long long</noscript>after</div>

<div>before<details><summary>summary long long long long </summary>details</details>after</div>

<div>before<dialog open>dialog long long long long  long long long long </dialog>after</div>

<div>before<object data="horse.wav"><param name="autoplay" value="true"/><param name="autoplay" value="true"/></object>after</div>

<div>before<meter min="0" max="1" low=".4" high=".7" optimum=".5" value=".2"></meter>after</div>

<div>before<progress value=".5" max="1"></progress>after</div>
`;
    const expected = `<div>
  before
  <noscript>noscript long long long long long long long long</noscript>
  after
</div>

<div>
  before
  <details>
    <summary>summary long long long long</summary>
    details
  </details>
  after
</div>

<div>
  before
  <dialog open>dialog long long long long long long long long</dialog>
  after
</div>

<div>
  before
  <object data="horse.wav">
    <param name="autoplay" value="true" />
    <param name="autoplay" value="true" />
  </object>
  after
</div>

<div>
  before
  <meter min="0" max="1" low=".4" high=".7" optimum=".5" value=".2"></meter>
  after
</div>

<div>
  before
  <progress value=".5" max="1"></progress>
  after
</div>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('tags2.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<div>before<noscript>noscript long long long long long long long long</noscript>after</div>

<div>before<details><summary>summary long long long long </summary>details</details>after</div>

<div>before<dialog open>dialog long long long long  long long long long </dialog>after</div>

<div>before<object data="horse.wav"><param name="autoplay" value="true"/><param name="autoplay" value="true"/></object>after</div>

<div>before<meter min="0" max="1" low=".4" high=".7" optimum=".5" value=".2"></meter>after</div>

<div>before<progress value=".5" max="1"></progress>after</div>
`;
    const expected = `<div
  >before<noscript>noscript long long long long long long long long</noscript
  >after</div
>

<div
  >before<details
    ><summary>summary long long long long </summary>details</details
  >after</div
>

<div
  >before<dialog open>dialog long long long long long long long long </dialog
  >after</div
>

<div
  >before<object data="horse.wav"
    ><param name="autoplay" value="true" /><param
      name="autoplay"
      value="true" /></object
  >after</div
>

<div
  >before<meter
    min="0"
    max="1"
    low=".4"
    high=".7"
    optimum=".5"
    value=".2"
  ></meter
  >after</div
>

<div>before<progress value=".5" max="1"></progress>after</div>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('tags2.html {"printWidth":"Infinity"}', async () => {
    const input = `<div>before<noscript>noscript long long long long long long long long</noscript>after</div>

<div>before<details><summary>summary long long long long </summary>details</details>after</div>

<div>before<dialog open>dialog long long long long  long long long long </dialog>after</div>

<div>before<object data="horse.wav"><param name="autoplay" value="true"/><param name="autoplay" value="true"/></object>after</div>

<div>before<meter min="0" max="1" low=".4" high=".7" optimum=".5" value=".2"></meter>after</div>

<div>before<progress value=".5" max="1"></progress>after</div>
`;
    const expected = `<div>before<noscript>noscript long long long long long long long long</noscript>after</div>

<div>
  before
  <details>
    <summary>summary long long long long</summary>
    details
  </details>
  after
</div>

<div>
  before
  <dialog open>dialog long long long long long long long long</dialog>
  after
</div>

<div>
  before<object data="horse.wav">
    <param name="autoplay" value="true" />
    <param name="autoplay" value="true" /></object
  >after
</div>

<div>before<meter min="0" max="1" low=".4" high=".7" optimum=".5" value=".2"></meter>after</div>

<div>before<progress value=".5" max="1"></progress>after</div>
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('tags2.html {"printWidth":1}', async () => {
    const input = `<div>before<noscript>noscript long long long long long long long long</noscript>after</div>

<div>before<details><summary>summary long long long long </summary>details</details>after</div>

<div>before<dialog open>dialog long long long long  long long long long </dialog>after</div>

<div>before<object data="horse.wav"><param name="autoplay" value="true"/><param name="autoplay" value="true"/></object>after</div>

<div>before<meter min="0" max="1" low=".4" high=".7" optimum=".5" value=".2"></meter>after</div>

<div>before<progress value=".5" max="1"></progress>after</div>
`;
    const expected = `<div>
  before<noscript
    >noscript
    long
    long
    long
    long
    long
    long
    long
    long</noscript
  >after
</div>

<div>
  before
  <details>
    <summary>
      summary
      long
      long
      long
      long
    </summary>
    details
  </details>
  after
</div>

<div>
  before
  <dialog
    open
  >
    dialog
    long
    long
    long
    long
    long
    long
    long
    long
  </dialog>
  after
</div>

<div>
  before<object
    data="horse.wav"
  >
    <param
      name="autoplay"
      value="true"
    />
    <param
      name="autoplay"
      value="true"
    /></object
  >after
</div>

<div>
  before<meter
    min="0"
    max="1"
    low=".4"
    high=".7"
    optimum=".5"
    value=".2"
  ></meter
  >after
</div>

<div>
  before<progress
    value=".5"
    max="1"
  ></progress
  >after
</div>
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("tags2.html", async () => {
    const input = `<div>before<noscript>noscript long long long long long long long long</noscript>after</div>

<div>before<details><summary>summary long long long long </summary>details</details>after</div>

<div>before<dialog open>dialog long long long long  long long long long </dialog>after</div>

<div>before<object data="horse.wav"><param name="autoplay" value="true"/><param name="autoplay" value="true"/></object>after</div>

<div>before<meter min="0" max="1" low=".4" high=".7" optimum=".5" value=".2"></meter>after</div>

<div>before<progress value=".5" max="1"></progress>after</div>
`;
    const expected = `<div>
  before<noscript>noscript long long long long long long long long</noscript
  >after
</div>

<div>
  before
  <details>
    <summary>summary long long long long</summary>
    details
  </details>
  after
</div>

<div>
  before
  <dialog open>dialog long long long long long long long long</dialog>
  after
</div>

<div>
  before<object data="horse.wav">
    <param name="autoplay" value="true" />
    <param name="autoplay" value="true" /></object
  >after
</div>

<div>
  before<meter
    min="0"
    max="1"
    low=".4"
    high=".7"
    optimum=".5"
    value=".2"
  ></meter
  >after
</div>

<div>before<progress value=".5" max="1"></progress>after</div>
`;
    await formatEqual(input, expected);
  });

  it('textarea.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<div>
  <div>
    <div>
      <div>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <div>
                      <div>
                        <textarea rows="10" cols="45" name="text">
                        String
                        </textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<textarea></textarea>

<div><textarea>lorem ipsum</textarea></div>
`;
    const expected = `<div>
  <div>
    <div>
      <div>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <div>
                      <div>
                        <textarea rows="10" cols="45" name="text">
                        String
                        </textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<textarea></textarea>

<div><textarea>lorem ipsum</textarea></div>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('textarea.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<div>
  <div>
    <div>
      <div>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <div>
                      <div>
                        <textarea rows="10" cols="45" name="text">
                        String
                        </textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<textarea></textarea>

<div><textarea>lorem ipsum</textarea></div>
`;
    const expected = `<div>
  <div>
    <div>
      <div>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <div>
                      <div>
                        <textarea rows="10" cols="45" name="text">
                        String
                        </textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<textarea></textarea>

<div><textarea>lorem ipsum</textarea></div>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('textarea.html {"printWidth":"Infinity"}', async () => {
    const input = `<div>
  <div>
    <div>
      <div>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <div>
                      <div>
                        <textarea rows="10" cols="45" name="text">
                        String
                        </textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<textarea></textarea>

<div><textarea>lorem ipsum</textarea></div>
`;
    const expected = `<div>
  <div>
    <div>
      <div>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <div>
                      <div>
                        <textarea rows="10" cols="45" name="text">
                        String
                        </textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<textarea></textarea>

<div><textarea>lorem ipsum</textarea></div>
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('textarea.html {"printWidth":1}', async () => {
    const input = `<div>
  <div>
    <div>
      <div>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <div>
                      <div>
                        <textarea rows="10" cols="45" name="text">
                        String
                        </textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<textarea></textarea>

<div><textarea>lorem ipsum</textarea></div>
`;
    const expected = `<div>
  <div>
    <div>
      <div>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <div>
                      <div>
                        <textarea
                          rows="10"
                          cols="45"
                          name="text"
                        >
                        String
                        </textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<textarea></textarea>

<div>
  <textarea>
lorem ipsum</textarea
  >
</div>
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("textarea.html", async () => {
    const input = `<div>
  <div>
    <div>
      <div>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <div>
                      <div>
                        <textarea rows="10" cols="45" name="text">
                        String
                        </textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<textarea></textarea>

<div><textarea>lorem ipsum</textarea></div>
`;
    const expected = `<div>
  <div>
    <div>
      <div>
        <div>
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <div>
                      <div>
                        <textarea rows="10" cols="45" name="text">
                        String
                        </textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<textarea></textarea>

<div><textarea>lorem ipsum</textarea></div>
`;
    await formatEqual(input, expected);
  });

  it('unsupported.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<center></center>
`;
    const expected = `<center></center>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('unsupported.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<center></center>
`;
    const expected = `<center></center>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('unsupported.html {"printWidth":"Infinity"}', async () => {
    const input = `<center></center>
`;
    const expected = `<center></center>
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('unsupported.html {"printWidth":1}', async () => {
    const input = `<center></center>
`;
    const expected = `<center></center>
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("unsupported.html", async () => {
    const input = `<center></center>
`;
    const expected = `<center></center>
`;
    await formatEqual(input, expected);
  });
});
