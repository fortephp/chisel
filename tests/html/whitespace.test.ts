// Auto-generated from Prettier HTML snapshot: whitespace/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/whitespace", () => {
  it("break-tags.html", async () => {
    const input = `<a>Lorem</a>, ispum dolor sit <strong>amet</strong>.
<div><a>Lorem</a>, ispum dolor sit <strong>amet</strong>.</div>
<div><div><a>Lorem</a>, ispum dolor sit <strong>amet</strong>.</div></div>
`;
    const expected = `<a>Lorem</a>, ispum dolor sit <strong>amet</strong>.
<div><a>Lorem</a>, ispum dolor sit <strong>amet</strong>.</div>
<div>
  <div><a>Lorem</a>, ispum dolor sit <strong>amet</strong>.</div>
</div>
`;
    await formatEqual(input, expected);
  });

  it("display-inline-block.html", async () => {
    const input = `<button>Click here! Click here! Click here! Click here! Click here! Click here!</button>
<button>
Click here! Click here! Click here! Click here! Click here! Click here!
</button>
<div>
<button>Click here! Click here! Click here! Click here! Click here! Click here!</button><button>Click here! Click here! Click here! Click here! Click here! Click here!</button>
</div>
<div>
<button>Click here! Click here! Click here! Click here! Click here! Click here!</button>
<button>Click here! Click here! Click here! Click here! Click here! Click here!</button>
</div>
<video src="brave.webm"><track kind=subtitles src=brave.en.vtt srclang=en label="English"><track kind=subtitles src=brave.en.vtt srclang=en label="English"></video>
`;
    const expected = `<button>
  Click here! Click here! Click here! Click here! Click here! Click here!
</button>
<button>
  Click here! Click here! Click here! Click here! Click here! Click here!
</button>
<div>
  <button>
    Click here! Click here! Click here! Click here! Click here! Click here!</button
  ><button>
    Click here! Click here! Click here! Click here! Click here! Click here!
  </button>
</div>
<div>
  <button>
    Click here! Click here! Click here! Click here! Click here! Click here!
  </button>
  <button>
    Click here! Click here! Click here! Click here! Click here! Click here!
  </button>
</div>
<video src="brave.webm">
  <track kind="subtitles" src="brave.en.vtt" srclang="en" label="English" />
  <track kind="subtitles" src="brave.en.vtt" srclang="en" label="English" />
</video>
`;
    await formatEqual(input, expected);
  });

  it("display-none.html", async () => {
    const input = `<!DOCTYPE html><HTML CLASS="no-js mY-ClAsS"><HEAD><META CHARSET="utf-8"><TITLE>My tITlE</TITLE><META NAME="description" content="My CoNtEnT"></HEAD></HTML>
`;
    const expected = `<!doctype html>
<html class="no-js mY-ClAsS">
  <head>
    <meta charset="utf-8" />
    <title>My tITlE</title>
    <meta name="description" content="My CoNtEnT" />
  </head>
</html>
`;
    await formatEqual(input, expected);
  });

  it("fill.html", async () => {
    const input = `<p>
  <img
    src="/images/pansies.jpg"
    alt="about fedco bottom image"
    style="float: left;"
  /><strong>We are a cooperative</strong>, one of the few seed companies so organized
  in the United States. Because we do not have an individual owner or beneficiary,
  profit is not our primary goal. Consumers own 60% of the cooperative and worker
  members 40%. Consumer and worker members share proportionately in the cooperative&#8217;s
  profits through our annual patronage dividends.
</p>
`;
    const expected = `<p>
  <img
    src="/images/pansies.jpg"
    alt="about fedco bottom image"
    style="float: left"
  /><strong>We are a cooperative</strong>, one of the few seed companies so
  organized in the United States. Because we do not have an individual owner or
  beneficiary, profit is not our primary goal. Consumers own 60% of the
  cooperative and worker members 40%. Consumer and worker members share
  proportionately in the cooperative&#8217;s profits through our annual
  patronage dividends.
</p>
`;
    await formatEqual(input, expected);
  });

  it("inline-leading-trailing-spaces.html", async () => {
    const input = `<span> 321 </span>

<span> <a>321</a> </span>
`;
    const expected = `<span> 321 </span>

<span> <a>321</a> </span>
`;
    await formatEqual(input, expected);
  });

  it("inline-nodes.html", async () => {
    const input = `<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce cursus massa vel augue 
vestibulum facilisis in porta turpis. Ut faucibus lectus sit amet urna consectetur dignissim.
Sam vitae neque quis ex dapibus faucibus at sed ligula. Nulla sit amet aliquet nibh.
Vestibulum at congue mi. Suspendisse vitae odio vitae massa hendrerit mattis sed eget dui.
Sed eu scelerisque neque. Donec <b>maximus</b> rhoncus pellentesque. Aenean purus turpis, vehicula 
euismod ante vel, ultricies eleifend dui. Class aptent taciti sociosqu ad litora torquent per 
conubia nostra, per inceptos himenaeos. Donec in ornare velit.</p>

<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce cursus massa vel augue 
vestibulum facilisis in porta turpis. Ut faucibus lectus sit amet urna consectetur dignissim.
Sam vitae neque quis ex dapibus faucibus at sed ligula. Nulla sit amet aliquet nibh.
Vestibulum at congue mi. Suspendisse vitae odio vitae massa hendrerit mattis sed eget dui.
Sed eu scelerisque neque. Donec <a href="#"><b>maximus</b></a> rhoncus pellentesque. Aenean purus turpis, vehicula 
euismod ante vel, ultricies eleifend dui. Class aptent taciti sociosqu ad litora torquent per 
conubia nostra, per inceptos himenaeos. Donec in ornare velit.</p>
`;
    const expected = `<p>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce cursus massa
  vel augue vestibulum facilisis in porta turpis. Ut faucibus lectus sit amet
  urna consectetur dignissim. Sam vitae neque quis ex dapibus faucibus at sed
  ligula. Nulla sit amet aliquet nibh. Vestibulum at congue mi. Suspendisse
  vitae odio vitae massa hendrerit mattis sed eget dui. Sed eu scelerisque
  neque. Donec <b>maximus</b> rhoncus pellentesque. Aenean purus turpis,
  vehicula euismod ante vel, ultricies eleifend dui. Class aptent taciti
  sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Donec
  in ornare velit.
</p>

<p>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce cursus massa
  vel augue vestibulum facilisis in porta turpis. Ut faucibus lectus sit amet
  urna consectetur dignissim. Sam vitae neque quis ex dapibus faucibus at sed
  ligula. Nulla sit amet aliquet nibh. Vestibulum at congue mi. Suspendisse
  vitae odio vitae massa hendrerit mattis sed eget dui. Sed eu scelerisque
  neque. Donec <a href="#"><b>maximus</b></a> rhoncus pellentesque. Aenean purus
  turpis, vehicula euismod ante vel, ultricies eleifend dui. Class aptent taciti
  sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Donec
  in ornare velit.
</p>
`;
    await formatEqual(input, expected);
  });

  it("nested-inline-without-whitespace.html", async () => {
    const input = `<a href="/wiki/Help:IPA/English" title="Help:IPA/English">/<span style="border-bottom:1px dotted"><span title="/ˌ/: secondary stress follows">ˌ</span
><span title="/ɪ/: &#39;i&#39; in &#39;kit&#39;">ɪ</span
><span title="&#39;l&#39; in &#39;lie&#39;">l</span
><span title="/ə/: &#39;a&#39; in &#39;about&#39;">ə</span
><span title="/ˈ/: primary stress follows">ˈ</span
><span title="&#39;n&#39; in &#39;nigh&#39;">n</span
><span title="/ɔɪ/: &#39;oi&#39; in &#39;choice&#39;">ɔɪ</span></span>/</a>

<span class="word"><span class="syllable"><span class="letter vowel">i</span><span class="letter consonant">p</span></span
><span class="syllable"><span class="letter consonant onset">s</span><span class="letter vowel">u</span><span class="letter consonant">m</span></span></span>
`;
    const expected = `<a href="/wiki/Help:IPA/English" title="Help:IPA/English"
  >/<span style="border-bottom: 1px dotted"
    ><span title="/ˌ/: secondary stress follows">ˌ</span
    ><span title="/ɪ/: &#39;i&#39; in &#39;kit&#39;">ɪ</span
    ><span title="&#39;l&#39; in &#39;lie&#39;">l</span
    ><span title="/ə/: &#39;a&#39; in &#39;about&#39;">ə</span
    ><span title="/ˈ/: primary stress follows">ˈ</span
    ><span title="&#39;n&#39; in &#39;nigh&#39;">n</span
    ><span title="/ɔɪ/: &#39;oi&#39; in &#39;choice&#39;">ɔɪ</span></span
  >/</a
>

<span class="word"
  ><span class="syllable"
    ><span class="letter vowel">i</span
    ><span class="letter consonant">p</span></span
  ><span class="syllable"
    ><span class="letter consonant onset">s</span
    ><span class="letter vowel">u</span
    ><span class="letter consonant">m</span></span
  ></span
>
`;
    await formatEqual(input, expected);
  });

  it("non-breaking-whitespace.html", async () => {
    const input = `<!-- normal whitespaces -->
<span>Nihil aut odit omnis. Quam maxime est molestiae. Maxime dolorem dolores voluptas quaerat ut qui sunt vitae error.</span>
<!-- non-breaking whitespaces -->
<span>Nihil aut odit omnis. Quam maxime est molestiae. Maxime dolorem dolores voluptas quaerat ut qui sunt vitae error.</span>
<!-- non-breaking narrow whitespaces -->
<span>Prix : 32 €</span>
`;
    const expected = `<!-- normal whitespaces -->
<span
  >Nihil aut odit omnis. Quam maxime est molestiae. Maxime dolorem dolores
  voluptas quaerat ut qui sunt vitae error.</span
>
<!-- non-breaking whitespaces -->
<span
  >Nihil aut odit omnis. Quam maxime est molestiae. Maxime dolorem dolores voluptas quaerat ut qui sunt vitae error.</span
>
<!-- non-breaking narrow whitespaces -->
<span>Prix : 32 €</span>
`;
    await formatEqual(input, expected);
  });

  it("snippet: #18", async () => {
    const input = "<div> </div>";
    const expected = `<div> </div>
`;
    await formatEqual(input, expected);
  });

  it("snippet: #19", async () => {
    const input = "<div>          </div>";
    const expected = `<div> </div>
`;
    await formatEqual(input, expected);
  });

  it("snippet: #20", async () => {
    const input = "<div>           </div>";
    const expected = `<div>  </div>
`;
    await formatEqual(input, expected);
  });

  it("snippet: #21", async () => {
    const input = "<div>                   </div>";
    const expected = `<div>   </div>
`;
    await formatEqual(input, expected);
  });

  it("snippet: #22", async () => {
    const input = "<span> </span>";
    const expected = `<span> </span>
`;
    await formatEqual(input, expected);
  });

  it("snippet: #23", async () => {
    const input = "<span>          </span>";
    const expected = `<span>   </span>
`;
    await formatEqual(input, expected);
  });

  it("snippet: #24", async () => {
    const input = "<span>           </span>";
    const expected = `<span>    </span>
`;
    await formatEqual(input, expected);
  });

  it("snippet: #25", async () => {
    const input = "<span>                   </span>";
    const expected = `<span>     </span>
`;
    await formatEqual(input, expected);
  });

  it("snippet: #26", async () => {
    const input = "<img/> <img/>";
    const expected = `<img /> <img />
`;
    await formatEqual(input, expected);
  });

  it("snippet: #27", async () => {
    const input = "<img/>          <img/>";
    const expected = `<img />   <img />
`;
    await formatEqual(input, expected);
  });

  it("snippet: #28", async () => {
    const input = "<img/>           <img/>";
    const expected = `<img />    <img />
`;
    await formatEqual(input, expected);
  });

  it("snippet: #29", async () => {
    const input = "<img/>                   <img/>";
    const expected = `<img />     <img />
`;
    await formatEqual(input, expected);
  });

  it("snippet: #30", async () => {
    const input = "<i />   |   <i />";
    const expected = `<i />   |   <i />
`;
    await formatEqual(input, expected);
  });

  it("snippet: #31", async () => {
    const input = "<p><span>X</span>   or   <span>Y</span></p><p>X   or   Y</p>";
    const expected = `<p><span>X</span>   or   <span>Y</span></p>
<p>X   or   Y</p>
`;
    await formatEqual(input, expected);
  });

  it("snippet: `U+2005` should format like `U+005F` not like `U+0020`", async () => {
    const input = `<!-- U+2005 -->
<div>before<span> </span>afterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafter</div>
<!-- U+005F -->
<div>before<span>_</span>afterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafter</div>
<!-- U+0020 -->
<div>before<span> </span>afterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafter</div>`;
    const expected = `<!-- U+2005 -->
<div>
  before<span> </span>afterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafter
</div>
<!-- U+005F -->
<div>
  before<span>_</span>afterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafter
</div>
<!-- U+0020 -->
<div>
  before<span
  > </span
  >afterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafterafter
</div>
`;
    await formatEqual(input, expected);
  });

  it("snippet: `U+2005` should indent like `U+005F` not like `U+0020`", async () => {
    const input = `<!-- U+2005 -->
<script type="text/unknown" lang="unknown">
        // comment
          // comment
          // comment
          // comment
</script>
<!-- U+005F -->
<script type="text/unknown" lang="unknown">
   _    // comment
          // comment
          // comment
          // comment
</script>
<!-- U+0020 -->
<script type="text/unknown" lang="unknown">
        // comment
          // comment
          // comment
          // comment
</script>`;
    const expected = `<!-- U+2005 -->
<script type="text/unknown" lang="unknown">
       // comment
         // comment
         // comment
         // comment
</script>
<!-- U+005F -->
<script type="text/unknown" lang="unknown">
  _    // comment
         // comment
         // comment
         // comment
</script>
<!-- U+0020 -->
<script type="text/unknown" lang="unknown">
  // comment
    // comment
    // comment
    // comment
</script>
`;
    await formatEqual(input, expected);
  });

  it("surrounding-linebreak.html", async () => {
    const input = `<span>123</span>
<span>
123</span>
<span>123
</span>
<span>
123
</span>

<div>123</div>
<div>
123</div>
<div>123
</div>
<div>
123
</div>
`;
    const expected = `<span>123</span>
<span> 123</span>
<span>123 </span>
<span> 123 </span>

<div>123</div>
<div>123</div>
<div>123</div>
<div>123</div>
`;
    await formatEqual(input, expected);
  });

  it("table.html", async () => {
    const input = `<table>
  <thead>
    <tr>
      <th>A</th>
      <th>B</th>
      <th>C</th>
    </tr>
  </thead>
</table>

<table><thead><tr><th>A</th><th>B</th><th>C</th></tr></thead></table>

<table> <thead> <tr> <th> A </th> <th> B </th> <th> C </th> </tr> </thead> </table>

<table>
  <thead>
    <tr>
    </tr>
  </thead>
</table>
`;
    const expected = `<table>
  <thead>
    <tr>
      <th>A</th>
      <th>B</th>
      <th>C</th>
    </tr>
  </thead>
</table>

<table>
  <thead>
    <tr>
      <th>A</th>
      <th>B</th>
      <th>C</th>
    </tr>
  </thead>
</table>

<table>
  <thead>
    <tr>
      <th>A</th>
      <th>B</th>
      <th>C</th>
    </tr>
  </thead>
</table>

<table>
  <thead>
    <tr></tr>
  </thead>
</table>
`;
    await formatEqual(input, expected);
  });

  it("template.html", async () => {
    const input = `<template>
  <template>foo</template>
</template>

<template>
  <template>foooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo</template>
</template>
`;
    const expected = `<template>
  <template>foo</template>
</template>

<template>
  <template
    >foooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo</template
  >
</template>
`;
    await formatEqual(input, expected);
  });
});
