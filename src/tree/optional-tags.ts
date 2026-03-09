/**
 * HTML5 optional closing tag rules.
 *
 * Rules define when an element's closing tag can be omitted:
 * - `autoCloseWhenSibling`: sibling element names that trigger auto-close
 * - `autoCloseAtParentEnd`: parent elements where this closes at parent's end
 *
 * @see https://html.spec.whatwg.org/multipage/syntax.html#optional-tags
 */

interface ClosingConditions {
  autoCloseWhenSibling?: readonly string[];
  autoCloseAtParentEnd?: readonly string[];
}

const RULES: Readonly<Record<string, ClosingConditions>> = {
  li: {
    autoCloseWhenSibling: ["li"],
    autoCloseAtParentEnd: ["ul", "ol", "menu"],
  },
  dt: {
    autoCloseWhenSibling: ["dt", "dd"],
    autoCloseAtParentEnd: ["dl"],
  },
  dd: {
    autoCloseWhenSibling: ["dt", "dd"],
    autoCloseAtParentEnd: ["dl"],
  },
  p: {
    autoCloseWhenSibling: [
      "address",
      "article",
      "aside",
      "blockquote",
      "div",
      "dl",
      "fieldset",
      "footer",
      "form",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "header",
      "hr",
      "main",
      "nav",
      "ol",
      "p",
      "pre",
      "section",
      "table",
      "ul",
    ],
  },
  option: {
    autoCloseWhenSibling: ["option", "optgroup"],
    autoCloseAtParentEnd: ["select", "datalist", "optgroup"],
  },
  optgroup: {
    autoCloseWhenSibling: ["optgroup"],
    autoCloseAtParentEnd: ["select"],
  },
  rt: {
    autoCloseWhenSibling: ["rt", "rp"],
    autoCloseAtParentEnd: ["ruby", "rtc"],
  },
  rp: {
    autoCloseWhenSibling: ["rt", "rp"],
    autoCloseAtParentEnd: ["ruby", "rtc"],
  },
  rb: {
    autoCloseWhenSibling: ["rb", "rt", "rp", "rtc"],
    autoCloseAtParentEnd: ["ruby"],
  },
  caption: {
    autoCloseWhenSibling: ["colgroup", "thead", "tbody", "tfoot", "tr"],
    autoCloseAtParentEnd: ["table"],
  },
  colgroup: {
    autoCloseWhenSibling: ["colgroup", "thead", "tbody", "tfoot", "tr"],
    autoCloseAtParentEnd: ["table"],
  },
  thead: {
    autoCloseWhenSibling: ["tbody", "tfoot"],
    autoCloseAtParentEnd: ["table"],
  },
  tbody: {
    autoCloseWhenSibling: ["tbody", "tfoot"],
    autoCloseAtParentEnd: ["table"],
  },
  tfoot: {
    autoCloseAtParentEnd: ["table"],
  },
  tr: {
    autoCloseWhenSibling: ["tr"],
    autoCloseAtParentEnd: ["table", "thead", "tbody", "tfoot"],
  },
  td: {
    autoCloseWhenSibling: ["td", "th"],
    autoCloseAtParentEnd: ["tr"],
  },
  th: {
    autoCloseWhenSibling: ["td", "th"],
    autoCloseAtParentEnd: ["tr"],
  },
};

export function canOmitClosingTag(element: string): boolean {
  return element in RULES;
}

export function getClosingConditions(element: string): ClosingConditions | null {
  return RULES[element] ?? null;
}

export function shouldAutoCloseOnSibling(element: string, sibling: string): boolean {
  const rules = RULES[element];
  if (!rules?.autoCloseWhenSibling) return false;
  return rules.autoCloseWhenSibling.includes(sibling);
}

export function shouldAutoCloseAtParentEnd(element: string, parent: string | null): boolean {
  const rules = RULES[element];
  if (!rules?.autoCloseAtParentEnd || parent === null) return false;
  return rules.autoCloseAtParentEnd.includes(parent);
}

/**
 * Check if an element is in a valid parent context for optional tag rules.
 */
export function isInValidParentContext(element: string, parent: string | null): boolean {
  const conditions = RULES[element];
  if (!conditions) return false;

  const hasParentRules = conditions.autoCloseAtParentEnd !== undefined;
  const hasSiblingRules = conditions.autoCloseWhenSibling !== undefined;

  if (parent === element || parent === null) {
    if (hasParentRules || parent === element) return false;
  }

  if (hasParentRules) {
    return conditions.autoCloseAtParentEnd!.includes(parent!);
  }

  if (hasSiblingRules) {
    // For sibling-triggered optional closures (notably <p>), allow root-level
    // context so block siblings can auto-close the current element.
    return true;
  }

  return false;
}

/**
 * Check if an element should auto-close in the current context.
 */
export function shouldAutoCloseElement(
  element: string,
  nextElement: string | null,
  parent: string | null,
  atParentEnd: boolean,
): boolean {
  if (!canOmitClosingTag(element)) return false;

  if (nextElement !== null && shouldAutoCloseOnSibling(element, nextElement)) {
    return true;
  }

  if (atParentEnd && shouldAutoCloseAtParentEnd(element, parent)) {
    return true;
  }

  return false;
}
