function splitLines(value) {
  const lines = value.replace(/\r\n?/gu, "\n").split("\n");
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

function uniqueAnchors(left, right, leftStart, leftEnd, rightStart, rightEnd) {
  const leftInfo = new Map();
  const rightInfo = new Map();

  for (let index = leftStart; index < leftEnd; index++) {
    const line = left[index];
    const entry = leftInfo.get(line);
    leftInfo.set(line, entry ? { count: entry.count + 1, index } : { count: 1, index });
  }

  for (let index = rightStart; index < rightEnd; index++) {
    const line = right[index];
    const entry = rightInfo.get(line);
    rightInfo.set(line, entry ? { count: entry.count + 1, index } : { count: 1, index });
  }

  const pairs = [];
  for (const [line, leftEntry] of leftInfo) {
    const rightEntry = rightInfo.get(line);
    if (leftEntry.count === 1 && rightEntry?.count === 1) {
      pairs.push({ left: leftEntry.index, right: rightEntry.index });
    }
  }
  pairs.sort((a, b) => a.left - b.left);

  const tails = [];
  const tailIndices = [];
  const previous = Array.from({ length: pairs.length }).fill(-1);

  for (let index = 0; index < pairs.length; index++) {
    const rightIndex = pairs[index].right;
    let low = 0;
    let high = tails.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (tails[middle] < rightIndex) low = middle + 1;
      else high = middle;
    }
    tails[low] = rightIndex;
    previous[index] = low > 0 ? tailIndices[low - 1] : -1;
    tailIndices[low] = index;
  }

  const anchors = [];
  let cursor = tailIndices.at(-1) ?? -1;
  while (cursor !== -1) {
    anchors.push(pairs[cursor]);
    cursor = previous[cursor];
  }
  return anchors.reverse();
}

function appendDiff(operations, left, right, leftStart, leftEnd, rightStart, rightEnd) {
  while (leftStart < leftEnd && rightStart < rightEnd && left[leftStart] === right[rightStart]) {
    operations.push({ type: "equal", line: left[leftStart] });
    leftStart += 1;
    rightStart += 1;
  }

  const suffix = [];
  while (
    leftStart < leftEnd &&
    rightStart < rightEnd &&
    left[leftEnd - 1] === right[rightEnd - 1]
  ) {
    suffix.push(left[leftEnd - 1]);
    leftEnd -= 1;
    rightEnd -= 1;
  }

  if (leftStart === leftEnd) {
    for (let index = rightStart; index < rightEnd; index++) {
      operations.push({ type: "insert", line: right[index] });
    }
  } else if (rightStart === rightEnd) {
    for (let index = leftStart; index < leftEnd; index++) {
      operations.push({ type: "delete", line: left[index] });
    }
  } else {
    const anchors = uniqueAnchors(left, right, leftStart, leftEnd, rightStart, rightEnd);
    if (anchors.length === 0) {
      for (let index = leftStart; index < leftEnd; index++) {
        operations.push({ type: "delete", line: left[index] });
      }
      for (let index = rightStart; index < rightEnd; index++) {
        operations.push({ type: "insert", line: right[index] });
      }
    } else {
      let nextLeft = leftStart;
      let nextRight = rightStart;
      for (const anchor of anchors) {
        appendDiff(operations, left, right, nextLeft, anchor.left, nextRight, anchor.right);
        operations.push({ type: "equal", line: left[anchor.left] });
        nextLeft = anchor.left + 1;
        nextRight = anchor.right + 1;
      }
      appendDiff(operations, left, right, nextLeft, leftEnd, nextRight, rightEnd);
    }
  }

  for (let index = suffix.length - 1; index >= 0; index--) {
    operations.push({ type: "equal", line: suffix[index] });
  }
}

export function diffLines(leftText, rightText) {
  const left = splitLines(leftText);
  const right = splitLines(rightText);
  const operations = [];
  appendDiff(operations, left, right, 0, left.length, 0, right.length);
  return operations;
}

export function sideBySideRows(leftText, rightText) {
  const operations = diffLines(leftText, rightText);
  const rows = [];
  let leftLine = 1;
  let rightLine = 1;
  let cursor = 0;

  while (cursor < operations.length) {
    const operation = operations[cursor];
    if (operation.type === "equal") {
      rows.push({
        kind: "equal",
        left: { number: leftLine, text: operation.line },
        right: { number: rightLine, text: operation.line },
      });
      leftLine += 1;
      rightLine += 1;
      cursor += 1;
      continue;
    }

    const deleted = [];
    const inserted = [];
    while (cursor < operations.length && operations[cursor].type !== "equal") {
      const change = operations[cursor];
      if (change.type === "delete") deleted.push(change.line);
      else inserted.push(change.line);
      cursor += 1;
    }

    const count = Math.max(deleted.length, inserted.length);
    for (let index = 0; index < count; index++) {
      const leftText = deleted[index];
      const rightText = inserted[index];
      rows.push({
        kind: leftText === undefined ? "insert" : rightText === undefined ? "delete" : "change",
        left: leftText === undefined ? null : { number: leftLine++, text: leftText },
        right: rightText === undefined ? null : { number: rightLine++, text: rightText },
      });
    }
  }

  return rows;
}
