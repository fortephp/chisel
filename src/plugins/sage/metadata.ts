import type {
  TreeDirectiveArgsDefinition,
  TreeDirectiveDefinition,
} from "../../tree/directive-definitions.js";

export interface SageDirectiveMetadata {
  name: string;
  allowsArguments: boolean;
  isConditionDirective: boolean;
}

const SAGE_ACF_DIRECTIVES: readonly TreeDirectiveDefinition[] = [
  { name: "fields", args: true, structure: { role: "open", terminators: "endfields" } },
  { name: "endfields", args: false, structure: { role: "close" } },
  {
    name: "hasfields",
    args: true,
    structure: { role: "open", condition: true, terminators: "endhasfields" },
  },
  { name: "endhasfields", args: false, structure: { role: "close", condition: true } },
  { name: "field", args: true },
  {
    name: "hasfield,isfield",
    args: true,
    structure: { role: "open", condition: true, terminators: "endfield" },
  },
  { name: "endfield", args: false, structure: { role: "close", condition: true } },
  { name: "sub", args: true },
  {
    name: "hassub,issub",
    args: true,
    structure: { role: "open", condition: true, terminators: "endsub" },
  },
  { name: "endsub", args: false, structure: { role: "close", condition: true } },
  { name: "layouts", args: true, structure: { role: "open", terminators: "endlayouts" } },
  { name: "endlayouts", args: false, structure: { role: "close" } },
  {
    name: "layout",
    args: true,
    structure: { role: "open", condition: true, terminators: "endlayout" },
  },
  { name: "endlayout", args: false, structure: { role: "close", condition: true } },
  { name: "group", args: true, structure: { role: "open", terminators: "endgroup" } },
  { name: "endgroup", args: false, structure: { role: "close" } },
  { name: "options", args: true, structure: { role: "open", terminators: "endoptions" } },
  { name: "endoptions", args: false, structure: { role: "close" } },
  {
    name: "hasoptions",
    args: true,
    structure: { role: "open", condition: true, terminators: "endhasoptions" },
  },
  { name: "endhasoptions", args: false, structure: { role: "close", condition: true } },
  { name: "option", args: true },
  {
    name: "hasoption,isoption",
    args: true,
    structure: { role: "open", condition: true, terminators: "endoption" },
  },
  { name: "endoption", args: false, structure: { role: "close", condition: true } },
];

const SAGE_HELPER_DIRECTIVES: readonly TreeDirectiveDefinition[] = [
  {
    name: "istrue",
    args: true,
    structure: {
      role: "conditional_pair",
      condition: true,
      terminators: "endistrue",
      pairing_strategy: "single_argument_block",
    },
  },
  {
    name: "isfalse",
    args: true,
    structure: {
      role: "conditional_pair",
      condition: true,
      terminators: "endisfalse",
      pairing_strategy: "single_argument_block",
    },
  },
  {
    name: "isnull",
    args: true,
    structure: {
      role: "conditional_pair",
      condition: true,
      terminators: "endisnull",
      pairing_strategy: "single_argument_block",
    },
  },
  {
    name: "isnotnull",
    args: true,
    structure: {
      role: "conditional_pair",
      condition: true,
      terminators: "endisnotnull",
      pairing_strategy: "single_argument_block",
    },
  },
  {
    name: "notempty",
    args: true,
    structure: {
      role: "conditional_pair",
      condition: true,
      terminators: "endnotempty",
      pairing_strategy: "single_argument_block",
    },
  },
  {
    name: "endistrue,endisfalse,endisnull,endisnotnull,endnotempty",
    args: false,
    structure: { role: "close", condition: true },
  },
  {
    name: "instanceof",
    args: true,
    structure: { role: "open", condition: true, terminators: "endinstanceof" },
  },
  { name: "endinstanceof", args: false, structure: { role: "close", condition: true } },
  {
    name: "typeof",
    args: true,
    structure: { role: "open", condition: true, terminators: "endtypeof" },
  },
  { name: "endtypeof", args: false, structure: { role: "close", condition: true } },
  { name: "global", args: true },
  { name: "set", args: true },
  { name: "unset", args: true },
  { name: "extract", args: true },
  { name: "implode", args: true },
  { name: "repeat", args: true, structure: { role: "open", terminators: "endrepeat" } },
  { name: "endrepeat", args: false, structure: { role: "close" } },
  {
    name: "stylesheet",
    structure: {
      role: "conditional_pair",
      terminators: "endstylesheet",
      pairing_strategy: "no_arguments_block",
    },
  },
  {
    name: "script",
    structure: {
      role: "conditional_pair",
      terminators: "endscript",
      pairing_strategy: "no_arguments_block",
    },
  },
  { name: "endstylesheet,endscript", args: false, structure: { role: "conditional_close" } },
  { name: "js", args: true },
  { name: "inline", args: true },
];

const SAGE_WORDPRESS_DIRECTIVES: readonly TreeDirectiveDefinition[] = [
  { name: "query", args: true },
  { name: "posts", args: true, structure: { role: "open", terminators: "endposts" } },
  { name: "endposts", args: false, structure: { role: "close" } },
  {
    name: "hasposts",
    args: true,
    structure: { role: "open", condition: true, terminators: "endhasposts" },
  },
  {
    name: "noposts",
    args: true,
    structure: { role: "open", condition: true, terminators: "endnoposts" },
  },
  {
    name: "endhasposts,endnoposts",
    args: false,
    structure: { role: "close", condition: true },
  },
  { name: "postmeta,title,permalink,thumbnail,author,authorurl,published,modified", args: true },
  { name: "content,excerpt,wphead,wpfooter,wpbodyopen", args: false },
  { name: "category,categories,term,terms,image,shortcode,wpautop,wpautokp", args: true },
  { name: "action,filter,bodyclass,postclass,sidebar,thememod,menu", args: true },
  {
    name: "role",
    args: true,
    structure: { role: "open", condition: true, terminators: "endrole" },
  },
  {
    name: "elserole",
    args: false,
  },
  { name: "endrole", args: false, structure: { role: "close", condition: true } },
  {
    name: "user",
    args: false,
    structure: { role: "open", condition: true, terminators: "enduser" },
  },
  { name: "enduser", args: false, structure: { role: "close", condition: true } },
  {
    name: "guest",
    args: false,
    structure: { role: "open", condition: true, terminators: "endguest" },
  },
  {
    name: "elseguest",
    args: false,
  },
  { name: "endguest", args: false, structure: { role: "close", condition: true } },
  {
    name: "hassidebar",
    args: true,
    structure: { role: "open", condition: true, terminators: "endhassidebar" },
  },
  {
    name: "hasmenu",
    args: true,
    structure: { role: "open", condition: true, terminators: "endhasmenu" },
  },
  {
    name: "endhassidebar,endhasmenu",
    args: false,
    structure: { role: "close", condition: true },
  },
  { name: "__", args: true },
];

export const SAGE_TREE_DIRECTIVES: readonly TreeDirectiveDefinition[] = [
  ...SAGE_ACF_DIRECTIVES,
  ...SAGE_HELPER_DIRECTIVES,
  ...SAGE_WORDPRESS_DIRECTIVES,
];

function splitDirectiveNames(value: string): string[] {
  return value
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
}

function allowsDirectiveArguments(args: TreeDirectiveArgsDefinition): boolean {
  if (args === false) {
    return false;
  }

  if (typeof args === "object" && args !== null && args.allowed === false) {
    return false;
  }

  return true;
}

function isConditionDirective(definition: TreeDirectiveDefinition): boolean {
  if (!definition.structure?.condition) {
    return false;
  }

  return definition.structure.role === "open" || definition.structure.role === "conditional_pair";
}

const SAGE_DIRECTIVE_METADATA = new Map<string, SageDirectiveMetadata>();
const SAGE_INTERNAL_OVERRIDE_DIRECTIVE_NAMES = new Set(["elseguest", "elserole"]);

for (const definition of SAGE_TREE_DIRECTIVES) {
  const directiveMetadata = {
    allowsArguments: allowsDirectiveArguments(definition.args),
    isConditionDirective: isConditionDirective(definition),
  };

  for (const name of splitDirectiveNames(definition.name)) {
    SAGE_DIRECTIVE_METADATA.set(name, {
      name,
      ...directiveMetadata,
    });
  }
}

export const SAGE_DECLARED_DIRECTIVE_NAMES = Object.freeze(
  [...SAGE_DIRECTIVE_METADATA.keys()].filter(
    (name) => !SAGE_INTERNAL_OVERRIDE_DIRECTIVE_NAMES.has(name),
  ),
);
export const SAGE_ARGUMENT_DIRECTIVE_NAMES = Object.freeze(
  SAGE_DECLARED_DIRECTIVE_NAMES.filter(
    (name) => SAGE_DIRECTIVE_METADATA.get(name)?.allowsArguments === true,
  ),
);

export function getSageDirectiveMetadata(name: string): SageDirectiveMetadata | null {
  return SAGE_DIRECTIVE_METADATA.get(name.trim().toLowerCase()) ?? null;
}
