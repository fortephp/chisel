import { describe, it, expect, beforeEach } from "vitest";
import { tokenize, TokenType, Directives } from "../../src/lexer/index.js";

let directives: Directives;

beforeEach(() => {
    directives = Directives.empty();
});

describe('CDATA Section Tokenization', () => {
    it('tokenizes basic CDATA section', () => {
        const source = '<![CDATA[content]]>';
        const result = tokenize(source, directives);

        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[0].type).toBe(TokenType.CdataStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(result.tokens[2].type).toBe(TokenType.CdataEnd);
        expect(source.slice(result.tokens[0].start, result.tokens[0].end)).toBe('<![CDATA[');
        expect(source.slice(result.tokens[1].start, result.tokens[1].end)).toBe('content');
        expect(source.slice(result.tokens[2].start, result.tokens[2].end)).toBe(']]>');

    });

    it('tokenizes CDATA with special characters', () => {
        const source = '<![CDATA[<div class="foo" & bar>]]>';
        const result = tokenize(source, directives);

        expect(result.tokens).toHaveLength(3);
        expect(source.slice(result.tokens[1].start, result.tokens[1].end)).toBe('<div class="foo" & bar>');
    });

    it('tokenizes CDATA with Blade syntax preserved', () => {
        const source = '<![CDATA[{{ $variable }} @directive]]>';
        const result = tokenize(source, directives);

        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(source.slice(result.tokens[1].start, result.tokens[1].end)).toBe('{{ $variable }} @directive');
    });

    it('tokenizes empty CDATA section', () => {
        const source = '<![CDATA[]]>';
        const result = tokenize(source, directives);

        expect(result.tokens).toHaveLength(2);
        expect(result.tokens[0].type).toBe(TokenType.CdataStart);
        expect(result.tokens[1].type).toBe(TokenType.CdataEnd);
    });

    it('handles unclosed CDATA section', () => {
        const source = '<![CDATA[content without closing';
        const result = tokenize(source, directives);

        expect(result.tokens).toHaveLength(2);
        expect(result.tokens[0].type).toBe(TokenType.CdataStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(result.errors).toHaveLength(1);
    });

    it('tokenizes CDATA with newlines', () => {
        const source = "<![CDATA[line1\nline2\nline3]]>";
        const result = tokenize(source, directives);

        expect(result.tokens).toHaveLength(3);
        expect(source.slice(result.tokens[1].start, result.tokens[1].end)).toBe("line1\nline2\nline3");
    });

    it('does not confuse conditional comment end with CDATA', () => {
        const source = '<![endif]-->';
        const result = tokenize(source, directives);

        expect(result.tokens[0].type).toBe(TokenType.ConditionalCommentEnd);
    });

    it('tokenizes CDATA followed by other content', () => {
        const source = '<![CDATA[content]]><div>test</div>';
        const result = tokenize(source, directives);

        expect(result.tokens[0].type).toBe(TokenType.CdataStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(result.tokens[2].type).toBe(TokenType.CdataEnd);
        expect(result.tokens[3].type).toBe(TokenType.LessThan);
    });
});
