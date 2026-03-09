import { describe, it, expect } from "vitest";
import {
  parse,
  rootChildren,
  indexOf,
  getAttributes,
  getAttributeName,
  getAttributeValue,
  renderDocument,
} from "./helpers.js";

describe("parser/compound-attributes-mixed-syntax", () => {
  it("parses boolean multipart attribute names with mixed constructs", () => {
    const source = "<div data-{{ $key }}-@if($on)on@endif-<?php echo $kind; ?>></div>";
    const r = parse(source);
    const elementIdx = indexOf(r, rootChildren(r)[0]);
    const attrs = getAttributes(r, elementIdx);

    expect(attrs).toHaveLength(1);
    expect(getAttributeName(r, attrs[0])).toBe(
      "data-{{ $key }}-@if($on)on@endif-<?php echo $kind; ?>",
    );
    expect(getAttributeValue(r, attrs[0])).toBeNull();
    expect(renderDocument(r)).toBe(source);
  });

  it("parses quoted mixed values with echo/directive/php", () => {
    const source = "<div data='prefix {{ $value }} @if($on)on@endif <?php echo $tail; ?>'></div>";
    const r = parse(source);
    const elementIdx = indexOf(r, rootChildren(r)[0]);
    const attrs = getAttributes(r, elementIdx);

    expect(attrs).toHaveLength(1);
    expect(getAttributeName(r, attrs[0])).toBe("data");
    expect(getAttributeValue(r, attrs[0])).toBe(
      "'prefix {{ $value }} @if($on)on@endif <?php echo $tail; ?>'",
    );
    expect(renderDocument(r)).toBe(source);
  });

  it("parses unquoted mixed values", () => {
    const source = "<div data={{ $value }}-suffix></div>";
    const r = parse(source);
    const elementIdx = indexOf(r, rootChildren(r)[0]);
    const attrs = getAttributes(r, elementIdx);

    expect(attrs).toHaveLength(1);
    expect(getAttributeName(r, attrs[0])).toBe("data");
    expect(getAttributeValue(r, attrs[0])).toBe("{{ $value }}-suffix");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses compound attribute names with consecutive echoes and php", () => {
    const source =
      '<div {{ $one }}{{ $two }}{{ $three}}-<?php echo "tail"; ?>="Things">compound attribute payload</div>';
    const r = parse(source);
    const elementIdx = indexOf(r, rootChildren(r)[0]);
    const attrs = getAttributes(r, elementIdx);

    expect(attrs).toHaveLength(1);
    expect(getAttributeName(r, attrs[0])).toBe(
      '{{ $one }}{{ $two }}{{ $three}}-<?php echo "tail"; ?>',
    );
    expect(getAttributeValue(r, attrs[0])).toBe('"Things"');
    expect(renderDocument(r)).toBe(source);
  });
});
