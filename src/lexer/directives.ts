const DEFAULT_DIRECTIVES: string[] = [
  "if",
  "elseif",
  "else",
  "endif",
  "unless",
  "endunless",
  "isset",
  "endisset",
  "empty",
  "endempty",
  "switch",
  "case",
  "break",
  "default",
  "endswitch",

  "foreach",
  "endforeach",
  "for",
  "endfor",
  "while",
  "endwhile",
  "forelse",
  "endforelse",
  "continue",

  "auth",
  "elseauth",
  "endauth",
  "guest",
  "elseguest",
  "endguest",

  "can",
  "elsecan",
  "endcan",
  "canany",
  "elsecanany",
  "endcanany",
  "cannot",
  "elsecannot",
  "endcannot",

  "env",
  "elseenv",
  "endenv",
  "production",
  "elseproduction",
  "endproduction",

  "section",
  "endsection",
  "yield",
  "show",
  "stop",
  "append",
  "overwrite",
  "extends",
  "extendsFirst",
  "parent",
  "hasSection",
  "sectionMissing",

  "include",
  "includeIf",
  "includeWhen",
  "includeUnless",
  "includeFirst",
  "includeIsolated",
  "each",

  "once",
  "endonce",

  "push",
  "endpush",
  "pushOnce",
  "endPushOnce",
  "pushIf",
  "elsePushIf",
  "endPushIf",
  "prepend",
  "endprepend",
  "prependOnce",
  "endPrependOnce",
  "stack",
  "hasstack",

  "component",
  "endcomponent",
  "endComponentClass",
  "componentFirst",
  "endComponentFirst",
  "slot",
  "endslot",
  "props",
  "aware",

  "csrf",
  "method",
  "error",
  "enderror",
  "old",

  "inject",
  "dd",
  "dump",
  "vite",
  "viteReactRefresh",
  "json",
  "js",
  "unset",

  "class",
  "style",
  "checked",
  "selected",
  "disabled",
  "readonly",
  "required",
  "bool",

  "php",
  "endphp",
  "verbatim",
  "endverbatim",

  "fragment",
  "endfragment",

  "session",
  "endsession",

  "context",
  "endcontext",

  "lang",
  "endlang",
  "choice",

  "livewire",
  "livewireStyles",
  "livewireScripts",
  "entangle",
  "this",
  "persist",
  "endpersist",
  "teleport",
  "endteleport",
  "volt",

  // Inertia.js
  "inertia",
  "inertiaHead",
  // Filament
  "filamentStyles",
  "filamentScripts",
  // Blade Icons
  "svg",
  // Spatie Permission
  "role",
  "endrole",
  "hasrole",
  "endhasrole",
  "hasanyrole",
  "endhasanyrole",
  "hasallroles",
  "endhasallroles",
  "unlessrole",
  "endunlessrole",
  // Pennant
  "feature",
  "endfeature",
  "featureany",
  "endfeatureany",
  // Cashier Paddle
  "paddleJS",

  "use",
];

const CANONICAL_DIRECTIVE_CASE = new Map<string, string>();
for (const name of DEFAULT_DIRECTIVES) {
  const lower = name.toLowerCase();
  if (!CANONICAL_DIRECTIVE_CASE.has(lower)) {
    CANONICAL_DIRECTIVE_CASE.set(lower, name);
  }
}

export type DirectivePhpWrapperKind =
  | "for"
  | "foreach"
  | "while"
  | "switch"
  | "case"
  | "if"
  | "call";

export type DirectivePhpWrapperMode = "safe" | "aggressive";

export interface DirectivePhpWrapperContext {
  hasDirective?: (name: string) => boolean;
  isConditionLikeDirective?: (name: string) => boolean;
}

const IF_WRAPPER_DIRECTIVES = new Set([
  "if",
  "elseif",
  "unless",
  "isset",
  "once",
  "auth",
  "elseauth",
  "guest",
  "elseguest",
  "can",
  "elsecan",
  "cannot",
  "elsecannot",
  "canany",
  "elsecanany",
  "env",
  "elseenv",
  "production",
  "elseproduction",
  "hassection",
  "sectionmissing",
  "error",
  "role",
  "hasrole",
  "hasanyrole",
  "hasallroles",
  "unlessrole",
  "pushif",
  "elsepushif",
  "hasstack",
]);

const AGGRESSIVE_WRAPPER_ORDER: DirectivePhpWrapperKind[] = [
  "if",
  "while",
  "switch",
  "foreach",
  "for",
  "case",
  "call",
];

export function getDirectivePhpWrapperKind(
  directiveName: string,
  context: DirectivePhpWrapperContext = {},
): DirectivePhpWrapperKind {
  const name = directiveName.toLowerCase();
  const hasDirective = context.hasDirective;

  if (context.isConditionLikeDirective?.(name)) {
    return "if";
  }

  if (name === "for") return "for";
  if (name === "foreach" || name === "forelse") return "foreach";
  if (name === "while") return "while";
  if (name === "switch") return "switch";
  if (name === "case") return "case";
  if (IF_WRAPPER_DIRECTIVES.has(name)) return "if";

  // Custom condition-like opener detected by training:
  // @disk ... @elsedisk ... @enddisk
  if (hasDirective?.(`else${name}`) && hasDirective(`end${name}`)) {
    return "if";
  }

  // Custom condition-like branch name itself (e.g. @elsedisk).
  if (name.startsWith("else") && name.length > 4) {
    const baseName = name.slice(4);
    if (hasDirective?.(baseName) && hasDirective(`end${baseName}`)) {
      return "if";
    }
  }

  return "call";
}

export function getDirectivePhpWrapperKinds(
  directiveName: string,
  mode: DirectivePhpWrapperMode,
  context: DirectivePhpWrapperContext = {},
): DirectivePhpWrapperKind[] {
  const first = getDirectivePhpWrapperKind(directiveName, context);

  if (mode === "safe") {
    return first === "call" ? ["call"] : [first, "call"];
  }

  const kinds: DirectivePhpWrapperKind[] = [first];
  for (const kind of AGGRESSIVE_WRAPPER_ORDER) {
    if (!kinds.includes(kind)) {
      kinds.push(kind);
    }
  }

  return kinds;
}

export function getCanonicalDirectiveName(directiveName: string): string | null {
  return CANONICAL_DIRECTIVE_CASE.get(directiveName.toLowerCase()) ?? null;
}

export class Directives {
  private known: Set<string>;
  private _acceptAll: boolean;

  private constructor(known: Set<string>, acceptAll: boolean) {
    this.known = known;
    this._acceptAll = acceptAll;
  }

  static acceptAll(): Directives {
    return new Directives(new Set(), true);
  }

  static withDefaults(extraNames: Iterable<string> = []): Directives {
    const set = new Set<string>();
    for (const name of DEFAULT_DIRECTIVES) {
      set.add(name.toLowerCase());
    }
    for (const name of extraNames) {
      const normalized = name.trim().toLowerCase().replace(/^@/, "");
      if (normalized) set.add(normalized);
    }
    return new Directives(set, false);
  }

  static empty(): Directives {
    return new Directives(new Set(), false);
  }

  static from(names: Iterable<string>): Directives {
    const set = new Set<string>();
    for (const name of names) {
      set.add(name.toLowerCase());
    }
    return new Directives(set, false);
  }

  isDirective(name: string): boolean {
    if (this._acceptAll) return true;
    return this.known.has(name.toLowerCase());
  }

  isDirectiveLower(nameLower: string): boolean {
    if (this._acceptAll) return true;
    return this.known.has(nameLower);
  }

  acceptsAll(): boolean {
    return this._acceptAll;
  }

  register(name: string): this {
    this.known.add(name.toLowerCase());
    return this;
  }
}
