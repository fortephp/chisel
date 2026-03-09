import { describe, test, it, expect } from "vitest";
import { tokenize, TokenType, tokenContent, reconstructFromTokens } from "../../src/lexer/index.js";
import { Directives } from "../../src/lexer/directives.js";

function countTokenType(tokens: { type: number }[], type: number): number {
    return tokens.filter(t => t.type === type).length;
}

function getNthToken(tokens: { type: number; start: number; end: number }[], type: number, n: number) {
    const matches = tokens.filter(t => t.type === type);
    return matches[n] ?? null;
}

function getTokenText(source: string, token: { start: number; end: number }): string {
    return source.slice(token.start, token.end);
}

describe('JSX/TSX-Style Generics and Attributes', () => {
    describe('TSX Generic Types', () => {
        test('simple generic type', () => {
            const template = '<Table<User> />';
            const result = tokenize(template, Directives.acceptAll());

            expect(countTokenType(result.tokens, TokenType.TsxGenericType)).toBe(1);

            const generic = getNthToken(result.tokens, TokenType.TsxGenericType, 0);
            expect(generic).not.toBeNull();
            expect(getTokenText(template, generic!)).toBe('<User>');
        });

        test('object type generic', () => {
            const template = '<Table<{ id: number }> />';
            const result = tokenize(template, Directives.acceptAll());

            expect(countTokenType(result.tokens, TokenType.TsxGenericType)).toBe(1);

            const generic = getNthToken(result.tokens, TokenType.TsxGenericType, 0);
            expect(generic).not.toBeNull();
            expect(getTokenText(template, generic!)).toBe('<{ id: number }>');
        });

        test('nested generic types', () => {
            const template = '<Map<Record<string, Array<Foo>>> />';
            const result = tokenize(template, Directives.acceptAll());

            expect(countTokenType(result.tokens, TokenType.TsxGenericType)).toBe(1);

            const generic = getNthToken(result.tokens, TokenType.TsxGenericType, 0);
            expect(generic).not.toBeNull();
            expect(getTokenText(template, generic!)).toBe('<Record<string, Array<Foo>>>');
        });
    });

    describe('JSX Attribute Values', () => {
        test('simple JSX attribute value', () => {
            const template = '<div data={users}>';
            const result = tokenize(template, Directives.acceptAll());

            expect(countTokenType(result.tokens, TokenType.JsxAttributeValue)).toBe(1);

            const jsx = getNthToken(result.tokens, TokenType.JsxAttributeValue, 0);
            expect(jsx).not.toBeNull();
            expect(getTokenText(template, jsx!)).toBe('{users}');
        });

        test('JSX arrow function attribute', () => {
            const template = '<button onClick={() => handle()}>Click</button>';
            const result = tokenize(template, Directives.acceptAll());

            expect(countTokenType(result.tokens, TokenType.JsxAttributeValue)).toBe(1);

            const jsx = getNthToken(result.tokens, TokenType.JsxAttributeValue, 0);
            expect(jsx).not.toBeNull();
            expect(getTokenText(template, jsx!)).toBe('{() => handle()}');
        });

        test('JSX object literal attribute (now Blade echo)', () => {
            const template = '<div config={{debug: true, mode: "dev"}}>test</div>';
            const result = tokenize(template, Directives.acceptAll());

            expect(countTokenType(result.tokens, TokenType.EchoStart)).toBe(1);
            expect(countTokenType(result.tokens, TokenType.EchoEnd)).toBe(1);
            expect(countTokenType(result.tokens, TokenType.JsxAttributeValue)).toBe(0);

            const echoContent = getNthToken(result.tokens, TokenType.EchoContent, 0);
            expect(echoContent).not.toBeNull();
            expect(getTokenText(template, echoContent!)).toBe('debug: true, mode: "dev"');
        });

        test('JSX array literal attribute', () => {
            const template = '<List items={[1, 2, 3]} />';
            const result = tokenize(template, Directives.acceptAll());

            expect(countTokenType(result.tokens, TokenType.JsxAttributeValue)).toBe(1);

            const jsx = getNthToken(result.tokens, TokenType.JsxAttributeValue, 0);
            expect(jsx).not.toBeNull();
            expect(getTokenText(template, jsx!)).toBe('{[1, 2, 3]}');
        });

        test('JSX with parenthesized expression', () => {
            const template = '<div value=({computed}) />';
            const result = tokenize(template, Directives.acceptAll());

            expect(countTokenType(result.tokens, TokenType.JsxAttributeValue)).toBe(1);

            const jsx = getNthToken(result.tokens, TokenType.JsxAttributeValue, 0);
            expect(jsx).not.toBeNull();
            expect(getTokenText(template, jsx!)).toBe('({computed})');
        });
    });

    describe('JSX Shorthand Attributes', () => {
        test('simple shorthand attribute', () => {
            const template = '<input {disabled} />';
            const result = tokenize(template, Directives.acceptAll());

            expect(countTokenType(result.tokens, TokenType.JsxShorthandAttribute)).toBe(1);

            const jsx = getNthToken(result.tokens, TokenType.JsxShorthandAttribute, 0);
            expect(jsx).not.toBeNull();
            expect(getTokenText(template, jsx!)).toBe('{disabled}');
        });

        test('spread attributes', () => {
            const template = '<div {...props} />';
            const result = tokenize(template, Directives.acceptAll());

            expect(countTokenType(result.tokens, TokenType.JsxShorthandAttribute)).toBe(1);

            const jsx = getNthToken(result.tokens, TokenType.JsxShorthandAttribute, 0);
            expect(jsx).not.toBeNull();
            expect(getTokenText(template, jsx!)).toBe('{...props}');
        });

        test('conditional shorthand', () => {
            const template = '<div {count > 0} />';
            const result = tokenize(template, Directives.acceptAll());

            expect(countTokenType(result.tokens, TokenType.JsxShorthandAttribute)).toBe(1);

            const jsx = getNthToken(result.tokens, TokenType.JsxShorthandAttribute, 0);
            expect(jsx).not.toBeNull();
            expect(getTokenText(template, jsx!)).toBe('{count > 0}');
        });
    });

    describe('Combined JSX/TSX', () => {
        test('TSX generic with JSX attributes', () => {
            const template = '<Table<User> data={users} {enabled} />';
            const result = tokenize(template, Directives.acceptAll());

            expect(countTokenType(result.tokens, TokenType.TsxGenericType)).toBe(1);
            expect(countTokenType(result.tokens, TokenType.JsxAttributeValue)).toBe(1);
            expect(countTokenType(result.tokens, TokenType.JsxShorthandAttribute)).toBe(1);

            const generic = getNthToken(result.tokens, TokenType.TsxGenericType, 0);
            expect(getTokenText(template, generic!)).toBe('<User>');

            const jsxValue = getNthToken(result.tokens, TokenType.JsxAttributeValue, 0);
            expect(getTokenText(template, jsxValue!)).toBe('{users}');

            const jsxShorthand = getNthToken(result.tokens, TokenType.JsxShorthandAttribute, 0);
            expect(getTokenText(template, jsxShorthand!)).toBe('{enabled}');
        });

        test('lots of generics!', () => {
            const template = '<List<User> items={users} {enabled} />\n<Table<{ id: number }> data={rows} renderItem={(item) => <div>{item.name}</div>} />\n<Map<Record<string, Array<Foo>>> config={{debug: true}} />';
            const result = tokenize(template, Directives.acceptAll());

            expect(countTokenType(result.tokens, TokenType.TsxGenericType)).toBe(3);
            expect(countTokenType(result.tokens, TokenType.JsxAttributeValue)).toBeGreaterThanOrEqual(3);
            expect(countTokenType(result.tokens, TokenType.JsxShorthandAttribute)).toBe(1);
        });
    });

    describe('Edge Cases', () => {
        test('JSX not confused with Blade echo', () => {
            const template = '<div data={value}>{{ $blade }}</div>';
            const result = tokenize(template, Directives.acceptAll());

            expect(countTokenType(result.tokens, TokenType.JsxAttributeValue)).toBe(1);
            expect(countTokenType(result.tokens, TokenType.EchoStart)).toBe(1);
            expect(countTokenType(result.tokens, TokenType.EchoEnd)).toBe(1);
        });

        test('TSX not confused with HTML tags', () => {
            const template = '<div><User> is not generic but <Table<User> is</div>';
            const result = tokenize(template, Directives.acceptAll());

            expect(countTokenType(result.tokens, TokenType.TsxGenericType)).toBe(1);
        });

        test('JSX with comments', () => {
            const template = '<div data={/* comment */ value} />';
            const result = tokenize(template, Directives.acceptAll());

            expect(countTokenType(result.tokens, TokenType.JsxAttributeValue)).toBe(1);
        });

        test('JSX with template literals', () => {
            const template = '<div data={`hello ${name}`} />';
            const result = tokenize(template, Directives.acceptAll());

            expect(countTokenType(result.tokens, TokenType.JsxAttributeValue)).toBe(1);
        });
    });

    describe('TypeScript Generics Edge Cases', () => {
        it('handles incomplete TypeScript generics at EOF', () => {
            const template = '<Map<Record<string, Array<';
            const result = tokenize(template);

            const syntheticCloseCount = result.tokens.filter(t => t.type === TokenType.SyntheticClose).length;
            expect(syntheticCloseCount).toBe(4);
        });

        it('emits SyntheticClose before new tag in generic context', () => {
            const template = '<div<span>';
            const result = tokenize(template);
            const tokens = result.tokens;

            const divIndex = tokens.findIndex(t =>
                t.type === TokenType.TagName && tokenContent(template, t) === 'div'
            );

            expect(divIndex).not.toBe(-1);
            expect(tokens[divIndex + 1].type).toBe(TokenType.SyntheticClose);
            expect(tokens[divIndex + 2].type).toBe(TokenType.LessThan);
        });

        it('correctly handles attribute name followed by less-than', () => {
            const template = '<div class<';
            const result = tokenize(template);
            const tokens = result.tokens;

            const classIndex = tokens.findIndex(t =>
                t.type === TokenType.AttributeName && tokenContent(template, t) === 'class'
            );

            expect(classIndex).not.toBe(-1);
            expect(tokens[classIndex + 1].type).toBe(TokenType.SyntheticClose);
            expect(tokens[classIndex + 2].type).toBe(TokenType.LessThan);
        });

        it('handles multiple nested generics at EOF', () => {
            const template = '<Component<Foo<Bar<Baz<';
            const result = tokenize(template);

            const syntheticCloseCount = result.tokens.filter(t => t.type === TokenType.SyntheticClose).length;
            expect(syntheticCloseCount).toBe(5);
        });

        it('preserves source offsets with incomplete generics', () => {
            const template = '<Map<Record<string, Array<';
            const result = tokenize(template);

            const reconstructed = reconstructFromTokens(result.tokens, template);
            expect(reconstructed).toBe(template);
        });

        it('does not double-emit SyntheticClose for attribute followed by less-than', () => {
            const template = '<div foo<';
            const result = tokenize(template);

            const syntheticCloseCount = result.tokens.filter(t => t.type === TokenType.SyntheticClose).length;
            expect(syntheticCloseCount).toBe(2);
        });
    });
});
