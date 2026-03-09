/**
 * Pragma detection and insertion for Blade templates.
 *
 * Supports both HTML comments and Blade comments:
 *   <!-- @format -->  or  {{-- @format --}}
 *   <!-- @prettier --> or  {{-- @prettier --}}
 */

const HTML_PRAGMA_RE = /^\s*<!--\s*@(?:format|prettier)\s*-->/;

const BLADE_PRAGMA_RE = /^\s*\{\{--\s*@(?:format|prettier)\s*--\}\}/;

export function hasPragma(text: string): boolean {
  return HTML_PRAGMA_RE.test(text) || BLADE_PRAGMA_RE.test(text);
}

export function insertPragma(text: string): string {
  return `<!-- @format -->\n\n${text}`;
}
