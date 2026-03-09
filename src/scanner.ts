export const enum TokenType {
  Text,
  HtmlOpenTagStart, // "<div" - includes tag name
  HtmlOpenTagEnd, // ">" or "/>"
  HtmlCloseTag, // "</div>"
  HtmlComment, // "<!-- ... -->"
  HtmlDoctype, // "<!DOCTYPE ...>"
  AttributeName, // "class", "x-data", ":class"
  AttributeAssign, // "="
  AttributeValueStart, // opening quote (' or ")
  AttributeValue, // the value content between quotes
  AttributeValueEnd, // closing quote
  BladeEcho, // "{{ expr }}"
  BladeRawEcho, // "{!! expr !!}"
  BladeComment, // "{{-- comment --}}"
  BladeDirective, // "@if(...)" or "@csrf"
  RawContent, // content inside <script>, <style>, <pre>, <textarea>
}

export interface Token {
  type: TokenType;
  start: number;
  end: number;
}

const RAW_TAGS = new Set(["script", "style", "pre", "textarea"]);

function isAlpha(ch: number): boolean {
  return (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122);
}

function isWhitespace(ch: number): boolean {
  return ch === 32 || ch === 9 || ch === 10 || ch === 13;
}

function isTagNameChar(ch: number): boolean {
  // a-z A-Z 0-9 - . : (for x-component, alpine :class, namespaced tags)
  return (
    isAlpha(ch) ||
    (ch >= 48 && ch <= 57) ||
    ch === 45 /* - */ ||
    ch === 46 /* . */ ||
    ch === 58 /* : */
  );
}

function isAttrNameChar(ch: number): boolean {
  // Attribute names: a-z A-Z 0-9 - _ . : @ (for alpine, vue, blade shorthands)
  return (
    isAlpha(ch) ||
    (ch >= 48 && ch <= 57) ||
    ch === 45 /* - */ ||
    ch === 95 /* _ */ ||
    ch === 46 /* . */ ||
    ch === 58 /* : */ ||
    ch === 64 /* @ */
  );
}

function skipString(src: string, pos: number, len: number, quoteCode: number): number {
  pos++; // skip opening quote
  while (pos < len) {
    const ch = src.charCodeAt(pos);
    if (ch === quoteCode) return pos + 1;
    if (ch === 92 /* \ */) {
      pos += 2;
      continue;
    }
    pos++;
  }
  return pos;
}

function scanParams(src: string, pos: number, len: number): number {
  let depth = 1;
  pos++; // skip opening (
  while (pos < len) {
    const ch = src.charCodeAt(pos);
    if (ch === 40 /* ( */) {
      depth++;
    } else if (ch === 41 /* ) */) {
      depth--;
      if (depth === 0) return pos + 1;
    } else if (ch === 39 /* ' */ || ch === 34 /* " */) {
      pos = skipString(src, pos, len, ch);
      continue;
    }
    pos++;
  }
  return pos;
}

export function scan(source: string): Token[] {
  const tokens: Token[] = [];
  const len = source.length;
  let pos = 0;
  let textStart = 0;

  while (pos < len) {
    if (
      source.charCodeAt(pos) === 123 /* { */ &&
      pos + 3 < len &&
      source.charCodeAt(pos + 1) === 123 /* { */ &&
      source.charCodeAt(pos + 2) === 45 /* - */ &&
      source.charCodeAt(pos + 3) === 45 /* - */
    ) {
      if (pos > textStart) {
        tokens.push({ type: TokenType.Text, start: textStart, end: pos });
      }
      const end = scanBladeComment(source, pos, len);
      tokens.push({ type: TokenType.BladeComment, start: pos, end });
      pos = end;
      textStart = pos;
      continue;
    }

    if (
      source.charCodeAt(pos) === 123 /* { */ &&
      pos + 2 < len &&
      source.charCodeAt(pos + 1) === 33 /* ! */ &&
      source.charCodeAt(pos + 2) === 33 /* ! */
    ) {
      if (pos > textStart) {
        tokens.push({ type: TokenType.Text, start: textStart, end: pos });
      }
      const end = scanBladeRawEcho(source, pos, len);
      tokens.push({ type: TokenType.BladeRawEcho, start: pos, end });
      pos = end;
      textStart = pos;
      continue;
    }

    if (
      source.charCodeAt(pos) === 123 /* { */ &&
      pos + 1 < len &&
      source.charCodeAt(pos + 1) === 123 /* { */
    ) {
      if (pos > textStart) {
        tokens.push({ type: TokenType.Text, start: textStart, end: pos });
      }
      const end = scanBladeEcho(source, pos, len);
      tokens.push({ type: TokenType.BladeEcho, start: pos, end });
      pos = end;
      textStart = pos;
      continue;
    }

    if (
      source.charCodeAt(pos) === 64 /* @ */ &&
      pos + 1 < len &&
      source.charCodeAt(pos + 1) === 64 /* @ */
    ) {
      // Skip both @@ - they become part of the current text run
      pos += 2;
      continue;
    }

    if (
      source.charCodeAt(pos) === 64 /* @ */ &&
      pos + 1 < len &&
      source.charCodeAt(pos + 1) === 123 /* { */ &&
      pos + 2 < len &&
      source.charCodeAt(pos + 2) === 123 /* { */
    ) {
      // Skip @{{ - stays as text. Advance past @ and let {{ be consumed as text too
      pos++;
      continue;
    }

    if (
      source.charCodeAt(pos) === 64 /* @ */ &&
      pos + 1 < len &&
      isAlpha(source.charCodeAt(pos + 1))
    ) {
      if (pos > textStart) {
        tokens.push({ type: TokenType.Text, start: textStart, end: pos });
      }
      const end = scanBladeDirective(source, pos, len);
      tokens.push({ type: TokenType.BladeDirective, start: pos, end });
      pos = end;
      textStart = pos;
      continue;
    }

    if (
      source.charCodeAt(pos) === 60 /* < */ &&
      pos + 3 < len &&
      source.charCodeAt(pos + 1) === 33 /* ! */ &&
      source.charCodeAt(pos + 2) === 45 /* - */ &&
      source.charCodeAt(pos + 3) === 45 /* - */
    ) {
      if (pos > textStart) {
        tokens.push({ type: TokenType.Text, start: textStart, end: pos });
      }
      const end = scanHtmlComment(source, pos, len);
      tokens.push({ type: TokenType.HtmlComment, start: pos, end });
      pos = end;
      textStart = pos;
      continue;
    }

    if (
      source.charCodeAt(pos) === 60 /* < */ &&
      pos + 1 < len &&
      source.charCodeAt(pos + 1) === 33 /* ! */ &&
      pos + 9 < len &&
      source.slice(pos + 2, pos + 9).toUpperCase() === "DOCTYPE"
    ) {
      if (pos > textStart) {
        tokens.push({ type: TokenType.Text, start: textStart, end: pos });
      }
      const end = scanHtmlDoctype(source, pos, len);
      tokens.push({ type: TokenType.HtmlDoctype, start: pos, end });
      pos = end;
      textStart = pos;
      continue;
    }

    if (
      source.charCodeAt(pos) === 60 /* < */ &&
      pos + 1 < len &&
      source.charCodeAt(pos + 1) === 47 /* / */
    ) {
      if (pos > textStart) {
        tokens.push({ type: TokenType.Text, start: textStart, end: pos });
      }
      const end = scanHtmlCloseTag(source, pos, len);
      tokens.push({ type: TokenType.HtmlCloseTag, start: pos, end });
      pos = end;
      textStart = pos;
      continue;
    }

    if (
      source.charCodeAt(pos) === 60 /* < */ &&
      pos + 1 < len &&
      isAlpha(source.charCodeAt(pos + 1))
    ) {
      if (pos > textStart) {
        tokens.push({ type: TokenType.Text, start: textStart, end: pos });
      }
      pos = scanHtmlOpenTag(source, pos, len, tokens);
      textStart = pos;
      continue;
    }

    pos++;
  }

  // Flush trailing text
  if (pos > textStart) {
    tokens.push({ type: TokenType.Text, start: textStart, end: pos });
  }

  return tokens;
}

function scanBladeComment(src: string, start: number, len: number): number {
  // {{-- ... --}}
  let pos = start + 4; // skip {{--
  while (pos < len) {
    if (
      src.charCodeAt(pos) === 45 /* - */ &&
      pos + 3 <= len &&
      src.charCodeAt(pos + 1) === 45 /* - */ &&
      src.charCodeAt(pos + 2) === 125 /* } */ &&
      src.charCodeAt(pos + 3) === 125 /* } */
    ) {
      return pos + 4;
    }
    pos++;
  }
  return len;
}

function scanBladeRawEcho(src: string, start: number, len: number): number {
  // {!! ... !!}
  let pos = start + 3; // skip {!!
  while (pos < len) {
    if (
      src.charCodeAt(pos) === 33 /* ! */ &&
      pos + 2 <= len &&
      src.charCodeAt(pos + 1) === 33 /* ! */ &&
      src.charCodeAt(pos + 2) === 125 /* } */
    ) {
      return pos + 3;
    }
    // Skip strings inside the expression
    const ch = src.charCodeAt(pos);
    if (ch === 39 /* ' */ || ch === 34 /* " */) {
      pos = skipString(src, pos, len, ch);
      continue;
    }
    pos++;
  }
  return len;
}

function scanBladeEcho(src: string, start: number, len: number): number {
  // {{ ... }}
  let pos = start + 2; // skip {{
  while (pos < len) {
    const ch = src.charCodeAt(pos);
    if (ch === 125 /* } */ && pos + 1 < len && src.charCodeAt(pos + 1) === 125 /* } */) {
      return pos + 2;
    }
    if (ch === 39 /* ' */ || ch === 34 /* " */) {
      pos = skipString(src, pos, len, ch);
      continue;
    }
    pos++;
  }
  return len;
}

function scanBladeDirective(src: string, start: number, len: number): number {
  let pos = start + 1; // skip @

  // Scan directive name
  while (pos < len && (isAlpha(src.charCodeAt(pos)) || src.charCodeAt(pos) === 95) /* _ */) {
    pos++;
  }

  // Scan optional params
  if (pos < len && src.charCodeAt(pos) === 40 /* ( */) {
    pos = scanParams(src, pos, len);
  }

  return pos;
}

function scanHtmlComment(src: string, start: number, len: number): number {
  // <!-- ... -->
  let pos = start + 4; // skip <!--
  while (pos < len) {
    if (
      src.charCodeAt(pos) === 45 /* - */ &&
      pos + 2 <= len &&
      src.charCodeAt(pos + 1) === 45 /* - */ &&
      src.charCodeAt(pos + 2) === 62 /* > */
    ) {
      return pos + 3;
    }
    pos++;
  }
  return len;
}

function scanHtmlDoctype(src: string, start: number, len: number): number {
  let pos = start + 2; // skip <!
  while (pos < len) {
    if (src.charCodeAt(pos) === 62 /* > */) {
      return pos + 1;
    }
    pos++;
  }
  return len;
}

function scanHtmlCloseTag(src: string, start: number, len: number): number {
  // </tagname>  or </tagname  >
  let pos = start + 2; // skip </
  // Skip whitespace before tag name
  while (pos < len && isWhitespace(src.charCodeAt(pos))) pos++;
  // Scan tag name
  while (pos < len && isTagNameChar(src.charCodeAt(pos))) pos++;
  // Skip whitespace before >
  while (pos < len && isWhitespace(src.charCodeAt(pos))) pos++;
  // Expect >
  if (pos < len && src.charCodeAt(pos) === 62 /* > */) {
    return pos + 1;
  }
  return pos;
}

function scanHtmlOpenTag(src: string, start: number, len: number, tokens: Token[]): number {
  let pos = start + 1; // skip <

  // Scan tag name
  const nameStart = pos;
  while (pos < len && isTagNameChar(src.charCodeAt(pos))) pos++;
  const tagName = src.slice(nameStart, pos).toLowerCase();

  tokens.push({ type: TokenType.HtmlOpenTagStart, start, end: pos });

  // Scan attributes until > or />
  pos = scanAttributes(src, pos, len, tokens);

  // Determine self-closing
  let selfClosing = false;
  if (pos < len && src.charCodeAt(pos) === 47 /* / */) {
    selfClosing = true;
    pos++; // skip /
  }
  if (pos < len && src.charCodeAt(pos) === 62 /* > */) {
    const tagEndStart = selfClosing ? pos - 1 : pos;
    tokens.push({
      type: TokenType.HtmlOpenTagEnd,
      start: tagEndStart,
      end: pos + 1,
    });
    pos++; // skip >
  }

  // If this is a raw content tag, scan until </tagname>
  if (!selfClosing && RAW_TAGS.has(tagName)) {
    const contentStart = pos;
    pos = scanRawContent(src, pos, len, tagName);
    if (pos > contentStart) {
      tokens.push({
        type: TokenType.RawContent,
        start: contentStart,
        end: pos,
      });
    }
  }

  return pos;
}

function scanAttributes(src: string, pos: number, len: number, tokens: Token[]): number {
  while (pos < len) {
    // Skip whitespace
    while (pos < len && isWhitespace(src.charCodeAt(pos))) pos++;

    // Check for end of tag
    if (pos >= len) break;
    const ch = src.charCodeAt(pos);
    if (
      ch === 62 /* > */ ||
      (ch === 47 /* / */ && pos + 1 < len && src.charCodeAt(pos + 1) === 62)
    ) {
      break;
    }

    if (ch === 64 /* @ */ && pos + 1 < len && isAlpha(src.charCodeAt(pos + 1))) {
      const end = scanBladeDirective(src, pos, len);
      tokens.push({ type: TokenType.BladeDirective, start: pos, end });
      pos = end;
      continue;
    }

    if (ch === 123 /* { */ && pos + 1 < len && src.charCodeAt(pos + 1) === 123 /* { */) {
      const end = scanBladeEcho(src, pos, len);
      tokens.push({ type: TokenType.BladeEcho, start: pos, end });
      pos = end;
      continue;
    }

    if (isAttrNameChar(ch)) {
      const nameStart = pos;
      while (pos < len && isAttrNameChar(src.charCodeAt(pos))) pos++;
      tokens.push({
        type: TokenType.AttributeName,
        start: nameStart,
        end: pos,
      });

      // Skip whitespace
      while (pos < len && isWhitespace(src.charCodeAt(pos))) pos++;

      // Check for = (attribute value)
      if (pos < len && src.charCodeAt(pos) === 61 /* = */) {
        tokens.push({
          type: TokenType.AttributeAssign,
          start: pos,
          end: pos + 1,
        });
        pos++; // skip =

        // Skip whitespace
        while (pos < len && isWhitespace(src.charCodeAt(pos))) pos++;

        // Scan attribute value
        if (pos < len) {
          const qch = src.charCodeAt(pos);
          if (qch === 34 /* " */ || qch === 39 /* ' */) {
            pos = scanAttributeValue(src, pos, len, qch, tokens);
          } else {
            // Unquoted attribute value - scan until whitespace or >
            const valStart = pos;
            while (
              pos < len &&
              !isWhitespace(src.charCodeAt(pos)) &&
              src.charCodeAt(pos) !== 62 /* > */ &&
              src.charCodeAt(pos) !== 47 /* / */
            ) {
              pos++;
            }
            if (pos > valStart) {
              tokens.push({
                type: TokenType.AttributeValue,
                start: valStart,
                end: pos,
              });
            }
          }
        }
      }
      continue;
    }

    // Unknown character in attribute position - skip to avoid infinite loop
    pos++;
  }

  return pos;
}

function scanAttributeValue(
  src: string,
  start: number,
  len: number,
  quoteCode: number,
  tokens: Token[],
): number {
  // Emit opening quote
  tokens.push({
    type: TokenType.AttributeValueStart,
    start,
    end: start + 1,
  });

  let pos = start + 1;
  let valueStart = pos;

  while (pos < len) {
    const ch = src.charCodeAt(pos);

    // Closing quote
    if (ch === quoteCode) {
      // Flush any pending value text
      if (pos > valueStart) {
        tokens.push({
          type: TokenType.AttributeValue,
          start: valueStart,
          end: pos,
        });
      }
      tokens.push({
        type: TokenType.AttributeValueEnd,
        start: pos,
        end: pos + 1,
      });
      return pos + 1;
    }

    // Blade echo inside attribute value {{ ... }}
    if (ch === 123 /* { */ && pos + 1 < len && src.charCodeAt(pos + 1) === 123 /* { */) {
      // Flush text before the blade echo
      if (pos > valueStart) {
        tokens.push({
          type: TokenType.AttributeValue,
          start: valueStart,
          end: pos,
        });
      }
      const end = scanBladeEcho(src, pos, len);
      tokens.push({ type: TokenType.BladeEcho, start: pos, end });
      pos = end;
      valueStart = pos;
      continue;
    }

    pos++;
  }

  // Unterminated attribute value - flush what we have
  if (pos > valueStart) {
    tokens.push({
      type: TokenType.AttributeValue,
      start: valueStart,
      end: pos,
    });
  }
  return pos;
}

function scanRawContent(src: string, start: number, len: number, tagName: string): number {
  // Scan until </tagName> (case-insensitive)
  let pos = start;
  const closeTag = `</${tagName}`;
  const closeLen = closeTag.length;

  while (pos < len) {
    if (
      src.charCodeAt(pos) === 60 /* < */ &&
      pos + 1 < len &&
      src.charCodeAt(pos + 1) === 47 /* / */ &&
      pos + closeLen <= len &&
      src.slice(pos, pos + closeLen).toLowerCase() === closeTag
    ) {
      // Check that the next char after the tag name is > or whitespace
      const afterName = pos + closeLen;
      if (
        afterName >= len ||
        src.charCodeAt(afterName) === 62 /* > */ ||
        isWhitespace(src.charCodeAt(afterName))
      ) {
        return pos; // stop before </tagname>
      }
    }
    pos++;
  }

  return pos;
}

export function tokenContent(source: string, token: Token): string {
  return source.slice(token.start, token.end);
}

export function hasBladeInRawContent(source: string, token: Token): boolean {
  if (token.type !== TokenType.RawContent) return false;
  const content = source.slice(token.start, token.end);
  // Quick check for Blade constructs
  for (let i = 0; i < content.length; i++) {
    const ch = content.charCodeAt(i);
    // @directive
    if (ch === 64 /* @ */ && i + 1 < content.length && isAlpha(content.charCodeAt(i + 1))) {
      return true;
    }
    // {{ or {!!
    if (ch === 123 /* { */ && i + 1 < content.length) {
      const next = content.charCodeAt(i + 1);
      if (next === 123 /* { */ || next === 33 /* ! */) {
        return true;
      }
    }
  }
  return false;
}
