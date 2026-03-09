import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/verbatim", () => {
  it("preserves blade constructs inside verbatim blocks", async () => {
    const input = `@verbatim
<div>{{   $x }}</div>
@if($ready)
@endverbatim
`;
    const expected = `@verbatim
<div>{{   $x }}</div>
@if($ready)
@endverbatim
`;
    await formatEqual(input, expected);
  });

  it("does not apply echo spacing normalization inside verbatim blocks", async () => {
    const input = `@verbatim
<div>{{$x}}</div>
@endverbatim
`;
    const expected = `@verbatim
<div>{{$x}}</div>
@endverbatim
`;
    await formatEqual(input, expected, { bladeEchoSpacing: "space" });
  });

  it("treats @antlers/@endantlers as verbatim blocks", async () => {
    const input = `@antlers
<div>{{$x}}</div>
@if($ready)
@endantlers
<div>{{$y}}</div>
`;
    const expected = `@antlers
<div>{{$x}}</div>
@if($ready)
@endantlers
<div>{{ $y }}</div>
`;
    await formatEqual(input, expected, {
      bladeEchoSpacing: "space",
      bladeSyntaxPlugins: ["statamic"],
    });
  });
});
