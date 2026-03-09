export interface PosRef {
  value: number;
}

export function findLineEnding(src: string, pos: number, len: number): number {
  for (let i = pos; i < len; i++) {
    const ch = src[i];
    if (ch === "\n" || ch === "\r") return i;
  }
  return -1;
}

export function skipLineEnding(src: string, pos: PosRef, len: number): void {
  if (pos.value >= len) return;

  const byte = src[pos.value];
  if (byte === "\n") {
    pos.value++;
  } else if (byte === "\r") {
    pos.value++;
    if (pos.value < len && src[pos.value] === "\n") {
      pos.value++;
    }
  }
}

export function skipQuotedString(src: string, pos: PosRef, len: number, quote: string): void {
  while (pos.value < len) {
    const quotePos = src.indexOf(quote, pos.value);

    if (quotePos === -1) {
      pos.value = len;
      return;
    }

    pos.value = quotePos;

    // Count preceding backslashes
    let backslashCount = 0;
    let checkPos = pos.value - 1;
    while (checkPos >= 0 && src[checkPos] === "\\") {
      backslashCount++;
      checkPos--;
    }

    pos.value++; // Move past the quote

    if (backslashCount % 2 === 0) {
      return;
    }
  }

  pos.value = len;
}

export function skipBlockComment(src: string, pos: PosRef, len: number): void {
  while (pos.value < len) {
    const starPos = src.indexOf("*", pos.value);

    if (starPos === -1) {
      pos.value = len;
      return;
    }

    pos.value = starPos + 1; // Move past *

    if (pos.value < len && src[pos.value] === "/") {
      pos.value++; // Move past /
      return;
    }
  }

  pos.value = len;
}

export function skipLineComment(src: string, pos: PosRef, len: number): void {
  const lineEndPos = findLineEnding(src, pos.value, len);

  if (lineEndPos === -1) {
    pos.value = len;
  } else {
    pos.value = lineEndPos;
    skipLineEnding(src, pos, len);
  }
}

export function skipLineCommentStoppingAt(
  src: string,
  pos: PosRef,
  len: number,
  stopSequence: string,
): boolean {
  const seqLen = stopSequence.length;

  while (pos.value < len) {
    const byte = src[pos.value];

    if (byte === "\n" || byte === "\r") {
      pos.value++;
      return false;
    }

    if (pos.value + seqLen <= len && src.slice(pos.value, pos.value + seqLen) === stopSequence) {
      return true;
    }

    pos.value++;
  }

  return false;
}

export function skipLineCommentDetecting(
  src: string,
  pos: PosRef,
  len: number,
  sequences: string[],
): Array<{ sequence: string; offset: number }> {
  const detected: Array<{ sequence: string; offset: number }> = [];

  const lineEndPos = findLineEnding(src, pos.value, len);
  const endPos = lineEndPos === -1 ? len : lineEndPos;

  for (const sequence of sequences) {
    const seqLen = sequence.length;
    let searchPos = pos.value;

    while (searchPos + seqLen <= endPos) {
      const foundPos = src.indexOf(sequence, searchPos);

      if (foundPos === -1 || foundPos >= endPos) {
        break;
      }

      detected.push({ sequence, offset: foundPos });
      searchPos = foundPos + seqLen;
    }
  }

  if (lineEndPos === -1) {
    pos.value = len;
  } else {
    pos.value = lineEndPos;
    skipLineEnding(src, pos, len);
  }

  return detected;
}

export function skipHeredoc(src: string, pos: PosRef, len: number): void {
  if (pos.value >= len) return;

  const isNowdoc = src[pos.value] === "'";
  if (isNowdoc) {
    pos.value++; // Skip opening quote
  }

  const delimStart = pos.value;
  while (pos.value < len) {
    const ch = src.charCodeAt(pos.value);
    // alphanumeric or _
    if ((ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || (ch >= 48 && ch <= 57) || ch === 95) {
      pos.value++;
    } else {
      break;
    }
  }

  if (pos.value === delimStart) {
    pos.value = len;
    return;
  }

  const delimiter = src.slice(delimStart, pos.value);

  if (isNowdoc && pos.value < len && src[pos.value] === "'") {
    pos.value++;
  }

  // Skip to end of opening line
  const lineEndPos = findLineEnding(src, pos.value, len);
  if (lineEndPos === -1) {
    pos.value = len;
    return;
  }
  pos.value = lineEndPos;
  skipLineEnding(src, pos, len);

  const delimLen = delimiter.length;

  // Scan for closing delimiter on its own line
  while (pos.value < len) {
    if (pos.value + delimLen <= len) {
      const potentialDelim = src.slice(pos.value, pos.value + delimLen);

      if (potentialDelim === delimiter) {
        const afterPos = pos.value + delimLen;
        if (
          afterPos >= len ||
          src[afterPos] === "\n" ||
          src[afterPos] === "\r" ||
          src[afterPos] === ";"
        ) {
          pos.value = afterPos;

          if (pos.value < len && src[pos.value] === ";") {
            pos.value++;
          }

          skipLineEnding(src, pos, len);
          return;
        }
      }
    }

    // Not the delimiter, skip to next line
    const nextLineEnd = findLineEnding(src, pos.value, len);
    if (nextLineEnd === -1) {
      pos.value = len;
      return;
    }
    pos.value = nextLineEnd;
    skipLineEnding(src, pos, len);
  }

  pos.value = len;
}

export function skipTemplateLiteral(src: string, pos: PosRef, len: number): void {
  while (pos.value < len) {
    const byte = src[pos.value];

    if (byte === "`") {
      pos.value++;
      return;
    } else if (byte === "\\") {
      pos.value += 2;
    } else if (byte === "$" && pos.value + 1 < len && src[pos.value + 1] === "{") {
      // Template expression ${...}
      pos.value += 2;
      skipTemplateExpression(src, pos, len);
    } else {
      pos.value++;
    }
  }
}

export function skipTemplateExpression(src: string, pos: PosRef, len: number): void {
  let depth = 1;

  while (depth > 0 && pos.value < len) {
    const byte = src[pos.value];

    if (byte === "{") {
      depth++;
      pos.value++;
    } else if (byte === "}") {
      depth--;
      pos.value++;
    } else if (byte === "'" || byte === '"') {
      pos.value++;
      skipQuotedString(src, pos, len, byte);
    } else if (byte === "`") {
      pos.value++;
      skipTemplateLiteral(src, pos, len);
    } else if (byte === "/" && pos.value + 1 < len) {
      const next = src[pos.value + 1];
      if (next === "/") {
        pos.value += 2;
        skipLineComment(src, pos, len);
      } else if (next === "*") {
        pos.value += 2;
        skipBlockComment(src, pos, len);
      } else {
        pos.value++;
      }
    } else {
      pos.value++;
    }
  }
}

export function skipBacktickString(src: string, pos: PosRef, len: number): void {
  skipQuotedString(src, pos, len, "`");
}
