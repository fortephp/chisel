import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("Blade comment with echo braces does not drop sibling nodes", () => {
  it("preserves nodes after comment with multiple echo braces", async () => {
    const input = [
      "<div>",
      "    <h1></h1>",
      "    {{-- {{ }} {{ }} --}}",
      "    <div>",
      "        <span></span>",
      "    </div>",
      "    <h2></h2>",
      "</div>",
    ].join("\n");

    const expected = [
      "<div>",
      "  <h1></h1>",
      "  {{-- {{ }} {{ }} --}}",
      "  <div>",
      "    <span></span>",
      "  </div>",
      "  <h2></h2>",
      "</div>",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("preserves nodes after comment with triple echo braces", async () => {
    const input = [
      "<div>",
      "    {{-- {{ }} {{{ }}} {!! !!} --}}",
      "    <p>still here</p>",
      "</div>",
    ].join("\n");

    const expected = [
      "<div>",
      "  {{-- {{ }} {{{ }}} {!! !!} --}}",
      "  <p>still here</p>",
      "</div>",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("preserves nodes after multiple comments each with echo braces", async () => {
    const input = [
      "<div>",
      "    {{-- {{ $a }} --}}",
      "    {{-- {{ $b }} {{ $c }} --}}",
      "    <p>still here</p>",
      "</div>",
    ].join("\n");

    const expected = [
      "<div>",
      "  {{-- {{ $a }} --}}",
      "  {{-- {{ $b }} {{ $c }} --}}",
      "  <p>still here</p>",
      "</div>",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });
});
