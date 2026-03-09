import { describe, it, expect } from "vitest";
import { tokenize, TokenType, tokenContent, reconstructFromTokens } from "../../src/lexer/index.js";

describe('Multibyte Tokenization', () => {
    it('handles UTF-8 BOM at start', () => {
        const source = "\uFEFFHello World";
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe(TokenType.Text);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    it('handles UTF-8 BOM with echo', () => {
        const source = "\uFEFF{{ $var }}";
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(4);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    it('handles Chinese characters in text', () => {
        const source = 'Some text: 测试 some more text';
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe(TokenType.Text);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    it('handles Japanese in echo', () => {
        const source = '{{ $日本語 }}';
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    it('handles mixed CJK characters', () => {
        const source = '日本語">{{ $中文 }}';
        const result = tokenize(source);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    it('handles search ellipsis', () => {
        const source = 'Search\u2026';
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(1);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    it('handles guillemets', () => {
        const source = '\u00AB\u00AB';
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(1);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    it('handles corner brackets', () => {
        const source = '\u3010\u3011';
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(1);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    it('handles emoji in text', () => {
        const source = '\uD83D\uDC18\uD83D\uDC18\uD83D\uDC18\uD83D\uDC18';
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(1);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    it('handles specific high unicode code points', () => {
        const grinningFace = '\u{1F600}';
        const linearB = '\u{10000}';
        const snowman = '\u{2603}';

        const source = `${grinningFace} ${linearB} ${snowman}`;
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(1);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    it('handles high code points in echo', () => {
        const grinningFace = '\u{1F600}';
        const linearB = '\u{10000}';
        const snowman = '\u{2603}';

        const source = `{{ '${grinningFace}${linearB}${snowman}' }}`;
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    it('handles emoji in echo', () => {
        const source = "{{ '\uD83C\uDF89' }}";
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    it('handles mixed emoji and text', () => {
        const source = '测试 content with \u00E9mojis \uD83C\uDF89';
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(1);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    it('handles multibyte in all three echo variants', () => {
        const source = "{{ '测试' }} text {!! '\uD83C\uDF89' !!} more {{{ '日本語' }}}";
        const result = tokenize(source);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    it('handles multibyte near braces', () => {
        const source = "{{ '测试{{ nested }} test' }}";
        const result = tokenize(source);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    it('handles 4-byte emoji sequences', () => {
        const source = "Text {{ '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}' }} more";
        const result = tokenize(source);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    it('char offsets for multibyte characters', () => {
        const source = '测试{{ $var }}';
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens[0].type).toBe(TokenType.Text);
        expect(tokens[0].start).toBe(0);
        expect(tokens[0].end).toBe(2);
        expect(tokenContent(source, tokens[0])).toBe('测试');
        expect(tokens[1].type).toBe(TokenType.EchoStart);
        expect(tokens[1].start).toBe(2);
        expect(tokens[1].end).toBe(4);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    it('handles various control characters', () => {
        const source = "Test\x01\x02\x03\x04\x05\x06\x07\x08\x0B\x0C\x0E\x0FTest";
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(1);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });
});
