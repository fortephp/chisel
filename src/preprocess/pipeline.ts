import type { WrappedNode } from "../types.js";
import { nodeKindLabel } from "../tree/types.js";

export interface PreprocessStage {
  name: string;
  run: () => void;
  validateParents?: boolean;
  validateSiblings?: boolean;
}

interface ExecutePreprocessStageOptions {
  validateStages: boolean;
}

function getNodeKindName(node: WrappedNode): string {
  return typeof node.kind === "number" ? nodeKindLabel(node.kind) : node.kind;
}

function assertParentLinks(node: WrappedNode): void {
  for (const child of node.children) {
    if (child.parent !== node) {
      throw new Error(
        `Invalid parent link: child ${getNodeKindName(child)} does not point to parent ${getNodeKindName(node)}`,
      );
    }
    assertParentLinks(child);
  }
}

function assertSiblingLinks(node: WrappedNode): void {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const expectedPrev = i > 0 ? node.children[i - 1] : null;
    const expectedNext = i < node.children.length - 1 ? node.children[i + 1] : null;
    if (child.prev !== expectedPrev || child.next !== expectedNext) {
      throw new Error(
        `Invalid sibling links on ${getNodeKindName(child)} under ${getNodeKindName(node)}`,
      );
    }
    assertSiblingLinks(child);
  }
}

function runPreprocessStage(
  ast: WrappedNode,
  stage: PreprocessStage,
  options: ExecutePreprocessStageOptions,
): void {
  stage.run();
  if (!options.validateStages) {
    return;
  }

  try {
    if (stage.validateParents) {
      assertParentLinks(ast);
    }
    if (stage.validateSiblings) {
      assertSiblingLinks(ast);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown preprocess failure";
    throw new Error(`[preprocess:${stage.name}] ${message}`);
  }
}

export function executePreprocessStages(
  ast: WrappedNode,
  stages: PreprocessStage[],
  { validateStages = false }: { validateStages?: boolean } = {},
): void {
  for (const stage of stages) {
    runPreprocessStage(ast, stage, { validateStages });
  }
}
