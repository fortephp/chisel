import type { Doc } from "prettier";
import { doc } from "prettier";

const { ifBreak } = doc.builders;

/**
 * Apply nested `ifBreak` checks from right to left so a flat-space fallback
 * can be gated by one or more parent groups.
 */
export function ifBreakChain(
  flatDoc: Doc,
  groupIds: Array<symbol | undefined>,
  breakDoc: Doc = "",
): Doc {
  let chained = flatDoc;
  for (let i = groupIds.length - 1; i >= 0; i--) {
    const groupId = groupIds[i];
    if (!groupId) {
      continue;
    }
    chained = ifBreak(breakDoc, chained, { groupId });
  }
  return chained;
}
