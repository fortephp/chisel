import { getIgnoreCommentKindFromCommentText } from "../ignore-markers.js";
import { Directives } from "./directives.js";
import { Lexer, type LexerRawBlockConfig } from "./lexer.js";
import { State, type IgnoreRangeRegion, type IgnoreRangeResumeState } from "./types.js";

function isTagIgnoreState(state: State): boolean {
  switch (state) {
    case State.TagName:
    case State.BeforeAttrName:
    case State.AttrName:
    case State.AfterAttrName:
    case State.BeforeAttrValue:
    case State.AttrValueUnquoted:
      return true;
    default:
      return false;
  }
}

function isIgnoreMarkerAllowed(wrapper: "blade" | "html", originState: State): boolean {
  if (originState === State.AttrValueQuoted) {
    return false;
  }

  if (wrapper === "html") {
    return originState !== State.RawText;
  }

  return true;
}

class IgnoreRangeCollectorImpl {
  private ranges: IgnoreRangeRegion[] = [];
  private depth = 0;
  private outerStart = -1;

  constructor(private readonly source: string) {}

  handleBladeComment(
    start: number,
    end: number,
    originState: State,
    tagStart: number | null,
    resume: IgnoreRangeResumeState,
  ): void {
    this.handleComment("blade", start, end, originState, tagStart, resume);
  }

  handleHtmlComment(
    start: number,
    end: number,
    originState: State,
    tagStart: number | null,
    resume: IgnoreRangeResumeState,
  ): void {
    this.handleComment("html", start, end, originState, tagStart, resume);
  }

  finish(resume: IgnoreRangeResumeState, eof: number): IgnoreRangeRegion[] {
    if (this.depth > 0 && this.outerStart >= 0) {
      this.ranges.push({
        start: this.outerStart,
        end: eof,
        resume,
      });
      this.depth = 0;
      this.outerStart = -1;
    }

    return this.ranges;
  }

  private handleComment(
    wrapper: "blade" | "html",
    start: number,
    end: number,
    originState: State,
    tagStart: number | null,
    resume: IgnoreRangeResumeState,
  ): void {
    if (!isIgnoreMarkerAllowed(wrapper, originState)) {
      return;
    }

    const kind = getIgnoreCommentKindFromCommentText(this.source.slice(start, end), wrapper);
    if (!kind) {
      return;
    }

    if (kind === "ignore-start") {
      if (this.depth === 0) {
        this.outerStart =
          isTagIgnoreState(originState) && tagStart !== null && tagStart >= 0 ? tagStart : start;
      }
      this.depth++;
      return;
    }

    if (this.depth === 0) {
      return;
    }

    this.depth--;
    if (this.depth !== 0) {
      return;
    }

    this.ranges.push({
      start: this.outerStart >= 0 ? this.outerStart : start,
      end,
      resume,
    });
    this.outerStart = -1;
  }
}

export function collectIgnoreRanges(
  source: string,
  directives?: Directives,
  rawBlockConfig?: LexerRawBlockConfig,
): IgnoreRangeRegion[] {
  const collector = new IgnoreRangeCollectorImpl(source);
  new Lexer(source, directives, {
    ...rawBlockConfig,
    ignoreRangeCollector: collector,
  }).tokenize();

  return collector.finish(
    {
      state: State.Data,
      returnState: State.Data,
      rawtextTagName: "",
      currentTagName: "",
      isClosingTag: false,
      continuedTagName: false,
      inXmlDeclaration: false,
      verbatim: false,
      verbatimReturnState: null,
      phpBlock: false,
      phpTag: false,
      attrPhpDirectiveDepth: 0,
    },
    source.length,
  );
}
