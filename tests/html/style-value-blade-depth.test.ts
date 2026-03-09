import { describe, expect, it } from "vitest";
import { format, wrapInDiv } from "../helpers.js";

const phpSafe = {
  bladePhpFormatting: "safe" as const,
  bladeDirectiveArgSpacing: "space" as const,
  singleQuote: true,
};

describe("html/style-value-blade-depth", () => {
  const fixture = `<style>
.thing {
  background-color: @foreach ($something as $somethingElse)
    {{ $thing}}
  @endforeach
}
</style>`;

  it("stays stable across nesting depths", async () => {
    for (let depth = 0; depth <= 8; depth++) {
      const output = await format(wrapInDiv(fixture, depth), phpSafe);

      expect(output).toContain("@foreach ($something as $somethingElse)");
      expect(output).toContain("@endforeach");
      expect(output).toContain("{{ $thing");
      expect(output).toContain("background-color:");
      expect(output).not.toContain("background-color:;");
      expect(output).not.toMatch(/@foreach \(\$something\s*\n\s*as \$somethingElse\)/u);
    }
  });
});
