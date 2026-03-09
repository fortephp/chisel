import { describe, test, expect } from "vitest";
import { tokenize, TokenType, reconstructFromTokens, ErrorReason } from "../../src/lexer/index.js";
import { Directives } from "../../src/lexer/directives.js";

describe('Verbatim Basic Tests', () => {
    test('basic verbatim block', () => {
        const source = "@verbatim\n{{ $var }}\n@endverbatim";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.VerbatimStart);
        expect(tokens[1].type).toBe(TokenType.Text);
        expect(tokens[2].type).toBe(TokenType.VerbatimEnd);

        const text = source.slice(tokens[1].start, tokens[1].end);
        expect(text).toBe("\n{{ $var }}\n");
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('multiple blade constructs in verbatim', () => {
        const source = "@verbatim\n{{ $echo }}\n{!! $raw !!}\n{{{ $triple }}}\n@if($x)\n@endverbatim";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.VerbatimStart);
        expect(tokens[1].type).toBe(TokenType.Text);
        expect(tokens[2].type).toBe(TokenType.VerbatimEnd);

        const text = source.slice(tokens[1].start, tokens[1].end);
        expect(text).toContain('{{ $echo }}');
        expect(text).toContain('{!! $raw !!}');
        expect(text).toContain('{{{ $triple }}}');
        expect(text).toContain('@if($x)');
    });

    test('blade comments in verbatim', () => {
        const source = "@verbatim\n{{-- This is a comment --}}\n@endverbatim";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[1].type).toBe(TokenType.Text);

        const text = source.slice(tokens[1].start, tokens[1].end);
        expect(text).toBe("\n{{-- This is a comment --}}\n");
    });
});

describe('Verbatim Case Insensitive Tests', () => {
    test('uppercase verbatim', () => {
        const source = "@VERBATIM\n{{ $var }}\n@ENDVERBATIM";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.VerbatimStart);
        expect(tokens[1].type).toBe(TokenType.Text);
        expect(tokens[2].type).toBe(TokenType.VerbatimEnd);
    });

    test('mixed case verbatim', () => {
        const source = "@VeRbAtIm\n{{ $var }}\n@EnDvErBaTiM";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[1].type).toBe(TokenType.Text);
    });

    test.each([
        '@endverbatim',
        '@ENDVERBATIM',
        '@EndVerbatim',
        '@endVERBATIM',
    ])('various endverbatim case variants: %s', (endTag) => {
        const source = `@verbatim\n{{ $var }}\n${endTag}`;
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[2].type).toBe(TokenType.VerbatimEnd);
    });
});

describe('Verbatim Directive Detection Tests', () => {
    test('only endverbatim recognized in verbatim mode', () => {
        const source = "@verbatim\n@if($x)\n@section('test')\n@endverbatim";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);

        const text = source.slice(tokens[1].start, tokens[1].end);
        expect(text).toContain('@if($x)');
        expect(text).toContain("@section('test')");
    });
});

describe('Verbatim Word Boundary Tests', () => {
    test('endverbatim with suffix should not end verbatim', () => {
        const source = "@verbatim\n{{ $var }}\n@endverbatimfoo\n@endverbatim";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);

        const text = source.slice(tokens[1].start, tokens[1].end);
        expect(text).toContain('@endverbatimfoo');
    });

    test('endverbatim with underscore should not end verbatim', () => {
        const source = "@verbatim\n{{ $var }}\n@endverbatim_test\n@endverbatim";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);

        const text = source.slice(tokens[1].start, tokens[1].end);
        expect(text).toContain('@endverbatim_test');
    });
});

describe('Verbatim Content Preservation Tests', () => {
    test('preserves whitespace', () => {
        const source = "@verbatim\n    {{ $var }}\n        {!! $raw !!}\n@endverbatim";
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(0);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('empty verbatim content', () => {
        const source = '@verbatim@endverbatim';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.VerbatimStart);
        expect(tokens[1].type).toBe(TokenType.VerbatimEnd);
    });

    test('verbatim with whitespace between tags', () => {
        const source = "@verbatim   \n\n   @endverbatim";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[1].type).toBe(TokenType.Text);

        const text = source.slice(tokens[1].start, tokens[1].end);
        expect(text).toBe("   \n\n   ");
    });
});

describe('Verbatim Nested/Multiple Blocks Tests', () => {
    test('multiple verbatim blocks', () => {
        const source = "@verbatim\n{{ $one }}\n@endverbatim\n<p>Normal</p>\n@verbatim\n{{ $two }}\n@endverbatim";
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(0);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('verbatim inside verbatim', () => {
        const source = "@verbatim\n@verbatim\n{{ $var }}\n@endverbatim";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);

        const text = source.slice(tokens[1].start, tokens[1].end);
        expect(text).toContain('@verbatim');
        expect(text).toContain('{{ $var }}');
    });
});

describe('Verbatim Edge Cases', () => {
    test('unclosed verbatim', () => {
        const source = "@verbatim\n{{ $var }}\nNo closing tag";
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.UnexpectedEof);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.VerbatimStart);
        expect(tokens[1].type).toBe(TokenType.Text);
    });

    test('endverbatim without verbatim', () => {
        const source = '@endverbatim';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe(TokenType.VerbatimEnd);
    });

    test('verbatim with special chars', () => {
        const source = "@verbatim\n<script>var x = \"{{ $var }}\";</script>\n@endverbatim";
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(0);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('javascript example', () => {
        const source = "@verbatim\n<script>\n    var app = new Vue({\n        data: {\n            message: '{{ greeting }}'\n        }\n    });\n</script>\n@endverbatim";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[1].type).toBe(TokenType.Text);

        const text = source.slice(tokens[1].start, tokens[1].end);
        expect(text).toContain("'{{ greeting }}'");
    });

    test('@verbatim@endverbatim emits correct tokens', () => {
        const source = '@verbatim@endverbatim';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.tokens).toHaveLength(2);
        expect(result.tokens[0].type).toBe(TokenType.VerbatimStart);
        expect(result.tokens[1].type).toBe(TokenType.VerbatimEnd);
    });
});
