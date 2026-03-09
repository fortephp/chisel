import { TokenType, type Token } from "../lexer/types.js";
import { StructureRole, ArgumentRequirement } from "./types.js";

export interface DiscoveredDirective {
  name: string;
  args: ArgumentRequirement;
  role: StructureRole;
  isCondition: boolean;
  terminators: string[];
  conditionLikeBranches: string[];
  hasConditionLikeBranches: boolean;
  terminator: string | null;
  isSwitch: boolean;
  switchParent: string | null;
  isSwitchBranch: boolean;
  isSwitchTerminator: boolean;
  isConditionalPair: boolean;
  pairingStrategy: string | null;
  isConditionalClose: boolean;
}

function createDirective(
  overrides: Partial<DiscoveredDirective> & { name: string },
): DiscoveredDirective {
  return {
    args: ArgumentRequirement.Optional,
    role: StructureRole.None,
    isCondition: false,
    terminators: [],
    conditionLikeBranches: [],
    hasConditionLikeBranches: false,
    terminator: null,
    isSwitch: false,
    switchParent: null,
    isSwitchBranch: false,
    isSwitchTerminator: false,
    isConditionalPair: false,
    pairingStrategy: null,
    isConditionalClose: false,
    ...overrides,
  };
}

export class Directives {
  private static defaultTemplate: Directives | null = null;
  private directives = new Map<string, DiscoveredDirective>();
  private conditions = new Map<string, boolean>();
  private finalTerminators = new Map<string, boolean>();
  private conditionBranchesCache: string[] | null = null;
  private conditionTerminatorsCache: string[] | null = null;
  private switchBranchesCache = new Map<string, string[]>();
  private shared = false;

  static withDefaults(extraDirectives: readonly unknown[] = []): Directives {
    if (Directives.defaultTemplate === null) {
      const template = new Directives();
      // Load bundled directive definitions once.
      for (const json of BUNDLED_DIRECTIVES) {
        template.loadJson(json);
      }
      Directives.defaultTemplate = template;
    }
    const directives = Directives.defaultTemplate.forkShared();
    if (extraDirectives.length > 0) {
      directives.loadJson([...extraDirectives]);
    }
    return directives;
  }

  isDirective(name: string): boolean {
    return this.directives.has(name.toLowerCase());
  }

  isCondition(name: string): boolean {
    return this.conditions.has(name.toLowerCase());
  }

  isPaired(name: string): boolean {
    const d = this.directives.get(name.toLowerCase());
    if (!d) return false;
    return d.role === StructureRole.Opening && d.terminators.length > 0 && d.terminator !== null;
  }

  isSwitch(name: string): boolean {
    return this.getDirective(name)?.isSwitch ?? false;
  }

  isSwitchBranch(name: string): boolean {
    return this.getDirective(name)?.isSwitchBranch ?? false;
  }

  isSwitchTerminator(name: string): boolean {
    return this.getDirective(name)?.isSwitchTerminator ?? false;
  }

  isConditionalPair(name: string): boolean {
    return this.getDirective(name)?.isConditionalPair ?? false;
  }

  isConditionalClose(name: string): boolean {
    return this.getDirective(name)?.isConditionalClose ?? false;
  }

  isFinalTerminator(name: string): boolean {
    return this.finalTerminators.has(name.toLowerCase());
  }

  getDirective(name: string): DiscoveredDirective | null {
    return this.directives.get(name.toLowerCase()) ?? null;
  }

  getTerminator(name: string): string {
    const lower = name.toLowerCase();
    if (this.isFinalTerminator(lower)) return lower;

    const d = this.directives.get(lower);
    if (d?.terminator) return d.terminator;

    return "end" + lower;
  }

  getTerminators(name: string): string[] {
    const d = this.directives.get(name.toLowerCase());
    if (!d) return [];
    return d.terminators;
  }

  getBranches(name: string): string[] {
    const d = this.directives.get(name.toLowerCase());
    if (!d || !d.isCondition) return [];
    if (this.conditionBranchesCache === null) {
      this.conditionBranchesCache = this.computeAllConditionBranches();
    }
    return this.conditionBranchesCache;
  }

  getSwitchBranches(switchName: string): string[] {
    const lower = switchName.toLowerCase();
    const cached = this.switchBranchesCache.get(lower);
    if (cached) return cached;

    const branches: string[] = [];
    for (const d of this.directives.values()) {
      if (d.switchParent === lower) {
        branches.push(d.name);
      }
    }

    this.switchBranchesCache.set(lower, branches);
    return branches;
  }

  getConditionTerminators(): string[] {
    if (this.conditionTerminatorsCache === null) {
      const terminators: string[] = [];
      for (const d of this.directives.values()) {
        if (d.isCondition && d.role === StructureRole.Closing) {
          terminators.push(d.name.toLowerCase());
        }
      }
      this.conditionTerminatorsCache = terminators;
    }
    return this.conditionTerminatorsCache;
  }

  getPairingStrategy(name: string): string | null {
    return this.getDirective(name)?.pairingStrategy ?? null;
  }

  registerDirective(name: string): void {
    const lower = name.toLowerCase();
    if (this.directives.has(lower)) return;
    this.ensureMutable();
    this.invalidateCaches();
    this.directives.set(lower, createDirective({ name: lower }));
  }

  /**
   * Discover custom paired directives from a token stream.
   * Looks for patterns like @custom + @endcustom and @custom + @elsecustom.
   */
  train(tokens: readonly Token[], source: string): void {
    const found = new Map<string, boolean>();

    for (const token of tokens) {
      if (token.type !== TokenType.Directive) continue;
      let name = source.slice(token.start, token.end).toLowerCase();
      if (name.startsWith("@")) name = name.slice(1);
      found.set(name, true);
    }

    for (const directiveName of found.keys()) {
      // Check for custom condition: @foo + @elsefoo
      const elseName = "else" + directiveName;
      if (found.has(elseName) && !this.isCondition(directiveName)) {
        this.addConditionDirective(directiveName);
      }

      // Check for custom pair: @endfoo
      if (directiveName.startsWith("end") && directiveName.length > 3) {
        const openingCandidate = directiveName.slice(3).toLowerCase();
        if (this.directives.has(openingCandidate)) continue;
        this.addPairedDirective(openingCandidate, directiveName);
      }
    }
  }

  loadJson(data: unknown[]): void {
    this.ensureMutable();
    for (const meta of data) {
      if (!meta || typeof meta !== "object") continue;
      const m = meta as Record<string, unknown>;

      const argReq = this.parseArgumentRequirement(m.args);
      const namesRaw = typeof m.name === "string" ? m.name : "";
      const names = namesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const structure =
        typeof m.structure === "object" && m.structure !== null
          ? (m.structure as Record<string, unknown>)
          : null;

      let role = StructureRole.None;
      let isCondition = false;
      let terminators: string[] = [];
      let conditionLikeBranches: string[] = [];
      let hasConditionLikeBranches = false;
      let terminator: string | null = null;
      let isSwitch = false;
      let switchParent: string | null = null;
      let isSwitchBranch = false;
      let isSwitchTerminator = false;
      let isConditionalPair = false;
      let pairingStrategy: string | null = null;
      let isConditionalClose = false;

      if (structure) {
        const roleVal = typeof structure.role === "string" ? structure.role : "";
        role = this.parseStructureRole(roleVal);
        isCondition = Boolean(structure.condition);

        const termsVal = typeof structure.terminators === "string" ? structure.terminators : "";
        const branchesVal = typeof structure.branches === "string" ? structure.branches : "";
        terminators = this.parseTerminators(termsVal);
        conditionLikeBranches = this.parseTerminators(branchesVal);
        hasConditionLikeBranches = conditionLikeBranches.length > 0;

        if (terminators.length > 0) {
          terminator = terminators[terminators.length - 1];
        }

        if (structure.type === "switch") isSwitch = true;

        if (typeof structure.parent === "string") {
          switchParent = structure.parent.toLowerCase();
        }

        if (roleVal === "branch" && switchParent === "switch") {
          isSwitchBranch = true;
        }

        if (roleVal === "branch_terminator" && switchParent === "switch") {
          isSwitchTerminator = true;
        }

        if (roleVal === "conditional_pair") {
          isConditionalPair = true;
          if (typeof structure.pairing_strategy === "string") {
            pairingStrategy = structure.pairing_strategy;
          }
        }

        if (roleVal === "conditional_close") {
          isConditionalClose = true;
        }
      }

      for (const name of names) {
        const directive = createDirective({
          name,
          args: argReq,
          role,
          isCondition,
          terminators,
          conditionLikeBranches,
          hasConditionLikeBranches,
          terminator,
          isSwitch,
          switchParent,
          isSwitchBranch,
          isSwitchTerminator,
          isConditionalPair,
          pairingStrategy,
          isConditionalClose,
        });
        this.addDirective(directive);
      }
    }
  }

  private addDirective(directive: DiscoveredDirective): void {
    this.ensureMutable();
    this.invalidateCaches();
    const name = directive.name.toLowerCase();

    if (directive.role === StructureRole.Closing && directive.terminators.length === 0) {
      this.finalTerminators.set(name, true);
    }

    this.directives.set(name, directive);

    if (directive.isCondition) {
      this.conditions.set(name, true);
    }
  }

  private addPairedDirective(openName: string, closeName: string): void {
    this.ensureMutable();
    this.invalidateCaches();
    const open = createDirective({
      name: openName,
      role: StructureRole.Opening,
      terminators: [closeName],
      terminator: closeName,
    });

    const close = createDirective({
      name: closeName,
      args: ArgumentRequirement.NotAllowed,
      role: StructureRole.Closing,
    });

    this.directives.set(openName, open);
    this.directives.set(closeName, close);
  }

  private addConditionDirective(condition: string): void {
    this.ensureMutable();
    this.invalidateCaches();
    condition = condition.toLowerCase();
    const elseCond = "else" + condition;
    const endCond = "end" + condition;

    this.conditions.set(condition, true);

    this.directives.set(
      condition,
      createDirective({
        name: condition,
        args: ArgumentRequirement.Required,
        role: StructureRole.Opening,
        isCondition: true,
        terminators: [elseCond, endCond],
      }),
    );

    this.directives.set(
      elseCond,
      createDirective({
        name: elseCond,
        args: ArgumentRequirement.Required,
        role: StructureRole.Mixed,
        isCondition: true,
        terminators: [elseCond, endCond],
      }),
    );

    this.directives.set(
      endCond,
      createDirective({
        name: endCond,
        args: ArgumentRequirement.NotAllowed,
        role: StructureRole.Closing,
        isCondition: true,
      }),
    );
  }

  private computeAllConditionBranches(): string[] {
    const branches = ["else"];
    for (const d of this.directives.values()) {
      if (d.isCondition && d.role === StructureRole.Opening) {
        branches.push(...d.terminators);
      }
    }
    return branches;
  }

  private parseTerminators(value: string): string[] {
    return value
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }

  private parseStructureRole(role: string): StructureRole {
    switch (role) {
      case "open":
      case "conditional_pair":
        return StructureRole.Opening;
      case "close":
      case "conditional_close":
        return StructureRole.Closing;
      case "mixed":
        return StructureRole.Mixed;
      default:
        return StructureRole.None;
    }
  }

  private parseArgumentRequirement(args: unknown): ArgumentRequirement {
    if (args === null || args === undefined) return ArgumentRequirement.Optional;
    if (args === true) return ArgumentRequirement.Required;
    if (args === false) return ArgumentRequirement.NotAllowed;

    if (typeof args === "object") {
      const a = args as Record<string, unknown>;
      if (!a.allowed) return ArgumentRequirement.NotAllowed;
      if (a.required) return ArgumentRequirement.Required;
    }

    return ArgumentRequirement.Optional;
  }

  private invalidateCaches(): void {
    this.conditionBranchesCache = null;
    this.conditionTerminatorsCache = null;
    this.switchBranchesCache.clear();
  }

  private forkShared(): Directives {
    const copy = new Directives();
    copy.directives = this.directives;
    copy.conditions = this.conditions;
    copy.finalTerminators = this.finalTerminators;
    copy.conditionBranchesCache = this.conditionBranchesCache;
    copy.conditionTerminatorsCache = this.conditionTerminatorsCache;
    copy.switchBranchesCache = this.switchBranchesCache;
    copy.shared = true;
    return copy;
  }

  private ensureMutable(): void {
    if (!this.shared) return;

    this.directives = new Map(this.directives);
    this.conditions = new Map(this.conditions);
    this.finalTerminators = new Map(this.finalTerminators);
    this.conditionBranchesCache = this.conditionBranchesCache
      ? [...this.conditionBranchesCache]
      : null;
    this.conditionTerminatorsCache = this.conditionTerminatorsCache
      ? [...this.conditionTerminatorsCache]
      : null;
    this.switchBranchesCache = new Map(
      [...this.switchBranchesCache.entries()].map(([key, value]) => [key, [...value]]),
    );
    this.shared = false;
  }
}

const BUNDLED_DIRECTIVES: unknown[][] = [
  // conditions.json
  [
    {
      name: "if",
      args: true,
      structure: { role: "open", condition: true, terminators: "elseif,endif" },
    },
    { name: "elseif", args: true, structure: { role: "mixed", terminators: "elseif,endif" } },
    { name: "else", args: false, structure: { role: "mixed", terminators: "endif" } },
    { name: "endif", args: false, structure: { role: "close", condition: true } },
    {
      name: "unless",
      args: true,
      structure: { role: "open", condition: true, terminators: "elseif,endunless" },
    },
    { name: "endunless", args: false, structure: { role: "close", condition: true } },
    {
      name: "isset",
      args: true,
      structure: { role: "open", condition: true, terminators: "elseif,endIsset" },
    },
    { name: "endIsset", args: false, structure: { role: "close", condition: true } },
    {
      name: "once",
      args: true,
      structure: { role: "open", condition: true, terminators: "elseif,endOnce" },
    },
    { name: "endOnce", args: false, structure: { role: "close", condition: true } },
    {
      name: "pushIf",
      args: true,
      structure: { role: "open", condition: true, terminators: "elsePushIf,elseif,endPushIf" },
    },
    {
      name: "elsePushIf",
      args: true,
      structure: { role: "mixed", condition: true, terminators: "elsePushIf,elseif,endPushIf" },
    },
    { name: "endPushIf", args: false, structure: { role: "close", condition: true } },
    {
      name: "hasstack",
      args: true,
      structure: { role: "open", condition: true, terminators: "elseif,endif" },
    },
    // Note: @empty/@endempty as standalone condition is intentionally NOT bundled here.
    // @empty is primarily used as a branch marker inside @forelse (via forelse.branches).
    // Standalone @empty($var)...@endempty can be discovered via training.
  ],
  // auth.json
  [
    {
      name: "auth",
      args: true,
      structure: { role: "open", condition: true, terminators: "elseauth,endauth" },
    },
    {
      name: "elseauth",
      args: true,
      structure: { role: "mixed", condition: true, terminators: "elseauth,endauth" },
    },
    { name: "endauth", args: false, structure: { role: "close", condition: true } },
  ],
  // guest.json
  [
    {
      name: "guest",
      args: true,
      structure: { role: "open", condition: true, terminators: "elseguest,endguest" },
    },
    {
      name: "elseguest",
      args: true,
      structure: { role: "mixed", condition: true, terminators: "elseguest,endguest" },
    },
    { name: "endguest", args: false, structure: { role: "close", condition: true } },
  ],
  // authorizations.json
  [
    {
      name: "can",
      args: true,
      structure: { role: "open", condition: true, terminators: "elsecan,endcan" },
    },
    {
      name: "elsecan",
      args: true,
      structure: { role: "mixed", condition: true, terminators: "elsecan,endcan" },
    },
    { name: "endcan", args: false, structure: { role: "close", condition: true } },
    {
      name: "cannot",
      args: true,
      structure: { role: "open", condition: true, terminators: "elsecannot,endcannot" },
    },
    {
      name: "elsecannot",
      args: true,
      structure: { role: "mixed", condition: true, terminators: "elsecannot,endcannot" },
    },
    { name: "endcannot", args: false, structure: { role: "close", condition: true } },
    {
      name: "canany",
      args: true,
      structure: { role: "open", condition: true, terminators: "elsecanany,endcanany" },
    },
    {
      name: "elsecanany",
      args: true,
      structure: { role: "mixed", condition: true, terminators: "elsecanany,endcanany" },
    },
    { name: "endcanany", args: false, structure: { role: "close", condition: true } },
  ],
  // env.json
  [
    {
      name: "env",
      args: true,
      structure: { role: "open", condition: true, terminators: "elseenv,endenv" },
    },
    { name: "elseenv", args: true, structure: { role: "mixed", condition: true } },
    { name: "endenv", args: false, structure: { role: "close", condition: true } },
    {
      name: "production",
      args: false,
      structure: { role: "open", condition: true, terminators: "elseproduction,endproduction" },
    },
    { name: "elseproduction", args: false, structure: { role: "mixed", condition: true } },
    { name: "endproduction", args: false, structure: { role: "close", condition: true } },
  ],
  // for.json
  [
    { name: "for", args: true, structure: { role: "open", terminators: "endfor" } },
    { name: "endfor", args: false, structure: { role: "close" } },
  ],
  // foreach.json
  [
    { name: "foreach", args: true, structure: { role: "open", terminators: "endforeach" } },
    { name: "endforeach", args: false, structure: { role: "close" } },
  ],
  // forelse.json
  [
    {
      name: "forelse",
      args: true,
      structure: { role: "open", terminators: "endforelse", branches: "empty" },
    },
    { name: "endforelse", args: false, structure: { role: "close" } },
  ],
  // while.json
  [
    { name: "while", args: true, structure: { role: "open", terminators: "endwhile" } },
    { name: "endwhile", args: false, structure: { role: "close" } },
  ],
  // switch.json
  [
    { name: "switch", args: true, structure: { role: "open", type: "switch" } },
    { name: "case", args: true, structure: { role: "branch", parent: "switch" } },
    { name: "default", args: false, structure: { role: "branch", parent: "switch" } },
    {
      name: "break",
      args: false,
      structure: { role: "branch_terminator", parent: "switch", optional: true },
    },
    { name: "endSwitch", args: false, structure: { role: "close" } },
  ],
  // error.json
  [
    {
      name: "error",
      args: true,
      structure: { role: "open", terminators: "enderror", branches: "else" },
    },
    { name: "enderror", args: false, structure: { role: "close" } },
  ],
  // components.json
  [
    { name: "props,aware", args: true },
    {
      name: "component",
      args: true,
      structure: { role: "open", terminators: "endComponent,endComponentClass" },
    },
    {
      name: "endComponent,endComponentClass,endSlot,endComponentFirst",
      args: false,
      structure: { role: "close" },
    },
    { name: "slot", args: true, structure: { role: "open", terminators: "endSlot" } },
    {
      name: "componentFirst",
      args: true,
      structure: { role: "open", terminators: "endComponentFirst" },
    },
  ],
  // layouts.json
  [
    { name: "extends,extendsFirst,parent,yield", args: true },
    {
      name: "section",
      args: true,
      structure: {
        role: "conditional_pair",
        terminators: "show,append,overwrite,stop,endsection",
        pairing_strategy: "section_style",
      },
    },
    {
      name: "show,append,overwrite,stop,endsection",
      args: false,
      structure: { role: "conditional_close" },
    },
    {
      name: "hasSection,sectionMissing",
      args: true,
      structure: {
        role: "open",
        condition: true,
        terminators: "elseif,else,endif,endhasSection,endsectionMissing",
      },
    },
    {
      name: "endhasSection,endsectionMissing",
      args: false,
      structure: { role: "close", condition: true },
    },
  ],
  // stacks.json
  [
    { name: "stack", args: true },
    { name: "push", args: true, structure: { role: "open", terminators: "endpush,endpushOnce" } },
    {
      name: "endpush,endpushOnce,endprepend,endprependOnce",
      args: false,
      structure: { role: "close" },
    },
    {
      name: "pushOnce",
      args: true,
      structure: { role: "open", terminators: "endpush,endpushOnce" },
    },
    {
      name: "prepend",
      args: true,
      structure: { role: "open", terminators: "endprepend,endprependOnce" },
    },
    {
      name: "prependOnce",
      args: true,
      structure: { role: "open", terminators: "endprepend,endprependOnce" },
    },
  ],
  // fragments.json
  [
    { name: "fragment", args: true, structure: { role: "open", terminators: "endfragment" } },
    { name: "endfragment", args: false, structure: { role: "close" } },
  ],
  // sessions.json
  [
    { name: "session", args: true, structure: { role: "open", terminators: "endsession" } },
    { name: "endsession", args: false, structure: { role: "close" } },
  ],
  // contexts.json
  [
    { name: "context", args: true, structure: { role: "open", terminators: "endcontext" } },
    { name: "endcontext", args: false, structure: { role: "close" } },
  ],
  // livewire.json
  [
    { name: "persist", args: true, structure: { role: "open", terminators: "endpersist" } },
    { name: "endpersist", args: false, structure: { role: "close" } },
    { name: "teleport", args: true, structure: { role: "open", terminators: "endteleport" } },
    { name: "endteleport", args: false, structure: { role: "close" } },
    { name: "livewire", args: true },
    { name: "livewireStyles,livewireScripts", args: false },
    { name: "entangle", args: true },
    { name: "this" },
    { name: "volt" },
  ],
  // spatie-permission.json
  [
    {
      name: "role",
      args: true,
      structure: { role: "open", condition: true, terminators: "elserole,endrole" },
    },
    { name: "endrole", args: false, structure: { role: "close", condition: true } },
    {
      name: "hasrole",
      args: true,
      structure: { role: "open", condition: true, terminators: "elsehasrole,endhasrole" },
    },
    { name: "endhasrole", args: false, structure: { role: "close", condition: true } },
    {
      name: "hasanyrole",
      args: true,
      structure: { role: "open", condition: true, terminators: "elsehasanyrole,endhasanyrole" },
    },
    { name: "endhasanyrole", args: false, structure: { role: "close", condition: true } },
    {
      name: "hasallroles",
      args: true,
      structure: { role: "open", condition: true, terminators: "elsehasallroles,endhasallroles" },
    },
    { name: "endhasallroles", args: false, structure: { role: "close", condition: true } },
    {
      name: "unlessrole",
      args: true,
      structure: { role: "open", condition: true, terminators: "elseunlessrole,endunlessrole" },
    },
    { name: "endunlessrole", args: false, structure: { role: "close", condition: true } },
  ],
  // pennant.json (Feature Flags)
  [
    {
      name: "feature",
      args: true,
      structure: { role: "open", condition: true, terminators: "elsefeature,endfeature" },
    },
    { name: "endfeature", args: false, structure: { role: "close", condition: true } },
    {
      name: "featureany",
      args: true,
      structure: { role: "open", condition: true, terminators: "elsefeatureany,endfeatureany" },
    },
    { name: "endfeatureany", args: false, structure: { role: "close", condition: true } },
  ],
  // translations.json
  [
    {
      name: "lang",
      structure: {
        role: "conditional_pair",
        terminators: "endlang",
        pairing_strategy: "lang_style",
      },
    },
    { name: "choice", args: true },
    { name: "endlang", args: false, structure: { role: "conditional_close" } },
  ],
  // verbatim.json
  [
    { name: "verbatim", args: false, structure: { role: "open", terminators: "endverbatim" } },
    { name: "endverbatim", args: false, structure: { role: "close" } },
  ],
  // includes.json
  [
    { name: "each", args: true },
    { name: "include", args: true },
    { name: "includeIf", args: true },
    { name: "includeWhen", args: true },
    { name: "includeUnless", args: true },
    { name: "includeFirst", args: true },
    { name: "includeIsolated", args: true },
  ],
  // basic.json
  [
    { name: "csrf", args: false },
    { name: "method", args: true },
    { name: "inject", args: true },
    { name: "dd", args: true },
    { name: "dump", args: true },
    { name: "js", args: true },
    { name: "json", args: true },
    { name: "vite", args: true },
    { name: "viteReactRefresh", args: false },
    { name: "bool", args: true },
    { name: "class", args: true },
    { name: "style", args: true },
    { name: "selected", args: true },
    { name: "checked", args: true },
    { name: "disabled", args: true },
    { name: "required", args: true },
    { name: "readonly", args: true },
    { name: "old", args: true },
    { name: "use" },
    { name: "unset", args: true },
    { name: "inertia", args: true },
    { name: "inertiaHead" },
    { name: "filamentStyles,filamentScripts", args: false },
    { name: "svg", args: true },
    { name: "paddleJS", args: false },
    { name: "continue" },
    { name: "php", args: false, structure: { role: "open", terminators: "endphp" } },
    { name: "endphp", args: false, structure: { role: "close" } },
  ],
];
