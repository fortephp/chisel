import { TokenType, State, type Token } from "./types.js";
import { Directives } from "./directives.js";
import { ErrorReason, type LexerError } from "./errors.js";
import { isFrontendEventStyleAtName } from "../frontend-attribute-names.js";
import {
  skipQuotedString,
  skipBacktickString,
  skipBlockComment,
  skipLineCommentDetecting,
  skipHeredoc,
  skipTemplateLiteral,
  type PosRef,
} from "./scan-primitives.js";

const RAWTEXT_ELEMENTS = new Set(["script", "style"]);
const ATTR_LIKE_AT_NAME_CONTINUATION = new Set([".", "-", ":", "[", "]"]);

export interface LexerResult {
  tokens: Token[];
  errors: LexerError[];
}

export interface LexerRawBlockConfig {
  verbatimStartDirectives?: readonly string[];
  verbatimEndDirectives?: readonly string[];
}

export class Lexer {
  private src: string;
  private pos = 0;
  private len: number;
  private state: State = State.Data;
  private returnState: State = State.Data;
  private tokens: Token[] = [];
  private errors: LexerError[] = [];
  private verbatim = false;
  private verbatimReturnState: State | null = null;
  private phpBlock = false;
  private phpTag = false;
  private attrPhpDirectiveDepth = 0;
  private rawtextTagName = "";
  private currentTagName = "";

  private isAtAttributeCandidate(nameLower: string, afterNamePos: number): boolean {
    if (afterNamePos >= this.len) {
      return isFrontendEventStyleAtName(nameLower);
    }

    const immediate = this.src[afterNamePos];
    if (ATTR_LIKE_AT_NAME_CONTINUATION.has(immediate)) {
      return true;
    }

    let pos = afterNamePos;
    while (pos < this.len && isSpace(this.src.charCodeAt(pos))) {
      pos++;
    }

    if (pos < this.len && this.src[pos] === "=") {
      return true;
    }

    if (!isFrontendEventStyleAtName(nameLower)) {
      return false;
    }

    return (
      pos >= this.len ||
      this.src[pos] === ">" ||
      this.src[pos] === "/" ||
      isSpace(immediate.charCodeAt(0))
    );
  }
  private isClosingTag = false;
  private continuedTagName = false;
  private inXmlDeclaration = false;
  private _directives: Directives;
  private verbatimStartDirectives = new Set<string>(["verbatim"]);
  private verbatimEndDirectives = new Set<string>(["endverbatim"]);

  constructor(source: string, directives?: Directives, rawBlockConfig?: LexerRawBlockConfig) {
    this.src = source;
    this.len = source.length;
    this._directives = directives ?? Directives.acceptAll();

    for (const directive of rawBlockConfig?.verbatimStartDirectives ?? []) {
      const normalized = normalizeDirectiveName(directive);
      if (normalized) this.verbatimStartDirectives.add(normalized);
    }

    for (const directive of rawBlockConfig?.verbatimEndDirectives ?? []) {
      const normalized = normalizeDirectiveName(directive);
      if (normalized) this.verbatimEndDirectives.add(normalized);
    }
  }

  directives(): Directives {
    return this._directives;
  }

  tokenize(): LexerResult {
    while (this.pos < this.len) {
      switch (this.state) {
        case State.Data:
          this.scanData();
          break;
        case State.RawText:
          this.scanRawtext();
          break;
        case State.BladeComment:
          this.scanBladeCommentContent();
          break;
        case State.Comment:
          this.scanComment();
          break;
        case State.TagName:
          this.scanTagName();
          break;
        case State.BeforeAttrName:
          this.scanBeforeAttrName();
          break;
        case State.AttrName:
          this.scanAttrName();
          break;
        case State.AfterAttrName:
          this.scanAfterAttrName();
          break;
        case State.BeforeAttrValue:
          this.scanBeforeAttrValue();
          break;
        case State.AttrValueQuoted:
          this.scanAttrValueQuoted();
          break;
        case State.AttrValueUnquoted:
          this.scanAttrValueUnquoted();
          break;
        default:
          break;
      }
    }

    // EOF in tag - emit SyntheticClose
    if (
      this.state === State.TagName ||
      this.state === State.BeforeAttrName ||
      this.state === State.AttrName ||
      this.state === State.AfterAttrName ||
      this.state === State.BeforeAttrValue ||
      this.state === State.AttrValueQuoted ||
      this.state === State.AttrValueUnquoted
    ) {
      this.emit(TokenType.SyntheticClose, this.pos, this.pos);
    }

    return { tokens: this.tokens, errors: this.errors };
  }

  private emit(type: TokenType, start: number, end: number): void {
    this.tokens.push({ type, start, end });
  }

  private logError(reason: ErrorReason, offset: number): void {
    this.errors.push({ reason, offset });
  }

  private peek(): string | null {
    return this.pos < this.len ? this.src[this.pos] : null;
  }

  private peekAhead(n: number): string | null {
    const p = this.pos + n;
    return p < this.len ? this.src[p] : null;
  }

  private skipWhitespace(): void {
    while (this.pos < this.len && isSpace(this.src.charCodeAt(this.pos))) {
      this.pos++;
    }
  }

  private skipAndEmitWhitespace(): void {
    const start = this.pos;
    while (this.pos < this.len && isSpace(this.src.charCodeAt(this.pos))) {
      this.pos++;
    }
    if (start < this.pos) {
      this.emit(TokenType.Whitespace, start, this.pos);
    }
  }

  private scanAttributePhpDirectiveContent(): boolean {
    if (this.attrPhpDirectiveDepth <= 0) return false;

    const start = this.pos;

    while (this.pos < this.len) {
      const ch = this.src[this.pos];

      if (ch === '"' || ch === "'") {
        this.pos++;
        this.skipQuotedStringPrim(ch);
        continue;
      }

      if (ch === "`") {
        this.pos++;
        this.skipBacktickStringPrim();
        continue;
      }

      if (ch === "/" && this.pos + 1 < this.len) {
        const next = this.src[this.pos + 1];
        if (next === "/") {
          this.pos += 2;
          while (this.pos < this.len) {
            const c = this.src[this.pos];
            if (c === "\n" || c === "\r") {
              this.pos++;
              break;
            }
            this.pos++;
          }
          continue;
        }
        if (next === "*") {
          this.pos += 2;
          this.skipBlockCommentPrim();
          continue;
        }
      }

      if (ch === "#") {
        this.pos++;
        while (this.pos < this.len) {
          const c = this.src[this.pos];
          if (c === "\n" || c === "\r") {
            this.pos++;
            break;
          }
          this.pos++;
        }
        continue;
      }

      if (
        ch === "<" &&
        this.pos + 2 < this.len &&
        this.src[this.pos + 1] === "<" &&
        this.src[this.pos + 2] === "<"
      ) {
        this.pos += 3;
        this.skipHeredocPrim();
        continue;
      }

      if (ch === "@" && !this.verbatim && !this.phpTag) {
        let nameEnd = this.pos + 1;
        while (nameEnd < this.len) {
          const cc = this.src.charCodeAt(nameEnd);
          if (isAlnum(cc) || cc === 95) {
            nameEnd++;
          } else {
            break;
          }
        }

        if (nameEnd > this.pos + 1) {
          const name = this.src.slice(this.pos + 1, nameEnd).toLowerCase();
          if (name === "php" || name === "endphp") {
            if (start < this.pos) {
              this.emit(TokenType.Text, start, this.pos);
            }
            this.returnState = this.state;
            this.scanDirective();
            return true;
          }
        }
      }

      this.pos++;
    }

    if (start < this.pos) {
      this.emit(TokenType.Text, start, this.pos);
    }

    return true;
  }

  private posRef(): PosRef {
    return { value: this.pos };
  }

  private syncPos(ref: PosRef): void {
    this.pos = ref.value;
  }

  private skipQuotedStringPrim(quote: string): void {
    const ref = this.posRef();
    skipQuotedString(this.src, ref, this.len, quote);
    this.syncPos(ref);
  }

  private skipBlockCommentPrim(): void {
    const ref = this.posRef();
    skipBlockComment(this.src, ref, this.len);
    this.syncPos(ref);
  }

  private skipHeredocPrim(): void {
    const ref = this.posRef();
    skipHeredoc(this.src, ref, this.len);
    this.syncPos(ref);
  }

  private skipBacktickStringPrim(): void {
    const ref = this.posRef();
    skipBacktickString(this.src, ref, this.len);
    this.syncPos(ref);
  }

  private skipTemplateLiteralPrim(): void {
    const ref = this.posRef();
    skipTemplateLiteral(this.src, ref, this.len);
    this.syncPos(ref);
  }

  /**
   * Skip line comment with warnings about ?> inside comments.
   */
  private skipLineCommentWithWarnings(): void {
    const ref = this.posRef();
    const detected = skipLineCommentDetecting(this.src, ref, this.len, ["?>"]);
    this.syncPos(ref);

    for (const d of detected) {
      this.logError(ErrorReason.PhpCloseTagInComment, d.offset);
    }
  }

  /**
   * Detect if the current position starts a Blade/PHP construct.
   * Used for construct collision detection inside echos.
   */
  private detectConstruct(): boolean {
    if (this.pos >= this.len) return false;
    const byte = this.src[this.pos];

    // Triple echo: {{{
    if (byte === "{" && this.peekAhead(1) === "{" && this.peekAhead(2) === "{") {
      return true;
    }

    // Blade comment: {{--
    if (
      byte === "{" &&
      this.peekAhead(1) === "{" &&
      this.peekAhead(2) === "-" &&
      this.peekAhead(3) === "-"
    ) {
      return true;
    }

    // Raw echo: {!!
    if (byte === "{" && this.peekAhead(1) === "!" && this.peekAhead(2) === "!") {
      return true;
    }

    // Echo: {{
    if (byte === "{" && this.peekAhead(1) === "{") {
      return true;
    }

    // Directive: @word
    if (byte === "@" && this.pos + 1 < this.len) {
      const next = this.src[this.pos + 1];
      if (isAlpha(next.charCodeAt(0))) {
        return true;
      }
    }

    // PHP tag: <?php, <?=
    if (byte === "<" && this.peekAhead(1) === "?") {
      if (this.phpTagStartLength(this.pos) > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Case-insensitive ASCII word match at a source offset.
   */
  private hasAsciiWordAt(pos: number, word: string): boolean {
    if (pos + word.length > this.len) return false;
    for (let i = 0; i < word.length; i++) {
      let code = this.src.charCodeAt(pos + i);
      if (code >= 65 && code <= 90) code += 32;
      if (code !== word.charCodeAt(i)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Fast-forward to next character relevant to TSX generic scanning.
   */
  private nextInterestingPosForTsxGeneric(fromPos: number): number {
    for (let i = fromPos; i < this.len; i++) {
      switch (this.src.charCodeAt(i)) {
        case 60: // <
        case 62: // >
        case 34: // "
        case 39: // '
        case 96: // `
        case 64: // @
        case 10: // \n
        case 13: // \r
          return i;
      }
    }
    return this.len;
  }

  /**
   * Fast-forward to next character relevant to balanced JS-like scanning.
   */
  private nextInterestingPosForBalancedJsLike(fromPos: number): number {
    for (let i = fromPos; i < this.len; i++) {
      switch (this.src.charCodeAt(i)) {
        case 123: // {
        case 125: // }
        case 40: // (
        case 41: // )
        case 34: // "
        case 39: // '
        case 96: // `
        case 47: // /
        case 64: // @
        case 10: // \n
        case 13: // \r
          return i;
      }
    }
    return this.len;
  }

  private scanData(): void {
    const start = this.pos;

    while (this.pos < this.len) {
      const byte = this.src[this.pos];

      if (this.phpBlock) {
        if (byte === "'" || byte === '"') {
          this.pos++;
          this.skipQuotedStringPrim(byte);
          continue;
        }

        if (byte === "`") {
          this.pos++;
          this.skipBacktickStringPrim();
          continue;
        }

        if (byte === "/" && this.pos + 1 < this.len) {
          const next = this.src[this.pos + 1];
          if (next === "/") {
            this.pos += 2;
            while (this.pos < this.len) {
              const ch = this.src[this.pos];
              if (ch === "\n" || ch === "\r") {
                this.pos++;
                break;
              }
              this.pos++;
            }
            continue;
          }
          if (next === "*") {
            this.pos += 2;
            this.skipBlockCommentPrim();
            continue;
          }
        }

        if (byte === "#") {
          this.pos++;
          while (this.pos < this.len) {
            const ch = this.src[this.pos];
            if (ch === "\n" || ch === "\r") {
              this.pos++;
              break;
            }
            this.pos++;
          }
          continue;
        }

        if (
          byte === "<" &&
          this.pos + 2 < this.len &&
          this.src[this.pos + 1] === "<" &&
          this.src[this.pos + 2] === "<"
        ) {
          this.pos += 3;
          this.skipHeredocPrim();
          continue;
        }

        if (byte === "@" && this.isEndphpAt(this.pos)) {
          if (start < this.pos) {
            this.emit(TokenType.PhpBlock, start, this.pos);
          }
          this.scanDirective();
          return;
        }

        this.pos++;
        continue;
      }

      if (byte === "{" && !this.verbatim && !this.phpBlock && !this.phpTag) {
        // Escaped echo: previous char is @
        const prevChar = this.pos > 0 ? this.src[this.pos - 1] : null;
        if (prevChar === "@") {
          this.pos++;
          continue;
        }

        const next1 = this.peekAhead(1);

        if (next1 === "{") {
          const next2 = this.peekAhead(2);
          const next3 = this.peekAhead(3);
          if (start < this.pos) {
            this.emit(TokenType.Text, start, this.pos);
          }

          if (next2 === "-" && next3 === "-") {
            this.scanBladeCommentStart();
            return;
          }
          this.scanEcho();
          return;
        } else if (next1 === "!" && this.pos + 2 < this.len && this.src[this.pos + 2] === "!") {
          if (start < this.pos) {
            this.emit(TokenType.Text, start, this.pos);
          }
          this.scanRawEcho();
          return;
        } else {
          this.pos++;
        }
      } else if (byte === "@") {
        // Verbatim mode: only explicit terminators (e.g. @endverbatim,
        // @endantlers) matter.
        if (this.verbatim) {
          if (this.isVerbatimTerminatorAt(this.pos)) {
            if (start < this.pos) {
              this.emit(TokenType.Text, start, this.pos);
            }
            this.scanDirective();
            return;
          }
          this.pos++;
          continue;
        }

        // In PHP tag mode, @ is just regular content
        if (this.phpTag) {
          this.pos++;
          continue;
        }

        // Check if @ can start a directive
        const prevChar = this.pos > 0 ? this.src[this.pos - 1] : null;
        const canStart =
          this.pos === 0 ||
          (prevChar !== null && !isAlnum(prevChar.charCodeAt(0)) && prevChar !== "@");

        if (canStart) {
          // Check escape sequences: @@, @{{, @{!!
          const nextPos = this.pos + 1;
          let isEscaped = false;
          if (nextPos < this.len) {
            const nextByte = this.src[nextPos];
            if (nextByte === "@") {
              isEscaped = true;
            } else if (nextByte === "{" && nextPos + 1 < this.len) {
              const afterBrace = this.src[nextPos + 1];
              if (afterBrace === "{" || afterBrace === "!") {
                isEscaped = true;
              }
            }
          }

          if (start < this.pos) {
            this.emit(TokenType.Text, start, this.pos);
          }

          if (isEscaped) {
            this.emit(TokenType.AtSign, this.pos, this.pos + 1);
            this.pos++;
            return;
          }

          this.scanDirective();
          return;
        } else {
          this.pos++;
        }
      } else if (byte === "<" && !this.verbatim && !this.phpBlock && !this.phpTag) {
        // DOCTYPE
        if (
          this.pos + 9 <= this.len &&
          this.src[this.pos + 1] === "!" &&
          this.src.slice(this.pos + 2, this.pos + 9).toLowerCase() === "doctype"
        ) {
          if (start < this.pos) {
            this.emit(TokenType.Text, start, this.pos);
          }
          this.scanDoctype();
          return;
        }

        // CDATA section or conditional comment end: <![
        if (
          this.pos + 3 <= this.len &&
          this.src[this.pos + 1] === "!" &&
          this.src[this.pos + 2] === "["
        ) {
          if (start < this.pos) {
            this.emit(TokenType.Text, start, this.pos);
          }

          // Try CDATA first: <![CDATA[
          if (this.tryScanCdata()) {
            return;
          }

          // Otherwise, try conditional comment end: <![endif]-->
          this.tryScanConditionalCommentEnd();
          return;
        }

        // HTML comment <!--
        if (
          this.pos + 4 <= this.len &&
          this.src[this.pos + 1] === "!" &&
          this.src[this.pos + 2] === "-" &&
          this.src[this.pos + 3] === "-"
        ) {
          if (start < this.pos) {
            this.emit(TokenType.Text, start, this.pos);
          }

          // Check for conditional comment: <!--[if ...]>
          if (this.tryScanConditionalComment()) {
            return;
          }

          // Standard HTML comment
          this.state = State.Comment;
          return;
        }

        // Bogus comment with single dash: <!- (not <!--)
        if (
          this.pos + 3 <= this.len &&
          this.src[this.pos + 1] === "!" &&
          this.src[this.pos + 2] === "-" &&
          (this.pos + 3 >= this.len || this.src[this.pos + 3] !== "-")
        ) {
          if (start < this.pos) {
            this.emit(TokenType.Text, start, this.pos);
          }
          const bogusStart = this.pos;
          this.pos += 3; // Skip <!-
          while (this.pos < this.len) {
            if (this.src[this.pos] === ">") {
              this.pos++;
              this.emit(TokenType.BogusComment, bogusStart, this.pos);
              return;
            }
            if (
              this.pos + 1 < this.len &&
              this.src[this.pos] === "-" &&
              this.src[this.pos + 1] === ">"
            ) {
              this.pos += 2;
              this.emit(TokenType.BogusComment, bogusStart, this.pos);
              return;
            }
            this.pos++;
          }
          this.emit(TokenType.BogusComment, bogusStart, this.pos);
          return;
        }

        // <? sequences: XML declaration, PI, bogus comment, PHP tag
        if (this.pos + 1 < this.len && this.src[this.pos + 1] === "?") {
          const scanStart = this.pos;
          const tokensBefore = this.tokens.length;

          if (
            this.tryScanDecl() ||
            this.tryScanProcessingInstruction() ||
            this.tryScanBogusComment()
          ) {
            // Scanner matched and emitted tokens. Insert preceding text before them.
            if (start < scanStart) {
              this.tokens.splice(tokensBefore, 0, {
                type: TokenType.Text,
                start,
                end: scanStart,
              });
            }
            return;
          }

          // PHP tag: <?php, <?=
          if (this.phpTagStartLength(this.pos) > 0) {
            if (start < this.pos) {
              this.emit(TokenType.Text, start, this.pos);
            }
            this.tryScanPhpTag();
            return;
          }

          // None matched - treat < as regular text, advance past it
          this.pos++;
          continue;
        }

        // Bogus comment: <- ... -> (not <!--)
        if (
          this.pos + 1 < this.len &&
          this.src[this.pos + 1] === "-" &&
          (this.pos + 2 >= this.len || this.src[this.pos + 2] !== "-")
        ) {
          const scanStart = this.pos;
          const tokensBefore = this.tokens.length;

          if (this.tryScanBogusComment()) {
            if (start < scanStart) {
              this.tokens.splice(tokensBefore, 0, {
                type: TokenType.Text,
                start,
                end: scanStart,
              });
            }
            return;
          }
          // Didn't match - treat < as regular text, advance past it
          this.pos++;
          continue;
        }

        // Tag open: <alpha or </ or <_ or <> or <{ or <@
        const nextChar = this.pos + 1 < this.len ? this.src[this.pos + 1] : null;
        const isValidTagStart =
          nextChar !== null &&
          (isAlpha(nextChar.charCodeAt(0)) ||
            nextChar === "/" ||
            nextChar === "_" ||
            nextChar === ">" ||
            nextChar === "{" ||
            nextChar === "@");

        if (isValidTagStart) {
          if (start < this.pos) {
            this.emit(TokenType.Text, start, this.pos);
          }
          this.scanTagOpen();
          return;
        } else {
          this.pos++;
        }
      } else if (byte === "?" && this.phpTag) {
        // Check for ?> closing tag in PHP tag mode
        if (this.isPhpTagEndAt(this.pos)) {
          if (start < this.pos) {
            this.emit(TokenType.PhpContent, start, this.pos);
          }
          this.emit(TokenType.PhpTagEnd, this.pos, this.pos + 2);
          this.pos += 2;
          this.phpTag = false;
          return;
        }
        this.pos++;
      } else {
        this.pos++;
      }
    }

    if (start < this.pos) {
      if (this.phpBlock) {
        this.logError(ErrorReason.UnexpectedEof, this.pos);
        this.emit(TokenType.PhpBlock, start, this.pos);
      } else if (this.phpTag) {
        this.emit(TokenType.PhpContent, start, this.pos);
      } else if (this.verbatim) {
        this.logError(ErrorReason.UnexpectedEof, this.pos);
        this.emit(TokenType.Text, start, this.pos);
      } else {
        this.emit(TokenType.Text, start, this.pos);
      }
    }
  }

  private scanComment(): void {
    const start = this.pos;
    this.emit(TokenType.CommentStart, start, start + 4);
    this.pos += 4;

    const contentStart = this.pos;

    const closePos = this.src.indexOf("-->", this.pos);

    if (closePos === -1) {
      // EOF without closing
      if (contentStart < this.len) {
        this.emit(TokenType.Text, contentStart, this.len);
      }
      this.logError(ErrorReason.UnexpectedEof, this.len);
      this.pos = this.len;
      this.state = State.Data;
      return;
    }

    // Found closing -->
    if (contentStart < closePos) {
      this.emit(TokenType.Text, contentStart, closePos);
    }
    this.emit(TokenType.CommentEnd, closePos, closePos + 3);
    this.pos = closePos + 3;
    this.state = State.Data;
  }

  private tryScanBogusComment(): boolean {
    if (this.pos + 1 >= this.len) return false;

    const start = this.pos;

    // <? ... > (but not PHP tag)
    if (this.src[this.pos] === "<" && this.src[this.pos + 1] === "?") {
      // Check if this is a PHP tag
      const tagLen = this.phpTagStartLength(this.pos);
      if (tagLen > 0) return false;

      this.pos += 2;

      while (this.pos < this.len) {
        if (this.src[this.pos] === ">") {
          this.pos++;
          this.emit(TokenType.BogusComment, start, this.pos);
          return true;
        }
        this.pos++;
      }

      // EOF without closing. Restore position
      this.pos = start;
      return false;
    }

    // <- ... -> (but not <!--)
    if (this.src[this.pos] === "<" && this.src[this.pos + 1] === "-") {
      // Make sure this is not <!--
      if (this.pos + 2 < this.len && this.src[this.pos + 2] === "-") {
        return false;
      }

      this.pos += 2;

      while (this.pos + 1 < this.len) {
        if (this.src[this.pos] === "-" && this.src[this.pos + 1] === ">") {
          this.pos += 2;
          this.emit(TokenType.BogusComment, start, this.pos);
          return true;
        }
        this.pos++;
      }

      // EOF without closing. Restore position
      this.pos = start;
      return false;
    }

    return false;
  }

  private scanBladeCommentStart(): void {
    const start = this.pos;
    this.pos += 4; // {{--
    this.emit(TokenType.BladeCommentStart, start, this.pos);
    this.state = State.BladeComment;
  }

  private scanBladeCommentContent(): void {
    const start = this.pos;

    while (this.pos < this.len) {
      const closePos = this.src.indexOf("--}}", this.pos);

      if (closePos === -1) {
        // EOF without closing
        if (start < this.len) {
          this.emit(TokenType.Text, start, this.len);
        }
        this.pos = this.len;
        this.logError(ErrorReason.UnexpectedEof, this.len);
        this.state = this.returnState;
        this.returnState = State.Data;
        return;
      }

      if (closePos > start) {
        this.emit(TokenType.Text, start, closePos);
      }
      this.emit(TokenType.BladeCommentEnd, closePos, closePos + 4);
      this.pos = closePos + 4;
      this.state = this.returnState;
      this.returnState = State.Data;
      return;
    }

    this.state = this.returnState;
    this.returnState = State.Data;
  }

  private tryScanConditionalComment(): boolean {
    if (this.pos + 5 >= this.len) return false;
    if (this.src.slice(this.pos, this.pos + 5) !== "<!--[") return false;

    const start = this.pos;
    let scanPos = this.pos + 5;

    while (scanPos + 1 < this.len) {
      if (this.src[scanPos] === "]" && this.src[scanPos + 1] === ">") {
        const afterMarker = scanPos + 2;

        // Downlevel-revealed start marker `<!--[if ...]><!-->` should be
        // tokenized as a normal comment, not a conditional block start.
        if (
          afterMarker + 5 <= this.len &&
          this.src.slice(afterMarker, afterMarker + 5) === "<!-->"
        ) {
          return false;
        }

        this.pos = afterMarker;
        this.emit(TokenType.ConditionalCommentStart, start, this.pos);
        return true;
      }
      scanPos++;
    }

    // EOF without closing "]>"
    this.pos = this.len;
    this.emit(TokenType.ConditionalCommentStart, start, this.pos);
    return true;
  }

  private tryScanConditionalCommentEnd(): boolean {
    if (this.pos + 3 > this.len) return false;
    if (this.src.slice(this.pos, this.pos + 3) !== "<![") return false;

    const start = this.pos;
    this.pos += 3;

    return this.scanConditionalClosing(start);
  }

  private scanConditionalClosing(start: number): boolean {
    while (this.pos + 3 < this.len) {
      if (
        this.src[this.pos] === "]" &&
        this.src[this.pos + 1] === "-" &&
        this.src[this.pos + 2] === "-" &&
        this.src[this.pos + 3] === ">"
      ) {
        this.pos += 4;
        this.emit(TokenType.ConditionalCommentEnd, start, this.pos);
        return true;
      }
      this.pos++;
    }

    // EOF without closing "]-->"
    this.pos = this.len;
    this.emit(TokenType.ConditionalCommentEnd, start, this.pos);
    return true;
  }

  private tryScanCdata(): boolean {
    if (this.pos + 9 > this.len) return false;
    if (this.src.slice(this.pos, this.pos + 9) !== "<![CDATA[") return false;

    const start = this.pos;
    this.emit(TokenType.CdataStart, start, start + 9);
    this.pos += 9;

    const contentStart = this.pos;
    const closePos = this.src.indexOf("]]>", this.pos);

    if (closePos === -1) {
      // EOF without closing
      if (contentStart < this.len) {
        this.emit(TokenType.Text, contentStart, this.len);
      }
      this.logError(ErrorReason.UnexpectedEof, this.len);
      this.pos = this.len;
      return true;
    }

    if (contentStart < closePos) {
      this.emit(TokenType.Text, contentStart, closePos);
    }
    this.emit(TokenType.CdataEnd, closePos, closePos + 3);
    this.pos = closePos + 3;
    return true;
  }

  private tryScanProcessingInstruction(): boolean {
    if (this.pos + 2 > this.len) return false;
    if (this.src[this.pos] !== "<" || this.src[this.pos + 1] !== "?") {
      return false;
    }

    if (this.pos + 2 >= this.len) return false;

    const thirdChar = this.src[this.pos + 2];

    // If space immediately after, it's a bogus comment
    if (isSpace(thirdChar.charCodeAt(0))) return false;

    if (!isAlpha(thirdChar.charCodeAt(0))) return false;

    // Check if this is a PHP tag
    if (this.phpTagStartLength(this.pos) > 0) return false;

    // Scan the target name
    const targetStart = this.pos + 2;
    let targetEnd = targetStart;
    while (targetEnd < this.len) {
      const c = this.src[targetEnd];
      const cc = c.charCodeAt(0);
      if (isAlnum(cc) || c === "-" || c === "_" || c === ":") {
        targetEnd++;
      } else {
        break;
      }
    }

    const targetName = this.src.slice(targetStart, targetEnd);

    // xml is handled by tryScanDecl
    if (targetName.toLowerCase() === "xml") return false;

    const start = this.pos;
    const piStartEnd = targetEnd;

    this.emit(TokenType.PIStart, start, piStartEnd);
    this.pos = piStartEnd;

    const contentStart = this.pos;

    while (this.pos + 1 < this.len) {
      if (this.src[this.pos] === "?" && this.src[this.pos + 1] === ">") {
        if (contentStart < this.pos) {
          this.emit(TokenType.Text, contentStart, this.pos);
        }
        this.emit(TokenType.PIEnd, this.pos, this.pos + 2);
        this.pos += 2;
        return true;
      }
      this.pos++;
    }

    // EOF without closing
    if (contentStart < this.len) {
      this.emit(TokenType.Text, contentStart, this.len);
    }
    this.pos = this.len;
    this.logError(ErrorReason.UnexpectedEof, this.len);
    return true;
  }

  private tryScanDecl(): boolean {
    if (this.pos + 5 > this.len) return false;
    if (this.src[this.pos] !== "<" || this.src[this.pos + 1] !== "?") {
      return false;
    }

    const xmlMatch = this.hasAsciiWordAt(this.pos + 2, "xml");

    if (!xmlMatch) return false;

    // Make sure it's not a longer name like "xmlfoo"
    if (this.pos + 5 < this.len) {
      const next = this.src[this.pos + 5];
      const cc = next.charCodeAt(0);
      if (isAlnum(cc) || next === "_" || next === "-" || next === ":") {
        return false;
      }
    }

    const start = this.pos;
    this.emit(TokenType.DeclStart, start, start + 5);
    this.pos += 5;

    this.inXmlDeclaration = true;
    this.state = State.BeforeAttrName;
    return true;
  }

  private phpTagStartLength(pos: number): number {
    if (pos + 2 > this.len || this.src[pos] !== "<" || this.src[pos + 1] !== "?") {
      return 0;
    }

    // Check for <?php
    if (pos + 5 <= this.len) {
      const matchesPhp = this.hasAsciiWordAt(pos + 2, "php");

      if (matchesPhp) {
        if (pos + 5 < this.len) {
          const next = this.src[pos + 5];
          const cc = next.charCodeAt(0);
          if (isAlnum(cc) || next === "_") {
            return 0; // e.g., <?phps
          }
        }
        return 5;
      }
    }

    // Check for <?=
    if (pos + 3 <= this.len && this.src[pos + 2] === "=") {
      return 3;
    }

    // Just <? - not supported
    return 0;
  }

  private isPhpTagEndAt(pos: number): boolean {
    return pos + 2 <= this.len && this.src[pos] === "?" && this.src[pos + 1] === ">";
  }

  private tryScanPhpTag(): boolean {
    if (this.pos + 1 >= this.len || this.src[this.pos] !== "<" || this.src[this.pos + 1] !== "?") {
      return false;
    }

    const start = this.pos;
    this.pos += 2; // Skip <?

    // Check for <?php
    if (this.pos + 3 <= this.len) {
      const matchesPhp = this.hasAsciiWordAt(this.pos, "php");

      if (matchesPhp) {
        if (this.pos + 3 < this.len) {
          const next = this.src[this.pos + 3];
          const cc = next.charCodeAt(0);
          if (isAlnum(cc) || next === "_") {
            this.pos = start;
            return false;
          }
        }
        this.pos += 3;
      } else if (this.pos < this.len && this.src[this.pos] === "=") {
        this.pos++; // <?=
      } else {
        this.pos = start;
        return false;
      }
    } else if (this.pos < this.len && this.src[this.pos] === "=") {
      this.pos++; // <?=
    } else {
      this.pos = start;
      return false;
    }

    this.emit(TokenType.PhpTagStart, start, this.pos);
    this.scanPhpContent();
    return true;
  }

  private scanPhpContent(): void {
    const start = this.pos;

    while (true) {
      if (this.pos >= this.len) {
        if (this.pos > start) {
          this.emit(TokenType.PhpContent, start, this.pos);
        }
        return;
      }

      // Check for ?> closing tag
      if (this.pos + 1 < this.len && this.src[this.pos] === "?" && this.src[this.pos + 1] === ">") {
        if (this.pos > start) {
          this.emit(TokenType.PhpContent, start, this.pos);
        }
        this.emit(TokenType.PhpTagEnd, this.pos, this.pos + 2);
        this.pos += 2;
        return;
      }

      const byte = this.src[this.pos];

      if (byte === '"' || byte === "'") {
        this.pos++;
        this.skipQuotedStringPrim(byte);
      } else if (byte === "/" && this.pos + 1 < this.len) {
        const next = this.src[this.pos + 1];
        if (next === "/") {
          this.pos += 2;
          // Skip line comment stopping at ?>
          while (this.pos < this.len) {
            const ch = this.src[this.pos];
            if (ch === "\n" || ch === "\r") {
              this.pos++;
              break;
            }
            if (
              this.pos + 2 <= this.len &&
              this.src[this.pos] === "?" &&
              this.src[this.pos + 1] === ">"
            ) {
              break; // Stop before ?>
            }
            this.pos++;
          }
        } else if (next === "*") {
          this.pos += 2;
          this.skipBlockCommentPrim();
        } else {
          this.pos++;
        }
      } else if (byte === "#") {
        this.pos++;
        // Skip line comment stopping at ?>
        while (this.pos < this.len) {
          const ch = this.src[this.pos];
          if (ch === "\n" || ch === "\r") {
            this.pos++;
            break;
          }
          if (
            this.pos + 2 <= this.len &&
            this.src[this.pos] === "?" &&
            this.src[this.pos + 1] === ">"
          ) {
            break;
          }
          this.pos++;
        }
      } else if (
        byte === "<" &&
        this.pos + 2 < this.len &&
        this.src[this.pos + 1] === "<" &&
        this.src[this.pos + 2] === "<"
      ) {
        this.pos += 3;
        this.skipHeredocPrim();
      } else {
        this.pos++;
      }
    }
  }

  private scanDoctype(): void {
    this.emit(TokenType.DoctypeStart, this.pos, this.pos + 9);
    this.pos += 9;

    this.skipAndEmitWhitespace();

    const contentStart = this.pos;
    while (this.pos < this.len && this.src[this.pos] !== ">") {
      this.pos++;
    }
    if (contentStart < this.pos) {
      this.emit(TokenType.Doctype, contentStart, this.pos);
    }
    if (this.pos < this.len && this.src[this.pos] === ">") {
      this.emit(TokenType.DoctypeEnd, this.pos, this.pos + 1);
      this.pos++;
    }
  }

  private scanTagOpen(): void {
    const start = this.pos;
    this.currentTagName = "";

    this.emit(TokenType.LessThan, start, start + 1);
    this.pos++;

    if (this.pos < this.len && this.src[this.pos] === "/") {
      this.emit(TokenType.Slash, this.pos, this.pos + 1);
      this.pos++;
      this.isClosingTag = true;
    } else {
      this.isClosingTag = false;
    }

    this.state = State.TagName;
  }

  private checkRawtextMode(): State {
    if (this.isClosingTag) return State.Data;
    const tagNameLower = this.currentTagName.toLowerCase();
    if (RAWTEXT_ELEMENTS.has(tagNameLower)) {
      this.rawtextTagName = tagNameLower;
      return State.RawText;
    }
    return State.Data;
  }

  private scanTagName(): void {
    const start = this.pos;

    if (this.continuedTagName && this.pos < this.len && isSpace(this.src.charCodeAt(this.pos))) {
      this.continuedTagName = false;
      this.state = State.BeforeAttrName;
      return;
    }

    if (!this.continuedTagName) {
      this.skipWhitespace();
    }
    this.continuedTagName = false;

    // Empty/malformed tag like <> or </>
    if (this.pos >= this.len || this.src[this.pos] === ">" || this.src[this.pos] === "/") {
      if (start < this.pos) {
        this.emit(TokenType.Whitespace, start, this.pos);
      }

      if (this.pos < this.len) {
        if (this.src[this.pos] === ">") {
          this.emit(TokenType.GreaterThan, this.pos, this.pos + 1);
          this.pos++;
          this.state = this.checkRawtextMode();
        } else if (this.src[this.pos] === "/") {
          this.emit(TokenType.Slash, this.pos, this.pos + 1);
          this.pos++;
          if (this.pos < this.len && this.src[this.pos] === ">") {
            this.emit(TokenType.GreaterThan, this.pos, this.pos + 1);
            this.pos++;
            this.state = State.Data;
          } else {
            this.state = State.BeforeAttrName;
          }
        }
      } else {
        this.emit(TokenType.SyntheticClose, this.pos, this.pos);
        this.state = State.Data;
      }
      return;
    }

    const nameStart = this.pos;

    while (this.pos < this.len) {
      const ch = this.src[this.pos];

      // Blade echo in tag name: <{{ $element }}>
      if (ch === "{" && !this.verbatim && !this.phpBlock && !this.phpTag) {
        if (this.pos > nameStart) {
          this.emit(TokenType.TagName, nameStart, this.pos);
        }
        if (this.peekAhead(1) === "{") {
          if (this.peekAhead(2) === "-" && this.peekAhead(3) === "-") {
            this.returnState = State.TagName;
            this.continuedTagName = true;
            this.scanBladeCommentStart();
            this.scanBladeCommentContent();
            return;
          }
          this.returnState = State.TagName;
          this.continuedTagName = true;
          this.scanEcho();
          return;
        } else if (this.peekAhead(1) === "!" && this.peekAhead(2) === "!") {
          this.returnState = State.TagName;
          this.continuedTagName = true;
          this.scanRawEcho();
          return;
        }
        break;
      }

      const cc = ch.charCodeAt(0);
      if (
        isAlnum(cc) ||
        ch === "-" ||
        ch === ":" ||
        ch === "_" ||
        ch === "@" ||
        ch === "." ||
        ch === "[" ||
        ch === "]" ||
        ch === "$"
      ) {
        this.pos++;
      } else {
        break;
      }
    }

    if (nameStart < this.pos) {
      const tagNamePart = this.src.slice(nameStart, this.pos);
      this.currentTagName += tagNamePart;
      this.emit(TokenType.TagName, nameStart, this.pos);
    }

    if (this.pos >= this.len) {
      this.emit(TokenType.SyntheticClose, this.pos, this.pos);
      this.state = State.Data;
      return;
    }

    const ch = this.src[this.pos];

    if (ch === "<") {
      // Check for PHP tag first
      if (this.pos + 1 < this.len && this.src[this.pos + 1] === "?") {
        if (this.tryScanPhpTag()) {
          this.state = State.TagName;
          this.continuedTagName = true;
          return;
        }
      }

      // Try TSX generic type parameter
      if (this.tryScanTsxGenericType()) {
        this.state = State.BeforeAttrName;
        return;
      }

      // New tag starting before current is closed
      this.emit(TokenType.SyntheticClose, this.pos, this.pos);
      this.scanTagOpen();
    } else if (ch === ">") {
      this.emit(TokenType.GreaterThan, this.pos, this.pos + 1);
      this.pos++;
      this.state = this.checkRawtextMode();
    } else if (ch === "/") {
      this.emit(TokenType.Slash, this.pos, this.pos + 1);
      this.pos++;
      this.skipWhitespace();
      if (this.pos < this.len && this.src[this.pos] === ">") {
        this.emit(TokenType.GreaterThan, this.pos, this.pos + 1);
        this.pos++;
        this.state = State.Data;
      } else {
        this.state = State.BeforeAttrName;
      }
    } else if (isSpace(ch.charCodeAt(0))) {
      this.state = State.BeforeAttrName;
    } else {
      this.state = State.BeforeAttrName;
    }
  }

  private scanBeforeAttrName(): void {
    if (this.scanAttributePhpDirectiveContent()) return;

    const start = this.pos;

    while (this.pos < this.len && isSpace(this.src.charCodeAt(this.pos))) {
      this.pos++;
    }

    // Closing tags: only allow > or / after whitespace
    if (this.isClosingTag) {
      if (this.pos >= this.len) {
        this.emit(TokenType.SyntheticClose, start, start);
        this.pos = start;
        this.state = State.Data;
        return;
      }
      const ch = this.src[this.pos];
      if (ch !== ">" && ch !== "/") {
        this.emit(TokenType.SyntheticClose, start, start);
        this.pos = start;
        this.state = State.Data;
        return;
      }
    }

    if (start < this.pos) {
      this.emit(TokenType.Whitespace, start, this.pos);
    }

    if (this.pos >= this.len) {
      this.emit(TokenType.SyntheticClose, this.pos, this.pos);
      this.state = State.Data;
      return;
    }

    const ch = this.src[this.pos];

    // Blade directive as attribute: @if($condition)
    if (ch === "@" && !this.verbatim && !this.phpBlock && !this.phpTag) {
      let tempPos = this.pos + 1;
      const nameStart = tempPos;
      while (tempPos < this.len) {
        const b = this.src.charCodeAt(tempPos);
        if (isAlnum(b) || b === 95) {
          tempPos++;
        } else {
          break;
        }
      }
      if (tempPos > nameStart) {
        const nameLower = this.src.slice(nameStart, tempPos).toLowerCase();
        if (this.isAtAttributeCandidate(nameLower, tempPos)) {
          // Frontend shorthand like @click / @mouseenter stays as an
          // attribute name in tag context, even in accept-all mode.
        } else if (this._directives.acceptsAll()) {
          this.returnState = State.BeforeAttrName;
          this.scanDirective();
          return;
        } else if (this._directives.isDirectiveLower(nameLower)) {
          this.returnState = State.BeforeAttrName;
          this.scanDirective();
          return;
        }
      }
      // Not a known directive, fall through to attr name
    }

    // PHP tag in attribute context
    if (ch === "<" && this.pos + 1 < this.len && this.src[this.pos + 1] === "?") {
      if (this.tryScanPhpTag()) {
        this.state = State.BeforeAttrName;
        return;
      }
    }

    // HTML comment in attribute context
    if (
      ch === "<" &&
      this.pos + 3 < this.len &&
      this.src[this.pos + 1] === "!" &&
      this.src[this.pos + 2] === "-" &&
      this.src[this.pos + 3] === "-"
    ) {
      this.emit(TokenType.SyntheticClose, this.pos, this.pos);
      this.state = State.Data;
      return;
    }

    // TSX generic type parameter: <User> or <{ id: number }>
    if (ch === "<") {
      if (this.tryScanTsxGenericType()) {
        return;
      }

      // New tag starting (malformed sequence)
      this.emit(TokenType.SyntheticClose, this.pos, this.pos);
      this.emit(TokenType.LessThan, this.pos, this.pos + 1);
      this.pos++;
      this.state = State.TagName;
      return;
    }

    // JSX shorthand attribute: {enabled} or {...props}
    if (ch === "{" && !this.verbatim && !this.phpBlock && !this.phpTag) {
      if (this.tryScanJsxShorthandAttribute()) {
        return;
      }
    }

    // Blade echo as attribute: {{ $attributes }}
    if (ch === "{" && !this.verbatim && !this.phpBlock && !this.phpTag) {
      if (this.peekAhead(1) === "{") {
        if (this.peekAhead(2) === "-" && this.peekAhead(3) === "-") {
          this.returnState = State.BeforeAttrName;
          this.scanBladeCommentStart();
          this.scanBladeCommentContent();
          return;
        }
        this.returnState = State.BeforeAttrName;
        this.scanEcho();
        // Check if echo is followed by attribute name continuation
        if (this.pos < this.len) {
          const nextCh = this.src[this.pos];
          if (
            nextCh !== " " &&
            nextCh !== "\t" &&
            nextCh !== "\n" &&
            nextCh !== "\r" &&
            nextCh !== ">" &&
            nextCh !== "/" &&
            nextCh !== "=" &&
            nextCh !== "<"
          ) {
            this.state = State.AttrName;
            return;
          }
        }
        return;
      } else if (this.peekAhead(1) === "!" && this.peekAhead(2) === "!") {
        this.returnState = State.BeforeAttrName;
        this.scanRawEcho();
        return;
      }
    }

    // XML declaration ending
    if (
      this.inXmlDeclaration &&
      ch === "?" &&
      this.pos + 1 < this.len &&
      this.src[this.pos + 1] === ">"
    ) {
      this.emit(TokenType.DeclEnd, this.pos, this.pos + 2);
      this.pos += 2;
      this.inXmlDeclaration = false;
      this.state = State.Data;
      return;
    }

    if (ch === ">") {
      this.emit(TokenType.GreaterThan, this.pos, this.pos + 1);
      this.pos++;
      this.state = this.checkRawtextMode();
    } else if (ch === "/") {
      this.emit(TokenType.Slash, this.pos, this.pos + 1);
      this.pos++;
      const wsStart = this.pos;
      while (this.pos < this.len && isSpace(this.src.charCodeAt(this.pos))) {
        this.pos++;
      }
      if (this.pos < this.len && this.src[this.pos] === ">") {
        this.emit(TokenType.GreaterThan, this.pos, this.pos + 1);
        this.pos++;
      } else if (this.pos >= this.len) {
        this.emit(TokenType.SyntheticClose, this.pos, this.pos);
      } else {
        this.emit(TokenType.SyntheticClose, wsStart, wsStart);
        this.pos = wsStart;
      }
      this.state = State.Data;
    } else {
      this.state = State.AttrName;
    }
  }

  private scanAttrName(): void {
    if (this.scanAttributePhpDirectiveContent()) return;

    const start = this.pos;

    // Detect special Blade attribute prefixes
    let tokenType: TokenType = TokenType.AttributeName;
    if (this.pos < this.len && this.src[this.pos] === ":") {
      if (this.pos + 1 < this.len && this.src[this.pos + 1] === ":") {
        tokenType = TokenType.EscapedAttribute;
      } else if (this.pos + 1 < this.len && this.src[this.pos + 1] === "$") {
        tokenType = TokenType.ShorthandAttribute;
      } else {
        tokenType = TokenType.BoundAttribute;
      }
    }

    while (true) {
      if (this.pos >= this.len) break;
      const byte = this.src[this.pos];

      // Blade echo in attr name: class-{{ $thing }}
      if (byte === "{" && !this.verbatim && !this.phpBlock && !this.phpTag) {
        if (this.pos > start) {
          this.emit(tokenType, start, this.pos);
        }

        const savedPos = this.pos;
        if (this.peekAhead(1) === "{") {
          if (this.peekAhead(2) === "-" && this.peekAhead(3) === "-") {
            const savedState = this.state;
            this.returnState = State.Data;
            this.scanBladeCommentStart();
            this.scanBladeCommentContent();
            this.state = savedState;
            this.scanAttrName();
            return;
          }
          const savedState = this.state;
          this.returnState = State.Data;
          this.scanEcho();
          this.state = savedState;
          this.scanAttrName();
          return;
        } else if (this.peekAhead(1) === "!" && this.peekAhead(2) === "!") {
          const savedState = this.state;
          this.returnState = State.Data;
          this.scanRawEcho();
          this.state = savedState;
          this.scanAttrName();
          return;
        }
        // Not a Blade echo. Restore and break
        this.pos = savedPos;
        break;
      }

      // PHP tag in attr name
      if (byte === "<" && this.pos + 1 < this.len && this.src[this.pos + 1] === "?") {
        if (this.pos > start) {
          this.emit(tokenType, start, this.pos);
        }
        if (this.tryScanPhpTag()) {
          this.scanAttrName();
          return;
        }
        break;
      }

      // Blade directive in attr name
      if (byte === "@" && !this.verbatim && !this.phpBlock && !this.phpTag) {
        let tempPos = this.pos + 1;
        const nameStart = tempPos;
        while (tempPos < this.len) {
          const b = this.src.charCodeAt(tempPos);
          if (isAlnum(b) || b === 95) tempPos++;
          else break;
        }

        let isKnownDirective = false;
        if (tempPos > nameStart) {
          const nameLower = this.src.slice(nameStart, tempPos).toLowerCase();
          if (this.isAtAttributeCandidate(nameLower, tempPos)) {
            isKnownDirective = false;
          } else if (this._directives.acceptsAll()) {
            isKnownDirective = true;
          } else {
            isKnownDirective = this._directives.isDirectiveLower(nameLower);
          }
        }

        if (isKnownDirective) {
          if (this.pos > start) {
            this.emit(tokenType, start, this.pos);
          }
          const savedState = this.state;
          this.returnState = State.Data;
          this.scanDirective();
          this.state = savedState;
          this.scanAttrName();
          return;
        }

        this.pos++;
        continue;
      }

      const cc = byte.charCodeAt(0);
      if (
        isAlnum(cc) ||
        byte === "-" ||
        byte === ":" ||
        byte === "_" ||
        byte === "$" ||
        byte === "@" ||
        byte === "." ||
        byte === "[" ||
        byte === "]" ||
        byte === "(" ||
        byte === ")" ||
        byte === "*" ||
        byte === "#"
      ) {
        this.pos++;
      } else {
        break;
      }
    }

    if (start < this.pos) {
      this.emit(tokenType, start, this.pos);
    }

    if (this.pos >= this.len) {
      this.state = State.Data;
      return;
    }

    const char = this.src[this.pos];

    if (char === "=") {
      this.emit(TokenType.Equals, this.pos, this.pos + 1);
      this.pos++;
      this.state = State.BeforeAttrValue;
    } else if (
      this.inXmlDeclaration &&
      char === "?" &&
      this.pos + 1 < this.len &&
      this.src[this.pos + 1] === ">"
    ) {
      this.emit(TokenType.DeclEnd, this.pos, this.pos + 2);
      this.pos += 2;
      this.inXmlDeclaration = false;
      this.state = State.Data;
    } else if (char === ">") {
      this.emit(TokenType.GreaterThan, this.pos, this.pos + 1);
      this.pos++;
      this.state = State.Data;
    } else if (char === "/") {
      this.emit(TokenType.Slash, this.pos, this.pos + 1);
      this.pos++;
      if (this.pos < this.len && this.src[this.pos] === ">") {
        this.emit(TokenType.GreaterThan, this.pos, this.pos + 1);
        this.pos++;
        this.state = State.Data;
      } else {
        this.state = State.BeforeAttrName;
      }
    } else if (isSpace(char.charCodeAt(0))) {
      this.state = State.AfterAttrName;
    } else if (char === "<") {
      this.state = State.BeforeAttrName;
    } else {
      this.emit(TokenType.Text, this.pos, this.pos + 1);
      this.pos++;
      this.state = State.BeforeAttrName;
    }
  }

  private scanAfterAttrName(): void {
    if (this.scanAttributePhpDirectiveContent()) return;

    this.skipAndEmitWhitespace();

    if (this.pos >= this.len) {
      this.state = State.Data;
      return;
    }

    const char = this.src[this.pos];

    if (char === "=") {
      this.emit(TokenType.Equals, this.pos, this.pos + 1);
      this.pos++;
      this.state = State.BeforeAttrValue;
    } else if (
      this.inXmlDeclaration &&
      char === "?" &&
      this.pos + 1 < this.len &&
      this.src[this.pos + 1] === ">"
    ) {
      this.emit(TokenType.DeclEnd, this.pos, this.pos + 2);
      this.pos += 2;
      this.inXmlDeclaration = false;
      this.state = State.Data;
    } else if (char === ">") {
      this.emit(TokenType.GreaterThan, this.pos, this.pos + 1);
      this.pos++;
      this.state = State.Data;
    } else if (char === "/") {
      this.emit(TokenType.Slash, this.pos, this.pos + 1);
      this.pos++;
      if (this.pos < this.len && this.src[this.pos] === ">") {
        this.emit(TokenType.GreaterThan, this.pos, this.pos + 1);
        this.pos++;
        this.state = State.Data;
      } else {
        this.state = State.BeforeAttrName;
      }
    } else {
      this.state = State.BeforeAttrName;
    }
  }

  private scanBeforeAttrValue(): void {
    if (this.scanAttributePhpDirectiveContent()) return;

    this.skipAndEmitWhitespace();

    if (this.pos >= this.len) {
      this.state = State.Data;
      return;
    }

    const char = this.src[this.pos];

    // Prioritize Blade echoes over JSX-style attributes
    if (char === "{" && !this.verbatim && !this.phpBlock && !this.phpTag) {
      if (this.peekAhead(1) === "{") {
        // {{ or {{{
        this.returnState = State.BeforeAttrName;
        this.scanEcho();
        this.state = State.BeforeAttrName;
        return;
      } else if (this.peekAhead(1) === "!" && this.peekAhead(2) === "!") {
        // {!!
        this.returnState = State.BeforeAttrName;
        this.scanRawEcho();
        this.state = State.BeforeAttrName;
        return;
      }

      // Not a Blade echo, try JSX-style attribute value
      if (this.scanJsxAttributeValue()) {
        this.state = State.BeforeAttrName;
        return;
      }

      // Not JSX, treat as unquoted value
      this.state = State.AttrValueUnquoted;
      return;
    }

    // Check for ({expression}) pattern
    if (char === "(" && this.pos + 1 < this.len && this.src[this.pos + 1] === "{") {
      if (this.scanJsxAttributeValue()) {
        this.state = State.BeforeAttrName;
        return;
      }

      this.state = State.AttrValueUnquoted;
      return;
    }

    if (char === '"' || char === "'") {
      this.state = State.AttrValueQuoted;
    } else if (
      this.inXmlDeclaration &&
      char === "?" &&
      this.pos + 1 < this.len &&
      this.src[this.pos + 1] === ">"
    ) {
      this.emit(TokenType.DeclEnd, this.pos, this.pos + 2);
      this.pos += 2;
      this.inXmlDeclaration = false;
      this.state = State.Data;
    } else if (char === ">") {
      this.emit(TokenType.GreaterThan, this.pos, this.pos + 1);
      this.pos++;
      this.state = State.Data;
    } else {
      this.state = State.AttrValueUnquoted;
    }
  }

  private scanAttrValueQuoted(): void {
    if (this.scanAttributePhpDirectiveContent()) return;

    const quote = this.src[this.pos];

    this.emit(TokenType.Quote, this.pos, this.pos + 1);
    this.pos++;

    let valueStart = this.pos;

    while (true) {
      if (this.pos >= this.len) {
        if (this.pos > valueStart) {
          this.emit(TokenType.AttributeValue, valueStart, this.pos);
        }
        this.state = State.BeforeAttrName;
        return;
      }

      // Find the next interesting character
      const quotePos = this.src.indexOf(quote, this.pos);
      const bracePos = this.src.indexOf("{", this.pos);
      const atPos = this.src.indexOf("@", this.pos);

      let nextPos = this.len;
      if (quotePos !== -1 && quotePos < nextPos) nextPos = quotePos;
      if (bracePos !== -1 && bracePos < nextPos) nextPos = bracePos;
      if (atPos !== -1 && atPos < nextPos) nextPos = atPos;

      if (nextPos === this.len) {
        this.pos = this.len;
        if (this.pos > valueStart) {
          this.emit(TokenType.AttributeValue, valueStart, this.pos);
        }
        this.state = State.BeforeAttrName;
        return;
      }

      this.pos = nextPos;
      const byte = this.src[this.pos];

      if (byte === quote) {
        // Check if escaped
        let backslashCount = 0;
        let checkPos = this.pos - 1;
        while (checkPos >= valueStart && this.src[checkPos] === "\\") {
          backslashCount++;
          checkPos--;
        }
        if (backslashCount % 2 === 1) {
          this.pos++;
          continue;
        }

        if (this.pos > valueStart) {
          this.emit(TokenType.AttributeValue, valueStart, this.pos);
        }
        this.emit(TokenType.Quote, this.pos, this.pos + 1);
        this.pos++;
        this.state = State.BeforeAttrName;
        return;
      } else if (byte === "{" && !this.verbatim && !this.phpBlock && !this.phpTag) {
        const savedPos = this.pos;

        if (this.peekAhead(1) === "{") {
          if (this.peekAhead(2) === "-" && this.peekAhead(3) === "-") {
            if (savedPos > valueStart) {
              this.emit(TokenType.AttributeValue, valueStart, savedPos);
            }
            this.returnState = State.AttrValueQuoted;
            this.scanBladeCommentStart();
            this.scanBladeCommentContent();
            valueStart = this.pos;
            continue;
          }
          if (savedPos > valueStart) {
            this.emit(TokenType.AttributeValue, valueStart, savedPos);
          }
          this.returnState = State.AttrValueQuoted;
          this.scanEcho();
          valueStart = this.pos;
          continue;
        } else if (this.peekAhead(1) === "!" && this.peekAhead(2) === "!") {
          if (savedPos > valueStart) {
            this.emit(TokenType.AttributeValue, valueStart, savedPos);
          }
          this.returnState = State.AttrValueQuoted;
          this.scanRawEcho();
          valueStart = this.pos;
          continue;
        }
        this.pos = savedPos + 1;
      } else if (byte === "@" && !this.verbatim && !this.phpBlock && !this.phpTag) {
        const canStart = this.pos === valueStart || !isAlnum(this.src.charCodeAt(this.pos - 1));

        if (canStart) {
          const savedPos = this.pos;
          if (savedPos > valueStart) {
            this.emit(TokenType.AttributeValue, valueStart, savedPos);
          }
          this.returnState = State.AttrValueQuoted;
          this.scanDirective();
          valueStart = this.pos;
          continue;
        }
        this.pos++;
      } else {
        this.pos++;
      }
    }
  }

  private scanAttrValueUnquoted(): void {
    if (this.scanAttributePhpDirectiveContent()) return;

    let valueStart = this.pos;

    while (true) {
      if (this.pos >= this.len) break;
      const byte = this.src[this.pos];

      // XML declaration ending
      if (
        this.inXmlDeclaration &&
        byte === "?" &&
        this.pos + 1 < this.len &&
        this.src[this.pos + 1] === ">"
      ) {
        break;
      }

      if (isSpace(byte.charCodeAt(0)) || byte === ">") break;

      // PHP tag in unquoted value
      if (byte === "<" && this.pos + 1 < this.len && this.src[this.pos + 1] === "?") {
        const savedPos = this.pos;
        if (savedPos > valueStart) {
          this.emit(TokenType.AttributeValue, valueStart, savedPos);
        }
        if (this.tryScanPhpTag()) {
          valueStart = this.pos;
          continue;
        }
        break;
      }

      // Blade echo in unquoted value
      if (byte === "{" && !this.verbatim && !this.phpBlock && !this.phpTag) {
        if (this.peekAhead(1) === "{") {
          if (this.peekAhead(2) === "-" && this.peekAhead(3) === "-") {
            if (this.pos > valueStart) {
              this.emit(TokenType.AttributeValue, valueStart, this.pos);
            }
            this.returnState = State.AttrValueUnquoted;
            this.scanBladeCommentStart();
            this.scanBladeCommentContent();
            valueStart = this.pos;
            continue;
          }
          if (this.pos > valueStart) {
            this.emit(TokenType.AttributeValue, valueStart, this.pos);
          }
          this.returnState = State.AttrValueUnquoted;
          this.scanEcho();
          valueStart = this.pos;
          continue;
        } else if (this.peekAhead(1) === "!" && this.peekAhead(2) === "!") {
          if (this.pos > valueStart) {
            this.emit(TokenType.AttributeValue, valueStart, this.pos);
          }
          this.returnState = State.AttrValueUnquoted;
          this.scanRawEcho();
          valueStart = this.pos;
          continue;
        }
        this.pos++;
        continue;
      }

      // Blade directive in unquoted value
      if (byte === "@" && !this.verbatim && !this.phpBlock && !this.phpTag) {
        const canStart = this.pos === valueStart || !isAlnum(this.src.charCodeAt(this.pos - 1));
        if (canStart) {
          if (this.pos > valueStart) {
            this.emit(TokenType.AttributeValue, valueStart, this.pos);
          }
          this.returnState = State.AttrValueUnquoted;
          this.scanDirective();
          valueStart = this.pos;
          continue;
        }
        this.pos++;
        continue;
      }

      this.pos++;
    }

    if (valueStart < this.pos) {
      this.emit(TokenType.AttributeValue, valueStart, this.pos);
    }
    this.state = State.BeforeAttrName;
  }

  private scanDirective(): void {
    const start = this.pos;
    this.pos++; // skip @

    const nameStart = this.pos;
    let pos = nameStart;
    while (pos < this.len) {
      const cc = this.src.charCodeAt(pos);
      if (isAlnum(cc) || cc === 95) {
        pos++;
      } else {
        break;
      }
    }

    if (pos === nameStart) {
      this.emit(TokenType.Text, start, start + 1);
      this.state = this.returnState;
      this.returnState = State.Data;
      return;
    }

    const nameLower = this.src.slice(nameStart, pos).toLowerCase();

    const isRawBlockDirective =
      this.verbatimStartDirectives.has(nameLower) || this.verbatimEndDirectives.has(nameLower);

    if (!isRawBlockDirective && !this._directives.isDirectiveLower(nameLower)) {
      // Not a known directive, emit everything as text
      this.pos = pos;
      this.emit(TokenType.Text, start, pos);
      this.state = this.returnState;
      this.returnState = State.Data;
      return;
    }

    // Skip whitespace before potential args
    let argPos = pos;
    while (argPos < this.len && isSpace(this.src.charCodeAt(argPos))) {
      argPos++;
    }
    const hasArgs = argPos < this.len && this.src[argPos] === "(";

    this.pos = pos;
    const inTagAttributeState =
      this.state === State.TagName ||
      this.state === State.BeforeAttrName ||
      this.state === State.AttrName ||
      this.state === State.AfterAttrName ||
      this.state === State.BeforeAttrValue ||
      this.state === State.AttrValueQuoted ||
      this.state === State.AttrValueUnquoted;

    // @php without args -> PHP block mode
    if (nameLower === "php" && !hasArgs && !inTagAttributeState) {
      this.emit(TokenType.PhpBlockStart, start, pos);
      this.phpBlock = true;
      this.state = this.returnState;
      this.returnState = State.Data;
      return;
    }

    if (nameLower === "php" && !hasArgs && inTagAttributeState) {
      this.emit(TokenType.Directive, start, pos);
      this.attrPhpDirectiveDepth++;
      this.state = this.returnState;
      this.returnState = State.Data;
      return;
    }

    // @endphp
    if (nameLower === "endphp" && !inTagAttributeState) {
      this.emit(TokenType.PhpBlockEnd, start, pos);
      if (this.phpBlock) {
        this.phpBlock = false;
      }
      this.state = this.returnState;
      this.returnState = State.Data;
      return;
    }

    if (nameLower === "endphp" && inTagAttributeState && this.attrPhpDirectiveDepth > 0) {
      this.attrPhpDirectiveDepth--;
    }

    // @verbatim and plugin-provided raw blocks.
    if (this.verbatimStartDirectives.has(nameLower)) {
      this.emit(TokenType.VerbatimStart, start, pos);
      this.verbatimReturnState = this.state;
      this.verbatim = true;
      this.state = State.Data;
      this.returnState = State.Data;
      return;
    }

    // @endverbatim and plugin-provided raw block terminators.
    if (this.verbatimEndDirectives.has(nameLower)) {
      this.emit(TokenType.VerbatimEnd, start, pos);
      if (this.verbatimReturnState !== null) {
        this.state = this.verbatimReturnState;
        this.verbatimReturnState = null;
      } else {
        this.state = State.Data;
      }
      this.verbatim = false;
      this.returnState = State.Data;
      return;
    }

    this.emit(TokenType.Directive, start, pos);

    if (hasArgs && argPos > pos) {
      this.emit(TokenType.Whitespace, pos, argPos);
      this.pos = argPos;
    }

    if (hasArgs) {
      this.scanDirectiveArgs();
    }

    this.state = this.returnState;
    this.returnState = State.Data;
  }

  private scanDirectiveArgs(): void {
    const start = this.pos;
    if (this.pos >= this.len || this.src[this.pos] !== "(") return;

    this.pos++;
    let depth = 1;
    let firstRecoveryLineBreak = -1;

    while (this.pos < this.len && depth > 0) {
      const byte = this.src[this.pos];

      if (byte === "\n" && depth === 1 && firstRecoveryLineBreak < 0) {
        firstRecoveryLineBreak = this.pos + 1;
      }

      if (byte === "'" || byte === '"') {
        this.pos++;
        this.skipQuotedStringPrim(byte);
      } else if (byte === "`") {
        this.pos++;
        this.skipBacktickStringPrim();
      } else if (byte === "<" && this.peekAhead(1) === "<" && this.peekAhead(2) === "<") {
        this.pos += 3;
        this.skipHeredocPrim();
      } else if (byte === "/" && this.peekAhead(1) === "*") {
        this.pos += 2;
        this.skipBlockCommentPrim();
      } else if (byte === "/" && this.peekAhead(1) === "/") {
        this.pos += 2;
        this.skipLineCommentWithWarnings();
      } else if (byte === "#") {
        this.pos++;
        this.skipLineCommentWithWarnings();
      } else if (byte === "(") {
        depth++;
        this.pos++;
      } else if (byte === ")") {
        depth--;
        this.pos++;
      } else {
        this.pos++;
      }
    }

    if (depth > 0) {
      this.logError(ErrorReason.UnexpectedEof, this.pos);
      // Recovery path for malformed directive args:
      // emit a partial DirectiveArgs token, but stop at the first
      // top-level line break to avoid consuming the entire document.
      const fallbackEnd =
        firstRecoveryLineBreak > 0 ? Math.min(firstRecoveryLineBreak, this.len) : this.pos;
      this.pos = fallbackEnd;
      this.emit(TokenType.DirectiveArgs, start, fallbackEnd);
      return;
    }

    this.emit(TokenType.DirectiveArgs, start, this.pos);
  }

  private isVerbatimTerminatorAt(pos: number): boolean {
    const name = this.readDirectiveNameAt(pos);
    if (name === null) {
      return false;
    }

    return this.verbatimEndDirectives.has(name);
  }

  private readDirectiveNameAt(pos: number): string | null {
    if (pos >= this.len || this.src[pos] !== "@") return null;
    const nameStart = pos + 1;
    let end = nameStart;

    while (end < this.len) {
      const cc = this.src.charCodeAt(end);
      if (isAlnum(cc) || cc === 95) {
        end++;
      } else {
        break;
      }
    }

    if (end === nameStart) return null;

    if (end < this.len) {
      const next = this.src.charCodeAt(end);
      if (isAlnum(next) || next === 95) {
        return null;
      }
    }

    return this.src.slice(nameStart, end).toLowerCase();
  }

  private isEndphpAt(pos: number): boolean {
    if (pos + 7 > this.len || this.src[pos] !== "@") return false;
    if (!this.hasAsciiWordAt(pos + 1, "endphp")) return false;
    if (pos + 7 < this.len) {
      const next = this.src.charCodeAt(pos + 7);
      if (isAlnum(next) || next === 95) return false;
    }
    return true;
  }

  private scanEcho(): void {
    if (this.peek() === "{" && this.peekAhead(1) === "{" && this.peekAhead(2) === "{") {
      this.scanTripleEcho();
      return;
    }

    const start = this.pos;
    this.emit(TokenType.EchoStart, start, start + 2);
    this.pos += 2;

    const contentStart = this.pos;

    while (this.pos < this.len) {
      const byte = this.src[this.pos];

      if (byte === "'") {
        this.pos++;
        this.skipQuotedStringPrim("'");
      } else if (byte === '"') {
        this.pos++;
        this.skipQuotedStringPrim('"');
      } else if (byte === "`") {
        this.pos++;
        this.skipBacktickStringPrim();
      } else if (byte === "<" && this.peekAhead(1) === "<" && this.peekAhead(2) === "<") {
        this.pos += 3;
        this.skipHeredocPrim();
      } else if (byte === "/" && this.peekAhead(1) === "*") {
        this.pos += 2;
        this.skipBlockCommentPrim();
      } else if (byte === "/" && this.peekAhead(1) === "/") {
        this.pos += 2;
        this.skipLineCommentWithWarnings();
      } else if (byte === "#") {
        this.pos++;
        this.skipLineCommentWithWarnings();
      } else if (byte === "{" || byte === "@" || byte === "<") {
        // Construct collision detection
        if (this.detectConstruct()) {
          this.logError(ErrorReason.ConstructCollision, this.pos);
          if (contentStart < this.pos) {
            this.emit(TokenType.EchoContent, contentStart, this.pos);
          }
          this.state = this.returnState;
          this.returnState = State.Data;
          return;
        }
        this.pos++;
      } else if (byte === "}" && this.peekAhead(1) === "}") {
        if (contentStart < this.pos) {
          this.emit(TokenType.EchoContent, contentStart, this.pos);
        }
        this.emit(TokenType.EchoEnd, this.pos, this.pos + 2);
        this.pos += 2;
        this.state = this.returnState;
        this.returnState = State.Data;
        return;
      } else {
        this.pos++;
      }
    }

    // EOF
    this.logError(ErrorReason.UnexpectedEof, this.len);
    if (contentStart < this.pos) {
      this.emit(TokenType.EchoContent, contentStart, this.pos);
    }
    this.pos = this.len;
    this.state = this.returnState;
    this.returnState = State.Data;
  }

  private scanRawEcho(): void {
    const start = this.pos;
    this.emit(TokenType.RawEchoStart, start, start + 3);
    this.pos += 3;

    const contentStart = this.pos;

    while (this.pos < this.len) {
      const byte = this.src[this.pos];

      if (byte === "'") {
        this.pos++;
        this.skipQuotedStringPrim("'");
      } else if (byte === '"') {
        this.pos++;
        this.skipQuotedStringPrim('"');
      } else if (byte === "`") {
        this.pos++;
        this.skipBacktickStringPrim();
      } else if (byte === "<" && this.peekAhead(1) === "<" && this.peekAhead(2) === "<") {
        this.pos += 3;
        this.skipHeredocPrim();
      } else if (byte === "/" && this.peekAhead(1) === "*") {
        this.pos += 2;
        this.skipBlockCommentPrim();
      } else if (byte === "/" && this.peekAhead(1) === "/") {
        this.pos += 2;
        this.skipLineCommentWithWarnings();
      } else if (byte === "#") {
        this.pos++;
        this.skipLineCommentWithWarnings();
      } else if (byte === "{" || byte === "@" || byte === "<") {
        if (this.detectConstruct()) {
          this.logError(ErrorReason.ConstructCollision, this.pos);
          if (contentStart < this.pos) {
            this.emit(TokenType.EchoContent, contentStart, this.pos);
          }
          this.state = this.returnState;
          this.returnState = State.Data;
          return;
        }
        this.pos++;
      } else if (byte === "!" && this.peekAhead(1) === "!" && this.peekAhead(2) === "}") {
        if (contentStart < this.pos) {
          this.emit(TokenType.EchoContent, contentStart, this.pos);
        }
        this.emit(TokenType.RawEchoEnd, this.pos, this.pos + 3);
        this.pos += 3;
        this.state = this.returnState;
        this.returnState = State.Data;
        return;
      } else {
        this.pos++;
      }
    }

    this.logError(ErrorReason.UnexpectedEof, this.len);
    if (contentStart < this.pos) {
      this.emit(TokenType.EchoContent, contentStart, this.pos);
    }
    this.pos = this.len;
    this.state = this.returnState;
    this.returnState = State.Data;
  }

  private scanTripleEcho(): void {
    const start = this.pos;
    this.emit(TokenType.TripleEchoStart, start, start + 3);
    this.pos += 3;

    const contentStart = this.pos;

    while (this.pos < this.len) {
      const byte = this.src[this.pos];

      if (byte === "'") {
        this.pos++;
        this.skipQuotedStringPrim("'");
      } else if (byte === '"') {
        this.pos++;
        this.skipQuotedStringPrim('"');
      } else if (byte === "`") {
        this.pos++;
        this.skipBacktickStringPrim();
      } else if (byte === "<" && this.peekAhead(1) === "<" && this.peekAhead(2) === "<") {
        this.pos += 3;
        this.skipHeredocPrim();
      } else if (byte === "/" && this.peekAhead(1) === "*") {
        this.pos += 2;
        this.skipBlockCommentPrim();
      } else if (byte === "/" && this.peekAhead(1) === "/") {
        this.pos += 2;
        this.skipLineCommentWithWarnings();
      } else if (byte === "#") {
        this.pos++;
        this.skipLineCommentWithWarnings();
      } else if (byte === "{" || byte === "@" || byte === "<") {
        if (this.detectConstruct()) {
          this.logError(ErrorReason.ConstructCollision, this.pos);
          if (contentStart < this.pos) {
            this.emit(TokenType.EchoContent, contentStart, this.pos);
          }
          this.state = this.returnState;
          this.returnState = State.Data;
          return;
        }
        this.pos++;
      } else if (byte === "}" && this.peekAhead(1) === "}" && this.peekAhead(2) === "}") {
        if (contentStart < this.pos) {
          this.emit(TokenType.EchoContent, contentStart, this.pos);
        }
        this.emit(TokenType.TripleEchoEnd, this.pos, this.pos + 3);
        this.pos += 3;
        this.state = this.returnState;
        this.returnState = State.Data;
        return;
      } else {
        this.pos++;
      }
    }

    this.logError(ErrorReason.UnexpectedEof, this.len);
    if (contentStart < this.pos) {
      this.emit(TokenType.EchoContent, contentStart, this.pos);
    }
    this.pos = this.len;
    this.state = this.returnState;
    this.returnState = State.Data;
  }

  private tryScanJsxShorthandAttribute(): boolean {
    if (this.pos >= this.len || this.src[this.pos] !== "{") return false;

    // Make sure it's not an echo
    if (this.pos + 1 < this.len) {
      const next = this.src[this.pos + 1];
      if (next === "{" || next === "!") return false;
    }

    const start = this.pos;
    const originalPos = this.pos;
    this.pos++;

    // Fast path for simple {name} with no nesting
    let fastScanPos = this.pos;
    while (fastScanPos < this.len) {
      const byte = this.src[fastScanPos];

      if (byte === "}") {
        this.pos = fastScanPos + 1;
        this.emit(TokenType.JsxShorthandAttribute, start, this.pos);
        this.state = State.BeforeAttrName;
        return true;
      }

      if (byte === "{" || byte === "'" || byte === '"' || byte === "`" || byte === "/") {
        break; // complex case
      }

      if (byte === "\n" || byte === "\r" || byte === "@") {
        this.pos = originalPos;
        return false;
      }

      fastScanPos++;
    }

    // Complex case - use balanced scanner
    return this.scanBalancedJsLike(
      start,
      TokenType.JsxShorthandAttribute,
      originalPos,
      1, // braceDepth
      0, // parenDepth
      false, // trackParens
      true, // allowComments
      true, // abortOnDirective
      true, // abortOnNewline
    );
  }

  private scanJsxAttributeValue(): boolean {
    const start = this.pos;
    const originalPos = this.pos;

    const startsWithParen = this.src[this.pos] === "(";
    this.pos++;

    const braceDepth = startsWithParen ? 0 : 1;
    const parenDepth = startsWithParen ? 1 : 0;

    // Fast path for simple {expr}
    if (braceDepth === 1 && parenDepth === 0) {
      let fastScanPos = this.pos;
      while (fastScanPos < this.len) {
        const byte = this.src[fastScanPos];

        if (byte === "}") {
          this.pos = fastScanPos + 1;
          this.emit(TokenType.JsxAttributeValue, start, this.pos);
          return true;
        }

        if (
          byte === "{" ||
          byte === "(" ||
          byte === "'" ||
          byte === '"' ||
          byte === "`" ||
          byte === "/"
        ) {
          break;
        }

        if (byte === "\n" || byte === "\r" || byte === "@") {
          this.pos = originalPos;
          return false;
        }

        fastScanPos++;
      }
    }

    return this.scanBalancedJsLike(
      start,
      TokenType.JsxAttributeValue,
      originalPos,
      braceDepth,
      parenDepth,
      true, // trackParens
      true, // allowComments
      true, // abortOnDirective
      false, // abortOnNewline
    );
  }

  private tryScanTsxGenericType(): boolean {
    if (this.pos >= this.len || this.src[this.pos] !== "<") return false;

    // Check if starting a PHP tag
    if (this.pos + 1 < this.len && this.src[this.pos + 1] === "?") {
      return false;
    }

    const start = this.pos;
    const originalPos = this.pos;
    this.pos++;

    // Validate the next character looks like a generic start
    if (this.pos < this.len) {
      const nextByte = this.src[this.pos];

      const isPascalCaseTag =
        this.currentTagName !== "" &&
        this.currentTagName[0] >= "A" &&
        this.currentTagName[0] <= "Z";

      let looksLikeGeneric =
        nextByte === "{" || (nextByte >= "A" && nextByte <= "Z") || nextByte === "_";

      if (isPascalCaseTag) {
        looksLikeGeneric =
          looksLikeGeneric ||
          (nextByte >= "a" && nextByte <= "z") ||
          (nextByte >= "0" && nextByte <= "9") ||
          nextByte === "[" ||
          nextByte === '"' ||
          nextByte === "'" ||
          nextByte === "(" ||
          nextByte === " " ||
          nextByte === "\t";
      }

      if (!looksLikeGeneric) {
        this.pos = originalPos;
        return false;
      }
    }

    let depth = 1;

    while (true) {
      if (this.pos >= this.len) {
        this.pos = originalPos;
        return false;
      }

      const nextPos = this.nextInterestingPosForTsxGeneric(this.pos);
      if (nextPos >= this.len) {
        this.pos = originalPos;
        return false;
      }

      this.pos = nextPos;
      const byte = this.src[this.pos];

      if (byte === "<") {
        depth++;
        this.pos++;
        continue;
      }

      if (byte === ">") {
        // Arrow function => should not close generics
        if (this.pos > 0 && this.src[this.pos - 1] === "=") {
          this.pos++;
          continue;
        }

        depth--;
        this.pos++;
        if (depth === 0) {
          this.emit(TokenType.TsxGenericType, start, this.pos);
          return true;
        }
        continue;
      }

      if (byte === "\n" || byte === "\r" || byte === "@") {
        this.pos = originalPos;
        return false;
      }

      if (byte === '"' || byte === "'") {
        this.pos++;
        this.skipQuotedStringPrim(byte);
        continue;
      }

      if (byte === "`") {
        this.pos++;
        this.skipTemplateLiteralPrim();
        continue;
      }

      this.pos++;
    }
  }

  /**
   * Balanced scanner for JSX-ish content.
   */
  private scanBalancedJsLike(
    start: number,
    tokenType: TokenType,
    originalPos: number,
    braceDepth: number,
    parenDepth: number,
    trackParens: boolean,
    allowComments: boolean,
    abortOnDirective: boolean,
    abortOnNewline: boolean,
  ): boolean {
    while (true) {
      if (this.pos >= this.len) {
        this.emit(tokenType, start, this.pos);
        return true;
      }

      const nextPos = this.nextInterestingPosForBalancedJsLike(this.pos);
      if (nextPos >= this.len) {
        this.pos = this.len;
        this.emit(tokenType, start, this.pos);
        return true;
      }

      this.pos = nextPos;
      const byte = this.src[this.pos];

      if (byte === "{") {
        braceDepth++;
        this.pos++;
        continue;
      }

      if (byte === "}") {
        braceDepth--;
        this.pos++;
        if (braceDepth === 0 && (!trackParens || parenDepth === 0)) {
          this.emit(tokenType, start, this.pos);
          return true;
        }
        continue;
      }

      if (trackParens && byte === "(") {
        parenDepth++;
        this.pos++;
        continue;
      }

      if (trackParens && byte === ")") {
        parenDepth--;
        this.pos++;
        if (braceDepth === 0 && parenDepth === 0) {
          this.emit(tokenType, start, this.pos);
          return true;
        }
        continue;
      }

      if (byte === '"' || byte === "'") {
        this.pos++;
        this.skipQuotedStringPrim(byte);
        continue;
      }

      if (byte === "`") {
        this.pos++;
        this.skipTemplateLiteralPrim();
        continue;
      }

      if (byte === "/") {
        if (!allowComments) {
          this.pos++;
          continue;
        }

        if (this.pos + 1 < this.len) {
          const next = this.src[this.pos + 1];
          if (next === "/") {
            this.pos += 2;
            // Skip line comment to end of line
            while (this.pos < this.len) {
              const ch = this.src[this.pos];
              if (ch === "\n" || ch === "\r") {
                this.pos++;
                if (ch === "\r" && this.pos < this.len && this.src[this.pos] === "\n") {
                  this.pos++;
                }
                break;
              }
              this.pos++;
            }
            continue;
          }
          if (next === "*") {
            this.pos += 2;
            this.skipBlockCommentPrim();
            continue;
          }
        }

        this.pos++;
        continue;
      }

      if (abortOnDirective && byte === "@") {
        this.pos = originalPos;
        return false;
      }

      if (abortOnNewline && (byte === "\n" || byte === "\r")) {
        this.pos = originalPos;
        return false;
      }

      this.pos++;
    }
  }

  private scanRawtext(): void {
    const start = this.pos;
    const tagName = this.rawtextTagName;
    const tagNameLen = tagName.length;

    while (this.pos < this.len) {
      const byte = this.src[this.pos];

      // Check for Blade constructs
      if (byte === "{" && !this.verbatim && !this.phpBlock) {
        const next1 = this.peekAhead(1);

        if (next1 === "{") {
          const next2 = this.peekAhead(2);
          const next3 = this.peekAhead(3);
          if (start < this.pos) {
            this.emit(TokenType.Text, start, this.pos);
          }
          this.returnState = State.RawText;
          if (next2 === "-" && next3 === "-") {
            this.scanBladeCommentStart();
            return;
          }
          this.scanEcho();
          return;
        } else if (next1 === "!" && this.pos + 2 < this.len && this.src[this.pos + 2] === "!") {
          if (start < this.pos) {
            this.emit(TokenType.Text, start, this.pos);
          }
          this.returnState = State.RawText;
          this.scanRawEcho();
          return;
        }
        this.pos++;
        continue;
      }

      // Directives in rawtext
      if (byte === "@" && !this.verbatim && !this.phpBlock) {
        const prevChar = this.pos > 0 ? this.src[this.pos - 1] : null;
        const canStart =
          this.pos === 0 ||
          (prevChar !== null && !isAlnum(prevChar.charCodeAt(0)) && prevChar !== "@");

        if (canStart) {
          const nextPos = this.pos + 1;
          let isEscaped = false;
          if (nextPos < this.len) {
            const nextByte = this.src[nextPos];
            if (nextByte === "@") {
              isEscaped = true;
            } else if (nextByte === "{" && nextPos + 1 < this.len) {
              const afterBrace = this.src[nextPos + 1];
              if (afterBrace === "{" || afterBrace === "!") {
                isEscaped = true;
              }
            }
          }

          if (start < this.pos) {
            this.emit(TokenType.Text, start, this.pos);
          }

          if (isEscaped) {
            this.emit(TokenType.AtSign, this.pos, this.pos + 1);
            this.pos++;
            return;
          }

          this.returnState = State.RawText;
          this.scanDirective();
          return;
        }
        this.pos++;
        continue;
      }

      // Check for closing tag
      if (byte === "<") {
        if (this.pos + 2 + tagNameLen <= this.len && this.src[this.pos + 1] === "/") {
          const potentialTagName = this.src.slice(this.pos + 2, this.pos + 2 + tagNameLen);
          if (potentialTagName.toLowerCase() === tagName) {
            const afterTagPos = this.pos + 2 + tagNameLen;
            if (afterTagPos < this.len) {
              const afterTagChar = this.src[afterTagPos];
              if (afterTagChar === ">" || isSpace(afterTagChar.charCodeAt(0))) {
                if (start < this.pos) {
                  this.emit(TokenType.Text, start, this.pos);
                }
                this.rawtextTagName = "";

                this.emit(TokenType.LessThan, this.pos, this.pos + 1);
                this.pos++;
                this.emit(TokenType.Slash, this.pos, this.pos + 1);
                this.pos++;
                this.emit(TokenType.TagName, this.pos, this.pos + tagNameLen);
                this.currentTagName = potentialTagName;
                this.isClosingTag = true;
                this.pos += tagNameLen;

                let peekPos = this.pos;
                while (peekPos < this.len && isSpace(this.src.charCodeAt(peekPos))) {
                  peekPos++;
                }

                if (peekPos < this.len && this.src[peekPos] === ">") {
                  if (this.pos < peekPos) {
                    this.emit(TokenType.Whitespace, this.pos, peekPos);
                    this.pos = peekPos;
                  }
                  this.emit(TokenType.GreaterThan, this.pos, this.pos + 1);
                  this.pos++;
                } else {
                  this.emit(TokenType.SyntheticClose, this.pos, this.pos);
                }
                this.state = State.Data;
                return;
              }
            } else if (afterTagPos === this.len) {
              if (start < this.pos) {
                this.emit(TokenType.Text, start, this.pos);
              }
              this.rawtextTagName = "";
              this.emit(TokenType.LessThan, this.pos, this.pos + 1);
              this.pos++;
              this.emit(TokenType.Slash, this.pos, this.pos + 1);
              this.pos++;
              this.emit(TokenType.TagName, this.pos, this.pos + tagNameLen);
              this.pos += tagNameLen;
              this.state = State.Data;
              return;
            }
          }
        }
        this.pos++;
        continue;
      }

      this.pos++;
    }

    // EOF
    if (start < this.pos) {
      this.emit(TokenType.Text, start, this.pos);
    }
    this.rawtextTagName = "";
  }
}

function isAlpha(ch: number): boolean {
  return (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122);
}

function isAlnum(ch: number): boolean {
  return isAlpha(ch) || (ch >= 48 && ch <= 57);
}

function isSpace(ch: number): boolean {
  return ch === 32 || ch === 9 || ch === 10 || ch === 13;
}

function normalizeDirectiveName(name: string): string {
  return name.trim().toLowerCase().replace(/^@/, "");
}

export function tokenize(
  source: string,
  directives?: Directives,
  rawBlockConfig?: LexerRawBlockConfig,
): LexerResult {
  return new Lexer(source, directives, rawBlockConfig).tokenize();
}

export function tokenContent(source: string, token: Token): string {
  return source.slice(token.start, token.end);
}

export function reconstructFromTokens(tokens: Token[], source: string): string {
  let result = "";
  for (const token of tokens) {
    result += source.slice(token.start, token.end);
  }
  return result;
}
