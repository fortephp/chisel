import { describe, test, expect } from "vitest";
import { tokenize, TokenType, tokenContent, reconstructFromTokens } from "../../src/lexer/index.js";

describe('HTML Attributes', () => {
    test('single double quoted attribute', () => {
        const source = '<div class="container">';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.LessThan);
        expect(result.tokens[1].type).toBe(TokenType.TagName);
        expect(result.tokens[3].type).toBe(TokenType.AttributeName);
        expect(tokenContent(source, result.tokens[3])).toBe('class');
        expect(result.tokens[4].type).toBe(TokenType.Equals);
        expect(result.tokens[5].type).toBe(TokenType.Quote);
        expect(result.tokens[6].type).toBe(TokenType.AttributeValue);
        expect(tokenContent(source, result.tokens[6])).toBe('container');
        expect(result.tokens[7].type).toBe(TokenType.Quote);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('single single quoted attribute', () => {
        const source = "<div id='main'>";
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[3].type).toBe(TokenType.AttributeName);
        expect(tokenContent(source, result.tokens[3])).toBe('id');
        expect(result.tokens[6].type).toBe(TokenType.AttributeValue);
        expect(tokenContent(source, result.tokens[6])).toBe('main');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('empty quoted value', () => {
        const source = '<div class="">';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const quotes = result.tokens.filter(t => t.type === TokenType.Quote);
        expect(quotes).toHaveLength(2);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('unquoted attribute value', () => {
        const source = '<div data-id=123>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[3].type).toBe(TokenType.AttributeName);
        expect(tokenContent(source, result.tokens[3])).toBe('data-id');
        expect(result.tokens[4].type).toBe(TokenType.Equals);
        expect(result.tokens[5].type).toBe(TokenType.AttributeValue);
        expect(tokenContent(source, result.tokens[5])).toBe('123');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('unquoted alphanumeric', () => {
        const source = '<input type=text>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[3].type).toBe(TokenType.AttributeName);
        expect(tokenContent(source, result.tokens[3])).toBe('type');
        expect(result.tokens[5].type).toBe(TokenType.AttributeValue);
        expect(tokenContent(source, result.tokens[5])).toBe('text');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('boolean attribute no value', () => {
        const source = '<input disabled>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[3].type).toBe(TokenType.AttributeName);
        expect(tokenContent(source, result.tokens[3])).toBe('disabled');
        expect(result.tokens[4].type).toBe(TokenType.GreaterThan);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('multiple boolean attributes', () => {
        const source = '<input disabled checked readonly>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrNames = result.tokens
            .filter(t => t.type === TokenType.AttributeName)
            .map(t => tokenContent(source, t));
        expect(attrNames).toEqual(['disabled', 'checked', 'readonly']);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('a few attributes', () => {
        const source = '<div class="foo" id="bar">';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrNames = result.tokens
            .filter(t => t.type === TokenType.AttributeName)
            .map(t => tokenContent(source, t));
        expect(attrNames).toEqual(['class', 'id']);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('various mixed attributes', () => {
        const source = '<input type="text" disabled value=hello>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrNames = result.tokens
            .filter(t => t.type === TokenType.AttributeName)
            .map(t => tokenContent(source, t));
        expect(attrNames).toEqual(['type', 'disabled', 'value']);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('a few more attributes of various types', () => {
        const source = "<input type=\"text\" name='username' maxlength=50 required data-id=123>";
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrNames = result.tokens
            .filter(t => t.type === TokenType.AttributeName)
            .map(t => tokenContent(source, t));
        expect(attrNames).toEqual(['type', 'name', 'maxlength', 'required', 'data-id']);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('attribute with spaces around equals', () => {
        const source = '<div class = "foo">';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[3].type).toBe(TokenType.AttributeName);
        expect(result.tokens[5].type).toBe(TokenType.Equals);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('attributes with newlines', () => {
        const source = "<div\n  class=\"foo\"\n  id=\"bar\">";
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrNames = result.tokens.filter(t => t.type === TokenType.AttributeName);
        expect(attrNames).toHaveLength(2);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('data attribute', () => {
        const source = '<div data-test="value">';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrName = result.tokens.find(t => t.type === TokenType.AttributeName)!;
        expect(tokenContent(source, attrName)).toBe('data-test');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('aria attribute', () => {
        const source = '<div aria-label="menu">';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrName = result.tokens.find(t => t.type === TokenType.AttributeName)!;
        expect(tokenContent(source, attrName)).toBe('aria-label');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('namespaced attribute', () => {
        const source = '<svg xmlns:xlink="http://example.com">';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrName = result.tokens.find(t => t.type === TokenType.AttributeName)!;
        expect(tokenContent(source, attrName)).toBe('xmlns:xlink');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('attribute with underscore', () => {
        const source = '<div _custom="value">';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrName = result.tokens.find(t => t.type === TokenType.AttributeName)!;
        expect(tokenContent(source, attrName)).toBe('_custom');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('value with spaces', () => {
        const source = '<div title="hello world">';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrValue = result.tokens.find(t => t.type === TokenType.AttributeValue)!;
        expect(tokenContent(source, attrValue)).toBe('hello world');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('value with special chars', () => {
        const source = '<div data="<>&\\"">';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('value with numbers', () => {
        const source = '<div data="123-456">';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrValue = result.tokens.find(t => t.type === TokenType.AttributeValue)!;
        expect(tokenContent(source, attrValue)).toBe('123-456');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('self closing with attribute', () => {
        const source = '<img src="test.jpg" />';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrName = result.tokens.find(t => t.type === TokenType.AttributeName)!;
        expect(tokenContent(source, attrName)).toBe('src');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('self closing with multiple attributes', () => {
        const source = '<img src="test.jpg" alt="Test" width=100 />';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrNames = result.tokens
            .filter(t => t.type === TokenType.AttributeName)
            .map(t => tokenContent(source, t));
        expect(attrNames).toEqual(['src', 'alt', 'width']);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('link tag', () => {
        const source = '<link rel="stylesheet" href="/css/app.css" type="text/css">';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrNames = result.tokens
            .filter(t => t.type === TokenType.AttributeName)
            .map(t => tokenContent(source, t));
        expect(attrNames).toEqual(['rel', 'href', 'type']);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('script tag', () => {
        const source = '<script src="/js/app.js" defer async></script>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrNames = result.tokens
            .filter(t => t.type === TokenType.AttributeName)
            .map(t => tokenContent(source, t));
        expect(attrNames).toEqual(['src', 'defer', 'async']);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('input tag full', () => {
        const source = '<input type="text" name="username" id="user-input" class="form-control" placeholder="Enter username" required maxlength=50>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrNames = result.tokens
            .filter(t => t.type === TokenType.AttributeName)
            .map(t => tokenContent(source, t));
        expect(attrNames).toEqual(['type', 'name', 'id', 'class', 'placeholder', 'required', 'maxlength']);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('button tag', () => {
        const source = '<button type="submit" class="btn btn-primary" disabled>Submit</button>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrNames = result.tokens
            .filter(t => t.type === TokenType.AttributeName)
            .map(t => tokenContent(source, t));
        expect(attrNames).toEqual(['type', 'class', 'disabled']);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('multiline quoted value', () => {
        const source = "<div title=\"line 1\nline 2\">";
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrValue = result.tokens.find(t => t.type === TokenType.AttributeValue)!;
        expect(tokenContent(source, attrValue)).toBe("line 1\nline 2");
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('ten attributes', () => {
        const source = '<div a1="v1" a2="v2" a3="v3" a4="v4" a5="v5" a6="v6" a7="v7" a8="v8" a9="v9" a10="v10">';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrNames = result.tokens.filter(t => t.type === TokenType.AttributeName);
        expect(attrNames).toHaveLength(10);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('long attribute name', () => {
        const source = '<div data-very-long-attribute-name-for-testing="value">';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrName = result.tokens.find(t => t.type === TokenType.AttributeName)!;
        expect(tokenContent(source, attrName)).toBe('data-very-long-attribute-name-for-testing');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('long attribute value', () => {
        const source = '<div data="This is a very long attribute value that contains many words and special characters like <>&\\"">';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('nested tags with attributes', () => {
        const source = '<div class="a"><span id="b"><p data="c">text</p></span></div>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const attrNames = result.tokens
            .filter(t => t.type === TokenType.AttributeName)
            .map(t => tokenContent(source, t));
        expect(attrNames).toEqual(['class', 'id', 'data']);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });
});
