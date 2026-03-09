import { describe, test, expect } from "vitest";
import { tokenize, TokenType, tokenContent, reconstructFromTokens } from "../../src/lexer/index.js";

describe('HTML Elements', () => {
    test('simple opening tag', () => {
        const source = '<div>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[0].type).toBe(TokenType.LessThan);
        expect(result.tokens[1].type).toBe(TokenType.TagName);
        expect(tokenContent(source, result.tokens[1])).toBe('div');
        expect(result.tokens[2].type).toBe(TokenType.GreaterThan);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('opening tag with text', () => {
        const source = '<div>Hello</div>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(8);
        expect(result.tokens[0].type).toBe(TokenType.LessThan);
        expect(result.tokens[1].type).toBe(TokenType.TagName);
        expect(result.tokens[2].type).toBe(TokenType.GreaterThan);
        expect(result.tokens[3].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[3])).toBe('Hello');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('closing tag', () => {
        const source = '</div>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(4);
        expect(result.tokens[0].type).toBe(TokenType.LessThan);
        expect(result.tokens[1].type).toBe(TokenType.Slash);
        expect(result.tokens[2].type).toBe(TokenType.TagName);
        expect(tokenContent(source, result.tokens[2])).toBe('div');
        expect(result.tokens[3].type).toBe(TokenType.GreaterThan);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('self closing tag no space', () => {
        const source = '<br/>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(4);
        expect(result.tokens[0].type).toBe(TokenType.LessThan);
        expect(result.tokens[1].type).toBe(TokenType.TagName);
        expect(tokenContent(source, result.tokens[1])).toBe('br');
        expect(result.tokens[2].type).toBe(TokenType.Slash);
        expect(result.tokens[3].type).toBe(TokenType.GreaterThan);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('self closing tag with space', () => {
        const source = '<br />';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(5);
        expect(result.tokens[0].type).toBe(TokenType.LessThan);
        expect(result.tokens[1].type).toBe(TokenType.TagName);
        expect(tokenContent(source, result.tokens[1])).toBe('br');
        expect(result.tokens[2].type).toBe(TokenType.Whitespace);
        expect(result.tokens[3].type).toBe(TokenType.Slash);
        expect(result.tokens[4].type).toBe(TokenType.GreaterThan);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('tag with dash', () => {
        const source = '<my-component>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[1].type).toBe(TokenType.TagName);
        expect(tokenContent(source, result.tokens[1])).toBe('my-component');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('tag with colon', () => {
        const source = '<svg:path>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[1].type).toBe(TokenType.TagName);
        expect(tokenContent(source, result.tokens[1])).toBe('svg:path');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('tag mixed case', () => {
        const source = '<DiV>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[1].type).toBe(TokenType.TagName);
        expect(tokenContent(source, result.tokens[1])).toBe('DiV');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('nested tags', () => {
        const source = '<div><span>text</span></div>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(tokenContent(source, result.tokens[1])).toBe('div');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('empty tag', () => {
        const source = '<>';
        const result = tokenize(source);

        expect(result.tokens[0].type).toBe(TokenType.LessThan);
        expect(result.tokens[result.tokens.length - 1].type).toBe(TokenType.GreaterThan);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('tag at eof', () => {
        const source = 'text<div>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.Text);
        expect(result.tokens[1].type).toBe(TokenType.LessThan);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('single char tags', () => {
        const source = '<a><p><b>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(9);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('tag with multiple spaces before close', () => {
        const source = '<div   >';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(4);
        expect(result.tokens[0].type).toBe(TokenType.LessThan);
        expect(result.tokens[1].type).toBe(TokenType.TagName);
        expect(result.tokens[2].type).toBe(TokenType.Whitespace);
        expect(result.tokens[3].type).toBe(TokenType.GreaterThan);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('tag with newline', () => {
        const source = "<div\n>";
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(4);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('tag with tab', () => {
        const source = "<div\t>";
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(4);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('self closing with multiple spaces', () => {
        const source = '<br   />';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(5);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('tag with numbers', () => {
        const source = '<h1>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[1].type).toBe(TokenType.TagName);
        expect(tokenContent(source, result.tokens[1])).toBe('h1');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('tag with underscore', () => {
        const source = '<_component>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[1].type).toBe(TokenType.TagName);
        expect(tokenContent(source, result.tokens[1])).toBe('_component');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('tag all uppercase', () => {
        const source = '<DIV>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[1].type).toBe(TokenType.TagName);
        expect(tokenContent(source, result.tokens[1])).toBe('DIV');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('complex tag name', () => {
        const source = '<my-custom_component123>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[1].type).toBe(TokenType.TagName);
        expect(tokenContent(source, result.tokens[1])).toBe('my-custom_component123');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('namespace with multiple colons', () => {
        const source = '<ns:sub:element>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[1].type).toBe(TokenType.TagName);
        expect(tokenContent(source, result.tokens[1])).toBe('ns:sub:element');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('multiple consecutive opening tags', () => {
        const source = '<div><span><p>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(9);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('multiple consecutive closing tags', () => {
        const source = '</div></span></p>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(12);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('deeply nested tags', () => {
        const source = '<div><div><div><span>text</span></div></div></div>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('mixed tags and text', () => {
        const source = 'text1<div>text2</div>text3';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('self closing tags sequence', () => {
        const source = '<br/><hr/><img/>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(12);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('tag at start', () => {
        const source = '<div>content';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.LessThan);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('closing tag at start', () => {
        const source = '</div>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(4);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('only opening tag', () => {
        const source = '<div>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('common void elements', () => {
        const source = '<br><hr><img><input><meta><link>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });
});
