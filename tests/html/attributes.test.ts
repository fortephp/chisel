// Auto-generated from Prettier HTML snapshot: attributes/
// Snapshot-derived HTML compatibility cases.

import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/attributes", () => {
  it("attributes.html", async () => {
    const input = `<input name=address maxlength=200>
<input name='address' maxlength='200'>
<input name="address" maxlength="200">
<div class="foo"></div>
<div   class="foo"   ></div>
<div class="foo bar"></div>
<div class="foo bar" id="header"></div>
<div   class="foo bar"   id="header"   ></div>
<div data-prettier></div>
<div data-prettier="true"></div>
<meta property="og:description" content="The Mozilla Developer Network (MDN) provides
information about Open Web technologies including HTML, CSS, and APIs for both Web sites
and HTML5 Apps. It also documents Mozilla products, like Firefox OS.">
<div attribute>String</div>
<div attribute="">String</div>
<div attribute=''>String</div>
<div attribute >String</div>
<div attribute = "" >String</div>
<div attribute = '' >String</div>
<div  attribute  >String</div>
<div  attribute  =  ""  >String</div>
<div  attribute  =  ''  >String</div>
<div attribute="attribute = attribute"></div>
<div ATTRIBUTE>String</div>
<div ATTRIBUTE="">String</div>
<div ATTRIBUTE=''>String</div>
<article
  id="electriccars"
  data-columns="3"
  data-index-number="12314"
  data-parent="cars">
</article>
<article
  id="electriccars"
  data-columns="3"
  data-index-number="12314"
  data-parent="cars">...</article>
<article
  id="electriccars"
  data-columns="3"
  data-index-number="12314"
  data-parent="cars">
  ...
</article>
<article
  id="electriccars"
  data-columns="3"
  data-index-number="12314"
  data-parent="cars">

</article>
<article
  id="electriccars"
  data-columns="3"
  data-index-number="12314"
  data-parent="cars">



</article>
<X>
</X>
<X a="1">
</X>
<X a="1" b="2">
</X>
<X a="1" b="2" c="3">
</X>
<p 
  class="
    foo
    bar
    baz
  "
>
</p>
`;
    const expected = `<input name="address" maxlength="200" />
<input name="address" maxlength="200" />
<input name="address" maxlength="200" />
<div class="foo"></div>
<div class="foo"></div>
<div class="foo bar"></div>
<div class="foo bar" id="header"></div>
<div class="foo bar" id="header"></div>
<div data-prettier></div>
<div data-prettier="true"></div>
<meta
  property="og:description"
  content="The Mozilla Developer Network (MDN) provides
information about Open Web technologies including HTML, CSS, and APIs for both Web sites
and HTML5 Apps. It also documents Mozilla products, like Firefox OS."
/>
<div attribute>String</div>
<div attribute="">String</div>
<div attribute="">String</div>
<div attribute>String</div>
<div attribute="">String</div>
<div attribute="">String</div>
<div attribute>String</div>
<div attribute="">String</div>
<div attribute="">String</div>
<div attribute="attribute = attribute"></div>
<div ATTRIBUTE>String</div>
<div ATTRIBUTE="">String</div>
<div ATTRIBUTE="">String</div>
<article
  id="electriccars"
  data-columns="3"
  data-index-number="12314"
  data-parent="cars"
></article>
<article
  id="electriccars"
  data-columns="3"
  data-index-number="12314"
  data-parent="cars"
>
  ...
</article>
<article
  id="electriccars"
  data-columns="3"
  data-index-number="12314"
  data-parent="cars"
>
  ...
</article>
<article
  id="electriccars"
  data-columns="3"
  data-index-number="12314"
  data-parent="cars"
></article>
<article
  id="electriccars"
  data-columns="3"
  data-index-number="12314"
  data-parent="cars"
></article>
<X> </X>
<X a="1"> </X>
<X a="1" b="2"> </X>
<X a="1" b="2" c="3"> </X>
<p class="foo bar baz"></p>
`;
    await formatEqual(input, expected);
  });

  it("boolean.html", async () => {
    const input = `<button type="submit">This is valid.</button>
<button type="submit" disabled>This is valid.</button>
<button type="submit" disabled="">This is valid.</button>
<button type="submit" disabled="disabled">This is valid.</button>
<button type="submit" disabled=true>This is valid. This will be disabled.</button>
<button type="submit" disabled='true'>This is valid. This will be disabled.</button>
<button type="submit" disabled="true">This is valid. This will be disabled.</button>
<button type="submit" disabled=false>This is valid. This will be disabled.</button>
<button type="submit" disabled="false">This is valid. This will be disabled.</button>
<button type="submit" disabled='false'>This is valid. This will be disabled.</button>
<button type="submit" disabled=hahah>This is valid. This will be disabled.</button>
<button type="submit" disabled='hahah'>This is valid. This will be disabled.</button>
<button type="submit" disabled="hahah">This is valid. This will be disabled.</button>
<input type="checkbox" checked disabled name="cheese">
<input type="checkbox" checked="checked" disabled="disabled" name="cheese">
<input type='checkbox' checked="" disabled="" name=cheese >
<div lang=""></div>
`;
    const expected = `<button type="submit">This is valid.</button>
<button type="submit" disabled>This is valid.</button>
<button type="submit" disabled="">This is valid.</button>
<button type="submit" disabled="disabled">This is valid.</button>
<button type="submit" disabled="true">
  This is valid. This will be disabled.
</button>
<button type="submit" disabled="true">
  This is valid. This will be disabled.
</button>
<button type="submit" disabled="true">
  This is valid. This will be disabled.
</button>
<button type="submit" disabled="false">
  This is valid. This will be disabled.
</button>
<button type="submit" disabled="false">
  This is valid. This will be disabled.
</button>
<button type="submit" disabled="false">
  This is valid. This will be disabled.
</button>
<button type="submit" disabled="hahah">
  This is valid. This will be disabled.
</button>
<button type="submit" disabled="hahah">
  This is valid. This will be disabled.
</button>
<button type="submit" disabled="hahah">
  This is valid. This will be disabled.
</button>
<input type="checkbox" checked disabled name="cheese" />
<input type="checkbox" checked="checked" disabled="disabled" name="cheese" />
<input type="checkbox" checked="" disabled="" name="cheese" />
<div lang=""></div>
`;
    await formatEqual(input, expected);
  });

  it("case-sensitive.html", async () => {
    const input = `<div CaseSensitive></div>
`;
    const expected = `<div CaseSensitive></div>
`;
    await formatEqual(input, expected);
  });

  it("class-bem1.html", async () => {
    const input = `<div class="ProviderMeasuresContainer__heading-row
  d-flex
  flex-column flex-lg-row
  justify-content-start justify-content-lg-between
  align-items-start align-items-lg-center">Foo</div>

<div  class="a-bem-block a-bem-block--with-modifer ">
<div  class="a-bem-block__element a-bem-block__element--with-modifer also-another-block" >
<div  class="a-bem-block__element a-bem-block__element--with-modifer also-another-block__element">
</div></div> </div>
`;
    const expected = `<div
  class="ProviderMeasuresContainer__heading-row d-flex flex-column flex-lg-row justify-content-start justify-content-lg-between align-items-start align-items-lg-center"
>
  Foo
</div>

<div class="a-bem-block a-bem-block--with-modifer">
  <div
    class="a-bem-block__element a-bem-block__element--with-modifer also-another-block"
  >
    <div
      class="a-bem-block__element a-bem-block__element--with-modifer also-another-block__element"
    ></div>
  </div>
</div>
`;
    await formatEqual(input, expected);
  });

  it("class-bem2.html", async () => {
    const input = `<div class="news__header widget__content">
  <div class="news__tabs">
    <h1 class="news__tab-wrapper news__head-item">
      <a
        class="home-link home-link_blue_yes news__tab news__tab_selected_yes mix-tabber__tab mix-tabber__tab_selected_yes"
        tabindex="0"
        aria-selected="true"
        aria-controls="news_panel_news"
        data-key="news"
        id="news_tab_news"
        data-stat-link="news.tab.link.news"
        data-stat-select="news.tab.select.news"
        target="_blank"
        role="tab"
        href="https://yandex.ru/news?msid=1581089780.29024.161826.172442&mlid=1581088893.glob_225"
        rel="noopener"
        >...</a
      >
    </h1>
  </div>
</div>
`;
    const expected = `<div class="news__header widget__content">
  <div class="news__tabs">
    <h1 class="news__tab-wrapper news__head-item">
      <a
        class="home-link home-link_blue_yes news__tab news__tab_selected_yes mix-tabber__tab mix-tabber__tab_selected_yes"
        tabindex="0"
        aria-selected="true"
        aria-controls="news_panel_news"
        data-key="news"
        id="news_tab_news"
        data-stat-link="news.tab.link.news"
        data-stat-select="news.tab.select.news"
        target="_blank"
        role="tab"
        href="https://yandex.ru/news?msid=1581089780.29024.161826.172442&mlid=1581088893.glob_225"
        rel="noopener"
        >...</a
      >
    </h1>
  </div>
</div>
`;
    await formatEqual(input, expected);
  });

  it("class-colon.html", async () => {
    const input = `<my-tag class="md:foo-bg md:foo-color md:foo--sub-bg md:foo--sub-color xl:foo xl:prefix2 --prefix2--something-else unrelated_class_to_fill_80_chars"></my-tag>
`;
    const expected = `<my-tag
  class="md:foo-bg md:foo-color md:foo--sub-bg md:foo--sub-color xl:foo xl:prefix2 --prefix2--something-else unrelated_class_to_fill_80_chars"
></my-tag>
`;
    await formatEqual(input, expected);
  });

  it("class-leading-dashes.html", async () => {
    const input = `<my-tag class="__prefix1__foo __prefix1__bar __prefix2__foo prefix2 prefix2--something --prefix2--something-else"></my-tag>

<my-tag class="--prefix1--foo --prefix1--bar --prefix2--foo prefix2 prefix2__something __prefix2__something_else"></my-tag>
`;
    const expected = `<my-tag
  class="__prefix1__foo __prefix1__bar __prefix2__foo prefix2 prefix2--something --prefix2--something-else"
></my-tag>

<my-tag
  class="--prefix1--foo --prefix1--bar --prefix2--foo prefix2 prefix2__something __prefix2__something_else"
></my-tag>
`;
    await formatEqual(input, expected);
  });

  it("class-many-short-names.html", async () => {
    const input = `<div aria-hidden="true" class="border rounded-1 flex-shrink-0 bg-gray px-1 text-gray-light ml-1 f6 d-none d-on-nav-focus js-jump-to-badge-jump">
  Jump to
  <span class="d-inline-block ml-1 v-align-middle">x</span>
</div>
`;
    const expected = `<div
  aria-hidden="true"
  class="border rounded-1 flex-shrink-0 bg-gray px-1 text-gray-light ml-1 f6 d-none d-on-nav-focus js-jump-to-badge-jump"
>
  Jump to
  <span class="d-inline-block ml-1 v-align-middle">x</span>
</div>
`;
    await formatEqual(input, expected);
  });

  it("class-names.html", async () => {
    const input = `<img class="
                     foo
bar
">

<img class="  ">
<img class>

<img class="
looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong
a-long-long-long-long-long-class-name
another-long-long-long-class-name
                     foo bar
foo bar
                     foo bar
foo bar
                     foo bar
foo bar
                     foo bar
foo bar
                     foo bar
foo bar
                     foo bar
foo bar
                     foo bar
">

<img
class="{{ ...classes }}">
<img
class="foo bar {{ otherClass }}">

<!-- escaped -->
<!-- from: https://developer.mozilla.org/en-US/docs/Web/API/CSS/escape#Basic_results -->
<img class="
\\\\.foo\\\\#bar
\\\\(\\\\)\\\\[\\\\]\\\\{\\\\}
--a
\\\\30
\\\\ufffd
">

<!-- from yahoo website -->
<div id="header-wrapper" class="Bgc(#fff) Bdbc(t) Bdbs(s) Bdbw(1px) D(tb) Pos(f) Tbl(f) W(100%) Z(4)
has-scrolled_Bdc($c-fuji-grey-d) Scrolling_Bdc($c-fuji-grey-d) has-scrolled_Bxsh($headerShadow)
Scrolling_Bxsh($headerShadow) ">
<div class="Bgc(#fff) M(a) Maw(1301px) Miw(1000px) Pb(12px) Pt(22px) Pos(r) TranslateZ(0) Z(6)"
><h1 class="Fz(0) Pstart(15px) Pos(a)"><a id="header-logo"
href="https://www.yahoo.com/" class="D(b) Pos(r)" data-ylk="elm:img;elmt:logo;sec:hd;slk:logo">
<img class="H(27px)!--sm1024 Mt(9px)!--sm1024 W(90px)!--sm1024"
src="https://s.yimg.com/rz/p/yahoo_frontpage_en-US_s_f_p_205x58_frontpage_2x.png" height="58px"
width="205px" alt="Yahoo"/></a></h1></div></div>
`;
    const expected = `<img class="foo bar" />

<img class="  " />
<img class />

<img
  class="looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong a-long-long-long-long-long-class-name another-long-long-long-class-name foo bar foo bar foo bar foo bar foo bar foo bar foo bar foo bar foo bar foo bar foo bar foo bar foo bar"
/>

<img class="{{ ...classes }}" />
<img class="foo bar {{ otherClass }}" />

<!-- escaped -->
<!-- from: https://developer.mozilla.org/en-US/docs/Web/API/CSS/escape#Basic_results -->
<img class="\\\\.foo\\\\#bar \\\\(\\\\)\\\\[\\\\]\\\\{\\\\} --a \\\\30 \\\\ufffd" />

<!-- from yahoo website -->
<div
  id="header-wrapper"
  class="Bgc(#fff) Bdbc(t) Bdbs(s) Bdbw(1px) D(tb) Pos(f) Tbl(f) W(100%) Z(4) has-scrolled_Bdc($c-fuji-grey-d) Scrolling_Bdc($c-fuji-grey-d) has-scrolled_Bxsh($headerShadow) Scrolling_Bxsh($headerShadow)"
>
  <div
    class="Bgc(#fff) M(a) Maw(1301px) Miw(1000px) Pb(12px) Pt(22px) Pos(r) TranslateZ(0) Z(6)"
  >
    <h1 class="Fz(0) Pstart(15px) Pos(a)">
      <a
        id="header-logo"
        href="https://www.yahoo.com/"
        class="D(b) Pos(r)"
        data-ylk="elm:img;elmt:logo;sec:hd;slk:logo"
      >
        <img
          class="H(27px)!--sm1024 Mt(9px)!--sm1024 W(90px)!--sm1024"
          src="https://s.yimg.com/rz/p/yahoo_frontpage_en-US_s_f_p_205x58_frontpage_2x.png"
          height="58px"
          width="205px"
          alt="Yahoo"
      /></a>
    </h1>
  </div>
</div>
`;
    await formatEqual(input, expected);
  });

  it("class-print-width-edge.html", async () => {
    const input = `<div aria-hidden="true" class="border rounded-1 flex-shrink-0 bg-gray px-1 loooooooooooooooooooooooong">
</div>
`;
    const expected = `<div
  aria-hidden="true"
  class="border rounded-1 flex-shrink-0 bg-gray px-1 loooooooooooooooooooooooong"
></div>
`;
    await formatEqual(input, expected);
  });

  it("dobule-quotes.html", async () => {
    const input = `<img src="test.png" alt="John 'ShotGun' Nelson">
`;
    const expected = `<img src="test.png" alt="John 'ShotGun' Nelson" />
`;
    await formatEqual(input, expected);
  });

  it("duplicate.html", async () => {
    const input = `<a href="1" href="2">123</a>
`;
    const expected = `<a href="1" href="2">123</a>
`;
    await formatEqual(input, expected);
  });

  it("event-attributes.html", async () => {
    const input = `<button onclick="alert(    '1')">click me!</button>

<div onclick="handleClick(  event  )" onmouseover="showTooltip( this )" onmouseout="hideTooltip(  )">Hover me</div>

<img onerror='handleError(  this  )' onload="imageLoaded(  event  )" />

<button onclick="(event) =>   {  console.log('clicked');  handleClick(  event  );  }">Modern JS</button>

<div onclick="processData(  { id: 123, name: 'test'  },  [ 1,  2, 3 ]  )">Data</div>

<button onclick="api.user.get(  123  ).then(  data =>   updateUI( data )  )">API Call</button>

<input onfocus="highlightField(  this  )" onblur="validateField( this.value )" />
<select onchange="filterResults(  this.value,  this.selectedIndex  )">
  <option>Option 1</option>
</select>

<button onclick="
   alert(1);           alert(2);
 ">Click</button>

<button onclick="
    return false
  ">Click</button>

<button onclick="
  console.log(arguments)
  ">Click</button>

<button onclick="
  console.log(onclick)
  ">Click</button>

<button onclick="
  'use strict'
  console.log(onclick)
  ">Click</button>
`;
    const expected = `<button onclick="alert('1')">click me!</button>

<div
  onclick="handleClick(event)"
  onmouseover="showTooltip(this)"
  onmouseout="hideTooltip()"
>
  Hover me
</div>

<img onerror="handleError(this)" onload="imageLoaded(event)" />

<button
  onclick="
    (event) => {
      console.log('clicked');
      handleClick(event);
    }
  "
>
  Modern JS
</button>

<div onclick="processData({ id: 123, name: 'test' }, [1, 2, 3])">Data</div>

<button onclick="api.user.get(123).then((data) => updateUI(data))">
  API Call
</button>

<input onfocus="highlightField(this)" onblur="validateField(this.value)" />
<select onchange="filterResults(this.value, this.selectedIndex)">
  <option>Option 1</option>
</select>

<button
  onclick="
    alert(1);
    alert(2);
  "
>
  Click
</button>

<button onclick="return false;">Click</button>

<button onclick="console.log(arguments)">Click</button>

<button onclick="console.log(onclick)">Click</button>

<button
  onclick="
    &quot;use strict&quot;;
    console.log(onclick);
  "
>
  Click
</button>
`;
    await formatEqual(input, expected);
  });

  it("single-quotes.html", async () => {
    const input = `<img src="test.png" alt='John "ShotGun" Nelson'>
`;
    const expected = `<img src="test.png" alt='John "ShotGun" Nelson' />
`;
    await formatEqual(input, expected);
  });

  it("smart-quotes.html", async () => {
    const input = `<div 
    smart-quotes='123 " 456'
    smart-quotes="123 ' 456"
    smart-quotes='123 &apos;&quot; 456'
></div>
`;
    const expected = `<div
  smart-quotes='123 " 456'
  smart-quotes="123 ' 456"
  smart-quotes="123 '&quot; 456"
></div>
`;
    await formatEqual(input, expected);
  });

  it("srcset.html", async () => {
    const input = `<img src="/assets/visual.png" 
srcset="/assets/visual@0.5.png  400w, /assets/visual.png      805w" 
sizes="(max-width: 66rem) 100vw, 66rem" alt=""/>
<img src="/assets/visual.png" 
srcset="/assets/visual@0.5.png  400w, /assets/visual.png      805w,	/assets/visual@2x.png   1610w,	/assets/visual@3x.png   2415w" 
sizes="(max-width: 66rem) 100vw, 66rem" alt=""/>
<img src="/assets/visual.png" 
srcset="/assets/visual@0.5.png  0.5x, /assets/visual.png      1111x,	/assets/visual@2x.png   2x,	/assets/visual@3x.png   3.3333x" 
sizes="(max-width: 66rem) 100vw, 66rem" alt=""/>
<img

srcset="
             /media/examples/surfer-240-200.jpg
">
<!-- #8150 -->
<img
sizes="(max-width: 1400px) 100vw, 1400px"
srcset="
_20200401_145009_szrhju_c_scale,w_200.jpg 200w,
_20200401_145009_szrhju_c_scale,w_379.jpg 379w,
_20200401_145009_szrhju_c_scale,w_515.jpg 515w,
_20200401_145009_szrhju_c_scale,w_630.jpg 630w,
_20200401_145009_szrhju_c_scale,w_731.jpg 731w,
_20200401_145009_szrhju_c_scale,w_828.jpg 828w,
_20200401_145009_szrhju_c_scale,w_921.jpg 921w,
_20200401_145009_szrhju_c_scale,w_995.jpg 995w,
_20200401_145009_szrhju_c_scale,w_1072.jpg 1072w,
_20200401_145009_szrhju_c_scale,w_1145.jpg 1145w,
_20200401_145009_szrhju_c_scale,w_1216.jpg 1216w,
_20200401_145009_szrhju_c_scale,w_1284.jpg 1284w,
_20200401_145009_szrhju_c_scale,w_1350.jpg 1350w,
_20200401_145009_szrhju_c_scale,w_1398.jpg 1398w,
_20200401_145009_szrhju_c_scale,w_1400.jpg 1400w"
src="_20200401_145009_szrhju_c_scale,w_1400.jpg"
alt="">
`;
    const expected = `<img
  src="/assets/visual.png"
  srcset="/assets/visual@0.5.png 400w, /assets/visual.png 805w"
  sizes="(max-width: 66rem) 100vw, 66rem"
  alt=""
/>
<img
  src="/assets/visual.png"
  srcset="
    /assets/visual@0.5.png  400w,
    /assets/visual.png      805w,
    /assets/visual@2x.png  1610w,
    /assets/visual@3x.png  2415w
  "
  sizes="(max-width: 66rem) 100vw, 66rem"
  alt=""
/>
<img
  src="/assets/visual.png"
  srcset="
    /assets/visual@0.5.png    0.5x,
    /assets/visual.png     1111x,
    /assets/visual@2x.png     2x,
    /assets/visual@3x.png     3.3333x
  "
  sizes="(max-width: 66rem) 100vw, 66rem"
  alt=""
/>
<img srcset="/media/examples/surfer-240-200.jpg" />
<!-- #8150 -->
<img
  sizes="(max-width: 1400px) 100vw, 1400px"
  srcset="
    _20200401_145009_szrhju_c_scale,w_200.jpg   200w,
    _20200401_145009_szrhju_c_scale,w_379.jpg   379w,
    _20200401_145009_szrhju_c_scale,w_515.jpg   515w,
    _20200401_145009_szrhju_c_scale,w_630.jpg   630w,
    _20200401_145009_szrhju_c_scale,w_731.jpg   731w,
    _20200401_145009_szrhju_c_scale,w_828.jpg   828w,
    _20200401_145009_szrhju_c_scale,w_921.jpg   921w,
    _20200401_145009_szrhju_c_scale,w_995.jpg   995w,
    _20200401_145009_szrhju_c_scale,w_1072.jpg 1072w,
    _20200401_145009_szrhju_c_scale,w_1145.jpg 1145w,
    _20200401_145009_szrhju_c_scale,w_1216.jpg 1216w,
    _20200401_145009_szrhju_c_scale,w_1284.jpg 1284w,
    _20200401_145009_szrhju_c_scale,w_1350.jpg 1350w,
    _20200401_145009_szrhju_c_scale,w_1398.jpg 1398w,
    _20200401_145009_szrhju_c_scale,w_1400.jpg 1400w
  "
  src="_20200401_145009_szrhju_c_scale,w_1400.jpg"
  alt=""
/>
`;
    await formatEqual(input, expected);
  });

  it("style.html", async () => {
    const input = `<div style="

color:
#fFf

"></div>

<div style=" "></div>
<div style></div>

<div style="

all: initial;display: block;
contain: content;text-align: center;



background: linear-gradient(to left, hotpink, #FFF00F, #ccc, hsla(240, 100%, 50%, .05), transparent);
background: linear-gradient(to left, hsla(240, 100%, 50%, .05), red);
max-width: 500px;margin: 0 auto;
border-radius: 8px;transition: transform .2s ease-out;

"></div>



<div style="
background: linear-gradient(to left, hotpink, hsla(240, 100%, 50%, .05), transparent);
"></div>

<div style="   color : red;
            display    :inline ">
  </div>


<div style="  

color: green;

display: inline 

">
  </div>

<div attribute-1 attribute-2 attribute-3 attribute-4 attribute-5 attribute-6 attribute-7 
style="css-prop-1: css-value;css-prop-2: css-value;css-prop-3: css-value;css-prop-4: css-value;"
 attribute-1 attribute-2 attribute-3 attribute-4 attribute-5 attribute-6 attribute-7 >
  </div>

<div style="{{ ...styles }}" 
></div>

<div style="color: red; {{ otherStyles }}"
></div>`;
    const expected = `<div style="color: #fff"></div>

<div style=""></div>
<div style></div>

<div
  style="
    all: initial;
    display: block;
    contain: content;
    text-align: center;

    background: linear-gradient(
      to left,
      hotpink,
      #fff00f,
      #ccc,
      hsla(240, 100%, 50%, 0.05),
      transparent
    );
    background: linear-gradient(to left, hsla(240, 100%, 50%, 0.05), red);
    max-width: 500px;
    margin: 0 auto;
    border-radius: 8px;
    transition: transform 0.2s ease-out;
  "
></div>

<div
  style="
    background: linear-gradient(
      to left,
      hotpink,
      hsla(240, 100%, 50%, 0.05),
      transparent
    );
  "
></div>

<div style="color: red; display: inline"></div>

<div
  style="
    color: green;

    display: inline;
  "
></div>

<div
  attribute-1
  attribute-2
  attribute-3
  attribute-4
  attribute-5
  attribute-6
  attribute-7
  style="
    css-prop-1: css-value;
    css-prop-2: css-value;
    css-prop-3: css-value;
    css-prop-4: css-value;
  "
  attribute-1
  attribute-2
  attribute-3
  attribute-4
  attribute-5
  attribute-6
  attribute-7
></div>

<div style="{{ ...styles }}"></div>

<div style="color: red; {{ otherStyles }}"></div>
`;
    await formatEqual(input, expected);
  });

  it("without-quotes.html", async () => {
    const input = `<p title=Title>String</p>
`;
    const expected = `<p title="Title">String</p>
`;
    await formatEqual(input, expected);
  });
});
