import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/incomplete-documents", () => {
  it("handles directive branches with orphaned opening/closing tags", async () => {
    const input = `@if ($something)
    <div>
@endif

stuff

@if ($something)
    </div>
@endif
`;

    const expected = `@if ($something)
  <div>
@endif

stuff

@if ($something)
  </div>
@endif
`;

    await formatEqual(input, expected);
  });

  it("indents root-level orphaned directive branches nicely", async () => {
    const input = `@if ($something)
<div>
@endif

stuff

@if ($something)
</div>
@endif
`;

    const expected = `@if ($something)
  <div>
@endif

stuff

@if ($something)
  </div>
@endif
`;

    await formatEqual(input, expected);
  });

  it("indents root-level orphaned branches in compact form", async () => {
    const input = `@if ($something)
<div>
@endif
@if ($something)
</div>
@endif
`;

    const expected = `@if ($something)
  <div>
@endif
@if ($something)
  </div>
@endif
`;

    await formatEqual(input, expected);
  });

  it("keeps orphaned closing tags without crashing", async () => {
    const input = `stuff
</div>
<p>ok</p>
`;

    const expected = `stuff
</div>
<p>ok</p>
`;

    await formatEqual(input, expected);
  });

  it("repairs mismatched nested tags deterministically", async () => {
    const input = `<div><span>oops</div>
`;

    const expected = `<div><span>oops</span></div>
`;

    await formatEqual(input, expected, { bladeInsertOptionalClosingTags: true });
  });

  it("handles unterminated opening tags", async () => {
    const input = `<div class="x
`;

    const expected = `<div class="x"></div>
`;

    await formatEqual(input, expected, { bladeInsertOptionalClosingTags: true });
  });

  it("does not duplicate body content for unterminated directive blocks at EOF", async () => {
    const input = `@if ($this->author(""))
    <p>Hello world`;

    const expected = `@if ($this->author(""))
  <p>Hello world
`;

    await formatEqual(input, expected);
  });

  it("does not duplicate body content for unterminated directive blocks with php formatting", async () => {
    const input = `@if ($this->author(""))
    <p>Hello world`;

    const expected = `@if ($this->author(''))
  <p>Hello world
`;

    await formatEqual(input, expected, {
      bladePhpFormatting: "safe",
      singleQuote: true,
    });
  });

  it("preserves malformed synthetic-close opening spans without pass drift", async () => {
    const input = `<Map<PZF_1_0
@if ($cond)
<div>
  <span>alpha</span>
</div>
@endif
`;

    await formatEqual(input, input);
  });
});
