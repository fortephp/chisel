export function buildLineOffsets(source: string): number[] {
  const offsets = [0];
  for (let i = 0; i < source.length; i++) {
    if (source[i] === "\n") {
      offsets.push(i + 1);
      continue;
    }

    if (source[i] === "\r") {
      if (i + 1 < source.length && source[i + 1] === "\n") {
        i++;
      }
      offsets.push(i + 1);
    }
  }
  return offsets;
}

export function getLine(offset: number, lineOffsets: number[]): number {
  let lo = 0;
  let hi = lineOffsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineOffsets[mid] <= offset) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo;
}
