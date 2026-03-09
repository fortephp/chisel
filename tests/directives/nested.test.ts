import { describe, it } from "vitest";
import { formatEqual } from "../helpers.js";

describe("nested directive formatting", () => {
  it("@if inside @foreach", async () => {
    const input = [
      "@foreach($items as $item)",
      "@if($item->active)",
      "<p>{{ $item->name }}</p>",
      "@endif",
      "@endforeach",
    ].join("\n");

    const expected = [
      "@foreach ($items as $item)",
      "  @if ($item->active)",
      "    <p>{{ $item->name }}</p>",
      "  @endif",
      "@endforeach",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("@if/@else inside @foreach", async () => {
    const input = [
      "@foreach($items as $item)",
      "@if($item->active)",
      "<span>Active</span>",
      "@else",
      "<span>Inactive</span>",
      "@endif",
      "@endforeach",
    ].join("\n");

    const expected = [
      "@foreach ($items as $item)",
      "  @if ($item->active)",
      "    <span>Active</span>",
      "  @else",
      "    <span>Inactive</span>",
      "  @endif",
      "@endforeach",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("@foreach inside @if with HTML element", async () => {
    const input = [
      "@if($hasItems)",
      "<ul>",
      "@foreach($items as $item)",
      "<li>{{ $item }}</li>",
      "@endforeach",
      "</ul>",
      "@endif",
    ].join("\n");

    const expected = [
      "@if ($hasItems)",
      "  <ul>",
      "    @foreach ($items as $item)",
      "      <li>{{ $item }}</li>",
      "    @endforeach",
      "  </ul>",
      "@endif",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("triple nesting: @if > @foreach > @if", async () => {
    const input = [
      "@if($show)",
      "@foreach($items as $item)",
      "@if($item->visible)",
      "<p>{{ $item->name }}</p>",
      "@endif",
      "@endforeach",
      "@endif",
    ].join("\n");

    const expected = [
      "@if ($show)",
      "  @foreach ($items as $item)",
      "    @if ($item->visible)",
      "      <p>{{ $item->name }}</p>",
      "    @endif",
      "  @endforeach",
      "@endif",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("@forelse inside @if/@else", async () => {
    const input = [
      "@if($useList)",
      "@forelse($items as $item)",
      "<li>{{ $item }}</li>",
      "@empty",
      "<li>None</li>",
      "@endforelse",
      "@else",
      "<p>No list</p>",
      "@endif",
    ].join("\n");

    const expected = [
      "@if ($useList)",
      "  @forelse ($items as $item)",
      "    <li>{{ $item }}</li>",
      "  @empty",
      "    <li>None</li>",
      "  @endforelse",
      "@else",
      "  <p>No list</p>",
      "@endif",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("@switch with cases preserves body content", async () => {
    const input = [
      "@switch($type)",
      "@case('a')",
      "<p>Type A</p>",
      "@break",
      "@case('b')",
      "<p>Type B</p>",
      "@break",
      "@default",
      "<p>Unknown</p>",
      "@endswitch",
    ].join("\n");

    const expected = [
      "@switch ($type)",
      "  @case ('a')",
      "    <p>Type A</p>",
      "    @break",
      "  @case ('b')",
      "    <p>Type B</p>",
      "    @break",
      "  @default",
      "    <p>Unknown</p>",
      "@endswitch",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("@foreach inside HTML div inside @if", async () => {
    const input = [
      "@if($show)",
      '<div class="list">',
      "@foreach($items as $item)",
      "<span>{{ $item }}</span>",
      "@endforeach",
      "</div>",
      "@endif",
    ].join("\n");

    const expected = [
      "@if ($show)",
      '  <div class="list">',
      "    @foreach ($items as $item)",
      "      <span>{{ $item }}</span>",
      "    @endforeach",
      "  </div>",
      "@endif",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("@auth with @can nested", async () => {
    const input = [
      "@auth",
      "@can('edit', $post)",
      "<button>Edit</button>",
      "@endcan",
      "@endauth",
    ].join("\n");

    const expected = [
      "@auth",
      "  @can ('edit', $post)",
      "    <button>Edit</button>",
      "  @endcan",
      "@endauth",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("@unless with @foreach", async () => {
    const input = [
      "@unless($hidden)",
      "@foreach($items as $item)",
      "<p>{{ $item }}</p>",
      "@endforeach",
      "@endunless",
    ].join("\n");

    const expected = [
      "@unless ($hidden)",
      "  @foreach ($items as $item)",
      "    <p>{{ $item }}</p>",
      "  @endforeach",
      "@endunless",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("@if/@elseif/@else multi-branch", async () => {
    const input = [
      "@if($status === 'active')",
      '<span class="green">Active</span>',
      "@elseif($status === 'pending')",
      '<span class="yellow">Pending</span>',
      "@else",
      '<span class="red">Inactive</span>',
      "@endif",
    ].join("\n");

    const expected = [
      "@if ($status === 'active')",
      '  <span class="green">Active</span>',
      "@elseif ($status === 'pending')",
      '  <span class="yellow">Pending</span>',
      "@else",
      '  <span class="red">Inactive</span>',
      "@endif",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("@push inside @foreach", async () => {
    const input = [
      "@foreach($items as $item)",
      "@push('scripts')",
      '<script src="{{ $item->script }}"></script>',
      "@endpush",
      "@endforeach",
    ].join("\n");

    const expected = [
      "@foreach ($items as $item)",
      "  @push ('scripts')",
      '    <script src="{{ $item->script }}"></script>',
      "  @endpush",
      "@endforeach",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });

  it("@section with @foreach", async () => {
    const input = [
      "@section('content')",
      "<div>",
      "@foreach($items as $item)",
      "<p>{{ $item }}</p>",
      "@endforeach",
      "</div>",
      "@endsection",
    ].join("\n");

    const expected = [
      "@section ('content')",
      "  <div>",
      "    @foreach ($items as $item)",
      "      <p>{{ $item }}</p>",
      "    @endforeach",
      "  </div>",
      "@endsection",
      "",
    ].join("\n");

    await formatEqual(input, expected);
  });
});
