import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

const SAGE_OPTIONS = {
  bladeEchoSpacing: "space" as const,
  bladeSyntaxPlugins: ["log1x/sage-directives"],
};
const SAGE_PHP_OPTIONS = {
  ...SAGE_OPTIONS,
  bladePhpFormatting: "safe" as const,
  printWidth: 36,
  singleQuote: true,
};

describe("plugins/sage formatting", () => {
  it("formats the documented ACF repeater pattern", async () => {
    const input = [
      "@hasfield('list')",
      "<ul>",
      "@fields('list')",
      "<li>@sub('item')</li>",
      "@endfields",
      "</ul>",
      "@endfield",
      "",
    ].join("\n");

    const expected = [
      "@hasfield ('list')",
      "  <ul>",
      "    @fields ('list')",
      "      <li>@sub ('item')</li>",
      "    @endfields",
      "  </ul>",
      "@endfield",
      "",
    ].join("\n");

    await formatEqual(input, expected, SAGE_OPTIONS);
  });

  it("formats the documented WordPress posts loop pattern", async () => {
    const input = [
      "@posts",
      "<h2 class=\"entry-title\">@title</h2>",
      "<div class=\"entry-content\">",
      "@content",
      "</div>",
      "@endposts",
      "",
    ].join("\n");

    const expected = [
      "@posts",
      "  <h2 class=\"entry-title\">@title</h2>",
      "  <div class=\"entry-content\">",
      "    @content",
      "  </div>",
      "@endposts",
      "",
    ].join("\n");

    await formatEqual(input, expected, SAGE_OPTIONS);
  });

  it("formats helper condition blocks but keeps inline helper calls standalone", async () => {
    const blockInput = ["@istrue($ready)", "<div>{{$title}}</div>", "@endistrue", ""].join("\n");
    const blockExpected = [
      "@istrue ($ready)",
      "  <div>{{ $title }}</div>",
      "@endistrue",
      "",
    ].join("\n");

    await formatEqual(blockInput, blockExpected, SAGE_OPTIONS);

    await formatEqual("@istrue($ready, 'Ready')\n", "@istrue ($ready, 'Ready')\n", SAGE_OPTIONS);
  });

  it("formats inline @script blocks separately from src-path @script calls", async () => {
    const blockInput = ["@script", "console.log('Hello World')", "@endscript", ""].join("\n");
    const blockExpected = ["@script", "  console.log('Hello World')", "@endscript", ""].join(
      "\n",
    );

    await formatEqual(blockInput, blockExpected, SAGE_OPTIONS);
    await formatEqual(
      "@script('/path/to/script.js')\n",
      "@script ('/path/to/script.js')\n",
      SAGE_OPTIONS,
    );
  });

  it("formats Sage directive arguments when php formatting is enabled", async () => {
    const input = [
      "@global($post,$wp_query)",
      "@query(['post_type'=>'page','posts_per_page'=>1,'ignore_sticky_posts'=>true])",
      "",
    ].join("\n");

    const expected = [
      "@global ($post, $wp_query)",
      "@query ([",
      "  'post_type' => 'page',",
      "  'posts_per_page' => 1,",
      "  'ignore_sticky_posts' => true,",
      "])",
      "",
    ].join("\n");

    await formatEqual(input, expected, SAGE_PHP_OPTIONS);
  });

  it("formats multi-argument condition and call-style Sage directives with php formatting", async () => {
    await formatEqual(
      ["@role('author','editor')", "<p>Visible</p>", "@endrole", ""].join("\n"),
      ["@role ('author', 'editor')", "  <p>Visible</p>", "@endrole", ""].join("\n"),
      SAGE_PHP_OPTIONS,
    );

    await formatEqual(
      ["@hasfield('image','url',1)", "<span>@field('image','url',1)</span>", "@endfield", ""].join("\n"),
      [
        "@hasfield ('image', 'url', 1)",
        "  <span>",
        "    @field ('image', 'url', 1)",
        "  </span>",
        "@endfield",
        "",
      ].join("\n"),
      SAGE_PHP_OPTIONS,
    );

    await formatEqual(
      "@image('hero','full',['alt'=>$title.' image','class'=>'hero'])\n",
      "@image ('hero', 'full', ['alt' => $title . ' image', 'class' => 'hero'])\n",
      {
        ...SAGE_PHP_OPTIONS,
        printWidth: 80,
      },
    );

    await formatEqual(
      "@script('/dist/app'.'.js')\n",
      "@script ('/dist/app' . '.js')\n",
      SAGE_PHP_OPTIONS,
    );
  });
});
