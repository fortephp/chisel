export type IgnoreCommentKind = "ignore" | "ignore-start" | "ignore-end";
export type IgnoreCommentWrapper = "blade" | "html";

export function getIgnoreCommentKindFromPayload(payload: string): IgnoreCommentKind | null {
  switch (payload.trim().toLowerCase()) {
    case "format-ignore":
    case "prettier-ignore":
      return "ignore";
    case "format-ignore-start":
    case "prettier-ignore-start":
      return "ignore-start";
    case "format-ignore-end":
    case "prettier-ignore-end":
      return "ignore-end";
    default:
      return null;
  }
}

export function getIgnoreCommentKindFromCommentText(
  text: string,
  wrapper: IgnoreCommentWrapper,
): IgnoreCommentKind | null {
  const payload =
    wrapper === "blade"
      ? (text.match(/^\{\{--\s*([\s\S]*?)\s*--\}\}$/s)?.[1] ?? null)
      : (text.match(/^<!--\s*([\s\S]*?)\s*-->$/s)?.[1] ?? null);

  if (payload === null) {
    return null;
  }

  return getIgnoreCommentKindFromPayload(payload);
}
