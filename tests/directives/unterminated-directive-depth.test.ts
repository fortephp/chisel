import { describe, expect, it } from "vitest";
import type { Options } from "prettier";
import { Directives, type DiscoveredDirective } from "../../src/tree/directives.js";
import { ArgumentRequirement, StructureRole } from "../../src/tree/types.js";
import { formatWithPasses, leadingIndent, wrapInDiv } from "../helpers.js";
import {
  expectCoreConstructDelimiterSafety,
  expectNoBladePhpConstructLoss,
} from "../validation/support/fixture-suite.js";

const MAX_DEPTH = 10;
const AUDIT_MAX_DEPTH = 3;
const BASE_INPUT = `@if ($this->author(""))
<p>Hello world`;
const RAW_BLOCK_OPENERS = new Set(["php", "verbatim"]);

const NESTED_UNTERMINATED_CASES: Array<{
  name: string;
  input: string;
  directiveLiterals: string[];
}> = [
  {
    name: "unclosed @error inside @section",
    input: `@section('content')
    <div>
        @error('body')
        <input name="z" />
    </div>
@endsection
`,
    directiveLiterals: ["@section", "@endsection", "@error", "@enderror"],
  },
  {
    name: "unclosed @foreach inside @section",
    input: `@section('content')
    @foreach ($items as $item)
        <span>{{ $item }}</span>
@endsection
`,
    directiveLiterals: ["@section", "@endsection", "@foreach", "@endforeach"],
  },
];

const AUDITED_UNTERMINATED_CASES = [
  ...getDefaultUnterminatedDirectiveCases(),
  ...getDiscoveredUnterminatedDirectiveCases(),
];

const OPTION_PROFILES: Array<{ name: string; options: Options }> = [
  { name: "default", options: {} },
  {
    name: "php-safe-single-quote",
    options: { bladePhpFormatting: "safe", singleQuote: true },
  },
];

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let start = 0;
  for (;;) {
    const at = haystack.indexOf(needle, start);
    if (at < 0) return count;
    count++;
    start = at + needle.length;
  }
}

function countDirectiveLiteralOccurrences(haystack: string, needle: string): number {
  return countOccurrences(haystack.toLowerCase(), needle.toLowerCase());
}

function getDefaultUnterminatedDirectiveCases(): Array<{
  name: string;
  input: string;
  openerName: string;
  directiveLiterals: string[];
}> {
  const registry = Directives.withDefaults().getRegisteredDirectives();

  return registry
    .filter((directive) => {
      if (RAW_BLOCK_OPENERS.has(directive.name.toLowerCase())) {
        return false;
      }

      return (
        directive.isSwitch ||
        directive.isCondition ||
        directive.isConditionalPair ||
        (directive.role === StructureRole.Opening && directive.terminators.length > 0)
      );
    })
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((directive) => {
      const terminators = directive.isSwitch ? ["endswitch"] : directive.terminators;
      return {
        name: `unclosed @${directive.name}`,
        input: buildNestedUnterminatedDirectiveInput(directive),
        openerName: directive.name,
        directiveLiterals: [
          "@wrapper",
          "@endwrapper",
          `@${directive.name}`,
          ...terminators.map((terminator) => `@${terminator}`),
        ],
      };
    });
}

function getDiscoveredUnterminatedDirectiveCases(): Array<{
  name: string;
  input: string;
  openerName: string;
  directiveLiterals: string[];
}> {
  return [
    {
      name: "discovered @widget with closer after wrapper boundary",
      input: [
        "@wrapper",
        "    <div>",
        "        @widget",
        "        <span>tail</span>",
        "    </div>",
        "@endwrapper",
        "@endwidget",
        "",
      ].join("\n"),
      openerName: "widget",
      directiveLiterals: ["@wrapper", "@endwrapper", "@widget", "@endwidget"],
    },
    {
      name: "discovered condition-like @disk with closer after wrapper boundary",
      input: [
        "@wrapper",
        "    <div>",
        "        @disk('local')",
        "        <span>tail</span>",
        "    </div>",
        "@endwrapper",
        "@elsedisk",
        "@enddisk",
        "",
      ].join("\n"),
      openerName: "disk",
      directiveLiterals: ["@wrapper", "@endwrapper", "@disk", "@elsedisk", "@enddisk"],
    },
  ];
}

function buildNestedUnterminatedDirectiveInput(directive: DiscoveredDirective): string {
  return [
    "@wrapper",
    "    <div>",
    `        @${directive.name}${directiveArgs(directive)}`,
    "        <span>tail</span>",
    "    </div>",
    "@endwrapper",
    "",
  ].join("\n");
}

function directiveArgs(directive: DiscoveredDirective): string {
  if (directive.args === ArgumentRequirement.NotAllowed) {
    return "";
  }

  switch (directive.name.toLowerCase()) {
    case "for":
      return "($i = 0; $i < 1; $i++)";
    case "foreach":
    case "forelse":
      return "($items as $item)";
    case "component":
    case "componentfirst":
      return "('components.alert')";
    case "context":
      return "('active')";
    case "error":
      return "('body')";
    case "fragment":
      return "('panel')";
    case "lang":
    case "production":
      return "";
    case "persist":
      return "('player')";
    case "prepend":
    case "prependonce":
      return "('styles')";
    case "push":
    case "pushif":
    case "pushonce":
      return "('scripts')";
    case "section":
    case "hassection":
    case "sectionmissing":
      return "('content')";
    case "session":
      return "('status')";
    case "slot":
      return "('header')";
    case "switch":
      return "($value)";
    case "teleport":
      return "('#modal')";
    default:
      return "($value)";
  }
}

function expectPayloadNotIndentedAsDirectiveChild(
  output: string,
  openerName: string,
  context: string,
): void {
  const lines = output.split(/\r?\n/u);
  const payloadIndex = lines.findIndex((line) => line.includes("<span>tail</span>"));
  expect(payloadIndex, `${context}: missing payload line`).toBeGreaterThanOrEqual(0);

  const openerPrefix = `@${openerName.toLowerCase()}`;
  let openerLine: string | null = null;
  for (let i = payloadIndex - 1; i >= 0; i--) {
    if (lines[i].trimStart().toLowerCase().startsWith(openerPrefix)) {
      openerLine = lines[i];
      break;
    }
  }

  expect(openerLine, `${context}: missing opener line`).not.toBeNull();
  expect(leadingIndent(lines[payloadIndex]), `${context}: payload was indented as a child`).toBe(
    leadingIndent(openerLine ?? ""),
  );
}

describe("directives/unterminated-directive-depth", () => {
  for (const profile of OPTION_PROFILES) {
    it(`does not duplicate unterminated body content across wrapper depths (${profile.name})`, async () => {
      for (let depth = 0; depth <= MAX_DEPTH; depth++) {
        const input = wrapInDiv(BASE_INPUT, depth);
        const output = await formatWithPasses(input, profile.options, {
          passes: 4,
          assertIdempotent: true,
        });
        const context = `${profile.name} depth=${depth}`;

        expect(
          countOccurrences(output, "Hello world"),
          `${context}: duplicated plain text payload`,
        ).toBe(1);
        expect(
          countOccurrences(output, "<p>Hello world"),
          `${context}: duplicated paragraph payload`,
        ).toBe(1);
        expect(
          countOccurrences(output, "@if"),
          `${context}: changed unterminated directive opener count`,
        ).toBe(countOccurrences(input, "@if"));
        expect(
          countOccurrences(output, "@endif"),
          `${context}: unexpected directive closers were inserted`,
        ).toBe(countOccurrences(input, "@endif"));

        expectCoreConstructDelimiterSafety(input, output, context);
        expectNoBladePhpConstructLoss(input, output, context);
      }
    });
  }

  for (const profile of OPTION_PROFILES) {
    it(`does not borrow outer closers for nested unterminated directives (${profile.name})`, async () => {
      for (const caseEntry of NESTED_UNTERMINATED_CASES) {
        for (let depth = 0; depth <= MAX_DEPTH; depth++) {
          const input = wrapInDiv(caseEntry.input, depth);
          const output = await formatWithPasses(input, profile.options, {
            passes: 4,
            assertIdempotent: true,
          });
          const context = `${caseEntry.name} ${profile.name} depth=${depth}`;

          for (const literal of caseEntry.directiveLiterals) {
            expect(
              countOccurrences(output, literal),
              `${context}: changed directive count for ${literal}`,
            ).toBe(countOccurrences(input, literal));
          }

          expectCoreConstructDelimiterSafety(input, output, context);
          expectNoBladePhpConstructLoss(input, output, context);
        }
      }
    });
  }

  for (const profile of OPTION_PROFILES) {
    it(`does not borrow outer closers for default block openers (${profile.name})`, async () => {
      for (const caseEntry of AUDITED_UNTERMINATED_CASES) {
        for (let depth = 0; depth <= AUDIT_MAX_DEPTH; depth++) {
          const input = wrapInDiv(caseEntry.input, depth);
          const output = await formatWithPasses(input, profile.options, {
            passes: 4,
            assertIdempotent: true,
          });
          const context = `${caseEntry.name} ${profile.name} depth=${depth}`;

          for (const literal of caseEntry.directiveLiterals) {
            expect(
              countDirectiveLiteralOccurrences(output, literal),
              `${context}: changed directive count for ${literal}`,
            ).toBe(countDirectiveLiteralOccurrences(input, literal));
          }

          expectPayloadNotIndentedAsDirectiveChild(output, caseEntry.openerName, context);
          expectCoreConstructDelimiterSafety(input, output, context);
          expectNoBladePhpConstructLoss(input, output, context);
        }
      }
    }, 15000);
  }
});
