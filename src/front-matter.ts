const DELIMITER_LENGTH = 3;
export const FRONT_MATTER_MARK = Symbol.for("PRETTIER_IS_FRONT_MATTER");
type FrontMatterMarked = { [FRONT_MATTER_MARK]?: true };

export interface FrontMatterPosition {
  index: number;
  line: number; // 1-based
  column: number; // 0-based
}

export interface FrontMatter {
  language: string;
  explicitLanguage: string | null;
  value: string;
  startDelimiter: string;
  endDelimiter: string;
  raw: string;
  start: FrontMatterPosition;
  end: FrontMatterPosition;
  [FRONT_MATTER_MARK]: true;
}

export interface ParsedFrontMatter {
  frontMatter?: FrontMatter;
  content: string;
}

export function markFrontMatter(value: object): void {
  (value as FrontMatterMarked)[FRONT_MATTER_MARK] = true;
}

export function hasFrontMatterMark(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  return (value as FrontMatterMarked)[FRONT_MATTER_MARK] === true;
}

function replaceNonLineBreaksWithSpace(text: string): string {
  return text.replaceAll(/[^\r\n]/g, " ");
}

function findLineBreakIndex(text: string, start: number): number {
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\n" || ch === "\r") {
      return i;
    }
  }
  return -1;
}

function skipLineBreak(text: string, index: number): number {
  if (index < 0 || index >= text.length) return index;
  if (text[index] === "\r" && index + 1 < text.length && text[index + 1] === "\n") {
    return index + 2;
  }
  return index + 1;
}

function getLineAndColumnAtEnd(text: string): { line: number; column: number } {
  let line = 1;
  let column = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\n") {
      line++;
      column = 0;
      continue;
    }
    if (ch === "\r") {
      if (i + 1 < text.length && text[i + 1] === "\n") {
        i++;
      }
      line++;
      column = 0;
      continue;
    }
    column++;
  }

  return { line, column };
}

function getFrontMatter(text: string): FrontMatter | undefined {
  const startDelimiter = text.slice(0, DELIMITER_LENGTH);
  if (startDelimiter !== "---" && startDelimiter !== "+++") {
    return;
  }

  const firstLineBreakIndex = findLineBreakIndex(text, DELIMITER_LENGTH);
  if (firstLineBreakIndex === -1) {
    return;
  }

  const contentStartIndex = skipLineBreak(text, firstLineBreakIndex);

  const explicitLanguage = text.slice(DELIMITER_LENGTH, firstLineBreakIndex).trim();

  let language = explicitLanguage;
  if (!language) {
    language = startDelimiter === "+++" ? "toml" : "yaml";
  }

  const allowYamlAltDelimiter = startDelimiter === "---" && language === "yaml";

  let endDelimiterStartIndex = -1;
  let endDelimiterEndIndex = -1;
  let cursor = contentStartIndex;

  while (cursor <= text.length) {
    const lineBreakIndex = findLineBreakIndex(text, cursor);
    const lineEnd = lineBreakIndex === -1 ? text.length : lineBreakIndex;
    const line = text.slice(cursor, lineEnd);

    if (line === startDelimiter || (allowYamlAltDelimiter && line === "...")) {
      endDelimiterStartIndex = cursor;
      endDelimiterEndIndex = lineEnd;
      break;
    }

    if (lineBreakIndex === -1) {
      break;
    }

    cursor = skipLineBreak(text, lineBreakIndex);
  }

  if (endDelimiterStartIndex === -1 || endDelimiterEndIndex === -1) {
    return;
  }

  const frontMatterEndIndex = endDelimiterEndIndex;
  const raw = text.slice(0, frontMatterEndIndex);
  const endPosition = getLineAndColumnAtEnd(raw);
  const endDelimiter = text.slice(endDelimiterStartIndex, endDelimiterEndIndex);

  return {
    language,
    explicitLanguage: explicitLanguage || null,
    value: text.slice(contentStartIndex, endDelimiterStartIndex),
    startDelimiter,
    endDelimiter,
    raw,
    start: { line: 1, column: 0, index: 0 },
    end: {
      index: raw.length,
      line: endPosition.line,
      column: endPosition.column,
    },
    [FRONT_MATTER_MARK]: true,
  };
}

export function parseFrontMatter(text: string): ParsedFrontMatter {
  const frontMatter = getFrontMatter(text);
  if (!frontMatter) {
    return { content: text };
  }

  return {
    frontMatter,
    content: replaceNonLineBreaksWithSpace(frontMatter.raw) + text.slice(frontMatter.raw.length),
  };
}
