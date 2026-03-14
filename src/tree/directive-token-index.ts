import { TokenType, type Token } from "../lexer/types.js";

export class DirectiveTokenIndex {
  private byName = new Map<string, number[]>();
  private allPositions: number[] = [];
  private allNames: string[] = [];
  private nameSetCache = new Map<string, Set<string>>();

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

  existsBetween(name: string, minIdx: number, maxIdxExclusive: number): boolean {
    name = name.toLowerCase();
    const positions = this.byName.get(name);
    if (!positions || positions.length === 0) return false;
    if (positions[positions.length - 1] < minIdx) return false;

    const firstIdx = this.binarySearchGte(positions, minIdx);
    if (firstIdx === null) return false;

    return positions[firstIdx] < maxIdxExclusive;
  }

  findMatchingTerminator(
    directiveName: string,
    startIdx: number,
    terminators: string[],
    maxIdxExclusive: number | null = null,
    initialNesting = 0,
  ): number | null {
    return this.findMatchingTerminatorForOpeners(
      [directiveName],
      startIdx,
      terminators,
      maxIdxExclusive,
      initialNesting,
    );
  }

  findMatchingTerminatorForOpeners(
    openerNames: string[],
    startIdx: number,
    terminators: string[],
    maxIdxExclusive: number | null = null,
    initialNesting = 0,
  ): number | null {
    const firstIdx = this.binarySearchGte(this.allPositions, startIdx);
    if (firstIdx === null) return null;

    const openerSet = this.getNameSet(openerNames);
    const terminatorSet = this.getNameSet(terminators);

    let nesting = initialNesting;
    for (let i = firstIdx; i < this.allPositions.length; i++) {
      if (maxIdxExclusive !== null && this.allPositions[i] >= maxIdxExclusive) {
        return null;
      }

      const name = this.allNames[i];
      if (openerSet.has(name)) {
        nesting++;
        continue;
      }
      if (!terminatorSet.has(name)) continue;
      if (nesting === 0) return this.allPositions[i];
      nesting--;
    }

    return null;
  }

  hasTerminator(
    directiveName: string,
    startIdx: number,
    terminators: string[],
    maxIdxExclusive: number | null = null,
  ): boolean {
    return (
      this.findMatchingTerminator(directiveName, startIdx, terminators, maxIdxExclusive) !== null
    );
  }

  findMatchingBoundary(
    directiveName: string,
    startIdx: number,
    terminatorNames: string[],
    branchNames: string[] = [],
    maxIdxExclusive: number | null = null,
    initialNesting = 0,
  ): number | null {
    return this.findMatchingBoundaryForOpeners(
      [directiveName],
      startIdx,
      terminatorNames,
      branchNames,
      maxIdxExclusive,
      initialNesting,
    );
  }

  findMatchingBoundaryForOpeners(
    openerNames: string[],
    startIdx: number,
    terminatorNames: string[],
    branchNames: string[] = [],
    maxIdxExclusive: number | null = null,
    initialNesting = 0,
  ): number | null {
    const firstIdx = this.binarySearchGte(this.allPositions, startIdx);
    if (firstIdx === null) return null;

    const openerSet = this.getNameSet(openerNames);
    const terminatorSet = this.getNameSet(terminatorNames);
    const branchSet = this.getNameSet(branchNames);

    let nesting = initialNesting;
    for (let i = firstIdx; i < this.allPositions.length; i++) {
      if (maxIdxExclusive !== null && this.allPositions[i] >= maxIdxExclusive) {
        return null;
      }

      const name = this.allNames[i];
      if (openerSet.has(name)) {
        nesting++;
        continue;
      }

      if (branchSet.has(name)) {
        if (nesting === 0) {
          return this.allPositions[i];
        }
        continue;
      }

      if (!terminatorSet.has(name)) continue;
      if (nesting === 0) {
        return this.allPositions[i];
      }
      nesting--;
    }

    return null;
  }

  analyzeUnknownDirective(
    directiveName: string,
    startIdx: number,
    terminatorNames: string[],
    branchNames: string[] = [],
    maxIdxExclusive: number | null = null,
  ): { terminatorIdx: number | null; terminatorName: string | null; branchIdx: number | null } {
    return this.analyzeUnknownDirectiveFamily(
      [directiveName],
      startIdx,
      terminatorNames,
      branchNames,
      maxIdxExclusive,
    );
  }

  analyzeUnknownDirectiveFamily(
    openerNames: string[],
    startIdx: number,
    terminatorNames: string[],
    branchNames: string[] = [],
    maxIdxExclusive: number | null = null,
  ): { terminatorIdx: number | null; terminatorName: string | null; branchIdx: number | null } {
    const openerSet = this.getNameSet(openerNames);
    const terminatorSet = this.getNameSet(terminatorNames);
    const branchSet = this.getNameSet(branchNames);

    const firstIdx = this.binarySearchGte(this.allPositions, startIdx);
    if (firstIdx === null) {
      return { terminatorIdx: null, terminatorName: null, branchIdx: null };
    }

    let nesting = 0;
    let branchIdx: number | null = null;

    for (let i = firstIdx; i < this.allPositions.length; i++) {
      if (maxIdxExclusive !== null && this.allPositions[i] >= maxIdxExclusive) {
        return { terminatorIdx: null, terminatorName: null, branchIdx: null };
      }

      const name = this.allNames[i];
      if (openerSet.has(name)) {
        nesting++;
        continue;
      }

      if (terminatorSet.has(name)) {
        if (nesting === 0) {
          return {
            terminatorIdx: this.allPositions[i],
            terminatorName: name,
            branchIdx,
          };
        }
        nesting--;
        continue;
      }

      if (branchSet.has(name) && nesting === 0 && branchIdx === null) {
        branchIdx = this.allPositions[i];
      }
    }

    return { terminatorIdx: null, terminatorName: null, branchIdx: null };
  }

  private extractName(token: Token, source: string): string {
    let text = source.slice(token.start, token.end);
    if (text.startsWith("@")) text = text.slice(1);
    return text.toLowerCase();
  }

  private getNameSet(names: string[]): Set<string> {
    const key = names.join("|").toLowerCase();
    const cached = this.nameSetCache.get(key);
    if (cached) return cached;

    const set = new Set<string>();
    for (const name of names) {
      set.add(name.toLowerCase());
    }
    this.nameSetCache.set(key, set);
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
