import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/text", () => {
  it("keeps email addresses with dashed domains as inline text", async () => {
    const input = `<p>Contact test@example.com or test@exam-ple.com.</p>
`;
    const expected = `<p>Contact test@example.com or test@exam-ple.com.</p>
`;

    await formatEqual(input, expected);
  });
});
