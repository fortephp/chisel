import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/compound-elements", () => {
  it("preserves matching multipart element names", async () => {
    const input = `<my-{{ $element }}>hello</my-{{ $element }}>
`;
    const expected = `<my-{{ $element }}>hello</my-{{ $element }}>
`;
    await formatEqual(input, expected);
  });

  it("preserves differing multipart closing names", async () => {
    const input = `<my-{{ $element }}>hello</my-{{ $other }}>
`;
    const expected = `<my-{{ $element }}>hello</my-{{ $other }}>
`;
    await formatEqual(input, expected);
  });

  it("preserves fully dynamic multipart names", async () => {
    const input = `<{{ $prefix }}-{{ $suffix }}>hello</{{ $prefix }}-{{ $suffix }}>
`;
    const expected = `<{{ $prefix }}-{{ $suffix }}>hello</{{ $prefix }}-{{ $suffix }}>
`;
    await formatEqual(input, expected);
  });

  it("preserves generic component tags and jsx-style attributes", async () => {
    const input = `<Table<User> className={styles.root} {enabled}></Table>
`;
    const expected = `<Table<User> className={styles.root} {enabled}></Table>
`;
    await formatEqual(input, expected);
  });

  it("preserves colon-bracket dynamic slot syntax", async () => {
    const input = `<x-card><x-slot:[items]>Content</x-slot></x-card>
`;
    const expected = `<x-card
  ><x-slot:[items]>
    Content
  </x-slot:[items]></x-card
>
`;
    await formatEqual(input, expected);
  });

  it("preserves shorthand slot closing tags when configured", async () => {
    const input = `<x-card><x-slot:[items]>Content</x-slot></x-card>
`;
    const expected = `<x-card
  ><x-slot:[items]>
    Content
  </x-slot></x-card
>
`;
    await formatEqual(input, expected, {
      bladeSlotClosingTag: "preserve",
    });
  });

  it("preserves variadic-style slot names and repeated slots", async () => {
    const input = `<x-list><x-slot:items[]>One</x-slot><x-slot:items[]>Two</x-slot></x-list>
`;
    const expected = `<x-list
  ><x-slot:items[]>
    One
  </x-slot:items[]>
  <x-slot:items[]>
    Two
  </x-slot:items[]></x-list
>
`;
    await formatEqual(input, expected);
  });
});
