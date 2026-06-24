import { isAsciiAlnum } from "../lexer/scan-primitives.js";

// Standard CSS at-rules plus framework/preprocessor rules that should not be
// stolen by Blade directive detection inside style content.
export const CSS_AT_RULE_NAMES: ReadonlySet<string> = new Set([
  "charset",
  "import",
  "namespace",
  "media",
  "supports",
  "layer",
  "container",
  "scope",
  "font-face",
  "font-feature-values",
  "font-palette-values",
  "property",
  "counter-style",
  "keyframes",
  "-webkit-keyframes",
  "-moz-keyframes",
  "-o-keyframes",
  "page",
  "starting-style",
  "view-transition",
  "document",
  "custom-media",
  "tailwind",
  "apply",
  "screen",
  "responsive",
  "variants",
  "utility",
  "theme",
  "plugin",
  "config",
  "use",
  "forward",
  "mixin",
  "include",
  "function",
  "return",
  "if",
  "else",
  "for",
  "each",
  "while",
  "at-root",
  "extend",
  "debug",
  "warn",
  "error",
]);

export function extractStyleAtRuleNameAt(source: string, pos: number): string | null {
  if (pos < 0 || pos >= source.length || source[pos] !== "@") return null;

  let i = pos + 1;
  const start = i;
  while (i < source.length) {
    const code = source.charCodeAt(i);
    if (!isAsciiAlnum(code) && code !== 45 && code !== 95) break;
    i++;
  }

  if (i === start) return null;
  return source.slice(start, i).toLowerCase();
}

export function isKnownStyleAtRuleName(name: string): boolean {
  return CSS_AT_RULE_NAMES.has(name.toLowerCase());
}
