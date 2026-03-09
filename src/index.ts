import type { Plugin, SupportOption } from "prettier";
import { bladeParser } from "./parser.js";
import { bladePrinter } from "./printer.js";

const languages: Plugin["languages"] = [
  {
    name: "blade",
    parsers: ["blade"],
    extensions: [".blade.php"],
    vscodeLanguageIds: ["blade"],
  },
];

const parsers: Plugin["parsers"] = {
  blade: bladeParser,
};

const printers: Plugin["printers"] = {
  "blade-ast": bladePrinter,
};

/**
 * Declare HTML-specific options so Prettier passes them through.
 */
const options: Record<string, SupportOption> = {
  htmlWhitespaceSensitivity: {
    category: "HTML",
    type: "choice",
    default: "css",
    description: "How to handle whitespaces in HTML.",
    choices: [
      {
        value: "css",
        description: "Respect the default value of CSS display property.",
      },
      {
        value: "strict",
        description: "Whitespaces are considered sensitive.",
      },
      {
        value: "ignore",
        description: "Whitespaces are considered insensitive.",
      },
    ],
  },
  bladePhpFormatting: {
    category: "Blade",
    type: "choice",
    default: "safe",
    description: "Format Blade PHP fragments (directive args, echoes, and PHP blocks/tags).",
    choices: [
      {
        value: "off",
        description: "Disable Blade PHP fragment formatting.",
      },
      {
        value: "safe",
        description: "Format known-safe Blade PHP fragments with conservative wrappers.",
      },
      {
        value: "aggressive",
        description: "Try additional wrapper strategies before falling back to original text.",
      },
    ],
  },
  bladePhpFormattingTargets: {
    category: "Blade",
    type: "string",
    array: true,
    default: [{ value: ["directiveArgs", "echo", "phpBlock", "phpTag"] }],
    description:
      "PHP embedding targets: echo, directiveArgs, phpBlock, phpTag. Use [] (or CLI value 'none') to disable all targets.",
  },
  bladeSyntaxPlugins: {
    category: "Blade",
    type: "string",
    array: true,
    default: [{ value: ["statamic"] }],
    description: "List of Blade plugins",
  },
  bladeDirectiveCase: {
    category: "Blade",
    type: "choice",
    default: "preserve",
    description: "Normalize Blade directive casing.",
    choices: [
      {
        value: "preserve",
        description: "Keep directive case as written.",
      },
      {
        value: "canonical",
        description: "Use canonical directive casing for known directives.",
      },
      {
        value: "lower",
        description: "Lowercase all directive names.",
      },
    ],
  },
  bladeDirectiveCaseMap: {
    category: "Blade",
    type: "string",
    default: "",
    description: 'JSON object mapping directive names to canonical case, e.g. {"disk":"Disk"}.',
  },
  bladeDirectiveArgSpacing: {
    category: "Blade",
    type: "choice",
    default: "space",
    description: "Spacing between directive name and argument list.",
    choices: [
      {
        value: "preserve",
        description: "Preserve original spacing.",
      },
      {
        value: "none",
        description: "Print without a space, e.g. @if($x).",
      },
      {
        value: "space",
        description: "Print with one space, e.g. @if ($x).",
      },
    ],
  },
  bladeDirectiveBlockStyle: {
    category: "Blade",
    type: "choice",
    default: "preserve",
    description: "Formatting style for directive blocks.",
    choices: [
      {
        value: "preserve",
        description: "Preserve inline block intent when written on one line.",
      },
      {
        value: "inline-if-short",
        description: "Allow short blocks to print inline when possible.",
      },
      {
        value: "multiline",
        description: "Always print directive blocks in multiline style.",
      },
    ],
  },
  bladeBlankLinesAroundDirectives: {
    category: "Blade",
    type: "choice",
    default: "preserve",
    description: "Blank line policy between directives inside a block.",
    choices: [
      {
        value: "preserve",
        description: "Preserve existing blank line intent.",
      },
      {
        value: "always",
        description: "Insert a blank line between directive segments.",
      },
    ],
  },
  bladeEchoSpacing: {
    category: "Blade",
    type: "choice",
    default: "preserve",
    description: "Spacing style for Blade echo delimiters.",
    choices: [
      {
        value: "preserve",
        description: "Preserve current echo spacing.",
      },
      {
        value: "space",
        description: "Use spaced delimiters, e.g. {{ $x }}.",
      },
      {
        value: "tight",
        description: "Use tight delimiters, e.g. {{$x}}.",
      },
    ],
  },
  bladeSlotClosingTag: {
    category: "Blade",
    type: "choice",
    default: "canonical",
    description: "How to print Blade slot closing tags for shorthand pairs.",
    choices: [
      {
        value: "canonical",
        description: "Use canonical closing tag names based on the opening slot tag.",
      },
      {
        value: "preserve",
        description: "Preserve shorthand closing tags such as </x-slot> when present.",
      },
    ],
  },
  bladeInlineIntentElements: {
    category: "Blade",
    type: "string",
    array: true,
    default: [{ value: ["p", "svg", "svg:*"] }],
    description:
      "Element names that should preserve single-line inline intent and ignore printWidth-driven wrapping when source is inline. Supports namespace wildcards like svg:*.",
  },
  bladeComponentPrefixes: {
    category: "Blade",
    type: "string",
    array: true,
    default: [{ value: ["x", "s", "statamic", "flux", "livewire", "native"] }],
    description:
      "Component prefixes used to detect Blade components for :bound attribute PHP formatting.",
  },
  bladeInsertOptionalClosingTags: {
    category: "Blade",
    type: "boolean",
    default: false,
    description:
      "Insert explicit closing tags when elements are implicitly closed in source (optional-end-tag and parser-recovered missing closing tags).",
  },
  bladeKeepHeadAndBodyAtRoot: {
    category: "Blade",
    type: "boolean",
    default: true,
    description:
      "Keep root-level <head> and <body> tags flush with <html> for canonical HTML documents.",
  },
};

const plugin: Plugin = { languages, parsers, printers, options };

export default plugin;
export { languages, parsers, printers, options };
