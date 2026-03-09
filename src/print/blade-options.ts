import type { Options } from "prettier";
import { getCanonicalDirectiveName } from "../lexer/directives.js";

export type DirectiveCaseMode = "preserve" | "canonical" | "lower";
export type DirectiveArgSpacingMode = "preserve" | "none" | "space";
export type DirectiveBlockStyle = "preserve" | "inline-if-short" | "multiline";
export type BladeBlankLinesMode = "preserve" | "always";
export type EchoSpacingMode = "preserve" | "space" | "tight";
export type SlotClosingTagMode = "canonical" | "preserve";

const directiveCaseMapCache = new WeakMap<object, Map<string, string>>();
const inlineIntentElementsCache = new WeakMap<object, Set<string>>();
const bladeComponentPrefixesCache = new WeakMap<object, string[]>();

const DEFAULT_INLINE_INTENT_ELEMENTS = ["p", "svg", "svg:*"] as const;
const DEFAULT_BLADE_COMPONENT_PREFIXES = [
  "x",
  "s",
  "statamic",
  "flux",
  "livewire",
  "native",
] as const;

function normalizeDirectiveName(name: string): string {
  return name.startsWith("@") ? name.slice(1) : name;
}

function dedupStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    if (seen.has(item)) continue;
    seen.add(item);
    result.push(item);
  }
  return result;
}

function sanitizeDirectiveCaseValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return normalizeDirectiveName(trimmed);
}

function parseDirectiveCaseMapValue(value: unknown): Map<string, string> {
  const out = new Map<string, string>();

  if (!value) return out;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return out;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return parseDirectiveCaseMapValue(parsed);
    } catch {
      return out;
    }
  }

  if (typeof value !== "object") return out;

  for (const [rawKey, rawValue] of Object.entries(value as Record<string, unknown>)) {
    if (typeof rawValue !== "string") continue;
    const key = normalizeDirectiveName(rawKey).toLowerCase();
    const directiveName = sanitizeDirectiveCaseValue(rawValue);
    if (!key || !directiveName) continue;
    out.set(key, directiveName);
  }

  return out;
}

function parseLowercaseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .flatMap((item) => item.split(/[,\s]+/u).map((token) => token.trim().toLowerCase()))
    .filter(Boolean);

  return dedupStrings(normalized);
}

function expandBladeComponentPrefixToken(token: string): string[] {
  if (token.endsWith("-") || token.endsWith(":")) {
    return [token];
  }

  // Bare logical prefix (`x`) expands to both supported component tag forms.
  if (/^[a-z0-9_]+$/u.test(token)) {
    return [`${token}-`, `${token}:`];
  }

  return [token];
}

function normalizeBladeComponentPrefixes(tokens: string[]): string[] {
  return dedupStrings(tokens.flatMap(expandBladeComponentPrefixToken));
}

function getDirectiveCaseMap(options: Options): Map<string, string> {
  const key = options as unknown as object;
  const cached = directiveCaseMapCache.get(key);
  if (cached) return cached;

  const parsed = parseDirectiveCaseMapValue(
    (options as Record<string, unknown>).bladeDirectiveCaseMap,
  );
  directiveCaseMapCache.set(key, parsed);
  return parsed;
}

export function getDirectiveCaseMode(options: Options): DirectiveCaseMode {
  const value = (options as Record<string, unknown>).bladeDirectiveCase;
  return value === "canonical" || value === "lower" ? value : "preserve";
}

export function getDirectiveArgSpacingMode(options: Options): DirectiveArgSpacingMode {
  const value = (options as Record<string, unknown>).bladeDirectiveArgSpacing;
  if (value === "preserve" || value === "none" || value === "space") {
    return value;
  }
  return "space";
}

export function getDirectiveBlockStyle(options: Options): DirectiveBlockStyle {
  const value = (options as Record<string, unknown>).bladeDirectiveBlockStyle;
  if (value === "inline-if-short" || value === "multiline") return value;
  return "preserve";
}

export function getBladeBlankLinesMode(options: Options): BladeBlankLinesMode {
  const value = (options as Record<string, unknown>).bladeBlankLinesAroundDirectives;
  if (value === "always") return value;
  return "preserve";
}

export function getEchoSpacingMode(options: Options): EchoSpacingMode {
  const value = (options as Record<string, unknown>).bladeEchoSpacing;
  if (value === "space" || value === "tight") return value;
  return "preserve";
}

export function getSlotClosingTagMode(options: Options): SlotClosingTagMode {
  const value = (options as Record<string, unknown>).bladeSlotClosingTag;
  if (value === "preserve") return "preserve";
  return "canonical";
}

export function shouldInsertOptionalClosingTags(options: Options): boolean {
  const value = (options as Record<string, unknown>).bladeInsertOptionalClosingTags;
  return value === true;
}

export function shouldKeepHeadAndBodyAtRoot(options: Options): boolean {
  const value = (options as Record<string, unknown>).bladeKeepHeadAndBodyAtRoot;
  return value === true;
}

export function getInlineIntentElements(options: Options): Set<string> {
  const key = options as unknown as object;
  const cached = inlineIntentElementsCache.get(key);
  if (cached) return cached;

  const rawValue = (options as Record<string, unknown>).bladeInlineIntentElements;
  const parsed = parseLowercaseStringArray(rawValue);
  const values =
    rawValue === undefined || rawValue === null ? [...DEFAULT_INLINE_INTENT_ELEMENTS] : parsed;

  const result = new Set(values);
  inlineIntentElementsCache.set(key, result);
  return result;
}

export function shouldPreserveInlineIntentElement(
  options: Options,
  tagName: string,
  namespace = "",
): boolean {
  const normalizedTagName = tagName.toLowerCase();
  const normalizedNamespace = namespace.toLowerCase();
  const set = getInlineIntentElements(options);
  if (set.has(normalizedTagName)) {
    return true;
  }
  if (normalizedNamespace) {
    return set.has(`${normalizedNamespace}:${normalizedTagName}`);
  }
  return false;
}

export function shouldPreserveInlineIntentAttributes(
  options: Options,
  tagName: string,
  namespace = "",
): boolean {
  if (shouldPreserveInlineIntentElement(options, tagName, namespace)) {
    return true;
  }

  const normalizedTagName = tagName.toLowerCase();
  const normalizedNamespace = namespace.toLowerCase();
  if (!normalizedNamespace) {
    return false;
  }

  if (normalizedNamespace === "svg" && normalizedTagName === "foreignobject") {
    return false;
  }

  return shouldPreserveInlineIntentNamespace(options, normalizedNamespace);
}

export function shouldPreserveInlineIntentNamespace(options: Options, namespace: string): boolean {
  const normalizedNamespace = namespace.toLowerCase();
  return getInlineIntentElements(options).has(`${normalizedNamespace}:*`);
}

export function getBladeComponentPrefixes(options: Options): string[] {
  const key = options as unknown as object;
  const cached = bladeComponentPrefixesCache.get(key);
  if (cached) return cached;

  const rawValue = (options as Record<string, unknown>).bladeComponentPrefixes;
  const parsed = parseLowercaseStringArray(rawValue);
  const values = normalizeBladeComponentPrefixes(
    rawValue === undefined || rawValue === null ? [...DEFAULT_BLADE_COMPONENT_PREFIXES] : parsed,
  );

  bladeComponentPrefixesCache.set(key, values);
  return values;
}

export function formatDirectiveNameToken(rawDirectiveToken: string, options: Options): string {
  if (!rawDirectiveToken.startsWith("@")) {
    return rawDirectiveToken;
  }

  const name = rawDirectiveToken.slice(1);
  const lowerName = name.toLowerCase();
  const mode = getDirectiveCaseMode(options);

  if (mode === "preserve") {
    return rawDirectiveToken;
  }

  if (mode === "lower") {
    return `@${lowerName}`;
  }

  const map = getDirectiveCaseMap(options);
  const mapped = map.get(lowerName);
  if (mapped) {
    return `@${mapped}`;
  }

  const canonical = getCanonicalDirectiveName(name);
  if (!canonical) {
    return rawDirectiveToken;
  }

  return `@${canonical}`;
}
