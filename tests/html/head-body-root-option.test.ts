import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/head-body-root-option", () => {
  it("keeps existing indentation by default", async () => {
    const input = `<!doctype html>
<html>
<head></head>
<body></body>
</html>
`;

    const expected = `<!doctype html>
<html>
  <head></head>
  <body></body>
</html>
`;

    await formatEqual(input, expected);
  });

  it("keeps head and body flush at root when enabled", async () => {
    const input = `<!doctype html>
<html>
<head>
<title>Hi</title>
</head>
<body>
<main><p>Hello</p></main>
</body>
</html>
`;

    const expected = `<!doctype html>
<html>
<head>
  <title>Hi</title>
</head>
<body>
  <main><p>Hello</p></main>
</body>
</html>
`;

    await formatEqual(input, expected, {
      bladeKeepHeadAndBodyAtRoot: true,
    });
  });

  it("does not apply to non-canonical direct html children", async () => {
    const input = `<html><main><p>Hello</p></main></html>
`;

    const expected = `<html>
  <main><p>Hello</p></main>
</html>
`;

    await formatEqual(input, expected, {
      bladeKeepHeadAndBodyAtRoot: true,
    });
  });
});
