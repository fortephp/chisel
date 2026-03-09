export interface BladeSyntaxPlugin {
  name: string;
  lexerDirectives: readonly string[];
  treeDirectives: readonly unknown[];
  verbatimStartDirectives: readonly string[];
  verbatimEndDirectives: readonly string[];
}

const STATAMIC_VERBATIM_START_DIRECTIVES = ["antlers"] as const;
const STATAMIC_VERBATIM_END_DIRECTIVES = ["endantlers"] as const;

export const statamicPlugin: BladeSyntaxPlugin = {
  name: "statamic",
  lexerDirectives: [...STATAMIC_VERBATIM_START_DIRECTIVES, ...STATAMIC_VERBATIM_END_DIRECTIVES],
  treeDirectives: [
    {
      name: "antlers",
      args: false,
      structure: { role: "open", terminators: "endantlers" },
    },
    {
      name: "endantlers",
      args: false,
      structure: { role: "close" },
    },
  ],
  verbatimStartDirectives: STATAMIC_VERBATIM_START_DIRECTIVES,
  verbatimEndDirectives: STATAMIC_VERBATIM_END_DIRECTIVES,
};
