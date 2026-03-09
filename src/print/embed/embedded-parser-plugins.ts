import type { Options } from "prettier";

type PluginLike = {
  parsers?: Record<string, unknown>;
};

const EMBEDDED_PARSER_PLUGIN_MODULES: Readonly<Record<string, readonly string[]>> = {
  babel: ["prettier/plugins/babel", "prettier/plugins/estree"],
  "babel-ts": ["prettier/plugins/babel", "prettier/plugins/estree"],
  flow: ["prettier/plugins/babel", "prettier/plugins/estree"],
  typescript: ["prettier/plugins/typescript", "prettier/plugins/estree"],
  css: ["prettier/plugins/postcss"],
  scss: ["prettier/plugins/postcss"],
  less: ["prettier/plugins/postcss"],
  markdown: ["prettier/plugins/markdown"],
  mdx: ["prettier/plugins/markdown"],
};

const importedPluginPromises = new Map<string, Promise<unknown | null>>();

function getPlugins(options: Options): unknown[] {
  const plugins = (options as Record<string, unknown>).plugins;
  return Array.isArray(plugins) ? plugins : [];
}

function hasParser(plugin: unknown, parser: string): boolean {
  if (!plugin || typeof plugin !== "object") return false;
  const parsers = (plugin as PluginLike).parsers;
  if (!parsers || typeof parsers !== "object") return false;
  return parser in parsers;
}

function getDefaultExportCandidate(plugin: unknown): unknown | null {
  if (!plugin || typeof plugin !== "object") return null;
  const defaultExport = (plugin as { default?: unknown }).default;
  return defaultExport && typeof defaultExport === "object" ? defaultExport : null;
}

function normalizePlugin(plugin: unknown): unknown {
  const defaultExport = getDefaultExportCandidate(plugin);
  if (defaultExport) {
    const defaultRecord = defaultExport as Record<string, unknown>;
    if (
      typeof defaultRecord.parsers === "object" ||
      typeof defaultRecord.printers === "object" ||
      Array.isArray(defaultRecord.languages)
    ) {
      return defaultExport;
    }
  }

  return plugin;
}

function hasParserInPlugins(plugins: readonly unknown[], parser: string): boolean {
  return plugins.some((plugin) => hasParser(plugin, parser));
}

async function loadPluginModule(moduleId: string): Promise<unknown | null> {
  let promise = importedPluginPromises.get(moduleId);
  if (!promise) {
    promise = (async () => {
      try {
        const mod = await import(moduleId);
        return normalizePlugin(mod as Record<string, unknown>);
      } catch {
        return null;
      }
    })();
    importedPluginPromises.set(moduleId, promise);
  }

  return promise;
}

export async function resolveEmbeddedParserPlugins(
  options: Options,
  parser: string,
): Promise<unknown[]> {
  const plugins = getPlugins(options).map(normalizePlugin);
  if (hasParserInPlugins(plugins, parser)) {
    return plugins;
  }

  const moduleIds = EMBEDDED_PARSER_PLUGIN_MODULES[parser] ?? [];
  if (moduleIds.length === 0) {
    return plugins;
  }

  const resolved = [...plugins];
  for (const moduleId of moduleIds) {
    const plugin = await loadPluginModule(moduleId);
    if (!plugin) continue;
    if (resolved.includes(plugin)) continue;
    resolved.push(plugin);
  }

  return resolved;
}
