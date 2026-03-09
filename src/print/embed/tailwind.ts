import type { Options } from "prettier";
import { safeSerialize } from "../../string-utils.js";

type TailwindHtmlParser = {
  parse: (text: string, options: Options) => Promise<unknown> | unknown;
};

const MAX_CLASS_SORT_CACHE_SIZE = 500;
const parserIds = new WeakMap<object, number>();
const classSortCache = new Map<string, string>();
let nextParserId = 1;
let importedTailwindParserPromise: Promise<TailwindHtmlParser | null> | null = null;

function getPlugins(options: Options): unknown[] {
  const plugins = (options as Record<string, unknown>).plugins;
  return Array.isArray(plugins) ? plugins : [];
}

function hasTailwindOptionShape(plugin: Record<string, unknown>): boolean {
  const options = plugin.options;
  if (!options || typeof options !== "object") return false;

  const optionRecord = options as Record<string, unknown>;
  return (
    "tailwindConfig" in optionRecord ||
    "tailwindStylesheet" in optionRecord ||
    "tailwindAttributes" in optionRecord ||
    "tailwindFunctions" in optionRecord
  );
}

function getHtmlParserFromPlugin(plugin: Record<string, unknown>): TailwindHtmlParser | null {
  const parsers = plugin.parsers;
  if (!parsers || typeof parsers !== "object") return null;

  const htmlParser = (parsers as Record<string, unknown>).html;
  if (!htmlParser || typeof htmlParser !== "object") return null;

  return typeof (htmlParser as { parse?: unknown }).parse === "function"
    ? (htmlParser as TailwindHtmlParser)
    : null;
}

function isTailwindPlugin(plugin: Record<string, unknown>): boolean {
  return plugin.name === "prettier-plugin-tailwindcss" || hasTailwindOptionShape(plugin);
}

function findTailwindParserInLoadedPlugins(options: Options): TailwindHtmlParser | null {
  for (const plugin of getPlugins(options)) {
    if (!plugin || typeof plugin !== "object") continue;

    const pluginRecord = plugin as Record<string, unknown>;
    if (!isTailwindPlugin(pluginRecord)) continue;

    const htmlParser = getHtmlParserFromPlugin(pluginRecord);
    if (htmlParser) return htmlParser;
  }

  return null;
}

function hasTailwindPluginReference(options: Options): boolean {
  for (const plugin of getPlugins(options)) {
    if (typeof plugin === "string") {
      if (plugin.includes("prettier-plugin-tailwindcss")) {
        return true;
      }
      continue;
    }

    if (plugin instanceof URL) {
      if (plugin.href.includes("prettier-plugin-tailwindcss")) {
        return true;
      }
    }
  }

  return false;
}

async function loadTailwindParserFromModule(): Promise<TailwindHtmlParser | null> {
  if (!importedTailwindParserPromise) {
    importedTailwindParserPromise = (async () => {
      try {
        const tailwindModuleId = "prettier-plugin-tailwindcss";
        const mod = await import(tailwindModuleId);
        const moduleRecord = mod as Record<string, unknown>;

        const directParser = getHtmlParserFromPlugin(moduleRecord);
        if (directParser) return directParser;

        const defaultExport = moduleRecord.default;
        if (!defaultExport || typeof defaultExport !== "object") return null;
        return getHtmlParserFromPlugin(defaultExport as Record<string, unknown>);
      } catch {
        return null;
      }
    })();
  }

  return importedTailwindParserPromise;
}

async function resolveTailwindParser(options: Options): Promise<TailwindHtmlParser | null> {
  const loadedParser = findTailwindParserInLoadedPlugins(options);
  if (loadedParser) return loadedParser;

  if (!hasTailwindPluginReference(options)) return null;
  return loadTailwindParserFromModule();
}

function encodeSyntheticHtmlAttributeValue(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function decodeSyntheticHtmlAttributeValue(value: string): string {
  return value.replaceAll("&quot;", '"').replaceAll("&lt;", "<").replaceAll("&amp;", "&");
}

function extractClassAttributeValue(ast: unknown): string | null {
  const stack: unknown[] = [ast];
  const visited = new Set<object>();

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    if (visited.has(current)) continue;
    visited.add(current);

    const record = current as Record<string, unknown>;
    if (record.name === "class" && typeof record.value === "string") {
      return record.value;
    }

    for (const value of Object.values(record)) {
      if (!value || typeof value !== "object") continue;
      if (Array.isArray(value)) {
        for (let i = value.length - 1; i >= 0; i--) {
          stack.push(value[i]);
        }
      } else {
        stack.push(value);
      }
    }
  }

  return null;
}

function getParserId(parser: TailwindHtmlParser): number {
  const key = parser as unknown as object;
  let parserId = parserIds.get(key);
  if (!parserId) {
    parserId = nextParserId++;
    parserIds.set(key, parserId);
  }
  return parserId;
}

function getSortCacheKey(parser: TailwindHtmlParser, value: string, options: Options): string {
  const opts = options as Record<string, unknown>;
  const parserId = getParserId(parser);
  const optionsKey = safeSerialize({
    filepath: opts.filepath,
    tailwindConfig: opts.tailwindConfig,
    tailwindEntryPoint: opts.tailwindEntryPoint,
    tailwindStylesheet: opts.tailwindStylesheet,
    tailwindPackageName: opts.tailwindPackageName,
    tailwindAttributes: opts.tailwindAttributes,
    tailwindFunctions: opts.tailwindFunctions,
    tailwindPreserveWhitespace: opts.tailwindPreserveWhitespace,
    tailwindPreserveDuplicates: opts.tailwindPreserveDuplicates,
  });
  return `${parserId}|${optionsKey}|${value}`;
}

function setCachedSortResult(key: string, value: string): void {
  if (classSortCache.size >= MAX_CLASS_SORT_CACHE_SIZE) {
    classSortCache.clear();
  }
  classSortCache.set(key, value);
}

function createTailwindParseOptions(options: Options): Options {
  return {
    ...(options as Record<string, unknown>),
    parser: "html",
  } as Options;
}

export async function sortClassNamesWithTailwind(
  value: string,
  options: Options,
): Promise<string | null> {
  if (value.trim().length === 0) {
    return "";
  }

  const tailwindParser = await resolveTailwindParser(options);
  if (!tailwindParser) return null;

  const cacheKey = getSortCacheKey(tailwindParser, value, options);
  const cached = classSortCache.get(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const encodedValue = encodeSyntheticHtmlAttributeValue(value);
    const ast = await tailwindParser.parse(
      `<div class="${encodedValue}"></div>`,
      createTailwindParseOptions(options),
    );
    const sortedClassValue = extractClassAttributeValue(ast);
    if (typeof sortedClassValue !== "string") return null;

    const decodedValue = decodeSyntheticHtmlAttributeValue(sortedClassValue);
    setCachedSortResult(cacheKey, decodedValue);
    return decodedValue;
  } catch {
    return null;
  }
}
