import { describe, test, expect } from "vitest";
import { tokenize, TokenType, tokenContent, reconstructFromTokens } from "../../src/lexer/index.js";
import { Directives } from "../../src/lexer/directives.js";

describe('Blade Echo in Attributes', () => {
    test('echo in quoted attribute', () => {
        const source = '<div class="{{ $var }}">';
        const result = tokenize(source);
        const types = result.tokens.map(t => t.type);

        expect(result.errors).toHaveLength(0);
        expect(types).toEqual([
            TokenType.LessThan,
            TokenType.TagName,
            TokenType.Whitespace,
            TokenType.AttributeName,
            TokenType.Equals,
            TokenType.Quote,
            TokenType.EchoStart,
            TokenType.EchoContent,
            TokenType.EchoEnd,
            TokenType.Quote,
            TokenType.GreaterThan,
        ]);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('echo with surrounding text', () => {
        const source = '<div class="prefix {{ $var }} suffix">';
        const result = tokenize(source);
        const types = result.tokens.map(t => t.type);

        expect(result.errors).toHaveLength(0);
        expect(types).toEqual([
            TokenType.LessThan,
            TokenType.TagName,
            TokenType.Whitespace,
            TokenType.AttributeName,
            TokenType.Equals,
            TokenType.Quote,
            TokenType.AttributeValue, // "prefix "
            TokenType.EchoStart,
            TokenType.EchoContent,
            TokenType.EchoEnd,
            TokenType.AttributeValue, // " suffix"
            TokenType.Quote,
            TokenType.GreaterThan,
        ]);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('multiple echos in attribute', () => {
        const source = '<div class="{{ $a }} middle {{ $b }}">';
        const result = tokenize(source);
        const types = result.tokens.map(t => t.type);

        expect(result.errors).toHaveLength(0);
        expect(types).toEqual([
            TokenType.LessThan,
            TokenType.TagName,
            TokenType.Whitespace,
            TokenType.AttributeName,
            TokenType.Equals,
            TokenType.Quote,
            TokenType.EchoStart,
            TokenType.EchoContent,
            TokenType.EchoEnd,
            TokenType.AttributeValue, // " middle "
            TokenType.EchoStart,
            TokenType.EchoContent,
            TokenType.EchoEnd,
            TokenType.Quote,
            TokenType.GreaterThan,
        ]);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('raw echo in attribute', () => {
        const source = '<div data="{!! $html !!}">';
        const result = tokenize(source);
        const types = result.tokens.map(t => t.type);

        expect(result.errors).toHaveLength(0);
        expect(types).toEqual([
            TokenType.LessThan,
            TokenType.TagName,
            TokenType.Whitespace,
            TokenType.AttributeName,
            TokenType.Equals,
            TokenType.Quote,
            TokenType.RawEchoStart,
            TokenType.EchoContent,
            TokenType.RawEchoEnd,
            TokenType.Quote,
            TokenType.GreaterThan,
        ]);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('triple echo in attribute', () => {
        const source = '<div data="{{{ $safe }}}">';
        const result = tokenize(source);
        const types = result.tokens.map(t => t.type);

        expect(result.errors).toHaveLength(0);
        expect(types).toEqual([
            TokenType.LessThan,
            TokenType.TagName,
            TokenType.Whitespace,
            TokenType.AttributeName,
            TokenType.Equals,
            TokenType.Quote,
            TokenType.TripleEchoStart,
            TokenType.EchoContent,
            TokenType.TripleEchoEnd,
            TokenType.Quote,
            TokenType.GreaterThan,
        ]);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('echo in unquoted attribute', () => {
        const source = '<div data={{ $value }}>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens.some(t => t.type === TokenType.EchoStart)).toBe(true);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('mixed quotes and echoes', () => {
        const source = '<div class="{{ $a }}" data-value=\'{{ $b }}\'>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const echoCount = result.tokens.filter(t => t.type === TokenType.EchoStart).length;
        expect(echoCount).toBe(2);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });
});

describe('Blade Directives in Attributes', () => {
    test('frontend shorthand event attribute stays as an attribute name', () => {
        const source = '<div @click="handler">';
        const result = tokenize(source, Directives.acceptAll());

        expect(result.errors).toHaveLength(0);
        const names = result.tokens.filter(t => t.type === TokenType.AttributeName);
        expect(names.some(t => tokenContent(source, t) === "@click")).toBe(true);
        expect(result.tokens.some(t => t.type === TokenType.Directive)).toBe(false);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('multiple frontend shorthand event attributes stay as attribute names', () => {
        const source = '<div @click="handler" @mouseover="hover">';
        const result = tokenize(source, Directives.acceptAll());

        expect(result.errors).toHaveLength(0);
        const names = result.tokens.filter(t => t.type === TokenType.AttributeName);
        expect(names.map(t => tokenContent(source, t))).toContain("@click");
        expect(names.map(t => tokenContent(source, t))).toContain("@mouseover");
        expect(result.tokens.some(t => t.type === TokenType.Directive)).toBe(false);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('custom @event names with modifiers and assignment stay as attribute names', () => {
        const source = '<div @open-modal.window="open = true">';
        const result = tokenize(source, Directives.acceptAll());

        expect(result.errors).toHaveLength(0);
        const names = result.tokens.filter(t => t.type === TokenType.AttributeName);
        expect(names.some(t => tokenContent(source, t) === "@open-modal.window")).toBe(true);
        expect(result.tokens.some(t => t.type === TokenType.Directive)).toBe(false);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('dynamic attribute name with echo', () => {
        const source = '<div data-{{ $name }}="value">';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens.some(t => t.type === TokenType.EchoStart)).toBe(true);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('fully dynamic attribute with echo name and value', () => {
        const source = '<div {{ $name }}="{{ $value }}">';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const echoCount = result.tokens.filter(t => t.type === TokenType.EchoStart).length;
        expect(echoCount).toBe(2);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('attribute with echo and directive mixed', () => {
        const source = '<div class="{{ $class }}" @click="handler">';
        const result = tokenize(source, Directives.acceptAll());

        expect(result.errors).toHaveLength(0);
        expect(result.tokens.some(t => t.type === TokenType.EchoStart)).toBe(true);
        const names = result.tokens.filter(t => t.type === TokenType.AttributeName);
        expect(names.some(t => tokenContent(source, t) === "@click")).toBe(true);
        expect(result.tokens.some(t => t.type === TokenType.Directive)).toBe(false);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('nested tags with blade in attributes', () => {
        const source = '<div class="{{ $outer }}"><span data="{{ $inner }}"></span></div>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const echoCount = result.tokens.filter(t => t.type === TokenType.EchoStart).length;
        expect(echoCount).toBe(2);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('prioritizes Blade echo over JSX in attribute values', () => {
        const source = '<Table data={{...props}} />';
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens.filter(t => t.type === TokenType.EchoStart).length).toBe(1);
        expect(tokens.filter(t => t.type === TokenType.EchoEnd).length).toBe(1);
        expect(tokens.filter(t => t.type === TokenType.JsxAttributeValue).length).toBe(0);
    });

    test('tokenizes single curly brace as JSX', () => {
        const source = '<Component items={[1, 2, 3]} />';
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens.filter(t => t.type === TokenType.JsxAttributeValue).length).toBe(1);
        expect(tokens.filter(t => t.type === TokenType.EchoStart).length).toBe(0);
    });

    test('prioritizes Blade raw echo in attribute values', () => {
        const source = '<div data={!! $html !!} />';
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens.filter(t => t.type === TokenType.RawEchoStart).length).toBe(1);
        expect(tokens.filter(t => t.type === TokenType.RawEchoEnd).length).toBe(1);
        expect(tokens.filter(t => t.type === TokenType.JsxAttributeValue).length).toBe(0);
    });

    test('prioritizes Blade triple echo in attribute values', () => {
        const source = '<div data={{{ $escaped }}} />';
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens.filter(t => t.type === TokenType.TripleEchoStart).length).toBe(1);
        expect(tokens.filter(t => t.type === TokenType.TripleEchoEnd).length).toBe(1);
        expect(tokens.filter(t => t.type === TokenType.JsxAttributeValue).length).toBe(0);
    });

    test('handles mixed Blade and JSX attributes', () => {
        const source = '<Component blade={{...props}} jsx={value} />';
        const result = tokenize(source);
        const tokens = result.tokens;

        expect(tokens.filter(t => t.type === TokenType.EchoStart).length).toBe(1);
        expect(tokens.filter(t => t.type === TokenType.JsxAttributeValue).length).toBe(1);
    });
});
