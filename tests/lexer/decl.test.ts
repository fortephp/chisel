import { describe, it, expect, beforeEach } from "vitest";
import { tokenize, TokenType, Directives } from "../../src/lexer/index.js";

let directives: Directives;

beforeEach(() => {
    directives = Directives.empty();
});

describe('XML Declaration Tokenization', () => {
    it('tokenizes basic XML declaration', () => {
        const source = '<?xml version="1.0"?>';
        const result = tokenize(source, directives);

        expect(result.tokens).toHaveLength(8);
        expect(result.tokens[0].type).toBe(TokenType.DeclStart);
        expect(result.tokens[1].type).toBe(TokenType.Whitespace);
        expect(result.tokens[2].type).toBe(TokenType.AttributeName);
        expect(result.tokens[3].type).toBe(TokenType.Equals);
        expect(result.tokens[4].type).toBe(TokenType.Quote);
        expect(result.tokens[5].type).toBe(TokenType.AttributeValue);
        expect(result.tokens[6].type).toBe(TokenType.Quote);
        expect(result.tokens[7].type).toBe(TokenType.DeclEnd);
        expect(source.slice(result.tokens[0].start, result.tokens[0].end)).toBe('<?xml');
        expect(source.slice(result.tokens[2].start, result.tokens[2].end)).toBe('version');
        expect(source.slice(result.tokens[5].start, result.tokens[5].end)).toBe('1.0');
        expect(source.slice(result.tokens[7].start, result.tokens[7].end)).toBe('?>');

    });

    it('tokenizes XML declaration with encoding', () => {
        const source = '<?xml version="1.0" encoding="UTF-8"?>';
        const result = tokenize(source, directives);

        expect(result.tokens).toHaveLength(14);
        expect(result.tokens[0].type).toBe(TokenType.DeclStart);
        expect(result.tokens[13].type).toBe(TokenType.DeclEnd);
        expect(source.slice(result.tokens[2].start, result.tokens[2].end)).toBe('version');
        expect(source.slice(result.tokens[8].start, result.tokens[8].end)).toBe('encoding');
    });

    it('tokenizes XML declaration with standalone attribute', () => {
        const source = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
        const result = tokenize(source, directives);

        expect(result.tokens[0].type).toBe(TokenType.DeclStart);
        expect(result.tokens[result.tokens.length - 1].type).toBe(TokenType.DeclEnd);
    });

    it('tokenizes empty XML declaration', () => {
        const source = '<?xml?>';
        const result = tokenize(source, directives);

        expect(result.tokens).toHaveLength(2);
        expect(result.tokens[0].type).toBe(TokenType.DeclStart);
        expect(result.tokens[1].type).toBe(TokenType.DeclEnd);
    });

    it('handles unclosed XML declaration', () => {
        const source = '<?xml version="1.0"';
        const result = tokenize(source, directives);

        expect(result.tokens).toHaveLength(8);
        expect(result.tokens[0].type).toBe(TokenType.DeclStart);
        expect(result.tokens[result.tokens.length - 1].type).toBe(TokenType.SyntheticClose);
    });

    it('tokenizes XML declaration case-insensitively', () => {
        const source = '<?XML version="1.0"?>';
        const result = tokenize(source, directives);

        expect(result.tokens).toHaveLength(8);
        expect(result.tokens[0].type).toBe(TokenType.DeclStart);
    });

    it('does not confuse PHP tag with XML declaration', () => {
        const source = '<?php echo "test"; ?>';
        const result = tokenize(source, directives);

        expect(result.tokens[0].type).toBe(TokenType.PhpTagStart);
    });

    it('does not match xmlfoo as XML declaration', () => {
        const source = '<?xmlfoo?>';
        const result = tokenize(source, directives);

        expect(result.tokens[0].type).toBe(TokenType.PIStart);
    });

    it('tokenizes XML declaration followed by content', () => {
        const source = '<?xml version="1.0"?><root>content</root>';
        const result = tokenize(source, directives);

        expect(result.tokens[0].type).toBe(TokenType.DeclStart);
        expect(result.tokens[7].type).toBe(TokenType.DeclEnd);
        expect(result.tokens[8].type).toBe(TokenType.LessThan);
    });

    it('tokenizes XML declaration with newlines', () => {
        const source = "<?xml\nversion=\"1.0\"\nencoding=\"UTF-8\"?>";
        const result = tokenize(source, directives);

        expect(result.tokens).toHaveLength(14);
        expect(result.tokens[0].type).toBe(TokenType.DeclStart);
        expect(result.tokens[13].type).toBe(TokenType.DeclEnd);
    });
});
