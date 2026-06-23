import { describe, expect, it } from "vitest";
import { format, formatEqual, formatWithPasses } from "../helpers.js";

describe("html/text", () => {
  it("keeps email addresses with dashed domains as inline text", async () => {
    const input = `<p>Contact test@example.com or test@exam-ple.com.</p>
`;
    const expected = `<p>Contact test@example.com or test@exam-ple.com.</p>
`;

    await formatEqual(input, expected);
  });

  it("keeps directive-like email domains as inline text", async () => {
    const input = `<p>test@if.com</p>
<p>test@foreach.dev</p>
<p>test@endforeach.test</p>
<p>test@php.net</p>
`;

    await formatEqual(input, input);
  });

  it("keeps common email shapes and punctuation inline", async () => {
    const input = `<p>first.last+tag@sub.exam-ple.co.uk</p>
<p>(test@exam-ple.com), test@example.com.</p>
`;

    await formatEqual(input, input);
  });

  it("keeps emails intact in attribute values", async () => {
    const input = `<a href="mailto:test@exam-ple.com">Mail</a>
<div data-email="test@if.com"></div>
<div data-email=test@foreach.dev></div>
`;

    const output = await format(input);

    expect(output).toContain('href="mailto:test@exam-ple.com"');
    expect(output).toContain('data-email="test@if.com"');
    expect(output).toContain('data-email="test@foreach.dev"');
  });

  it("keeps emails intact in raw-content strings and comments", async () => {
    const input = `<script>
const contact = "test@if.com"
// test@foreach.dev
</script>
<style>
.contact::before { content: "test@if.com"; }
/* test@php.net */
</style>
`;

    const output = await formatWithPasses(input, {}, { passes: 3, assertIdempotent: true });

    expect(output).toContain('"test@if.com"');
    expect(output).toContain("// test@foreach.dev");
    expect(output).toContain('content: "test@if.com"');
    expect(output).toContain("/* test@php.net */");
  });
});
