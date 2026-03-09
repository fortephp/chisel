import type { FlatNode, BuildResult } from "./tree/types.js";
import type { NodeKind } from "./tree/types.js";

export interface WrappedNode {
  kind: NodeKind | "frontMatter";
  flatIndex: number;
  flat: FlatNode;
  parent: WrappedNode | null;
  children: WrappedNode[];
  source: string;
  start: number;
  end: number;

  rawText: string;

  language?: string;
  explicitLanguage?: string | null;
  value?: string;
  startDelimiter?: string;
  endDelimiter?: string;
  raw?: string;

  buildResult: BuildResult;

  attrs: WrappedNode[];
  tagName: string;
  rawTagName: string;
  rawClosingTagName: string;
  fullName: string;
  name: string;
  namespace: string;
  hasClosingTag: boolean;
  openTagEndOffset: number;
  closingTagStartOffset: number;
  startLine: number;
  endLine: number;

  prev: WrappedNode | null;
  next: WrappedNode | null;

  isSelfClosing: boolean;
  hasHtmComponentClosingTag: boolean;
  condition: string;
  complete: boolean;
  conditionalStartIsRevealed: boolean;
  conditionalEndIsHidden: boolean;
  isIeConditionalStartComment: boolean;
  ieConditionalStartCondition: string;
  cssDisplay: string;
  isWhitespaceSensitive: boolean;
  isIndentationSensitive: boolean;
  isLeadingSpaceSensitive: boolean;
  isTrailingSpaceSensitive: boolean;
  isDanglingSpaceSensitive: boolean;
  hasLeadingSpaces: boolean;
  hasTrailingSpaces: boolean;
  hasDanglingSpaces: boolean;
}
