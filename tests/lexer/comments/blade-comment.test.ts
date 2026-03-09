import { describe, test, expect } from "vitest";
import { tokenize, TokenType, tokenContent, reconstructFromTokens } from "../../../src/lexer/index.js";

describe('Blade Comments', () => {
    test('simple blade comment', () => {
        const source = '{{-- This is a comment --}}';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.BladeCommentStart);
        expect(tokens[1].type).toBe(TokenType.Text);
        expect(tokens[2].type).toBe(TokenType.BladeCommentEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('empty blade comment', () => {
        const source = '{{----}}';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.BladeCommentStart);
        expect(tokens[1].type).toBe(TokenType.BladeCommentEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('blade comment with text', () => {
        const source = 'Before {{-- comment --}} After';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(5);
        expect(tokens[0].type).toBe(TokenType.Text);
        expect(tokenContent(source, tokens[0])).toBe('Before ');
        expect(tokens[1].type).toBe(TokenType.BladeCommentStart);
        expect(tokens[2].type).toBe(TokenType.Text);
        expect(tokenContent(source, tokens[2])).toBe(' comment ');
        expect(tokens[3].type).toBe(TokenType.BladeCommentEnd);
        expect(tokens[4].type).toBe(TokenType.Text);
        expect(tokenContent(source, tokens[4])).toBe(' After');
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('blade comment ignores echo', () => {
        const source = '{{-- This has {{ $var }} inside --}}';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.BladeCommentStart);
        expect(tokens[1].type).toBe(TokenType.Text);
        expect(tokenContent(source, tokens[1])).toBe(' This has {{ $var }} inside ');
        expect(tokens[2].type).toBe(TokenType.BladeCommentEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('blade comment ignores raw echo', () => {
        const source = '{{-- This has {!! $html !!} inside --}}';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.BladeCommentStart);
        expect(tokens[1].type).toBe(TokenType.Text);
        expect(tokens[2].type).toBe(TokenType.BladeCommentEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('blade comment ignores triple echo', () => {
        const source = '{{-- This has {{{ $escaped }}} inside --}}';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.BladeCommentStart);
        expect(tokens[1].type).toBe(TokenType.Text);
        expect(tokens[2].type).toBe(TokenType.BladeCommentEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('blade comment ignores multiple echo braces', () => {
        const source = '{{-- {{ }} {{ }} --}}';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.BladeCommentStart);
        expect(tokens[1].type).toBe(TokenType.Text);
        expect(tokenContent(source, tokens[1])).toBe(' {{ }} {{ }} ');
        expect(tokens[2].type).toBe(TokenType.BladeCommentEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('blade comment ignores mixed echo types', () => {
        const source = '{{-- {{ $a }} {!! $b !!} {{{ $c }}} --}}';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.BladeCommentStart);
        expect(tokens[1].type).toBe(TokenType.Text);
        expect(tokens[2].type).toBe(TokenType.BladeCommentEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('blade comment with directive syntax', () => {
        const source = '{{-- @if($condition) something @endif --}}';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.BladeCommentStart);
        expect(tokens[1].type).toBe(TokenType.Text);
        expect(tokens[2].type).toBe(TokenType.BladeCommentEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('multiple blade comments', () => {
        const source = '{{-- First --}} Middle {{-- Second --}}';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(7);
        expect(tokens[0].type).toBe(TokenType.BladeCommentStart);
        expect(tokens[1].type).toBe(TokenType.Text);
        expect(tokens[2].type).toBe(TokenType.BladeCommentEnd);
        expect(tokens[3].type).toBe(TokenType.Text);
        expect(tokenContent(source, tokens[3])).toBe(' Middle ');
        expect(tokens[4].type).toBe(TokenType.BladeCommentStart);
        expect(tokens[5].type).toBe(TokenType.Text);
        expect(tokens[6].type).toBe(TokenType.BladeCommentEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('blade comment with newlines', () => {
        const source = "{{-- \nLine 1\nLine 2\n--}}";
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.BladeCommentStart);
        expect(tokens[1].type).toBe(TokenType.Text);
        expect(tokens[2].type).toBe(TokenType.BladeCommentEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('blade comment multiline', () => {
        const source = "{{--\n  This is a multi-line\n  blade comment\n--}}";
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(3);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('blade comment with many dashes', () => {
        const source = '{{-- --- ----- --}}';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(3);
        expect(tokens[1].type).toBe(TokenType.Text);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('blade comment almost closing', () => {
        const source = '{{-- test --} not closed --}}';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(3);
        expect(tokenContent(source, tokens[1])).toBe(' test --} not closed ');
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('unclosed blade comment', () => {
        const source = '{{-- This comment is not closed';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(1);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.BladeCommentStart);
        expect(tokens[1].type).toBe(TokenType.Text);
        expect(tokenContent(source, tokens[1])).toBe(' This comment is not closed');
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('unclosed blade comment with text before', () => {
        const source = 'Before text {{-- unclosed';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(1);
        const tokens = result.tokens;

        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.Text);
        expect(tokenContent(source, tokens[0])).toBe('Before text ');
        expect(tokens[1].type).toBe(TokenType.BladeCommentStart);
        expect(tokens[2].type).toBe(TokenType.Text);
        expect(tokenContent(source, tokens[2])).toBe(' unclosed');
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('blade comment exact offsets', () => {
        const source = 'Start {{-- comment --}} End';
        const result = tokenize(source);

        expect(result.errors).toHaveLength(0);
        const tokens = result.tokens;

        expect(tokens[0].start).toBe(0);
        expect(tokens[0].end).toBe(6);
        expect(tokens[1].start).toBe(6);
        expect(tokens[1].end).toBe(10);
        expect(tokens[2].start).toBe(10);
        expect(tokens[2].end).toBe(19);
        expect(tokens[3].start).toBe(19);
        expect(tokens[3].end).toBe(23);
        expect(tokens[4].start).toBe(23);
        expect(tokens[4].end).toBe(27);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });
});
