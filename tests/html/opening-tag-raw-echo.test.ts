import { describe, it } from "vitest";
import * as phpPlugin from "@prettier/plugin-php";
import bladePlugin from "../../src/index.js";
import { formatEqual } from "../helpers.js";

const withPhp = {
  plugins: [bladePlugin, phpPlugin],
  bladePhpFormatting: "safe" as const,
  printWidth: 80,
};

describe("html/opening-tag-raw-echo", () => {
  it("keeps reasonable source-inline dynamic attributes inline", async () => {
    const input = `<form>
<textarea
{!! ($autocapitalize = $getAutocapitalize()) ? "autocapitalize=\\"{$autocapitalize}\\"" : null !!}
{!! ($autocomplete = $getAutocomplete()) ? "autocomplete=\\"{$autocomplete}\\"" : null !!}
@if (! $isConcealed())
{!! filled($length = $getMaxLength()) ? "maxlength=\\"{$length}\\"" : null !!}
{!! filled($length = $getMinLength()) ? "minlength=\\"{$length}\\"" : null !!}
{!! $isRequired() ? 'required' : null !!}
@endif
></textarea>
</form>
`;
    const expected = `<form>
  <textarea
    {!! ($autocapitalize = $getAutocapitalize()) ? "autocapitalize=\\"{$autocapitalize}\\"" : null !!}
    {!! ($autocomplete = $getAutocomplete()) ? "autocomplete=\\"{$autocomplete}\\"" : null !!}
    @if (!$isConcealed())
      {!! filled($length = $getMaxLength()) ? "maxlength=\\"{$length}\\"" : null !!}
      {!! filled($length = $getMinLength()) ? "minlength=\\"{$length}\\"" : null !!}
      {!! $isRequired() ? "required" : null !!}
    @endif
  ></textarea>
</form>
`;

    await formatEqual(input, expected, withPhp);
  });

  it("preserves explicitly multiline raw echoes", async () => {
    const input = `<textarea
{!!
$isDisabled() ? 'disabled' : null
!!}
></textarea>
`;
    const expected = `<textarea
  {!!
    $isDisabled()
      ? "disabled"
      : null
  !!}
></textarea>
`;

    await formatEqual(input, expected, withPhp);
  });

  it("expands source-inline raw echoes when the inline candidate is too long", async () => {
    const input = `<textarea
{!! dynamic_attribute($firstArgument, $secondArgument, $thirdArgument, $fourthArgument, $fifthArgument, $sixthArgument, $seventhArgument, $eighthArgument) !!}
></textarea>
`;
    const expected = `<textarea
  {!!
    dynamic_attribute(
      $firstArgument,
      $secondArgument,
      $thirdArgument,
      $fourthArgument,
      $fifthArgument,
      $sixthArgument,
      $seventhArgument,
      $eighthArgument,
    )
  !!}
></textarea>
`;

    await formatEqual(input, expected, withPhp);
  });
});
