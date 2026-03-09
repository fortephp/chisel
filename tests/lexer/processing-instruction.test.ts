import { describe, it, expect, beforeEach } from "vitest";
import { tokenize, TokenType, tokenContent, reconstructFromTokens, Directives } from "../../src/lexer/index.js";

let directives: Directives;

beforeEach(() => {
    directives = Directives.empty();
});

describe('Processing Instruction Tokenization', () => {
    it('tokenizes basic processing instruction', () => {
        const source = '<?xml-stylesheet href="style.xsl" type="text/xsl"?>';
        const result = tokenize(source, directives);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[0].type).toBe(TokenType.PIStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(result.tokens[2].type).toBe(TokenType.PIEnd);

        expect(tokenContent(source, result.tokens[0])).toBe('<?xml-stylesheet');
        expect(tokenContent(source, result.tokens[1])).toBe(' href="style.xsl" type="text/xsl"');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    it('tokenizes PI with no data', () => {
        const source = '<?target?>';
        const result = tokenize(source, directives);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(2);
        expect(result.tokens[0].type).toBe(TokenType.PIStart);
        expect(result.tokens[1].type).toBe(TokenType.PIEnd);

        expect(tokenContent(source, result.tokens[0])).toBe('<?target');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    it('tokenizes PI with whitespace before closing', () => {
        const source = '<?target data ?>';
        const result = tokenize(source, directives);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[0].type).toBe(TokenType.PIStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(result.tokens[2].type).toBe(TokenType.PIEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    it('distinguishes PI from bogus comment with space', () => {
        const source = '<? invalid>';
        const result = tokenize(source, directives);

        expect(result.tokens[0].type).toBe(TokenType.BogusComment);
    });

    it('distinguishes PI from PHP tag', () => {
        const source = '<?php echo "test"; ?>';
        const result = tokenize(source, directives);

        expect(result.tokens[0].type).toBe(TokenType.PhpTagStart);
    });

    it('distinguishes PI from short echo tag', () => {
        const source = '<?= $var ?>';
        const result = tokenize(source, directives);

        expect(result.tokens[0].type).toBe(TokenType.PhpTagStart);
    });

    it('distinguishes PI from XML declaration', () => {
        const source = '<?xml version="1.0"?>';
        const result = tokenize(source, directives);

        expect(result.tokens[0].type).toBe(TokenType.DeclStart);
    });

    it('handles PI target with hyphen', () => {
        const source = '<?my-processor data?>';
        const result = tokenize(source, directives);

        expect(result.tokens[0].type).toBe(TokenType.PIStart);
        expect(tokenContent(source, result.tokens[0])).toBe('<?my-processor');
    });

    it('handles PI target with underscore', () => {
        const source = '<?my_processor data?>';
        const result = tokenize(source, directives);

        expect(result.tokens[0].type).toBe(TokenType.PIStart);
        expect(tokenContent(source, result.tokens[0])).toBe('<?my_processor');
    });

    it('handles PI target with colon (namespaced)', () => {
        const source = '<?ns:processor data?>';
        const result = tokenize(source, directives);

        expect(result.tokens[0].type).toBe(TokenType.PIStart);
        expect(tokenContent(source, result.tokens[0])).toBe('<?ns:processor');
    });

    it('handles PI target with digits', () => {
        const source = '<?processor123 data?>';
        const result = tokenize(source, directives);

        expect(result.tokens[0].type).toBe(TokenType.PIStart);
        expect(tokenContent(source, result.tokens[0])).toBe('<?processor123');
    });

    it('rejects PI target starting with digit', () => {
        const source = '<?123invalid?>';
        const result = tokenize(source, directives);

        expect(result.tokens[0].type).toBe(TokenType.BogusComment);
    });

    it('handles unclosed PI at EOF', () => {
        const source = '<?target data';
        const result = tokenize(source, directives);

        expect(result.tokens[0].type).toBe(TokenType.PIStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(result.errors).toHaveLength(1);
    });

    it('tokenizes multiple PIs', () => {
        const source = '<?pi1 data?><?pi2 data?>';
        const result = tokenize(source, directives);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(6);
        expect(result.tokens[0].type).toBe(TokenType.PIStart);
        expect(result.tokens[3].type).toBe(TokenType.PIStart);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    it('tokenizes PI with surrounding content', () => {
        const source = 'text<?pi data?>more';
        const result = tokenize(source, directives);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[0])).toBe('text');
        expect(result.tokens[1].type).toBe(TokenType.PIStart);
        expect(result.tokens[4].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[4])).toBe('more');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    it('handles PI with multiline content', () => {
        const source = "<?pi\nmultiline\ndata?>";
        const result = tokenize(source, directives);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.PIStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(result.tokens[2].type).toBe(TokenType.PIEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    it('handles xml-stylesheet PI', () => {
        const source = '<?xml-stylesheet type="text/xsl" href="transform.xsl"?>';
        const result = tokenize(source, directives);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.PIStart);
        expect(tokenContent(source, result.tokens[0])).toBe('<?xml-stylesheet');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    it('handles PI with special characters in data', () => {
        const source = '<?pi data="value" attr=\'single\' special!@#$%^&*()?>';
        const result = tokenize(source, directives);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.PIStart);
        expect(result.tokens[2].type).toBe(TokenType.PIEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });
});
