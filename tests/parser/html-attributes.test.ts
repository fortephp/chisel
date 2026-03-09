import { describe, it, expect } from "vitest";
import {
  parse,
  rootChildren,
  indexOf,
  renderDocument,
  getRawTagName,
  getAttributes,
  getAttributeName,
  getAttributeValue,
  isSelfClosing,
} from "./helpers.js";

describe("HTML Attributes", () => {
  it("parses static attribute", () => {
    const source = '<div class="mt-2"></div>';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    const elIdx = indexOf(r, nodes[0]);
    const attrs = getAttributes(r, elIdx);
    expect(attrs).toHaveLength(1);
    expect(getAttributeName(r, attrs[0])).toBe("class");
    expect(getAttributeValue(r, attrs[0])).toBe('"mt-2"');
    expect(renderDocument(r)).toBe(source);
  });

  it("parses bound attribute", () => {
    const source = '<div :class="{}"></div>';
    const r = parse(source);
    const elIdx = indexOf(r, rootChildren(r)[0]);
    const attrs = getAttributes(r, elIdx);
    expect(attrs).toHaveLength(1);
    expect(getAttributeName(r, attrs[0])).toBe(":class");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses escaped attribute", () => {
    const source = '<div ::escaped="thing"></div>';
    const r = parse(source);
    const elIdx = indexOf(r, rootChildren(r)[0]);
    const attrs = getAttributes(r, elIdx);
    expect(attrs).toHaveLength(1);
    expect(getAttributeName(r, attrs[0])).toBe("::escaped");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses boolean attribute", () => {
    const source = "<div data-attribute></div>";
    const r = parse(source);
    const elIdx = indexOf(r, rootChildren(r)[0]);
    const attrs = getAttributes(r, elIdx);
    expect(attrs).toHaveLength(1);
    expect(getAttributeName(r, attrs[0])).toBe("data-attribute");
    expect(getAttributeValue(r, attrs[0])).toBeNull();
    expect(renderDocument(r)).toBe(source);
  });

  it("renders static attributes correctly", () => {
    const source = '<div class="mt-2"></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("renders bound attributes correctly", () => {
    const source = '<div :class="{}"></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("preserves falsey attribute values", () => {
    const source = '<linearGradient x1="0"></linearGradient>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles multibyte characters in attribute values", () => {
    const source =
      '<input type="text" class="w-full border rounded px-3 py-2" placeholder="Search…">';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses boolean attributes without equals sign", () => {
    const source = "<input disabled required>";
    const r = parse(source);
    const elIdx = indexOf(r, rootChildren(r)[0]);
    const attrs = getAttributes(r, elIdx);
    expect(attrs).toHaveLength(2);
    expect(getAttributeName(r, attrs[0])).toBe("disabled");
    expect(getAttributeValue(r, attrs[0])).toBeNull();
    expect(getAttributeName(r, attrs[1])).toBe("required");
    expect(getAttributeValue(r, attrs[1])).toBeNull();
    expect(renderDocument(r)).toBe(source);
  });

  it("handles double quotes", () => {
    const source = '<div class="foo"></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles single quotes", () => {
    const source = "<div class='foo'></div>";
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles unquoted values", () => {
    const source = "<div class=foo></div>";
    const r = parse(source);
    const elIdx = indexOf(r, rootChildren(r)[0]);
    const attrs = getAttributes(r, elIdx);
    expect(attrs).toHaveLength(1);
    expect(getAttributeName(r, attrs[0])).toBe("class");
    expect(renderDocument(r)).toBe(source);
  });

  it("handles mixed quote styles", () => {
    const source = "<div class=\"double\" id='single' data=unquoted></div>";
    const r = parse(source);
    const elIdx = indexOf(r, rootChildren(r)[0]);
    const attrs = getAttributes(r, elIdx);
    expect(attrs).toHaveLength(3);
    expect(renderDocument(r)).toBe(source);
  });

  it("preserves unterminated quoted attribute when rendering", () => {
    const source = '<html lang="';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("preserves escaped brackets in attribute values", () => {
    const source = "<div onclick=\"handle('\\}')\">test</div>";
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses attribute with spaces before equals", () => {
    const source = '<div class   ="test"></div>';
    const r = parse(source);
    const elIdx = indexOf(r, rootChildren(r)[0]);
    const attrs = getAttributes(r, elIdx);
    expect(attrs).toHaveLength(1);
    expect(getAttributeName(r, attrs[0])).toBe("class");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses attribute with spaces after equals", () => {
    const source = '<div class=   "test"></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses attribute with spaces on both sides of equals", () => {
    const source = '<div class   =   "test"></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses multiple attributes", () => {
    const source = '<div class="test" id="main" data-value="123"></div>';
    const r = parse(source);
    const elIdx = indexOf(r, rootChildren(r)[0]);
    const attrs = getAttributes(r, elIdx);
    expect(attrs).toHaveLength(3);
    expect(getAttributeName(r, attrs[0])).toBe("class");
    expect(getAttributeName(r, attrs[1])).toBe("id");
    expect(getAttributeName(r, attrs[2])).toBe("data-value");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses attributes with hyphenated names", () => {
    const source = '<div data-test-id="123" aria-label="Test"></div>';
    const r = parse(source);
    const elIdx = indexOf(r, rootChildren(r)[0]);
    const attrs = getAttributes(r, elIdx);
    expect(attrs).toHaveLength(2);
    expect(getAttributeName(r, attrs[0])).toBe("data-test-id");
    expect(getAttributeName(r, attrs[1])).toBe("aria-label");
    expect(renderDocument(r)).toBe(source);
  });

  it("parses empty string attribute value", () => {
    const source = '<div class=""></div>';
    const r = parse(source);
    const elIdx = indexOf(r, rootChildren(r)[0]);
    const attrs = getAttributes(r, elIdx);
    expect(attrs).toHaveLength(1);
    expect(getAttributeValue(r, attrs[0])).toBe('""');
    expect(renderDocument(r)).toBe(source);
  });

  it("parses mixed boolean and valued attributes", () => {
    const source = '<input type="text" required disabled name="test">';
    const r = parse(source);
    const elIdx = indexOf(r, rootChildren(r)[0]);
    const attrs = getAttributes(r, elIdx);
    expect(attrs).toHaveLength(4);
    expect(getAttributeName(r, attrs[0])).toBe("type");
    expect(getAttributeValue(r, attrs[0])).not.toBeNull();
    expect(getAttributeName(r, attrs[1])).toBe("required");
    expect(getAttributeValue(r, attrs[1])).toBeNull();
    expect(getAttributeName(r, attrs[2])).toBe("disabled");
    expect(getAttributeValue(r, attrs[2])).toBeNull();
    expect(getAttributeName(r, attrs[3])).toBe("name");
    expect(getAttributeValue(r, attrs[3])).not.toBeNull();
    expect(renderDocument(r)).toBe(source);
  });

  it("parses attributes with special characters in values", () => {
    const source = '<div data-test="test-value_123" class="foo bar baz"></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses attributes with numeric value", () => {
    const source = '<div tabindex="0" data-count="42"></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });
});

describe("HTML Attributes - Self-Closing Tags", () => {
  it("parses self-closing tags with attributes", () => {
    const source = '<input type="text" value="test" />';
    const r = parse(source);
    const nodes = rootChildren(r);

    expect(nodes).toHaveLength(1);
    expect(isSelfClosing(nodes[0])).toBe(true);

    const elIdx = indexOf(r, nodes[0]);
    const attrs = getAttributes(r, elIdx);
    expect(attrs).toHaveLength(2);
    expect(getAttributeName(r, attrs[0])).toBe("type");
    expect(getAttributeName(r, attrs[1])).toBe("value");
    expect(renderDocument(r)).toBe(source);
  });

  it("explicit self-closing /> with spaces before closing tokens", () => {
    const source = '<input type="text"  />';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
    expect(isSelfClosing(rootChildren(r)[0])).toBe(true);
  });

  it("handles self-closing elements with whitespace", () => {
    const source = "<br   />";
    const r = parse(source);
    expect(isSelfClosing(rootChildren(r)[0])).toBe(true);
    expect(renderDocument(r)).toBe(source);
  });

  it("handles element with no attributes", () => {
    const source = "<div></div>";
    const r = parse(source);
    const elIdx = indexOf(r, rootChildren(r)[0]);
    const attrs = getAttributes(r, elIdx);
    expect(attrs).toHaveLength(0);
    expect(renderDocument(r)).toBe(source);
  });
});

describe("HTML Attributes - Whitespace Preservation", () => {
  it("preserves whitespace around attributes in rendering", () => {
    const source = '<div   class="foo"   id="bar"></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("preserves newlines in attribute whitespace", () => {
    const source = '<div\n    class="foo"\n    id="bar"\n>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("preserves mixed whitespace (tabs and spaces)", () => {
    const source = '<div\t  class="foo"\t\t>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("preserves trailing whitespace before >", () => {
    const source = '<div class="foo"   >';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("preserves single space when > is missing", () => {
    const source = '<div class="card" data-id="{{ $id }}" @if($active) ';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("preserves mixed whitespace when > is missing", () => {
    const source = '<div id="x" data-a="1"\t  \n';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });
});

describe("HTML Attributes - Interpolated Names", () => {
  it("parses interpolated attribute name with echo", () => {
    const source = '<div data-{{ $value }}="value"></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses interpolated attribute name with multiple parts", () => {
    const source = '<div data-{{ $value }}-thing="{{ $thing }}"></div>';
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses unquoted attribute with echo value", () => {
    const source = "<div data={{ $thing }}></div>";
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses composite echo attribute", () => {
    const source = "<div {{ $thing }}={{ $anotherThing }}></div>";
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses complex interpolated attributes with values", () => {
    const source = `<div
    {{ $thing }}-{{ $thing }}-@something('here')-attribute="value"
>
    <p>Inner content.</p>
</div>`;
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses complex interpolated attributes without values", () => {
    const source = `<div
    {{ $thing }}-{{ $thing }}-@something('here')-attribute
>
    <p>Inner content.</p>
</div>`;
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses complex interpolated with known directive", () => {
    const source = "<div {{ $thing }}-{{ $thing }}-@if(true==true)thing-here-@endif></div>";
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("preserves safe separators in interpolated attribute names", () => {
    const source = `<div {{ $a }}-_.{{ $b }}>
</div>`;
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });
});

describe("HTML Attributes - PHP Tags", () => {
  it("parses html attributes with php tags", () => {
    const source = `<div
    data-<?php echo 'thing'; ?>more="that"
>
    <p>Inner content.</p>
</div>`;
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });

  it("parses html attributes with php echo tag", () => {
    const source = `<div
    data-<?= $thing ?>more="that"
>
    <p>Inner content.</p>
</div>`;
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });
});

describe("HTML Attributes - All Types Combined", () => {
  it("parses all attribute types in one element", () => {
    const source = `<div
    class="mt-2"
    :class="{}"
    :$bound
    :dynamic="var"
    ::escaped="thing"
    data-attribute
    {{ $nameText }}
    data-{{ $value }}="value"
    data-{{ $value }}-thing="{{ $thing }}"
    data={{ $thing }}
    {{ $thing }}={{ $anotherThing }}
>
    <p>Inner content.</p>
</div>`;
    const r = parse(source);
    expect(renderDocument(r)).toBe(source);
  });
});

describe("HTML Attributes - JSX/TSX Integration", () => {
  it("parses generic component tags with jsx-style attributes", () => {
    const source = "<Table<User> className={styles.root} {enabled}></Table>";
    const r = parse(source);
    const elIdx = indexOf(r, rootChildren(r)[0]);
    const attrs = getAttributes(r, elIdx);

    expect(getRawTagName(r, elIdx)).toBe("Table");
    expect(attrs).toHaveLength(2);
    expect(getAttributeName(r, attrs[0])).toBe("className");
    expect(getAttributeValue(r, attrs[0])).toBe("{styles.root}");
    expect(renderDocument(r)).toBe(source);
  });
});
