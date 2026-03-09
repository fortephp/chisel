export function isBlockLikeCssDisplay(display: string): boolean {
  return display === "block" || display === "list-item" || display.startsWith("table");
}

export function isFirstChildLeadingSpaceSensitiveCssDisplay(display: string): boolean {
  return !isBlockLikeCssDisplay(display) && display !== "inline-block";
}

export function isLastChildTrailingSpaceSensitiveCssDisplay(display: string): boolean {
  return !isBlockLikeCssDisplay(display) && display !== "inline-block";
}

export function isNextLeadingSpaceSensitiveCssDisplay(display: string): boolean {
  return !isBlockLikeCssDisplay(display);
}

export function isPrevTrailingSpaceSensitiveCssDisplay(display: string): boolean {
  return !isBlockLikeCssDisplay(display);
}
