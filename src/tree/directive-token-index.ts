import { TokenType, type Token } from "../lexer/types.js";

export class DirectiveTokenIndex {
  private byName = new Map<string, number[]>();
  private allPositions: number[] = [];
  private allNames: string[] = [];
  private terminatorSetCache = new Map<string, Set<string>>();

  constructor(tokens: readonly Token[], source: string) {
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== TokenType.Directive) continue;
      const name = this.extractName(tokens[i], source);
      this.allPositions.push(i);
      this.allNames.push(name);
      let positions = this.byName.get(name);
      if (!positions) {
        positions = [];
        this.byName.set(name, positions);
      }
      positions.push(i);
    }
  }

  getPositionsAfter(name: string, minIdx: number): number[] {
    name = name.toLowerCase();
    const positions = this.byName.get(name);
    if (!positions) return [];

    const firstIdx = this.binarySearchGte(positions, minIdx);
    if (firstIdx === null) return [];

    return positions.slice(firstIdx);
  }

  existsAfter(name: string, minIdx: number): boolean {
    name = name.toLowerCase();
    const positions = this.byName.get(name);
    if (!positions || positions.length === 0) return false;
    if (positions[positions.length - 1] < minIdx) return false;
    return this.binarySearchGte(positions, minIdx) !== null;
  }

  findMatchingTerminator(
    directiveName: string,
    startIdx: number,
    terminators: string[],
  ): number | null {
    directiveName = directiveName.toLowerCase();
    const firstIdx = this.binarySearchGte(this.allPositions, startIdx);
    if (firstIdx === null) return null;

    const terminatorSet = this.getTerminatorSet(terminators);

    let nesting = 0;
    for (let i = firstIdx; i < this.allPositions.length; i++) {
      const name = this.allNames[i];
      if (name === directiveName) {
        nesting++;
        continue;
      }
      if (!terminatorSet.has(name)) continue;
      if (nesting === 0) return this.allPositions[i];
      nesting--;
    }

    return null;
  }

  hasTerminator(directiveName: string, startIdx: number, terminators: string[]): boolean {
    return this.findMatchingTerminator(directiveName, startIdx, terminators) !== null;
  }

  private extractName(token: Token, source: string): string {
    let text = source.slice(token.start, token.end);
    if (text.startsWith("@")) text = text.slice(1);
    return text.toLowerCase();
  }

  private getTerminatorSet(terminators: string[]): Set<string> {
    const key = terminators.join("|").toLowerCase();
    const cached = this.terminatorSetCache.get(key);
    if (cached) return cached;

    const set = new Set<string>();
    for (const term of terminators) {
      set.add(term.toLowerCase());
    }
    this.terminatorSetCache.set(key, set);
    return set;
  }

  private binarySearchGte(arr: number[], target: number): number | null {
    let lo = 0;
    let hi = arr.length - 1;
    let result: number | null = null;

    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (arr[mid] >= target) {
        result = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }

    return result;
  }
}
