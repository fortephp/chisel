import { describe, test, expect } from "vitest";
import { tokenize, TokenType, reconstructFromTokens } from "../../../src/lexer/index.js";

describe('Bogus Comments', () => {
    test('bogus comment question mark', () => {
        const source = '<? bogus ?>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(1);
        expect(result.tokens[0].type).toBe(TokenType.BogusComment);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('bogus comment dash', () => {
        const source = '<- bogus ->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(1);
        expect(result.tokens[0].type).toBe(TokenType.BogusComment);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('bogus vs php tag', () => {
        const source = "<?php echo 'test'; ?>";
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.PhpTagStart);
    });

    test('bogus vs short echo tag', () => {
        const source = '<?= $var ?>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.PhpTagStart);
    });

    test('bogus vs html comment', () => {
        const source = '<!->';
        const result = tokenize(source);

        expect(result.tokens[0].type).toBe(TokenType.BogusComment);
    });

    test('dash bogus vs html comment', () => {
        const source = '<- test ->';
        const result = tokenize(source);

        expect(result.tokens[0].type).toBe(TokenType.BogusComment);
    });

    test('unclosed bogus comment', () => {
        const source = '<? no close';
        const result = tokenize(source);

        expect(result.tokens).toHaveLength(1);
        expect(result.tokens[0].type).toBe(TokenType.Text);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });
});
