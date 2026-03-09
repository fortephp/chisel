// Auto-generated from Prettier HTML snapshot: doctype_declarations/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/doctype", () => {
  it("html4.01_frameset.html", async () => {
    const input = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN"
  "http://www.w3.org/TR/html4/frameset.dtd">
<html>
  <head>
    <title>An HTML standard template</title>
    <meta charset="utf-8"  />
  </head>
  <body>
    <p>… Your HTML content here …</p>
  </body>
</html>
`;
    const expected = `<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd">
<html>
  <head>
    <title>An HTML standard template</title>
    <meta charset="utf-8" />
  </head>
  <body>
    <p>… Your HTML content here …</p>
  </body>
</html>
`;
    await formatEqual(input, expected);
  });

  it("html4.01_strict.html", async () => {
    const input = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"
  "http://www.w3.org/TR/html4/strict.dtd">
<html>
  <head>
    <title>An HTML standard template</title>
    <meta charset="utf-8" />
  </head>
  <body>
    <p>… Your HTML content here …</p>
  </body>
</html>
`;
    const expected = `<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
  <head>
    <title>An HTML standard template</title>
    <meta charset="utf-8" />
  </head>
  <body>
    <p>… Your HTML content here …</p>
  </body>
</html>
`;
    await formatEqual(input, expected);
  });

  it("html4.01_transitional.html", async () => {
    const input = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
  "http://www.w3.org/TR/html4/loose.dtd">
<html>
  <head>
    <title>An HTML standard template</title>
    <meta charset="utf-8" />
  </head>
  <body>
    <p>… Your HTML content here …</p>
  </body>
</html>
`;
    const expected = `<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
  <head>
    <title>An HTML standard template</title>
    <meta charset="utf-8" />
  </head>
  <body>
    <p>… Your HTML content here …</p>
  </body>
</html>
`;
    await formatEqual(input, expected);
  });

  it("html5.html", async () => {
    const input = `<!DOCTYPE html>
<html>
  <head>
    <title>An HTML standard template</title>
    <meta charset="utf-8" />
  </head>
  <body>
    <p>… Your HTML content here …</p>
  </body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <head>
    <title>An HTML standard template</title>
    <meta charset="utf-8" />
  </head>
  <body>
    <p>… Your HTML content here …</p>
  </body>
</html>
`;
    await formatEqual(input, expected);
  });

  it("ibm_system.html", async () => {
    const input = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd">
`;
    const expected = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd">
`;
    await formatEqual(input, expected);
  });

  it("about_compat_string.html", async () => {
    const input = `<!DOCTYPE html SYSTEM "about:legacy-compat">
`;
    const expected = `<!DOCTYPE html SYSTEM "about:legacy-compat">
`;
    await formatEqual(input, expected);
  });

  it("xhtml1.0_frameset.html", async () => {
    const input = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN"
 "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">
`;
    const expected = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">
`;
    await formatEqual(input, expected);
  });

  it("xhtml1.0_strict.html", async () => {
    const input = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
 "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
`;
    const expected = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
`;
    await formatEqual(input, expected);
  });

  it("xhtml1.0_transitional.html", async () => {
    const input = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
 "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
`;
    const expected = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
`;
    await formatEqual(input, expected);
  });

  it("xhtml1.1.html", async () => {
    const input = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=windows-1251" />
    <title>XHTML markup</title>
  </head>
  <body style="background-color:#ffffcc; color:#008800">
    <br />
    <h2 align="center">Sample XHTML page</h2>
    <br />
    <div align="center">
      <img src="../images/bee3.jpg" width="400" height="250" alt="Beep" vspace="20" />
    </div>
    <p align="center" style="font-size:17px">Bar Foo,<br />
      Foo,<br />
      Bar<br />
      Foo</p>
    <p align="center"><em>String</em></p>
    <br />
    <hr />
  </body>
</html>
`;
    const expected = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=windows-1251" />
    <title>XHTML markup</title>
  </head>
  <body style="background-color: #ffffcc; color: #008800">
    <br />
    <h2 align="center">Sample XHTML page</h2>
    <br />
    <div align="center">
      <img
        src="../images/bee3.jpg"
        width="400"
        height="250"
        alt="Beep"
        vspace="20"
      />
    </div>
    <p align="center" style="font-size: 17px">
      Bar Foo,<br />
      Foo,<br />
      Bar<br />
      Foo
    </p>
    <p align="center"><em>String</em></p>
    <br />
    <hr />
  </body>
</html>
`;
    await formatEqual(input, expected);
  });

  it("malformed-doctype-eof.html", async () => {
    const input = `<!DOCTYPE`;
    const expected = `<!DOCTYPE
`;
    await formatEqual(input, expected);
  });
});
