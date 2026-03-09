import { describe, expect, it } from "vitest";
import bladePlugin from "../../src/index.js";
import * as phpPlugin from "@prettier/plugin-php";
import { format } from "../helpers.js";

const withPhp = {
  plugins: [bladePlugin, phpPlugin],
  bladePhpFormatting: "safe" as const,
  singleQuote: true,
};

describe("php/target-plugin-usage", () => {
  it("uses php plugin for directive args target", async () => {
    const input = '@blaze("a"."b")\n';

    const withPlugin = await format(input, {
      ...withPhp,
      bladePhpFormattingTargets: ["directiveArgs"],
    });
    const withoutTarget = await format(input, {
      ...withPhp,
      bladePhpFormattingTargets: [],
    });

    expect(withPlugin).toContain("@blaze ('a' . 'b')");
    expect(withoutTarget).toBe('@blaze ("a"."b")\n');
  });

  it("uses php plugin for echo/interpolation target", async () => {
    const input = '{{"a"."b"}}\n';

    const withPlugin = await format(input, {
      ...withPhp,
      bladePhpFormattingTargets: ["echo"],
    });
    const withoutTarget = await format(input, {
      ...withPhp,
      bladePhpFormattingTargets: [],
    });

    expect(withPlugin).toBe("{{ 'a' . 'b' }}\n");
    expect(withoutTarget).toBe(input);
  });

  it("uses php plugin for @php/@endphp block target", async () => {
    const input = '@php\n$x="a".$b;\n@endphp\n';

    const withPlugin = await format(input, {
      ...withPhp,
      bladePhpFormattingTargets: ["phpBlock"],
    });
    const withoutTarget = await format(input, {
      ...withPhp,
      bladePhpFormattingTargets: [],
    });

    expect(withPlugin).toContain("$x = 'a' . $b;");
    expect(withoutTarget).toBe(input);
  });

  it("uses php plugin for <?php ?> tag target", async () => {
    const input = '<?php $x="a".$b;?>\n';

    const withPlugin = await format(input, {
      ...withPhp,
      bladePhpFormattingTargets: ["phpTag"],
    });
    const withoutTarget = await format(input, {
      ...withPhp,
      bladePhpFormattingTargets: [],
    });

    expect(withPlugin).toContain("$x = 'a' . $b;");
    expect(withPlugin).toContain("<?php ");
    expect(withoutTarget).toBe(input);
  });
});
