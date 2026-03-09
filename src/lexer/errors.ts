export const enum ErrorReason {
  UnexpectedEof = 0,
  ConstructCollision = 1,
  PhpCloseTagInComment = 2,
}

export interface LexerError {
  reason: ErrorReason;
  offset: number;
}
