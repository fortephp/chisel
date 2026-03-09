// Auto-generated from Prettier HTML snapshot: basics/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual, formatEqualToPrettierHtml } from "../helpers.js";

describe("html/basics", () => {
  it("broken-html.html", async () => {
    const input = `<!-- 
#7241, 
reproduction:
two different element,
linebreak
\`<\`
extra space(s)
-->
<div><span>



<                                           
`;
    const expected = `<!-- 
#7241, 
reproduction:
two different element,
linebreak
\`<\`
extra space(s)
-->
<div><span> <
`;
    await formatEqual(input, expected);
  });

  it("comment.html", async () => {
    const input = `<!--hello world-->
`;
    const expected = `<!--hello world-->
`;
    await formatEqual(input, expected);
  });

  it("empty.html", async () => {
    const input = "";
    const expected = "";
    await formatEqual(input, expected);
  });

  it("empty-doc.html", async () => {
    const input = `<!doctype html>
<html>
<head></head>
<body></body>
</html>
`;
    const expected = `<!doctype html>
<html>
  <head></head>
  <body></body>
</html>
`;
    await formatEqual(input, expected);
  });

  it("form.html", async () => {
    const input = `<form>
  <div class="form-group">
    <label for="exampleInputEmail1">Email address</label>
    <input type="email" class="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Enter email">
    <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.</small>
  </div>
  <div class="form-group">
    <label for="exampleInputPassword1">Password</label>
    <input type="password" class="form-control" id="exampleInputPassword1" placeholder="Password">
  </div>
  <div class="form-group">
    <label for="exampleSelect1">Example select</label>
    <select class="form-control" id="exampleSelect1">
      <option>1</option>
      <option>2</option>
      <option>3</option>
      <option>4</option>
      <option>5</option>
    </select>
  </div>
  <div class="form-group">
    <label for="exampleSelect2">Example multiple select</label>
    <select multiple class="form-control" id="exampleSelect2">
      <option>1</option>
      <option>2</option>
      <option>3</option>
      <option>4</option>
      <option>5</option>
    </select>
  </div>
  <div class="form-group">
    <label for="exampleTextarea">Example textarea</label>
    <textarea class="form-control" id="exampleTextarea" rows="3"></textarea>
  </div>
  <div class="form-group">
    <label for="exampleInputFile">File input</label>
    <input type="file" class="form-control-file" id="exampleInputFile" aria-describedby="fileHelp">
    <small id="fileHelp" class="form-text text-muted">This is some placeholder block-level help text for the above input. It's a bit lighter and easily wraps to a new line.</small>
  </div>
  <fieldset class="form-group">
    <legend>Radio buttons</legend>
    <div class="form-check">
      <label class="form-check-label">
        <input type="radio" class="form-check-input" name="optionsRadios" id="optionsRadios1" value="option1" checked>
        Option one is this and that&mdash;be sure to include why it's great
      </label>
    </div>
    <div class="form-check">
      <label class="form-check-label">
        <input type="radio" class="form-check-input" name="optionsRadios" id="optionsRadios2" value="option2">
        Option two can be something else and selecting it will deselect option one
      </label>
    </div>
    <div class="form-check disabled">
      <label class="form-check-label">
        <input type="radio" class="form-check-input" name="optionsRadios" id="optionsRadios3" value="option3" disabled>
        Option three is disabled
      </label>
    </div>
  </fieldset>
  <div class="form-check">
    <label class="form-check-label">
      <input type="checkbox" class="form-check-input">
      Check me out
    </label>
  </div>
  <button type="submit" class="btn btn-primary">Submit</button>
</form>
`;
    const expected = `<form>
  <div class="form-group">
    <label for="exampleInputEmail1">Email address</label>
    <input
      type="email"
      class="form-control"
      id="exampleInputEmail1"
      aria-describedby="emailHelp"
      placeholder="Enter email"
    />
    <small id="emailHelp" class="form-text text-muted"
      >We'll never share your email with anyone else.</small
    >
  </div>
  <div class="form-group">
    <label for="exampleInputPassword1">Password</label>
    <input
      type="password"
      class="form-control"
      id="exampleInputPassword1"
      placeholder="Password"
    />
  </div>
  <div class="form-group">
    <label for="exampleSelect1">Example select</label>
    <select class="form-control" id="exampleSelect1">
      <option>1</option>
      <option>2</option>
      <option>3</option>
      <option>4</option>
      <option>5</option>
    </select>
  </div>
  <div class="form-group">
    <label for="exampleSelect2">Example multiple select</label>
    <select multiple class="form-control" id="exampleSelect2">
      <option>1</option>
      <option>2</option>
      <option>3</option>
      <option>4</option>
      <option>5</option>
    </select>
  </div>
  <div class="form-group">
    <label for="exampleTextarea">Example textarea</label>
    <textarea class="form-control" id="exampleTextarea" rows="3"></textarea>
  </div>
  <div class="form-group">
    <label for="exampleInputFile">File input</label>
    <input
      type="file"
      class="form-control-file"
      id="exampleInputFile"
      aria-describedby="fileHelp"
    />
    <small id="fileHelp" class="form-text text-muted"
      >This is some placeholder block-level help text for the above input. It's
      a bit lighter and easily wraps to a new line.</small
    >
  </div>
  <fieldset class="form-group">
    <legend>Radio buttons</legend>
    <div class="form-check">
      <label class="form-check-label">
        <input
          type="radio"
          class="form-check-input"
          name="optionsRadios"
          id="optionsRadios1"
          value="option1"
          checked
        />
        Option one is this and that&mdash;be sure to include why it's great
      </label>
    </div>
    <div class="form-check">
      <label class="form-check-label">
        <input
          type="radio"
          class="form-check-input"
          name="optionsRadios"
          id="optionsRadios2"
          value="option2"
        />
        Option two can be something else and selecting it will deselect option
        one
      </label>
    </div>
    <div class="form-check disabled">
      <label class="form-check-label">
        <input
          type="radio"
          class="form-check-input"
          name="optionsRadios"
          id="optionsRadios3"
          value="option3"
          disabled
        />
        Option three is disabled
      </label>
    </div>
  </fieldset>
  <div class="form-check">
    <label class="form-check-label">
      <input type="checkbox" class="form-check-input" />
      Check me out
    </label>
  </div>
  <button type="submit" class="btn btn-primary">Submit</button>
</form>
`;
    await formatEqual(input, expected);
  });

  it("hello-world.html", async () => {
    const input = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <!-- A comment -->
    <h1>Hello World</h1>
</body>
</html>

`;
    const expected = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Document</title>
  </head>
  <body>
    <!-- A comment -->
    <h1>Hello World</h1>
  </body>
</html>
`;
    await formatEqual(input, expected);
  });

  it("html-comments.html", async () => {
    const input = `<!-- htmlhint attr-lowercase: false -->
<html>
  <body>
    <a href="#">Anchor</a>
    <div hidden class="foo" id=bar></div>
  </body>
</html>
`;
    const expected = `<!-- htmlhint attr-lowercase: false -->
<html>
  <body>
    <a href="#">Anchor</a>
    <div hidden class="foo" id="bar"></div>
  </body>
</html>
`;
    await formatEqual(input, expected);
  });

  it("html5-boilerplate.html", async () => {
    const input = `<!doctype html>
<html class="no-js" lang="">

  <head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title></title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <link rel="manifest" href="site.webmanifest">
    <link rel="apple-touch-icon" href="icon.png">
    <!-- Place favicon.ico in the root directory -->

    <link rel="stylesheet" href="css/normalize.css">
    <link rel="stylesheet" href="css/main.css">
  </head>

  <body>
    <!--[if lte IE 9]>
    <p class="browserupgrade">You are using an <strong>outdated</strong> browser. Please <a href="https://browsehappy.com/">upgrade your browser</a> to improve your experience and security.</p>
    <![endif]-->

    <!-- Add your site or application content here -->
    <p>Hello world! This is HTML5 Boilerplate.</p>
    <script src="js/vendor/modernizr-3.6.0.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.3.1.min.js" integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=" crossorigin="anonymous"></script>
    <script>window.jQuery || document.write('<script src="js/vendor/jquery-3.3.1.min.js"><\\\\/script>')</script>
    <script src="js/plugins.js"></script>
    <script src="js/main.js"></script>

    <!-- Google Analytics: change UA-XXXXX-Y to be your site's ID. -->
    <script>
      window.ga = function () { ga.q.push(arguments) }; ga.q = []; ga.l = +new Date;
      ga('create', 'UA-XXXXX-Y', 'auto'); ga('send', 'pageview')
    </script>
    <script src="https://www.google-analytics.com/analytics.js" async defer></script>
  </body>

</html>
`;
    const expected = `<!doctype html>
<html class="no-js" lang="">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <title></title>
    <meta name="description" content="" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, shrink-to-fit=no"
    />

    <link rel="manifest" href="site.webmanifest" />
    <link rel="apple-touch-icon" href="icon.png" />
    <!-- Place favicon.ico in the root directory -->

    <link rel="stylesheet" href="css/normalize.css" />
    <link rel="stylesheet" href="css/main.css" />
  </head>

  <body>
    <!--[if lte IE 9]>
      <p class="browserupgrade">
        You are using an <strong>outdated</strong> browser. Please
        <a href="https://browsehappy.com/">upgrade your browser</a> to improve
        your experience and security.
      </p>
    <![endif]-->

    <!-- Add your site or application content here -->
    <p>Hello world! This is HTML5 Boilerplate.</p>
    <script src="js/vendor/modernizr-3.6.0.min.js"></script>
    <script
      src="https://code.jquery.com/jquery-3.3.1.min.js"
      integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8="
      crossorigin="anonymous"
    ></script>
    <script>
      window.jQuery ||
        document.write(
          '<script src="js/vendor/jquery-3.3.1.min.js"><\\\\/script>',
        );
    </script>
    <script src="js/plugins.js"></script>
    <script src="js/main.js"></script>

    <!-- Google Analytics: change UA-XXXXX-Y to be your site's ID. -->
    <script>
      window.ga = function () {
        ga.q.push(arguments);
      };
      ga.q = [];
      ga.l = +new Date();
      ga("create", "UA-XXXXX-Y", "auto");
      ga("send", "pageview");
    </script>
    <script
      src="https://www.google-analytics.com/analytics.js"
      async
      defer
    ></script>
  </body>
</html>
`;
    await formatEqual(input, expected);
  });

  it("issue-9368.html", async () => {
    const input = `<strong>a</strong>-&gt;<strong>b</strong>-&gt;
`;
    const expected = `<strong>a</strong>-&gt;<strong>b</strong>-&gt;
`;
    await formatEqual(input, expected);
  });

  it("issue-9368-2.html", async () => {
    const input = `<strong>a</strong>-<strong>b</strong>-
`;
    const expected = `<strong>a</strong>-<strong>b</strong>-
`;
    await formatEqual(input, expected);
  });

  it("issue-9368-3.html", async () => {
    const input = `a track<strong>pad</strong>, or a <strong>gyro</strong>scope.
`;
    const expected = `a track<strong>pad</strong>, or a <strong>gyro</strong>scope.
`;
    await formatEqual(input, expected);
  });

  it("more-html.html", async () => {
    const input = `<html>
<head></head>
<body>
    <a href="#">Anchor</a>
    <div hidden class="foo" id=bar></div>
</body>
</html>
`;
    const expected = `<html>
  <head></head>
  <body>
    <a href="#">Anchor</a>
    <div hidden class="foo" id="bar"></div>
  </body>
</html>
`;
    await formatEqual(input, expected);
  });

  it("void-elements.html", async () => {
    const input = `<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="code-guide.css">
</head>
<body></body>
</html>
`;
    const expected = `<html>
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="code-guide.css" />
  </head>
  <body></body>
</html>
`;
    await formatEqual(input, expected);
  });

  it("void-elements-2.html", async () => {
    const input = `<video controls width="250">
    <source src="/media/examples/flower.webm"
            type="video/webm">
    <source src="/media/examples/flower.mp4"
            type="video/mp4"
></video>text after

<!-- #8626 -->
<object data="horse.wav"><param name="autoplay" value="true"
><param name="autoplay" value="true"
></object>1

<span><img  src="1.png"
><img src="1.png"
></span>1
`;
    const expected = `<video controls width="250">
  <source src="/media/examples/flower.webm" type="video/webm" />
  <source src="/media/examples/flower.mp4" type="video/mp4" /></video
>text after

<!-- #8626 -->
<object data="horse.wav">
  <param name="autoplay" value="true" />
  <param name="autoplay" value="true" /></object
>1

<span><img src="1.png" /><img src="1.png" /></span>1
`;
    await formatEqual(input, expected);
  });

  it("with-colon.html", async () => {
    const input = `<!-- unknown tag with colon -->
<div>
<foo:bar>
<div> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block </div>
<div> block </div><DIV> BLOCK </DIV> <div> block </div><div> block </div><div> block </div>
<pre> pre pr
e</pre>
<textarea> pre-wrap pr
e-wrap </textarea>
<span> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline </span>
<span> inline </span><span> inline </span> <span> inline </span><span> inline </span>
<html:div> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block </html:div>
<html:DIV> block </html:DIV><HTML:DIV> BLOCK </HTML:DIV> <html:div> block </html:div><html:div> block </html:div><html:div> block </html:div>
<html:pre> pre pr
e</html:pre>
<html:textarea> pre-wrap pr
e-wrap </html:textarea>
<html:span> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline </html:span>
<html:span> inline </html:span><html:span> inline </html:span> <html:span> inline </html:span><html:span> inline </html:span></foo:bar>
</div>

<!-- block tag with colon -->
<div>
<foo:div>
<div> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block </div>
<div> block </div><DIV> BLOCK </DIV> <div> block </div><div> block </div><div> block </div>
<pre> pre pr
e</pre>
<textarea> pre-wrap pr
e-wrap </textarea>
<span> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline </span>
<span> inline </span><span> inline </span> <span> inline </span><span> inline </span>
<html:div> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block </html:div>
<html:DIV> block </html:DIV><HTML:DIV> BLOCK </HTML:DIV> <html:div> block </html:div><html:div> block </html:div><html:div> block </html:div>
<html:pre> pre pr
e</html:pre>
<html:textarea> pre-wrap pr
e-wrap </html:textarea>
<html:span> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline </html:span>
<html:span> inline </html:span><html:span> inline </html:span> <html:span> inline </html:span><html:span> inline </html:span></foo:div>
</div>

<!-- inline tag with colon -->
<div>
<foo:span>
<div> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block </div>
<div> block </div><DIV> BLOCK </DIV> <div> block </div><div> block </div><div> block </div>
<pre> pre pr
e</pre>
<textarea> pre-wrap pr
e-wrap </textarea>
<span> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline </span>
<span> inline </span><span> inline </span> <span> inline </span><span> inline </span>
<html:div> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block </html:div>
<html:DIV> block </html:DIV><HTML:DIV> BLOCK </HTML:DIV> <html:div> block </html:div><html:div> block </html:div><html:div> block </html:div>
<html:pre> pre pr
e</html:pre>
<html:textarea> pre-wrap pr
e-wrap </html:textarea>
<html:span> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline </html:span>
<html:span> inline </html:span><html:span> inline </html:span> <html:span> inline </html:span><html:span> inline </html:span></foo:span>
</div>

<!-- unknown -->
<div>
<foo-bar>
<div> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block </div>
<div> block </div><DIV> BLOCK </DIV> <div> block </div><div> block </div><div> block </div>
<pre> pre pr
e</pre>
<textarea> pre-wrap pr
e-wrap </textarea>
<span> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline </span>
<span> inline </span><span> inline </span> <span> inline </span><span> inline </span>
<html:div> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block </html:div>
<html:DIV> block </html:DIV><HTML:DIV> BLOCK </HTML:DIV> <html:div> block </html:div><html:div> block </html:div><html:div> block </html:div>
<html:pre> pre pr
e</html:pre>
<html:textarea> pre-wrap pr
e-wrap </html:textarea>
<html:span> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline </html:span>
<html:span> inline </html:span><html:span> inline </html:span> <html:span> inline </html:span><html:span> inline </html:span></foo-bar>
</div>

<!-- without colon -->
<div>
<div>
<div> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block </div>
<div> block </div><DIV> BLOCK </DIV> <div> block </div><div> block </div><div> block </div>
<pre> pre pr
e</pre>
<textarea> pre-wrap pr
e-wrap </textarea>
<span> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline </span>
<span> inline </span><span> inline </span> <span> inline </span><span> inline </span>
<html:div> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block </html:div>
<html:DIV> block </html:DIV><HTML:DIV> BLOCK </HTML:DIV> <html:div> block </html:div><html:div> block </html:div><html:div> block </html:div>
<html:pre> pre pr
e</html:pre>
<html:textarea> pre-wrap pr
e-wrap </html:textarea>
<html:span> looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline </html:span>
<html:span> inline </html:span><html:span> inline </html:span> <html:span> inline </html:span><html:span> inline </html:span></div>
</div>

<!-- #7236 -->
<with:colon>
  <div><h1> text  text  text  text  text  text  text  text  text  text  text  text  text  text </h1></div>
  <script>
  const func = function() { console.log('Hello, there');}
  </script>
  </with:colon>

<!-- script like -->
<with:colon>
<style>.a{color:#f00}</style>
  <SCRIPT>
  const func = function() { console.log('Hello, there');}
  </SCRIPT>
<STYLE>.A{COLOR:#F00}</STYLE>
<html:script>const func = function() { console.log('Hello, there');}</html:script>
<html:style>.a{color:#f00}</html:style>
<svg><style>.a{color:#f00}</style></svg>
<svg><style>.a{color:#f00}</style></svg>
</with:colon>
<html:script>const func = function() { console.log('Hello, there');}</html:script>
<html:style>.a{color:#f00}</html:style>
`;
    const _expected = `<!-- unknown tag with colon -->
<div>
  <foo:bar>
    <div>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block
    </div>
    <div>block</div>
    <div>BLOCK</div>
    <div>block</div>
    <div>block</div>
    <div>block</div>
    <pre>
 pre pr
e</pre
    >
    <textarea>
 pre-wrap pr
e-wrap </textarea
    >
    <span>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline
    </span>
    <span> inline </span><span> inline </span> <span> inline </span
    ><span> inline </span>
    <html:div>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block
    </html:div>
    <html:DIV> block </html:DIV><HTML:DIV> BLOCK </HTML:DIV>
    <html:div> block </html:div><html:div> block </html:div
    ><html:div> block </html:div>
    <html:pre> pre pr e</html:pre>
    <html:textarea> pre-wrap pr e-wrap </html:textarea>
    <html:span>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline
    </html:span>
    <html:span> inline </html:span><html:span> inline </html:span>
    <html:span> inline </html:span><html:span> inline </html:span></foo:bar
  >
</div>

<!-- block tag with colon -->
<div>
  <foo:div>
    <div>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block
    </div>
    <div>block</div>
    <div>BLOCK</div>
    <div>block</div>
    <div>block</div>
    <div>block</div>
    <pre>
 pre pr
e</pre
    >
    <textarea>
 pre-wrap pr
e-wrap </textarea
    >
    <span>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline
    </span>
    <span> inline </span><span> inline </span> <span> inline </span
    ><span> inline </span>
    <html:div>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block
    </html:div>
    <html:DIV> block </html:DIV><HTML:DIV> BLOCK </HTML:DIV>
    <html:div> block </html:div><html:div> block </html:div
    ><html:div> block </html:div>
    <html:pre> pre pr e</html:pre>
    <html:textarea> pre-wrap pr e-wrap </html:textarea>
    <html:span>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline
    </html:span>
    <html:span> inline </html:span><html:span> inline </html:span>
    <html:span> inline </html:span><html:span> inline </html:span></foo:div
  >
</div>

<!-- inline tag with colon -->
<div>
  <foo:span>
    <div>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block
    </div>
    <div>block</div>
    <div>BLOCK</div>
    <div>block</div>
    <div>block</div>
    <div>block</div>
    <pre>
 pre pr
e</pre
    >
    <textarea>
 pre-wrap pr
e-wrap </textarea
    >
    <span>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline
    </span>
    <span> inline </span><span> inline </span> <span> inline </span
    ><span> inline </span>
    <html:div>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block
    </html:div>
    <html:DIV> block </html:DIV><HTML:DIV> BLOCK </HTML:DIV>
    <html:div> block </html:div><html:div> block </html:div
    ><html:div> block </html:div>
    <html:pre> pre pr e</html:pre>
    <html:textarea> pre-wrap pr e-wrap </html:textarea>
    <html:span>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline
    </html:span>
    <html:span> inline </html:span><html:span> inline </html:span>
    <html:span> inline </html:span><html:span> inline </html:span></foo:span
  >
</div>

<!-- unknown -->
<div>
  <foo-bar>
    <div>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block
    </div>
    <div>block</div>
    <div>BLOCK</div>
    <div>block</div>
    <div>block</div>
    <div>block</div>
    <pre>
 pre pr
e</pre
    >
    <textarea>
 pre-wrap pr
e-wrap </textarea
    >
    <span>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline
    </span>
    <span> inline </span><span> inline </span> <span> inline </span
    ><span> inline </span>
    <html:div>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block
    </html:div>
    <html:DIV> block </html:DIV><HTML:DIV> BLOCK </HTML:DIV>
    <html:div> block </html:div><html:div> block </html:div
    ><html:div> block </html:div>
    <html:pre> pre pr e</html:pre>
    <html:textarea> pre-wrap pr e-wrap </html:textarea>
    <html:span>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline
    </html:span>
    <html:span> inline </html:span><html:span> inline </html:span>
    <html:span> inline </html:span><html:span> inline </html:span></foo-bar
  >
</div>

<!-- without colon -->
<div>
  <div>
    <div>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block
    </div>
    <div>block</div>
    <div>BLOCK</div>
    <div>block</div>
    <div>block</div>
    <div>block</div>
    <pre>
 pre pr
e</pre
    >
    <textarea>
 pre-wrap pr
e-wrap </textarea
    >
    <span>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline
    </span>
    <span> inline </span><span> inline </span> <span> inline </span
    ><span> inline </span>
    <html:div>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog block
    </html:div>
    <html:DIV> block </html:DIV><HTML:DIV> BLOCK </HTML:DIV>
    <html:div> block </html:div><html:div> block </html:div
    ><html:div> block </html:div>
    <html:pre> pre pr e</html:pre>
    <html:textarea> pre-wrap pr e-wrap </html:textarea>
    <html:span>
      looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooog inline
    </html:span>
    <html:span> inline </html:span><html:span> inline </html:span>
    <html:span> inline </html:span><html:span> inline </html:span>
  </div>
</div>

<!-- #7236 -->
<with:colon>
  <div>
    <h1>
      text text text text text text text text text text text text text text
    </h1>
  </div>
  <script>
    const func = function () {
      console.log("Hello, there");
    };
  </script>
</with:colon>

<!-- script like -->
<with:colon>
  <style>
    .a {
      color: #f00;
    }
  </style>
  <script>
    const func = function () {
      console.log("Hello, there");
    };
  </script>
  <style>
    .A {
      color: #f00;
    }
  </style>
  <html:script
    >const func = function() { console.log('Hello, there');}</html:script
  >
  <html:style
    >.a{color:#f00}</html:style
  >
  <svg><style> .a {
       color: #f00;
    } </style></svg>
  <svg><style> .a {
       color: #f00;
    } </style></svg>
</with:colon>
<html:script
  >const func = function() { console.log('Hello, there');}</html:script
>
<html:style
  >.a{color:#f00}</html:style
>
`;
    await formatEqualToPrettierHtml(input, {
      bladeInlineIntentElements: [],
    });
  });
});
