import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { format } from "../helpers.js";

const ALPINE_CORE_MANIFEST = join(
  process.cwd(),
  "tests",
  "fixtures",
  "alpine",
  "core-directives.json",
);

const COVERED_DIRECTIVES = new Set<string>([
  "bind",
  "cloak",
  "data",
  "effect",
  "for",
  "html",
  "id",
  "if",
  "ignore",
  "init",
  "model",
  "modelable",
  "on",
  "ref",
  "show",
  "teleport",
  "text",
  "transition",
]);

const COVERED_MODIFIERS: Record<string, readonly string[]> = {
  ignore: ["self"],
  model: [
    "parent",
    "change",
    "lazy",
    "blur",
    "enter",
    "fill",
    "unintrusive",
    "number",
    "boolean",
    "trim",
  ],
  show: ["important", "immediate"],
  teleport: ["prepend", "append"],
  transition: ["in", "out", "opacity", "scale", "delay", "origin", "duration"],
};

function readReferenceDirectiveCoverage(): {
  directives: Set<string>;
  modifiersByDirective: Map<string, Set<string>>;
} {
  const raw = JSON.parse(readFileSync(ALPINE_CORE_MANIFEST, "utf8")) as {
    directives: string[];
    modifiersByDirective: Record<string, string[]>;
  };
  const directives = new Set(raw.directives);
  const modifiersByDirective = new Map<string, Set<string>>();

  for (const [directive, modifiers] of Object.entries(raw.modifiersByDirective)) {
    modifiersByDirective.set(directive, new Set(modifiers));
  }

  return { directives, modifiersByDirective };
}

describe("html/alpine-reference", () => {
  it("covers all core Alpine directives from reference", () => {
    const { directives } = readReferenceDirectiveCoverage();
    const missing = [...directives].filter((name) => !COVERED_DIRECTIVES.has(name));

    expect(missing).toEqual([]);
  });

  it("covers all core Alpine modifiers from reference", () => {
    const { modifiersByDirective } = readReferenceDirectiveCoverage();
    const missing: string[] = [];

    for (const [directive, modifiers] of modifiersByDirective) {
      const covered = new Set(COVERED_MODIFIERS[directive] ?? []);
      for (const modifier of modifiers) {
        if (!covered.has(modifier)) {
          missing.push(`${directive}.${modifier}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it("formats a representative core Alpine directive/modifier matrix", async () => {
    const input = `<div x-data="{open:false,count:0}" x-bind:class="{active:open}" :title="count + 1" x-init="count++;setup()" x-on:click.prevent.stop.once="count++;doThing($event)" @keydown.enter.debounce.250ms.window.prevent="submit($event)" x-model.number.trim.lazy.blur.change.enter.parent.unintrusive.fill.boolean="form.name" x-show.important.immediate="open" x-transition.in.out.opacity.scale.95.duration.500ms.delay.75ms.origin.top.left="open" x-text="item.name" x-html="html" x-effect="sync()" x-for="item in items" x-if="open" x-ref="panel" x-id="['panel']" x-ignore.self x-cloak x-modelable="model" x-teleport.append="body"></div>
`;
    const output = await format(input);

    for (const name of [
      "x-data",
      "x-bind:class",
      ":title",
      "x-init",
      "x-on:click.prevent.stop.once",
      "@keydown",
      ".enter.debounce.250ms.window.prevent",
      "x-model.number.trim.lazy.blur.change.enter.parent.unintrusive.fill.boolean",
      "x-show.important.immediate",
      "x-transition.in.out.opacity.scale.95.duration.500ms.delay.75ms.origin.top.left",
      "x-text",
      "x-html",
      "x-effect",
      "x-for",
      "x-if",
      "x-ref",
      "x-id",
      "x-ignore.self",
      "x-cloak",
      "x-modelable",
      "x-teleport.append",
    ]) {
      expect(output).toContain(name);
    }

    expect(output).toContain("count++;");
    expect(output).toContain("doThing($event);");
  });

  it("preserves common Alpine plugin-style directives and modifiers", async () => {
    const input = `<div x-collapse.duration.400ms x-intersect.enter.once.half="intersected=true" x-intersect.leave.full.margin.-100px="hidden=true" x-mask:dynamic="$money($input)" x-sort:item="id" x-anchor.bottom-start.offset.8="button" x-resize.document.debounce.100ms="resized=true" x-trap.noscroll.inert="open"></div>
`;
    const output = await format(input);

    for (const name of [
      "x-collapse.duration.400ms",
      "x-intersect.enter.once.half",
      "x-intersect.leave.full.margin.-100px",
      "x-mask:dynamic",
      "x-sort:item",
      "x-anchor.bottom-start.offset.8",
      "x-resize.document.debounce.100ms",
      "x-trap.noscroll.inert",
    ]) {
      expect(output).toContain(name);
    }
  });
});
