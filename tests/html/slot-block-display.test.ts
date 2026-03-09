import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/slot-block-display", () => {
  it("keeps multiline slot content indented within the slot", async () => {
    const input = `<x-card><x-slot:title><p>One</p><p>Two</p></x-slot></x-card>
`;
    const expected = `<x-card
  ><x-slot:title>
    <p>One</p>
    <p>Two</p>
  </x-slot:title></x-card
>
`;
    await formatEqual(input, expected);
  });
});
