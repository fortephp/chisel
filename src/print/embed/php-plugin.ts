import type { Options } from "prettier";

type PhpParser = {
  parse: (text: string, options: Options) => Promise<unknown> | unknown;
};

type PhpPluginLike = {
  parsers?: Record<string, unknown>;
};

type ModuleImporter = (moduleId: string) => Promise<unknown>;

let importedPhpPluginPromise: Promise<unknown | null> | null = null;
const PHP_PLUGIN_MODULE_IDS = ["@prettier/plugin-php", "@prettier/plugin-php/standalone"] as const;
let moduleImporter: ModuleImporter = (moduleId) => import(moduleId);

function getPlugins(options: Options): unknown[] {
  const plugins = (options as Record<string, unknown>).plugins;
  return Array.isArray(plugins) ? plugins : [];
}

function getDefaultExportCandidate(plugin: unknown): unknown | null {
  if (!plugin || typeof plugin !== "object") return null;
  const defaultExport = (plugin as { default?: unknown }).default;
  return defaultExport && typeof defaultExport === "object" ? defaultExport : null;
}

function isPhpParser(value: unknown): value is PhpParser {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { parse?: unknown }).parse === "function"
  );
}

function isPhpParserFunction(value: unknown): boolean {
  return typeof value === "function";
}

function hasPhpParser(plugin: unknown): boolean {
  if (!plugin || typeof plugin !== "object") return false;
  const phpEntry = (plugin as PhpPluginLike).parsers?.php;
  return isPhpParser(phpEntry) || isPhpParserFunction(phpEntry);
}

function normalizePlugin(plugin: unknown): unknown {
  if (hasPhpParser(plugin)) {
    return plugin;
  }

  const defaultExport = getDefaultExportCandidate(plugin);
  if (defaultExport && hasPhpParser(defaultExport)) {
    return defaultExport;
  }

  return plugin;
}

async function loadPhpPluginFromModule(): Promise<unknown | null> {
  if (!importedPhpPluginPromise) {
    importedPhpPluginPromise = (async () => {
      for (const phpModuleId of PHP_PLUGIN_MODULE_IDS) {
        try {
          const mod = await moduleImporter(phpModuleId);
          const moduleRecord = mod as Record<string, unknown>;

          if (hasPhpParser(moduleRecord)) {
            return moduleRecord;
          }

          const defaultExport = moduleRecord.default;
          if (hasPhpParser(defaultExport)) {
            return defaultExport;
          }
        } catch {
          // Try the next known module id.
        }
      }

      return null;
    })();
  }

  return importedPhpPluginPromise;
}

export function resetPhpPluginResolverForTests(): void {
  importedPhpPluginPromise = null;
  moduleImporter = (moduleId) => import(moduleId);
}

export function setPhpPluginModuleImporterForTests(importer: ModuleImporter): void {
  importedPhpPluginPromise = null;
  moduleImporter = importer;
}

export async function resolvePhpPlugins(options: Options): Promise<unknown[] | null> {
  const plugins = getPlugins(options).map(normalizePlugin);

  if (plugins.some(hasPhpParser)) {
    return plugins;
  }

  const phpPlugin = await loadPhpPluginFromModule();
  if (!phpPlugin) {
    return null;
  }

  return [...plugins, phpPlugin];
}
