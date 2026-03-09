export function trimFinalLineBreak(text: string): string {
  if (text.endsWith("\r\n")) return text.slice(0, -2);
  if (text.endsWith("\n")) return text.slice(0, -1);
  return text;
}

export function normalizeLineEndingsToLf(text: string): string {
  return text.replace(/\r\n?/gu, "\n");
}

export function safeSerialize(value: unknown): string {
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return String(value);
  }
}

export function trimTrailingHorizontalWhitespace(value: string): string {
  return value.replace(/[ \t]+(?=\r?\n|$)/gu, "");
}
