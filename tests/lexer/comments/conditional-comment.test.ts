import { describe, test, expect } from "vitest";
import { tokenize, TokenType, tokenContent, reconstructFromTokens } from "../../../src/lexer/index.js";

describe('Conditional Comments', () => {
    test('conditional comment start', () => {
        const source = '<!--[if IE 8]>';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(1);
        expect(result.tokens[0].type).toBe(TokenType.ConditionalCommentStart);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('conditional comment end', () => {
        const source = '<![endif]-->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(1);
        expect(result.tokens[0].type).toBe(TokenType.ConditionalCommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('conditional comment full', () => {
        const source = '<!--[if IE 8]><div>IE specific</div><![endif]-->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.ConditionalCommentStart);
        expect(result.tokens[result.tokens.length - 1].type).toBe(TokenType.ConditionalCommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('conditional comment with parentheses condition', () => {
        const source = '<!--[if (gte mso 9)]><p>Office content</p><![endif]-->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.ConditionalCommentStart);
        expect(tokenContent(source, result.tokens[0])).toBe('<!--[if (gte mso 9)]>');
        expect(result.tokens[result.tokens.length - 1].type).toBe(TokenType.ConditionalCommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('conditional comment with OR condition', () => {
        const source = '<!--[if (gte mso 9)|(IE)]><table><tr><td>Outlook</td></tr></table><![endif]-->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.ConditionalCommentStart);
        expect(tokenContent(source, result.tokens[0])).toBe('<!--[if (gte mso 9)|(IE)]>');
        expect(result.tokens[result.tokens.length - 1].type).toBe(TokenType.ConditionalCommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('conditional comment with AND condition', () => {
        const source = '<!--[if (gt IE 5)&(lt IE 7)]><link rel="stylesheet" href="ie6.css"><![endif]-->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.ConditionalCommentStart);
        expect(tokenContent(source, result.tokens[0])).toBe('<!--[if (gt IE 5)&(lt IE 7)]>');
        expect(result.tokens[result.tokens.length - 1].type).toBe(TokenType.ConditionalCommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('conditional comment with NOT condition', () => {
        const source = '<!--[if !IE]><p>Not IE</p><![endif]-->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.ConditionalCommentStart);
        expect(tokenContent(source, result.tokens[0])).toBe('<!--[if !IE]>');
        expect(result.tokens[result.tokens.length - 1].type).toBe(TokenType.ConditionalCommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('conditional comment with less than version', () => {
        const source = '<!--[if lt IE 9]><script src="html5shiv.js"></script><![endif]-->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.ConditionalCommentStart);
        expect(tokenContent(source, result.tokens[0])).toBe('<!--[if lt IE 9]>');
        expect(result.tokens[result.tokens.length - 1].type).toBe(TokenType.ConditionalCommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('conditional comment with lte version', () => {
        const source = '<!--[if lte IE 8]><link href="ie8.css"><![endif]-->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.ConditionalCommentStart);
        expect(tokenContent(source, result.tokens[0])).toBe('<!--[if lte IE 8]>');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('conditional comment with gte version', () => {
        const source = '<!--[if gte IE 10]><meta content="ie=edge"><![endif]-->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.ConditionalCommentStart);
        expect(tokenContent(source, result.tokens[0])).toBe('<!--[if gte IE 10]>');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('conditional comment with gt version', () => {
        const source = '<!--[if gt IE 7]><div>Modern IE</div><![endif]-->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.ConditionalCommentStart);
        expect(tokenContent(source, result.tokens[0])).toBe('<!--[if gt IE 7]>');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('conditional comment full structure with exact token count', () => {
        const source = '<!--[if IE]><p>IE content</p><![endif]-->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(10);
        expect(result.tokens[0].type).toBe(TokenType.ConditionalCommentStart);
        expect(result.tokens[1].type).toBe(TokenType.LessThan);
        expect(result.tokens[2].type).toBe(TokenType.TagName);
        expect(tokenContent(source, result.tokens[2])).toBe('p');
        expect(result.tokens[3].type).toBe(TokenType.GreaterThan);
        expect(result.tokens[4].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[4])).toBe('IE content');
        expect(result.tokens[5].type).toBe(TokenType.LessThan);
        expect(result.tokens[6].type).toBe(TokenType.Slash);
        expect(result.tokens[7].type).toBe(TokenType.TagName);
        expect(tokenContent(source, result.tokens[7])).toBe('p');
        expect(result.tokens[8].type).toBe(TokenType.GreaterThan);
        expect(result.tokens[9].type).toBe(TokenType.ConditionalCommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('conditional comment with mso condition - full structure', () => {
        const source = '<!--[if (gte mso 9)]><xml>mso</xml><![endif]-->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(10);
        expect(result.tokens[0].type).toBe(TokenType.ConditionalCommentStart);
        expect(tokenContent(source, result.tokens[0])).toBe('<!--[if (gte mso 9)]>');
        expect(result.tokens[9].type).toBe(TokenType.ConditionalCommentEnd);
        expect(tokenContent(source, result.tokens[9])).toBe('<![endif]-->');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('multiple conditional comments in sequence', () => {
        const source = '<!--[if IE]>IE<![endif]--><!--[if !IE]>Not IE<![endif]-->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(6);
        expect(result.tokens[0].type).toBe(TokenType.ConditionalCommentStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[1])).toBe('IE');
        expect(result.tokens[2].type).toBe(TokenType.ConditionalCommentEnd);
        expect(result.tokens[3].type).toBe(TokenType.ConditionalCommentStart);
        expect(result.tokens[4].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[4])).toBe('Not IE');
        expect(result.tokens[5].type).toBe(TokenType.ConditionalCommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('conditional comment with text before and after', () => {
        const source = 'before<!--[if IE]>IE<![endif]-->after';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(5);
        expect(result.tokens[0].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[0])).toBe('before');
        expect(result.tokens[1].type).toBe(TokenType.ConditionalCommentStart);
        expect(result.tokens[2].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[2])).toBe('IE');
        expect(result.tokens[3].type).toBe(TokenType.ConditionalCommentEnd);
        expect(result.tokens[4].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[4])).toBe('after');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('unclosed conditional start', () => {
        const source = '<!--[if IE no close';
        const result = tokenize(source);

        expect(result.tokens[0].type).toBe(TokenType.ConditionalCommentStart);
    });

    test('unclosed conditional end', () => {
        const source = '<![endif no close';
        const result = tokenize(source);

        expect(result.tokens[0].type).toBe(TokenType.ConditionalCommentEnd);
    });
});
