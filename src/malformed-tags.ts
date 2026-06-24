export function hasSwallowedTagSyntaxInOpeningSource(openingSource: string): boolean {
  const firstNewlineIdx = openingSource.search(/[\r\n]/u);
  if (firstNewlineIdx < 0) {
    return false;
  }

  const tagPattern = /<(?!\/)([A-Za-z][\w:-]*)/gu;
  const sourceAfterNewline = openingSource.slice(firstNewlineIdx);
  return tagPattern.test(sourceAfterNewline);
}
