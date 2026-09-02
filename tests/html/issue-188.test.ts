import { describe, expect, it } from "vitest";
import { formatEqual, formatWithPasses, wrapInDiv } from "../helpers.js";

const REPORTED_INPUT = `@push('js')
    <script type="text/javascript">
        Alpine.data('Form', () =>
            window.AlpineComponents.Form({
                formRequest: {!! \\App\\Http\\Requests\\Manager\\CouponRequest::extractJson() !!},

                data: @formAttributesJs([
                    'quantity_limited',
                    'time_limited',
                ]),
            })
        );
    </script>
@endpush
`;

const LEFT_ALIGNED_INPUT = `@push('js')
<script type="text/javascript">
Alpine.data('Form', () =>
window.AlpineComponents.Form({
data: @formAttributesJs([
'quantity_limited',
'time_limited',
]),
})
);
</script>
@endpush
`;

function findLine(output: string, content: string): string {
  const line = output.split("\n").find((candidate) => candidate.trimStart().startsWith(content));
  expect(line, `missing line starting with ${content}`).toBeDefined();
  return line!;
}

function getIndent(line: string): string {
  return line.match(/^[\t ]*/u)?.[0] ?? "";
}

describe("html/issue-188", () => {
  it("keeps multiline custom directive arguments aligned in JavaScript", async () => {
    const expected = `@push ('js')
    <script type="text/javascript">
        Alpine.data("Form", () =>
            window.AlpineComponents.Form({
                formRequest: {!! \\App\\Http\\Requests\\Manager\\CouponRequest::extractJson() !!},

                data: @formAttributesJs ([
                    'quantity_limited',
                    'time_limited',
                ]),
            }),
        );
    </script>
@endpush
`;

    await formatEqual(REPORTED_INPUT, expected, { tabWidth: 4 });
  });

  it("formats fully left-aligned input into a readable structure", async () => {
    const expected = `@push ('js')
  <script type="text/javascript">
    Alpine.data("Form", () =>
      window.AlpineComponents.Form({
        data: @formAttributesJs ([
          'quantity_limited',
          'time_limited',
        ]),
      }),
    );
  </script>
@endpush
`;

    await formatEqual(LEFT_ALIGNED_INPUT, expected);
  });

  it.each([
    ["2 spaces", { useTabs: false, tabWidth: 2 }, "  "],
    ["4 spaces", { useTabs: false, tabWidth: 4 }, "    "],
    ["tabs", { useTabs: true, tabWidth: 2 }, "\t"],
  ] as const)("stays aligned across wrapper depths with %s", async (_name, options, indentUnit) => {
    let previousDataIndent: string | null = null;

    for (let depth = 0; depth <= 3; depth++) {
      const output = await formatWithPasses(wrapInDiv(LEFT_ALIGNED_INPUT, depth), options, {
        passes: 4,
      });
      const dataIndent = getIndent(findLine(output, "data: @formAttributesJs"));
      const itemIndent = getIndent(findLine(output, "'quantity_limited'"));
      const closeIndent = getIndent(findLine(output, "]),"));

      expect(itemIndent, `array item indentation at depth ${depth}`).toBe(
        `${dataIndent}${indentUnit}`,
      );
      expect(closeIndent, `array closer indentation at depth ${depth}`).toBe(dataIndent);

      if (previousDataIndent !== null) {
        expect(dataIndent, `wrapper indentation at depth ${depth}`).toBe(
          `${indentUnit}${previousDataIndent}`,
        );
      }
      previousDataIndent = dataIndent;
    }
  });
});
