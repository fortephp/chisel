import { describe, test, expect } from "vitest";
import { tokenize, TokenType, tokenContent, reconstructFromTokens } from "../../../src/lexer/index.js";

describe('Standard HTML Comments', () => {
    test('basic html comment', () => {
        const source = '<!-- test -->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[0].type).toBe(TokenType.CommentStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(result.tokens[2].type).toBe(TokenType.CommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('empty html comment', () => {
        const source = '<!---->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(2);
        expect(result.tokens[0].type).toBe(TokenType.CommentStart);
        expect(result.tokens[1].type).toBe(TokenType.CommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('multiline html comment', () => {
        const source = "<!--\ntest\ncomment\n-->";
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[0].type).toBe(TokenType.CommentStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[1])).toBe("\ntest\ncomment\n");
        expect(result.tokens[2].type).toBe(TokenType.CommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('comment with single dash', () => {
        const source = '<!-- foo - bar -->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(tokenContent(source, result.tokens[1])).toBe(' foo - bar ');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('comment with double dash', () => {
        const source = '<!-- foo -- bar -->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(tokenContent(source, result.tokens[1])).toBe(' foo -- bar ');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('comment with special chars', () => {
        const source = '<!-- foo > bar < baz -->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(tokenContent(source, result.tokens[1])).toBe(' foo > bar < baz ');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('comment with text before and after', () => {
        const source = 'Hello <!-- comment --> World';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(5);
        expect(result.tokens[0].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[0])).toBe('Hello ');
        expect(result.tokens[1].type).toBe(TokenType.CommentStart);
        expect(result.tokens[2].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[2])).toBe(' comment ');
        expect(result.tokens[3].type).toBe(TokenType.CommentEnd);
        expect(result.tokens[4].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[4])).toBe(' World');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('unclosed html comment', () => {
        const source = '<!-- no close';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].offset).toBe(source.length);
        expect(result.tokens[0].type).toBe(TokenType.CommentStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[1])).toBe(' no close');
    });

    test('comment with utf8', () => {
        const source = '<!-- 测试 -->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(tokenContent(source, result.tokens[1])).toBe(' 测试 ');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('comment with emoji', () => {
        const source = '<!-- Hello 🎉 World -->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(tokenContent(source, result.tokens[1])).toBe(' Hello 🎉 World ');
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('comment with crlf', () => {
        const source = "<!--\r\ntest\r\n-->";
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(tokenContent(source, result.tokens[1])).toBe("\r\ntest\r\n");
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('very long comment', () => {
        const content = 'x'.repeat(10000);
        const source = `<!-- ${content} -->`;
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('comment at eof', () => {
        const source = 'text<!--comment-->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].type).toBe(TokenType.Text);
        expect(result.tokens[1].type).toBe(TokenType.CommentStart);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('multiple comments', () => {
        const source = '<!-- one -->text<!-- two -->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(7);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('comment ignores echo', () => {
        const source = '<!-- This has {{ $var }} inside -->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[0].type).toBe(TokenType.CommentStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[1])).toBe(' This has {{ $var }} inside ');
        expect(result.tokens[2].type).toBe(TokenType.CommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('comment ignores raw echo', () => {
        const source = '<!-- This has {!! $html !!} inside -->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[0].type).toBe(TokenType.CommentStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[1])).toBe(' This has {!! $html !!} inside ');
        expect(result.tokens[2].type).toBe(TokenType.CommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('comment ignores triple echo', () => {
        const source = '<!-- This has {{{ $safe }}} inside -->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[0].type).toBe(TokenType.CommentStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[1])).toBe(' This has {{{ $safe }}} inside ');
        expect(result.tokens[2].type).toBe(TokenType.CommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('comment ignores directive', () => {
        const source = '<!-- @if(true) do something @endif -->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[0].type).toBe(TokenType.CommentStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[1])).toBe(' @if(true) do something @endif ');
        expect(result.tokens[2].type).toBe(TokenType.CommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('comment ignores blade comment', () => {
        const source = '<!-- This has {{-- nested --}} inside -->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[0].type).toBe(TokenType.CommentStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[1])).toBe(' This has {{-- nested --}} inside ');
        expect(result.tokens[2].type).toBe(TokenType.CommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('comment ignores php tags', () => {
        const source = "<!-- This has <?php echo 'test'; ?> inside -->";
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[0].type).toBe(TokenType.CommentStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[1])).toBe(" This has <?php echo 'test'; ?> inside ");
        expect(result.tokens[2].type).toBe(TokenType.CommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('comment with multiple blade constructs', () => {
        const source = '<!-- {{ $a }} {!! $b !!} @if(true) @endif -->';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[0].type).toBe(TokenType.CommentStart);
        expect(result.tokens[1].type).toBe(TokenType.Text);
        expect(tokenContent(source, result.tokens[1])).toBe(' {{ $a }} {!! $b !!} @if(true) @endif ');
        expect(result.tokens[2].type).toBe(TokenType.CommentEnd);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });
});
