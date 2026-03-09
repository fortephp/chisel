import { describe, test, expect } from "vitest";
import { tokenize, TokenType, tokenContent, reconstructFromTokens } from "../../src/lexer/index.js";
import { Directives } from "../../src/lexer/directives.js";

describe('Synthetic Close', () => {
    test('synthetic close on nested tag', () => {
        const source = '<div<span>';
        const result = tokenize(source);

        const syntheticClose = result.tokens.find(t => t.type === TokenType.SyntheticClose);
        expect(syntheticClose).toBeDefined();
        expect(syntheticClose!.start).toBe(syntheticClose!.end); // zero-width
        expect(syntheticClose!.start).toBe(4); // after "div"

        const types = result.tokens.map(t => t.type);
        expect(types).toEqual([
            TokenType.LessThan,
            TokenType.TagName,           // div
            TokenType.SyntheticClose,    // zero-width recovery
            TokenType.LessThan,
            TokenType.TagName,           // span
            TokenType.GreaterThan,
        ]);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('synthetic close with partial attributes', () => {
        const source = '<div class="test"<span>';
        const result = tokenize(source);

        const syntheticClose = result.tokens.find(t => t.type === TokenType.SyntheticClose);
        expect(syntheticClose).toBeDefined();
        expect(syntheticClose!.start).toBe(syntheticClose!.end); // zero-width
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('synthetic close with blade echo', () => {
        const source = '<div {{ $x }}<span>';
        const result = tokenize(source);

        expect(result.tokens.some(t => t.type === TokenType.SyntheticClose)).toBe(true);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('multiple unclosed tags', () => {
        const source = '<div<span<p>';
        const result = tokenize(source);

        const syntheticCloseCount = result.tokens.filter(t => t.type === TokenType.SyntheticClose).length;
        expect(syntheticCloseCount).toBeGreaterThanOrEqual(1);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('unclosed tag with attributes', () => {
        const source = '<div id="test" class="foo"<span>';
        const result = tokenize(source);

        expect(result.tokens.some(t => t.type === TokenType.SyntheticClose)).toBe(true);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('unclosed self-closing tag', () => {
        const source = '<img src="test"<div>';
        const result = tokenize(source);

        expect(result.tokens.some(t => t.type === TokenType.SyntheticClose)).toBe(true);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('no synthetic close on properly closed tag', () => {
        const source = '<div></div>';
        const result = tokenize(source);

        expect(result.tokens.some(t => t.type === TokenType.SyntheticClose)).toBe(false);
    });

    test('no synthetic close on self-closing tag', () => {
        const source = '<img src="test" />';
        const result = tokenize(source);

        expect(result.tokens.some(t => t.type === TokenType.SyntheticClose)).toBe(false);
    });

    test('synthetic close preserves zero-width nature', () => {
        const source = '<div<span<p>';
        const result = tokenize(source);

        result.tokens
            .filter(t => t.type === TokenType.SyntheticClose)
            .forEach(t => expect(t.start).toBe(t.end));
    });

    test('unclosed tag with directive', () => {
        const source = '<div @click="handler"<span>';
        const result = tokenize(source, Directives.acceptAll());
        const tokens = result.tokens;

        expect(tokens.some(t => t.type === TokenType.SyntheticClose)).toBe(true);
        expect(tokens.some(t => t.type === TokenType.Directive)).toBe(false);
        expect(
            tokens.some(t => t.type === TokenType.AttributeName && tokenContent(source, t) === "@click"),
        ).toBe(true);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('unclosed tag with mixed blade constructs', () => {
        const source = '<div class="{{ $class }}" @click="handler"<span>';
        const result = tokenize(source, Directives.acceptAll());
        const tokens = result.tokens;

        expect(tokens.some(t => t.type === TokenType.SyntheticClose)).toBe(true);
        expect(tokens.some(t => t.type === TokenType.EchoStart)).toBe(true);
        expect(tokens.some(t => t.type === TokenType.Directive)).toBe(false);
        expect(
            tokens.some(t => t.type === TokenType.AttributeName && tokenContent(source, t) === "@click"),
        ).toBe(true);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });
});
