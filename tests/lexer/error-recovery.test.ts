import { describe, test, expect } from "vitest";
import { tokenize } from "../../src/lexer/index.js";

describe('Nested Echo Errors', () => {
    test('nested echo in echo', () => {
        const source = '{{ $iAmEchoOne {{ $iAmEchoTwo }} }}';
        const result = tokenize(source);
        expect(Array.isArray(result.tokens)).toBe(true);
    });

    test('nested raw echo in echo', () => {
        const source = '{{ $var {!! $raw !!} }}';
        const result = tokenize(source);
        expect(Array.isArray(result.tokens)).toBe(true);
    });

    test('nested triple echo in raw echo', () => {
        const source = '{!! $var {{{ $triple }}} !!}';
        const result = tokenize(source);
        expect(Array.isArray(result.tokens)).toBe(true);
    });
});
