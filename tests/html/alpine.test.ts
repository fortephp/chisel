import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("html/alpine", () => {
  it("formats multiline x-data object and alpine expressions", async () => {
    const input = `<div
    x-data="{
        search: '',
 
        items: ['foo', 'bar', 'baz'],
 
        get filteredItems() {
            return this.items.filter(
                i => i.startsWith(this.search)
            )
        }
    }"
>
    <input x-model="search" placeholder="Search...">
 
    <ul>
        <template x-for="item in filteredItems" :key="item">
            <li x-text="item"></li>
        </template>
    </ul>
</div>
`;

    const expected = `<div
  x-data="{
    search: '',

    items: ['foo', 'bar', 'baz'],

    get filteredItems() {
      return this.items.filter((i) => i.startsWith(this.search));
    },
  }"
>
  <input x-model="search" placeholder="Search..." />

  <ul>
    <template x-for="item in filteredItems" :key="item">
      <li x-text="item"></li>
    </template>
  </ul>
</div>
`;

    await formatEqual(input, expected);
  });

  it("formats alpine statement directives via statement parser", async () => {
    const input = `<button x-init="count = 0; setup()" x-on:click="count++; doThing(count)"></button>
`;

    const expected = `<button
  x-init="
    count = 0;
    setup();
  "
  x-on:click="
    count++;
    doThing(count);
  "
></button>
`;

    await formatEqual(input, expected);
  });

  it("keeps shorthand event attributes as attributes", async () => {
    const input = `<div class="relative max-lg:hidden" @mouseenter="openDocs()" @mouseleave="scheduleDocsClose()"></div>
`;

    const expected = `<div
  class="relative max-lg:hidden"
  @mouseenter="openDocs()"
  @mouseleave="scheduleDocsClose()"
></div>
`;

    await formatEqual(input, expected);
  });
});
