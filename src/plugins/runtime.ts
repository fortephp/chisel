import type { TreeDirectiveDefinition } from "../tree/directive-definitions.js";
import { SAGE_PLUGIN_NAME, sagePlugin } from "./sage/index.js";
import type { BladeSyntaxPlugin } from "./types.js";
import { statamicPlugin } from "./statamic.js";

export interface BladeSyntaxProfile {
  lexerDirectives: string[];
  treeDirectives: TreeDirectiveDefinition[];
  verbatimStartDirectives: string[];
  verbatimEndDirectives: string[];
}

const BUILTIN_BLADE_SYNTAX_PLUGINS = new Map<string, BladeSyntaxPlugin>([
  [SAGE_PLUGIN_NAME, sagePlugin],
  ["statamic", statamicPlugin],
]);
const resolvedBladeSyntaxPluginsCache = new WeakMap<object, BladeSyntaxPlugin[]>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isBladeSyntaxPlugin(value: unknown): value is BladeSyntaxPlugin {
  if (!isRecord(value)) return false;

  if (typeof value.name !== "string") return false;
  if (!isStringArray(value.lexerDirectives)) return false;
  if (!Array.isArray(value.treeDirectives)) return false;
  if (!isStringArray(value.verbatimStartDirectives)) return false;
  if (!isStringArray(value.verbatimEndDirectives)) return false;

  return true;
}

function normalizeDirectiveName(name: string): string {
  return name.trim().toLowerCase().replace(/^@/, "");
}

function parseBladeSyntaxPluginTokens(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];

  const out: unknown[] = [];
  for (const entry of value) {
    if (typeof entry === "string") {
      for (const token of entry.split(",")) {
        const trimmed = token.trim();
        if (trimmed) out.push(trimmed);
      }
      continue;
    }
    out.push(entry);
  }
  return out;
}

function resolveBladeSyntaxPluginEntry(value: unknown): BladeSyntaxPlugin | null {
  if (typeof value === "string") {
    return BUILTIN_BLADE_SYNTAX_PLUGINS.get(normalizeDirectiveName(value)) ?? null;
  }

  if (isBladeSyntaxPlugin(value)) {
    return value;
  }

  return null;
}

export function resolveBladeSyntaxProfile(options?: unknown): BladeSyntaxProfile {
  const resolvedPlugins = resolveBladeSyntaxPlugins(options);
  const lexerDirectives = new Set<string>();
  const verbatimStartDirectives = new Set<string>();
  const verbatimEndDirectives = new Set<string>();
  const treeDirectives: TreeDirectiveDefinition[] = [];

  for (const plugin of resolvedPlugins) {
    for (const directive of plugin.lexerDirectives) {
      const normalized = normalizeDirectiveName(directive);
      if (normalized) lexerDirectives.add(normalized);
    }
    for (const directive of plugin.verbatimStartDirectives) {
      const normalized = normalizeDirectiveName(directive);
      if (normalized) verbatimStartDirectives.add(normalized);
    }
    for (const directive of plugin.verbatimEndDirectives) {
      const normalized = normalizeDirectiveName(directive);
      if (normalized) verbatimEndDirectives.add(normalized);
    }
    for (const directive of plugin.treeDirectives) {
      treeDirectives.push(directive);
    }
  }

  return {
    lexerDirectives: [...lexerDirectives],
    treeDirectives,
    verbatimStartDirectives: [...verbatimStartDirectives],
    verbatimEndDirectives: [...verbatimEndDirectives],
  };
}

export function resolveBladeSyntaxPlugins(options?: unknown): BladeSyntaxPlugin[] {
  const optionRecord = isRecord(options) ? options : {};
  const cached = resolvedBladeSyntaxPluginsCache.get(optionRecord);
  if (cached) {
    return cached;
  }

  const rawPlugins = parseBladeSyntaxPluginTokens(optionRecord.bladeSyntaxPlugins);

  const seenPluginNames = new Set<string>();
  const resolvedPlugins: BladeSyntaxPlugin[] = [];

  for (const entry of rawPlugins) {
    const plugin = resolveBladeSyntaxPluginEntry(entry);
    if (!plugin) continue;

    const key = plugin.name.toLowerCase();
    if (seenPluginNames.has(key)) continue;
    seenPluginNames.add(key);
    resolvedPlugins.push(plugin);
  }

  resolvedBladeSyntaxPluginsCache.set(optionRecord, resolvedPlugins);
  return resolvedPlugins;
}
