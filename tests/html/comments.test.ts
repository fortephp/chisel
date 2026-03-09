// Auto-generated from Prettier HTML snapshot: comments/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/comments", () => {
  it('before-text.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<!-- hello -->

123
`;
    const expected = `<!-- hello -->

123
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('before-text.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<!-- hello -->

123
`;
    const expected = `<!-- hello -->

123
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('before-text.html {"printWidth":"Infinity"}', async () => {
    const input = `<!-- hello -->

123
`;
    const expected = `<!-- hello -->

123
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('before-text.html {"printWidth":1}', async () => {
    const input = `<!-- hello -->

123
`;
    const expected = `<!-- hello -->

123
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("before-text.html", async () => {
    const input = `<!-- hello -->

123
`;
    const expected = `<!-- hello -->

123
`;
    await formatEqual(input, expected);
  });

  it('bogus.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<? hello ?>
<!- world ->
`;
    const expected = `<? hello ?>
<!- world ->
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('bogus.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<? hello ?>
<!- world ->
`;
    const expected = `<? hello ?>
<!- world ->
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('bogus.html {"printWidth":"Infinity"}', async () => {
    const input = `<? hello ?>
<!- world ->
`;
    const expected = `<? hello ?>
<!- world ->
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('bogus.html {"printWidth":1}', async () => {
    const input = `<? hello ?>
<!- world ->
`;
    const expected = `<? hello ?>
<!- world ->
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("bogus.html", async () => {
    const input = `<? hello ?>
<!- world ->
`;
    const expected = `<? hello ?>
<!- world ->
`;
    await formatEqual(input, expected);
  });

  it('conditional.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<!DOCTYPE html>
<html>
  <body>

    <!--[if IE 5]>This is IE 5<br><![endif]-->
    <!--[if IE 6]>This is IE 6<br><![endif]-->
    <!--[if IE 7]>This is IE 7<br><![endif]-->
    <!--[if IE 8]>This is IE 8<br><![endif]-->
    <!--[if IE 9]>This is IE 9<br><![endif]-->

  </body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html lang="zh-CN"><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html lang="zh-CN"><div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html lang="zh-CN"><div></div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<body width="100%" align="center">
  <center  >                                        
    <!--[if (gte mso 9)|(IE)]><table cellpadding="0" cellspacing="0" border="0" width="600" align="center"><tr><td><![endif]-->
    <div>  </div>
    <!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
  </center  >
</body>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html hello><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><head><![endif]-->
<!--[if gte IE 9]><!--><html><head><!--<![endif]-->
  </head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9
]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <body>
    <!--[if IE 5]>
      This is IE 5
      <br />
    <![endif]-->
    <!--[if IE 6]>
      This is IE 6
      <br />
    <![endif]-->
    <!--[if IE 7]>
      This is IE 7
      <br />
    <![endif]-->
    <!--[if IE 8]>
      This is IE 8
      <br />
    <![endif]-->
    <!--[if IE 9]>
      This is IE 9
      <br />
    <![endif]-->
  </body>
</html>

<!doctype html>
<!--[if lt IE 9]><html lang="zh-CN"><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html lang="zh-CN"><div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html lang="zh-CN"><div></div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<body width="100%" align="center">
  <center>
    <!--[if (gte mso 9)|(IE)]><table cellpadding="0" cellspacing="0" border="0" width="600" align="center"><tr><td><![endif]-->
    <div></div>
    <!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
  </center>
</body>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html hello><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><head><![endif]-->
<!--[if gte IE 9]><!-->
<html>
  <head>
    <!--<![endif]-->
  </head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('conditional.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<!DOCTYPE html>
<html>
  <body>

    <!--[if IE 5]>This is IE 5<br><![endif]-->
    <!--[if IE 6]>This is IE 6<br><![endif]-->
    <!--[if IE 7]>This is IE 7<br><![endif]-->
    <!--[if IE 8]>This is IE 8<br><![endif]-->
    <!--[if IE 9]>This is IE 9<br><![endif]-->

  </body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html lang="zh-CN"><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html lang="zh-CN"><div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html lang="zh-CN"><div></div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<body width="100%" align="center">
  <center  >                                        
    <!--[if (gte mso 9)|(IE)]><table cellpadding="0" cellspacing="0" border="0" width="600" align="center"><tr><td><![endif]-->
    <div>  </div>
    <!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
  </center  >
</body>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html hello><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><head><![endif]-->
<!--[if gte IE 9]><!--><html><head><!--<![endif]-->
  </head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9
]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <body>
    <!--[if IE 5]>This is IE 5<br /><![endif]-->
    <!--[if IE 6]>This is IE 6<br /><![endif]-->
    <!--[if IE 7]>This is IE 7<br /><![endif]-->
    <!--[if IE 8]>This is IE 8<br /><![endif]-->
    <!--[if IE 9]>This is IE 9<br /><![endif]-->
  </body>
</html>

<!doctype html>
<!--[if lt IE 9]><html lang="zh-CN"><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html lang="zh-CN"><div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html lang="zh-CN"><div></div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<body width="100%" align="center">
  <center>
    <!--[if (gte mso 9)|(IE)]><table cellpadding="0" cellspacing="0" border="0" width="600" align="center"><tr><td><![endif]-->
    <div> </div>
    <!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
  </center>
</body>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html hello><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><head><![endif]-->
<!--[if gte IE 9
]><!--><html
  ><head
    ><!--<![endif]-->
  </head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('conditional.html {"printWidth":"Infinity"}', async () => {
    const input = `<!DOCTYPE html>
<html>
  <body>

    <!--[if IE 5]>This is IE 5<br><![endif]-->
    <!--[if IE 6]>This is IE 6<br><![endif]-->
    <!--[if IE 7]>This is IE 7<br><![endif]-->
    <!--[if IE 8]>This is IE 8<br><![endif]-->
    <!--[if IE 9]>This is IE 9<br><![endif]-->

  </body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html lang="zh-CN"><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html lang="zh-CN"><div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html lang="zh-CN"><div></div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<body width="100%" align="center">
  <center  >                                        
    <!--[if (gte mso 9)|(IE)]><table cellpadding="0" cellspacing="0" border="0" width="600" align="center"><tr><td><![endif]-->
    <div>  </div>
    <!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
  </center  >
</body>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html hello><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><head><![endif]-->
<!--[if gte IE 9]><!--><html><head><!--<![endif]-->
  </head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9
]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <body>
    <!--[if IE 5]>This is IE 5<br /><![endif]-->
    <!--[if IE 6]>This is IE 6<br /><![endif]-->
    <!--[if IE 7]>This is IE 7<br /><![endif]-->
    <!--[if IE 8]>This is IE 8<br /><![endif]-->
    <!--[if IE 9]>This is IE 9<br /><![endif]-->
  </body>
</html>

<!doctype html>
<!--[if lt IE 9]><html lang="zh-CN"><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html lang="zh-CN"><div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html lang="zh-CN"><div></div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<body width="100%" align="center">
  <center>
    <!--[if (gte mso 9)|(IE)]><table cellpadding="0" cellspacing="0" border="0" width="600" align="center"><tr><td><![endif]-->
    <div></div>
    <!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
  </center>
</body>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html hello><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><head><![endif]-->
<!--[if gte IE 9]><!-->
<html>
  <head>
    <!--<![endif]-->
  </head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('conditional.html {"printWidth":1}', async () => {
    const input = `<!DOCTYPE html>
<html>
  <body>

    <!--[if IE 5]>This is IE 5<br><![endif]-->
    <!--[if IE 6]>This is IE 6<br><![endif]-->
    <!--[if IE 7]>This is IE 7<br><![endif]-->
    <!--[if IE 8]>This is IE 8<br><![endif]-->
    <!--[if IE 9]>This is IE 9<br><![endif]-->

  </body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html lang="zh-CN"><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html lang="zh-CN"><div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html lang="zh-CN"><div></div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<body width="100%" align="center">
  <center  >                                        
    <!--[if (gte mso 9)|(IE)]><table cellpadding="0" cellspacing="0" border="0" width="600" align="center"><tr><td><![endif]-->
    <div>  </div>
    <!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
  </center  >
</body>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html hello><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><head><![endif]-->
<!--[if gte IE 9]><!--><html><head><!--<![endif]-->
  </head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9
]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <body>
    <!--[if IE 5
      ]>This
      is
      IE
      5<br
    /><![endif]-->
    <!--[if IE 6
      ]>This
      is
      IE
      6<br
    /><![endif]-->
    <!--[if IE 7
      ]>This
      is
      IE
      7<br
    /><![endif]-->
    <!--[if IE 8
      ]>This
      is
      IE
      8<br
    /><![endif]-->
    <!--[if IE 9
      ]>This
      is
      IE
      9<br
    /><![endif]-->
  </body>
</html>

<!doctype html>
<!--[if lt IE 9]><html lang="zh-CN"><![endif]-->
<html
  lang="zh-CN"
>
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html lang="zh-CN"><div><![endif]-->
<html
  lang="zh-CN"
>
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html lang="zh-CN"><div></div><![endif]-->
<html
  lang="zh-CN"
>
  <head></head>
  <body></body>
</html>

<body
  width="100%"
  align="center"
>
  <center>
    <!--[if (gte mso 9)|(IE)]><table cellpadding="0" cellspacing="0" border="0" width="600" align="center"><tr><td><![endif]-->
    <div></div>
    <!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
  </center>
</body>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html
  hello
><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><head><![endif]-->
<!--[if gte IE 9]><!-->
<html>
  <head>
    <!--<![endif]-->
  </head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("conditional.html", async () => {
    const input = `<!DOCTYPE html>
<html>
  <body>

    <!--[if IE 5]>This is IE 5<br><![endif]-->
    <!--[if IE 6]>This is IE 6<br><![endif]-->
    <!--[if IE 7]>This is IE 7<br><![endif]-->
    <!--[if IE 8]>This is IE 8<br><![endif]-->
    <!--[if IE 9]>This is IE 9<br><![endif]-->

  </body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html lang="zh-CN"><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html lang="zh-CN"><div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html lang="zh-CN"><div></div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<body width="100%" align="center">
  <center  >                                        
    <!--[if (gte mso 9)|(IE)]><table cellpadding="0" cellspacing="0" border="0" width="600" align="center"><tr><td><![endif]-->
    <div>  </div>
    <!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
  </center  >
</body>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html hello><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><head><![endif]-->
<!--[if gte IE 9]><!--><html><head><!--<![endif]-->
  </head>
  <body></body>
</html>

<!DOCTYPE html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9
]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <body>
    <!--[if IE 5]>This is IE 5<br /><![endif]-->
    <!--[if IE 6]>This is IE 6<br /><![endif]-->
    <!--[if IE 7]>This is IE 7<br /><![endif]-->
    <!--[if IE 8]>This is IE 8<br /><![endif]-->
    <!--[if IE 9]>This is IE 9<br /><![endif]-->
  </body>
</html>

<!doctype html>
<!--[if lt IE 9]><html lang="zh-CN"><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html lang="zh-CN"><div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html lang="zh-CN"><div></div><![endif]-->
<html lang="zh-CN">
  <head></head>
  <body></body>
</html>

<body width="100%" align="center">
  <center>
    <!--[if (gte mso 9)|(IE)]><table cellpadding="0" cellspacing="0" border="0" width="600" align="center"><tr><td><![endif]-->
    <div></div>
    <!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
  </center>
</body>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html hello><!--<![endif]-->
  <head></head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><head><![endif]-->
<!--[if gte IE 9]><!-->
<html>
  <head>
    <!--<![endif]-->
  </head>
  <body></body>
</html>

<!doctype html>
<!--[if lt IE 9]><html class="compat-ie"><![endif]-->
<!--[if gte IE 9]><!--><html><!--<![endif]-->
  <head></head>
  <body></body>
</html>
`;
    await formatEqual(input, expected);
  });

  it('for_debugging.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<!DOCTYPE html>
<html>
  <body>

<!-- Do not display this at the moment
<img border="0" src="pic_trulli.jpg" alt="Trulli">
-->

  <!-- Do not display this at the moment
  <img border="0" src="pic_trulli.jpg" alt="Trulli">
  -->

    <!-- Do not display this at the moment
    <img border="0" src="pic_trulli.jpg" alt="Trulli">
    -->

  </body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <body>
    <!-- Do not display this at the moment
<img border="0" src="pic_trulli.jpg" alt="Trulli">
-->

    <!-- Do not display this at the moment
  <img border="0" src="pic_trulli.jpg" alt="Trulli">
  -->

    <!-- Do not display this at the moment
    <img border="0" src="pic_trulli.jpg" alt="Trulli">
    -->
  </body>
</html>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('for_debugging.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<!DOCTYPE html>
<html>
  <body>

<!-- Do not display this at the moment
<img border="0" src="pic_trulli.jpg" alt="Trulli">
-->

  <!-- Do not display this at the moment
  <img border="0" src="pic_trulli.jpg" alt="Trulli">
  -->

    <!-- Do not display this at the moment
    <img border="0" src="pic_trulli.jpg" alt="Trulli">
    -->

  </body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <body>
    <!-- Do not display this at the moment
<img border="0" src="pic_trulli.jpg" alt="Trulli">
-->

    <!-- Do not display this at the moment
  <img border="0" src="pic_trulli.jpg" alt="Trulli">
  -->

    <!-- Do not display this at the moment
    <img border="0" src="pic_trulli.jpg" alt="Trulli">
    -->
  </body>
</html>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('for_debugging.html {"printWidth":"Infinity"}', async () => {
    const input = `<!DOCTYPE html>
<html>
  <body>

<!-- Do not display this at the moment
<img border="0" src="pic_trulli.jpg" alt="Trulli">
-->

  <!-- Do not display this at the moment
  <img border="0" src="pic_trulli.jpg" alt="Trulli">
  -->

    <!-- Do not display this at the moment
    <img border="0" src="pic_trulli.jpg" alt="Trulli">
    -->

  </body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <body>
    <!-- Do not display this at the moment
<img border="0" src="pic_trulli.jpg" alt="Trulli">
-->

    <!-- Do not display this at the moment
  <img border="0" src="pic_trulli.jpg" alt="Trulli">
  -->

    <!-- Do not display this at the moment
    <img border="0" src="pic_trulli.jpg" alt="Trulli">
    -->
  </body>
</html>
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('for_debugging.html {"printWidth":1}', async () => {
    const input = `<!DOCTYPE html>
<html>
  <body>

<!-- Do not display this at the moment
<img border="0" src="pic_trulli.jpg" alt="Trulli">
-->

  <!-- Do not display this at the moment
  <img border="0" src="pic_trulli.jpg" alt="Trulli">
  -->

    <!-- Do not display this at the moment
    <img border="0" src="pic_trulli.jpg" alt="Trulli">
    -->

  </body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <body>
    <!-- Do not display this at the moment
<img border="0" src="pic_trulli.jpg" alt="Trulli">
-->

    <!-- Do not display this at the moment
  <img border="0" src="pic_trulli.jpg" alt="Trulli">
  -->

    <!-- Do not display this at the moment
    <img border="0" src="pic_trulli.jpg" alt="Trulli">
    -->
  </body>
</html>
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("for_debugging.html", async () => {
    const input = `<!DOCTYPE html>
<html>
  <body>

<!-- Do not display this at the moment
<img border="0" src="pic_trulli.jpg" alt="Trulli">
-->

  <!-- Do not display this at the moment
  <img border="0" src="pic_trulli.jpg" alt="Trulli">
  -->

    <!-- Do not display this at the moment
    <img border="0" src="pic_trulli.jpg" alt="Trulli">
    -->

  </body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <body>
    <!-- Do not display this at the moment
<img border="0" src="pic_trulli.jpg" alt="Trulli">
-->

    <!-- Do not display this at the moment
  <img border="0" src="pic_trulli.jpg" alt="Trulli">
  -->

    <!-- Do not display this at the moment
    <img border="0" src="pic_trulli.jpg" alt="Trulli">
    -->
  </body>
</html>
`;
    await formatEqual(input, expected);
  });

  it('hidden.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<!DOCTYPE html>
<html>
    <body>

        <!--This is a comment-->
        <!-- This is a comment -->
        <!--  This is a comment  -->
        <!--   This   is   a   comment   -->
        <p>This is a paragraph.</p>
        <!-- Comments are not displayed in the browser -->

    </body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <body>
    <!--This is a comment-->
    <!-- This is a comment -->
    <!--  This is a comment  -->
    <!--   This   is   a   comment   -->
    <p>This is a paragraph.</p>
    <!-- Comments are not displayed in the browser -->
  </body>
</html>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('hidden.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<!DOCTYPE html>
<html>
    <body>

        <!--This is a comment-->
        <!-- This is a comment -->
        <!--  This is a comment  -->
        <!--   This   is   a   comment   -->
        <p>This is a paragraph.</p>
        <!-- Comments are not displayed in the browser -->

    </body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <body>
    <!--This is a comment-->
    <!-- This is a comment -->
    <!--  This is a comment  -->
    <!--   This   is   a   comment   -->
    <p>This is a paragraph.</p>
    <!-- Comments are not displayed in the browser -->
  </body>
</html>
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('hidden.html {"printWidth":"Infinity"}', async () => {
    const input = `<!DOCTYPE html>
<html>
    <body>

        <!--This is a comment-->
        <!-- This is a comment -->
        <!--  This is a comment  -->
        <!--   This   is   a   comment   -->
        <p>This is a paragraph.</p>
        <!-- Comments are not displayed in the browser -->

    </body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <body>
    <!--This is a comment-->
    <!-- This is a comment -->
    <!--  This is a comment  -->
    <!--   This   is   a   comment   -->
    <p>This is a paragraph.</p>
    <!-- Comments are not displayed in the browser -->
  </body>
</html>
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('hidden.html {"printWidth":1}', async () => {
    const input = `<!DOCTYPE html>
<html>
    <body>

        <!--This is a comment-->
        <!-- This is a comment -->
        <!--  This is a comment  -->
        <!--   This   is   a   comment   -->
        <p>This is a paragraph.</p>
        <!-- Comments are not displayed in the browser -->

    </body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <body>
    <!--This is a comment-->
    <!-- This is a comment -->
    <!--  This is a comment  -->
    <!--   This   is   a   comment   -->
    <p>
      This
      is
      a
      paragraph.
    </p>
    <!-- Comments are not displayed in the browser -->
  </body>
</html>
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("hidden.html", async () => {
    const input = `<!DOCTYPE html>
<html>
    <body>

        <!--This is a comment-->
        <!-- This is a comment -->
        <!--  This is a comment  -->
        <!--   This   is   a   comment   -->
        <p>This is a paragraph.</p>
        <!-- Comments are not displayed in the browser -->

    </body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <body>
    <!--This is a comment-->
    <!-- This is a comment -->
    <!--  This is a comment  -->
    <!--   This   is   a   comment   -->
    <p>This is a paragraph.</p>
    <!-- Comments are not displayed in the browser -->
  </body>
</html>
`;
    await formatEqual(input, expected);
  });

  it('surrounding-empty-line.html {"htmlWhitespaceSensitivity":"ignore"}', async () => {
    const input = `<ul><!-- 123
--><li>First</li><!-- 123
456
   789
--><li>Second</li><!--


    123
       456
          789


--><li>Second</li><!--


           123
        456
    789


--></ul>
<span><!--
--><span>a</span><!--
--><span>b</span><!--
--></span>

<span><!-- 1
--><span>a</span><!-- 2
--><span>b</span><!-- 3
--></span>

<span><!--
1 --><span>a</span><!--
2 --><span>b</span><!--
3 --></span>

123<!---->456

123<!--x-->456

<!-- A
     B -->

<!--
The null hero's name is {{nullHero.name}}

See console log:
  TypeError: Cannot read property 'name' of null in [null]
-->

<!--
    The null hero's name is {{nullHero.name}}

    See console log:
    TypeError: Cannot read property 'name' of null in [null]
-->
`;
    const expected = `<ul>
  <!-- 123
-->
  <li>First</li>
  <!-- 123
456
   789
-->
  <li>Second</li>
  <!--


    123
       456
          789


-->
  <li>Second</li>
  <!--


           123
        456
    789


--></ul>
<span>
  <!--
-->
  <span>a</span>
  <!--
-->
  <span>b</span>
  <!--
--></span>

<span>
  <!-- 1
-->
  <span>a</span>
  <!-- 2
-->
  <span>b</span>
  <!-- 3
--></span>

<span>
  <!--
1 -->
  <span>a</span>
  <!--
2 -->
  <span>b</span>
  <!--
3 -->
</span>

123
<!---->
456 123
<!--x-->
456

<!-- A
     B -->

<!--
The null hero's name is {{nullHero.name}}

See console log:
  TypeError: Cannot read property 'name' of null in [null]
-->

<!--
    The null hero's name is {{nullHero.name}}

    See console log:
    TypeError: Cannot read property 'name' of null in [null]
-->
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "ignore" });
  });

  it('surrounding-empty-line.html {"htmlWhitespaceSensitivity":"strict"}', async () => {
    const input = `<ul><!-- 123
--><li>First</li><!-- 123
456
   789
--><li>Second</li><!--


    123
       456
          789


--><li>Second</li><!--


           123
        456
    789


--></ul>
<span><!--
--><span>a</span><!--
--><span>b</span><!--
--></span>

<span><!-- 1
--><span>a</span><!-- 2
--><span>b</span><!-- 3
--></span>

<span><!--
1 --><span>a</span><!--
2 --><span>b</span><!--
3 --></span>

123<!---->456

123<!--x-->456

<!-- A
     B -->

<!--
The null hero's name is {{nullHero.name}}

See console log:
  TypeError: Cannot read property 'name' of null in [null]
-->

<!--
    The null hero's name is {{nullHero.name}}

    See console log:
    TypeError: Cannot read property 'name' of null in [null]
-->
`;
    const expected = `<ul
  ><!-- 123
--><li>First</li
  ><!-- 123
456
   789
--><li>Second</li
  ><!--


    123
       456
          789


--><li>Second</li
  ><!--


           123
        456
    789


--></ul>
<span
  ><!--
--><span>a</span
  ><!--
--><span>b</span
  ><!--
--></span>

<span
  ><!-- 1
--><span>a</span
  ><!-- 2
--><span>b</span
  ><!-- 3
--></span>

<span
  ><!--
1 --><span>a</span
  ><!--
2 --><span>b</span
  ><!--
3 --></span
>

123<!---->456 123<!--x-->456

<!-- A
     B -->

<!--
The null hero's name is {{nullHero.name}}

See console log:
  TypeError: Cannot read property 'name' of null in [null]
-->

<!--
    The null hero's name is {{nullHero.name}}

    See console log:
    TypeError: Cannot read property 'name' of null in [null]
-->
`;
    await formatEqual(input, expected, { htmlWhitespaceSensitivity: "strict" });
  });

  it('surrounding-empty-line.html {"printWidth":"Infinity"}', async () => {
    const input = `<ul><!-- 123
--><li>First</li><!-- 123
456
   789
--><li>Second</li><!--


    123
       456
          789


--><li>Second</li><!--


           123
        456
    789


--></ul>
<span><!--
--><span>a</span><!--
--><span>b</span><!--
--></span>

<span><!-- 1
--><span>a</span><!-- 2
--><span>b</span><!-- 3
--></span>

<span><!--
1 --><span>a</span><!--
2 --><span>b</span><!--
3 --></span>

123<!---->456

123<!--x-->456

<!-- A
     B -->

<!--
The null hero's name is {{nullHero.name}}

See console log:
  TypeError: Cannot read property 'name' of null in [null]
-->

<!--
    The null hero's name is {{nullHero.name}}

    See console log:
    TypeError: Cannot read property 'name' of null in [null]
-->
`;
    const expected = `<ul>
  <!-- 123
-->
  <li>First</li>
  <!-- 123
456
   789
-->
  <li>Second</li>
  <!--


    123
       456
          789


-->
  <li>Second</li>
  <!--


           123
        456
    789


--></ul>
<span
  ><!--
--><span>a</span
  ><!--
--><span>b</span
  ><!--
--></span>

<span
  ><!-- 1
--><span>a</span
  ><!-- 2
--><span>b</span
  ><!-- 3
--></span>

<span
  ><!--
1 --><span>a</span
  ><!--
2 --><span>b</span
  ><!--
3 --></span
>

123<!---->456 123<!--x-->456

<!-- A
     B -->

<!--
The null hero's name is {{nullHero.name}}

See console log:
  TypeError: Cannot read property 'name' of null in [null]
-->

<!--
    The null hero's name is {{nullHero.name}}

    See console log:
    TypeError: Cannot read property 'name' of null in [null]
-->
`;
    await formatEqual(input, expected, { printWidth: Infinity });
  });

  it('surrounding-empty-line.html {"printWidth":1}', async () => {
    const input = `<ul><!-- 123
--><li>First</li><!-- 123
456
   789
--><li>Second</li><!--


    123
       456
          789


--><li>Second</li><!--


           123
        456
    789


--></ul>
<span><!--
--><span>a</span><!--
--><span>b</span><!--
--></span>

<span><!-- 1
--><span>a</span><!-- 2
--><span>b</span><!-- 3
--></span>

<span><!--
1 --><span>a</span><!--
2 --><span>b</span><!--
3 --></span>

123<!---->456

123<!--x-->456

<!-- A
     B -->

<!--
The null hero's name is {{nullHero.name}}

See console log:
  TypeError: Cannot read property 'name' of null in [null]
-->

<!--
    The null hero's name is {{nullHero.name}}

    See console log:
    TypeError: Cannot read property 'name' of null in [null]
-->
`;
    const expected = `<ul>
  <!-- 123
-->
  <li>
    First
  </li>
  <!-- 123
456
   789
-->
  <li>
    Second
  </li>
  <!--


    123
       456
          789


-->
  <li>
    Second
  </li>
  <!--


           123
        456
    789


--></ul>
<span
  ><!--
--><span
    >a</span
  ><!--
--><span
    >b</span
  ><!--
--></span>

<span
  ><!-- 1
--><span
    >a</span
  ><!-- 2
--><span
    >b</span
  ><!-- 3
--></span>

<span
  ><!--
1 --><span
    >a</span
  ><!--
2 --><span
    >b</span
  ><!--
3 --></span
>

123<!---->456
123<!--x-->456

<!-- A
     B -->

<!--
The null hero's name is {{nullHero.name}}

See console log:
  TypeError: Cannot read property 'name' of null in [null]
-->

<!--
    The null hero's name is {{nullHero.name}}

    See console log:
    TypeError: Cannot read property 'name' of null in [null]
-->
`;
    await formatEqual(input, expected, { printWidth: 1 });
  });

  it("surrounding-empty-line.html", async () => {
    const input = `<ul><!-- 123
--><li>First</li><!-- 123
456
   789
--><li>Second</li><!--


    123
       456
          789


--><li>Second</li><!--


           123
        456
    789


--></ul>
<span><!--
--><span>a</span><!--
--><span>b</span><!--
--></span>

<span><!-- 1
--><span>a</span><!-- 2
--><span>b</span><!-- 3
--></span>

<span><!--
1 --><span>a</span><!--
2 --><span>b</span><!--
3 --></span>

123<!---->456

123<!--x-->456

<!-- A
     B -->

<!--
The null hero's name is {{nullHero.name}}

See console log:
  TypeError: Cannot read property 'name' of null in [null]
-->

<!--
    The null hero's name is {{nullHero.name}}

    See console log:
    TypeError: Cannot read property 'name' of null in [null]
-->
`;
    const expected = `<ul>
  <!-- 123
-->
  <li>First</li>
  <!-- 123
456
   789
-->
  <li>Second</li>
  <!--


    123
       456
          789


-->
  <li>Second</li>
  <!--


           123
        456
    789


--></ul>
<span
  ><!--
--><span>a</span
  ><!--
--><span>b</span
  ><!--
--></span>

<span
  ><!-- 1
--><span>a</span
  ><!-- 2
--><span>b</span
  ><!-- 3
--></span>

<span
  ><!--
1 --><span>a</span
  ><!--
2 --><span>b</span
  ><!--
3 --></span
>

123<!---->456 123<!--x-->456

<!-- A
     B -->

<!--
The null hero's name is {{nullHero.name}}

See console log:
  TypeError: Cannot read property 'name' of null in [null]
-->

<!--
    The null hero's name is {{nullHero.name}}

    See console log:
    TypeError: Cannot read property 'name' of null in [null]
-->
`;
    await formatEqual(input, expected);
  });
});
