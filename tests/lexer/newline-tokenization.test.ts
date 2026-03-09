import { describe, it, expect } from "vitest";
import { tokenize, TokenType, reconstructFromTokens } from "../../src/lexer/index.js";

describe('LF Newlines', () => {
    it('handles LF in text', () => {
        const source = "Line 1\nLine 2\nLine 3";
        const tokens = tokenize(source).tokens;

        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe(TokenType.Text);

        const reconstructed = reconstructFromTokens(tokens, source);
        expect(reconstructed).toBe(source);
    });

    it('handles LF with echo', () => {
        const source = "Line 1\n{{ $var }}\nLine 3";
        const tokens = tokenize(source).tokens;

        expect(tokens.length).toBeGreaterThanOrEqual(5);

        const reconstructed = reconstructFromTokens(tokens, source);
        expect(reconstructed).toBe(source);
    });

    it('handles trailing LF', () => {
        const source = "Content\n";
        const tokens = tokenize(source).tokens;

        expect(tokens).toHaveLength(1);

        const reconstructed = reconstructFromTokens(tokens, source);
        expect(reconstructed).toBe(source);
    });
});

describe('CRLF Newlines (Windows)', () => {
    it('handles CRLF in text', () => {
        const source = "Line 1\r\nLine 2\r\nLine 3";
        const tokens = tokenize(source).tokens;

        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe(TokenType.Text);

        const reconstructed = reconstructFromTokens(tokens, source);
        expect(reconstructed).toBe(source);
    });

    it('handles CRLF with echo', () => {
        const source = "Line 1\r\n{{ $var }}\r\nLine 3";
        const tokens = tokenize(source).tokens;

        expect(tokens.length).toBeGreaterThanOrEqual(5);

        const reconstructed = reconstructFromTokens(tokens, source);
        expect(reconstructed).toBe(source);
    });

    it('handles trailing CRLF', () => {
        const source = "Content\r\n";
        const tokens = tokenize(source).tokens;

        expect(tokens).toHaveLength(1);

        const reconstructed = reconstructFromTokens(tokens, source);
        expect(reconstructed).toBe(source);
    });
});

describe('CR Newlines (old Mac)', () => {
    it('handles CR in text', () => {
        const source = "Line 1\rLine 2\rLine 3";
        const tokens = tokenize(source).tokens;

        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe(TokenType.Text);

        const reconstructed = reconstructFromTokens(tokens, source);
        expect(reconstructed).toBe(source);
    });

    it('handles CR with echo', () => {
        const source = "Line 1\r{{ $var }}\rLine 3";
        const tokens = tokenize(source).tokens;

        expect(tokens.length).toBeGreaterThanOrEqual(5);

        const reconstructed = reconstructFromTokens(tokens, source);
        expect(reconstructed).toBe(source);
    });

    it('handles trailing CR', () => {
        const source = "Content\r";
        const tokens = tokenize(source).tokens;

        expect(tokens).toHaveLength(1);

        const reconstructed = reconstructFromTokens(tokens, source);
        expect(reconstructed).toBe(source);
    });
});

describe('Mixed Newlines', () => {
    it('handles mixed LF and CRLF', () => {
        const source = "Line 1\nLine 2\r\nLine 3";
        const tokens = tokenize(source).tokens;

        expect(tokens).toHaveLength(1);

        const reconstructed = reconstructFromTokens(tokens, source);
        expect(reconstructed).toBe(source);
    });

    it('handles all three newline types', () => {
        const source = "Line 1\nLine 2\r\nLine 3\rLine 4";
        const tokens = tokenize(source).tokens;

        expect(tokens).toHaveLength(1);

        const reconstructed = reconstructFromTokens(tokens, source);
        expect(reconstructed).toBe(source);
    });

    it('handles mixed newlines with echos', () => {
        const source = "Text\n{{ $a }}\r\n{!! $b !!}\r{{{ $c }}}";
        const tokens = tokenize(source).tokens;

        expect(tokens.length).toBeGreaterThan(1);

        const reconstructed = reconstructFromTokens(tokens, source);
        expect(reconstructed).toBe(source);
    });
});

describe('Edge Cases', () => {
    it('handles consecutive newlines', () => {
        const source = "Text\n\n\nMore text";
        const tokens = tokenize(source).tokens;

        expect(tokens).toHaveLength(1);

        const reconstructed = reconstructFromTokens(tokens, source);
        expect(reconstructed).toBe(source);
    });

    it('handles consecutive mixed newlines', () => {
        const source = "Text\n\r\n\rMore text";
        const tokens = tokenize(source).tokens;

        expect(tokens).toHaveLength(1);

        const reconstructed = reconstructFromTokens(tokens, source);
        expect(reconstructed).toBe(source);
    });

    it('handles only newlines', () => {
        const source = "\n\r\n\r";
        const tokens = tokenize(source).tokens;

        expect(tokens).toHaveLength(1);

        const reconstructed = reconstructFromTokens(tokens, source);
        expect(reconstructed).toBe(source);
    });

    it('exact byte offsets with different newline styles', () => {
        const source = "Line 1\nLine 2\r\nLine 3\rEnd";
        const tokens = tokenize(source).tokens;

        const reconstructed = reconstructFromTokens(tokens, source);
        expect(reconstructed).toBe(source);
        expect(tokens[0].start).toBe(0);
    });
});
