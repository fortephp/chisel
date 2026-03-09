import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/compound-attributes-formatting", () => {
  it("keeps mixed structured values verbatim", async () => {
    const input = `<div data='prefix {{ $x }} "quoted" suffix'></div>
`;
    const expected = `<div data='prefix {{ $x }} "quoted" suffix'></div>
`;
    await formatEqual(input, expected);
  });

  it("keeps pure construct unquoted values unquoted", async () => {
    const input = `<div data={{ $x }}></div>
`;
    const expected = `<div data={{ $x }}></div>
`;
    await formatEqual(input, expected);
  });

  it("still formats static class/style values", async () => {
    const input = `<div class="  foo   bar  " style="color: red;  display:inline"></div>
`;
    const expected = `<div class="foo bar" style="color: red; display: inline"></div>
`;
    await formatEqual(input, expected);
  });

  it("does not run static embed formatters on dynamic values", async () => {
    const input = `<div class="<?php echo $classes; ?>  foo   bar" style="{{ $styles }} color: red" onclick="<?php echo $x; ?>" x-data="<?php echo $data; ?>"></div>
`;
    const expected = `<div
  class="<?php echo $classes; ?>  foo   bar"
  style="{{ $styles }} color: red"
  onclick="<?php echo $x; ?>"
  x-data="<?php echo $data; ?>"
></div>
`;
    await formatEqual(input, expected);
  });

  it("preserves compound attribute names with mixed echo and php fragments", async () => {
    const input = `<div {{ $one }}{{ $two }}{{ $three}}-<?php echo "tail"; ?>="Things">compound attribute payload</div>
`;
    const expected = `<div {{ $one }}{{ $two }}{{ $three}}-<?php echo "tail"; ?>="Things">compound attribute payload</div>
`;
    await formatEqual(input, expected, { printWidth: 300 });
  });

  it("formats echo/directive internals in compound names when options request it", async () => {
    const input = `<div data-@IF($ok)-{{ $x}}-{{ $y }}-<?php echo 'z'; ?>="v"></div>
`;
    const expected = `<div data-@if ($ok)-{{ $x }}-{{ $y }}-<?php echo 'z'; ?>="v"></div>
`;
    await formatEqual(input, expected, {
      bladeDirectiveCase: "lower",
      bladeDirectiveArgSpacing: "space",
      bladeEchoSpacing: "space",
    });
  });

  it("preserves jsx expression attribute values without coercing to quoted strings", async () => {
    const input = `<Table<User> className={styles.root} data-id={record.id}></Table>
`;
    const expected = `<Table<User> className={styles.root} data-id={record.id}></Table>
`;
    await formatEqual(input, expected);
  });
});
