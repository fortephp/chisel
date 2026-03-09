import { describe, test, expect } from "vitest";
import { tokenize, TokenType, tokenContent, reconstructFromTokens } from "../../src/lexer/index.js";

describe('Dynamic Element Names', () => {
    test('echo as element name emits proper token sequence', () => {
        const source = '<{{ $element }} class="test">';
        const result = tokenize(source);
        const types = result.tokens.map(t => t.type);

        expect(types).toEqual([
            TokenType.LessThan,
            TokenType.EchoStart,
            TokenType.EchoContent,
            TokenType.EchoEnd,
            TokenType.Whitespace,
            TokenType.AttributeName,
            TokenType.Equals,
            TokenType.Quote,
            TokenType.AttributeValue,
            TokenType.Quote,
            TokenType.GreaterThan,
        ]);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('echo element name without attributes', () => {
        const source = '<{{ $element }}>content</{{ $element }}>';
        const result = tokenize(source);
        const types = result.tokens.map(t => t.type);

        expect(types).toEqual([
            TokenType.LessThan,
            TokenType.EchoStart,
            TokenType.EchoContent,
            TokenType.EchoEnd,
            TokenType.GreaterThan,
            TokenType.Text,
            TokenType.LessThan,
            TokenType.Slash,
            TokenType.EchoStart,
            TokenType.EchoContent,
            TokenType.EchoEnd,
            TokenType.GreaterThan,
        ]);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('raw echo as element name with attributes', () => {
        const source = '<{!! $tag !!} id="main">';
        const result = tokenize(source);
        const types = result.tokens.map(t => t.type);

        expect(types).toEqual([
            TokenType.LessThan,
            TokenType.RawEchoStart,
            TokenType.EchoContent,
            TokenType.RawEchoEnd,
            TokenType.Whitespace,
            TokenType.AttributeName,
            TokenType.Equals,
            TokenType.Quote,
            TokenType.AttributeValue,
            TokenType.Quote,
            TokenType.GreaterThan,
        ]);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('triple echo as element name with attributes', () => {
        const source = '<{{{ $tag }}} data="val">';
        const result = tokenize(source);
        const types = result.tokens.map(t => t.type);

        expect(types).toEqual([
            TokenType.LessThan,
            TokenType.TripleEchoStart,
            TokenType.EchoContent,
            TokenType.TripleEchoEnd,
            TokenType.Whitespace,
            TokenType.AttributeName,
            TokenType.Equals,
            TokenType.Quote,
            TokenType.AttributeValue,
            TokenType.Quote,
            TokenType.GreaterThan,
        ]);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('composite tag name with static prefix and echo', () => {
        const source = '<div-{{ $id }} class="test">';
        const result = tokenize(source);
        const types = result.tokens.map(t => t.type);

        expect(types).toEqual([
            TokenType.LessThan,
            TokenType.TagName,
            TokenType.EchoStart,
            TokenType.EchoContent,
            TokenType.EchoEnd,
            TokenType.Whitespace,
            TokenType.AttributeName,
            TokenType.Equals,
            TokenType.Quote,
            TokenType.AttributeValue,
            TokenType.Quote,
            TokenType.GreaterThan,
        ]);
        expect(tokenContent(source, result.tokens[1])).toBe('div-');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('multiple echoes in element name', () => {
        const source = '<{{ $prefix }}-{{ $suffix }} id="x">';
        const result = tokenize(source);
        const types = result.tokens.map(t => t.type);

        expect(types).toEqual([
            TokenType.LessThan,
            TokenType.EchoStart,
            TokenType.EchoContent,
            TokenType.EchoEnd,
            TokenType.TagName,           // the "-" between echoes
            TokenType.EchoStart,
            TokenType.EchoContent,
            TokenType.EchoEnd,
            TokenType.Whitespace,
            TokenType.AttributeName,
            TokenType.Equals,
            TokenType.Quote,
            TokenType.AttributeValue,
            TokenType.Quote,
            TokenType.GreaterThan,
        ]);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('at-prefixed string in element name position becomes tag name', () => {
        const source = '<@component class="test">';
        const result = tokenize(source);
        const types = result.tokens.map(t => t.type);

        expect(types).toEqual([
            TokenType.LessThan,
            TokenType.TagName,
            TokenType.Whitespace,
            TokenType.AttributeName,
            TokenType.Equals,
            TokenType.Quote,
            TokenType.AttributeValue,
            TokenType.Quote,
            TokenType.GreaterThan,
        ]);
        expect(tokenContent(source, result.tokens[1])).toBe('@component');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });
});
