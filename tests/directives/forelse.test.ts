import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("@forelse formatting", () => {
  it("basic forelse with @empty branch", async () => {
    const input = [
      "@forelse($items as $item)",
      "<p>{{ $item }}</p>",
      "@empty",
      "<p>No items</p>",
      "@endforelse",
    ].join("\n");

    const expected = [
      "@forelse ($items as $item)",
      "  <p>{{ $item }}</p>",
      "@empty",
      "  <p>No items</p>",
      "@endforelse",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("forelse without @empty branch", async () => {
    const input = "@forelse($items as $item) {{ $item }} @endforelse";

    const expected = "@forelse ($items as $item) {{ $item }} @endforelse\n";

    await formatEqual(input, expected);
  });

  it("nested inside @if", async () => {
    const input = [
      "@if(true)",
      "@forelse($items as $item)",
      "<li>{{ $item }}</li>",
      "@empty",
      "<li>None</li>",
      "@endforelse",
      "@endif",
    ].join("\n");

    const expected = [
      "@if (true)",
      "  @forelse ($items as $item)",
      "    <li>{{ $item }}</li>",
      "  @empty",
      "    <li>None</li>",
      "  @endforelse",
      "@endif",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("inside HTML element", async () => {
    const input = [
      "<ul>",
      "@forelse($items as $item)",
      "<li>{{ $item->name }}</li>",
      "@empty",
      "<li>No items found.</li>",
      "@endforelse",
      "</ul>",
    ].join("\n");

    const expected = [
      "<ul>",
      "  @forelse ($items as $item)",
      "    <li>{{ $item->name }}</li>",
      "  @empty",
      "    <li>No items found.</li>",
      "  @endforelse",
      "</ul>",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });
});
