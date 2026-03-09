const HTML_WS_BOTH = /^[\t\n\f\r ]+|[\t\n\f\r ]+$/g;
const HTML_WS_START = /^[\t\n\f\r ]+/;
const HTML_WS_END = /[\t\n\f\r ]+$/;
const HTML_WS_CHAR = /[\t\n\f\r ]/;

export function htmlTrim(s: string): string {
  return s.replace(HTML_WS_BOTH, "");
}

export function htmlTrimStart(s: string): string {
  return s.replace(HTML_WS_START, "");
}

export function htmlTrimEnd(s: string): string {
  return s.replace(HTML_WS_END, "");
}

export function hasHtmlWhitespaceCharacter(s: string): boolean {
  return HTML_WS_CHAR.test(s);
}
