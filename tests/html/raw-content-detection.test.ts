import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/raw-content-detection", () => {
  const phpSafe = { bladePhpFormatting: "safe" as const };

  it("keeps CSS embedding for known @media rules", async () => {
    const input = `<style>@media (max-width: 768px){.a{color:red}}</style>
`;

    const expected = `<style>
  @media (max-width: 768px) {
    .a {
      color: red;
    }
  }
</style>
`;

    await formatEqual(input, expected, phpSafe);
  });

  it("does not treat @click-style names as Blade in style content", async () => {
    const input = `<style>@click{color:red}</style>
`;

    const expected = `<style>
  @click {
    color: red;
  }
</style>
`;

    await formatEqual(input, expected, phpSafe);
  });

  it("formats style content when Blade directives are present", async () => {
    const input = `<style>@if($dark).a{color:red}@endif</style>
`;
    const expected = `<style>
  @if ($dark)
  .a {
    color: red;
  }
  @endif
</style>
`;

    await formatEqual(input, expected, phpSafe);
  });

  it("formats style content for trained custom directive pairs", async () => {
    const input = `<style>@disk($theme).a{color:red}@enddisk</style>
`;
    const expected = `<style>
  @disk ($theme)
  .a {
    color: red;
  }
  @enddisk
</style>
`;

    await formatEqual(input, expected, phpSafe);
  });
});
