import { describe, test, expect } from "vitest";
import { tokenize, TokenType, reconstructFromTokens } from "../../src/lexer/index.js";
import { Directives } from "../../src/lexer/directives.js";

describe('PHP Tags', () => {
    test('basic php tag', () => {
        const source = "<?php\n$var = 'value';\n?>";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.PhpTagStart);
        expect(tokens[1].type).toBe(TokenType.PhpContent);
        expect(tokens[2].type).toBe(TokenType.PhpTagEnd);

        const phpContent = source.slice(tokens[1].start, tokens[1].end);
        expect(phpContent).toBe("\n$var = 'value';\n");
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('short echo php tag', () => {
        const source = '<?= $var ?>';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.PhpTagStart);
        expect(tokens[1].type).toBe(TokenType.PhpContent);
        expect(tokens[2].type).toBe(TokenType.PhpTagEnd);

        const phpContent = source.slice(tokens[1].start, tokens[1].end);
        expect(phpContent).toBe(' $var ');

        const tagStart = source.slice(tokens[0].start, tokens[0].end);
        expect(tagStart).toBe('<?=');
    });

    test('short php tag', () => {
        const source = "<? echo 'hello'; ?>";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe(TokenType.BogusComment);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('uppercase php tag', () => {
        const source = "<?PHP\n$var = 1;\n?>";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.PhpTagStart);
        expect(tokens[1].type).toBe(TokenType.PhpContent);
        expect(tokens[2].type).toBe(TokenType.PhpTagEnd);

        const tagStart = source.slice(tokens[0].start, tokens[0].end);
        expect(tagStart).toBe('<?PHP');
    });

    test('mixed case php tag', () => {
        const source = "<?PhP\n$var = 1;\n?>";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.PhpTagStart);
        expect(tokens[1].type).toBe(TokenType.PhpContent);
        expect(tokens[2].type).toBe(TokenType.PhpTagEnd);
    });

    test('empty php tag', () => {
        const source = '<?php?>';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.PhpTagStart);
        expect(tokens[1].type).toBe(TokenType.PhpTagEnd);
    });

    test('unclosed php tag', () => {
        const source = "<?php\n$var = 'value';\nNo closing tag";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.PhpTagStart);
        expect(tokens[1].type).toBe(TokenType.PhpContent);
    });

    test('php tag with blade syntax', () => {
        const source = "<?php\n$data = ['name' => '{{ $user }}'];\n?>";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.PhpTagStart);
        expect(tokens[1].type).toBe(TokenType.PhpContent);
        expect(tokens[2].type).toBe(TokenType.PhpTagEnd);

        const phpContent = source.slice(tokens[1].start, tokens[1].end);
        expect(phpContent).toContain('{{ $user }}');
    });

    test('php tag with blade directives', () => {
        const source = "<?php\n@if($x) { echo 'test'; }\n?>";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.PhpTagStart);
        expect(tokens[1].type).toBe(TokenType.PhpContent);
        expect(tokens[2].type).toBe(TokenType.PhpTagEnd);

        const phpContent = source.slice(tokens[1].start, tokens[1].end);
        expect(phpContent).toContain('@if($x)');
    });

    test('php tag word boundary', () => {
        const source = "<?phps\n$var = 1;\n?>";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.PIStart);
        expect(tokens[2].type).toBe(TokenType.PIEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('multiple php tags', () => {
        const source = "<?php\n$one = 1;\n?>\n<p>HTML</p>\n<?php\n$two = 2;\n?>";
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(0);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('mixed php tags', () => {
        const source = "<?php echo 'a'; ?> text <?= $var ?> more";
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(0);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('php tag preserves whitespace', () => {
        const source = "<?php\n    $var = 'value';\n        $another = 'test';\n?>";
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(0);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('php tag with surrounding blade', () => {
        const source = "{{ $before }}\n<?php\n$code = 'test';\n?>\n{{ $after }}";
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(0);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('xml declaration is properly tokenized', () => {
        const source = '<?xml version="1.0"?>';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(tokens).toHaveLength(8);
        expect(tokens[0].type).toBe(TokenType.DeclStart);
        expect(tokens[2].type).toBe(TokenType.AttributeName);
        expect(tokens[7].type).toBe(TokenType.DeclEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('question mark in php content', () => {
        const source = "<?php\n$test = true ? 'yes' : 'no';\n?>";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.PhpTagStart);
        expect(tokens[1].type).toBe(TokenType.PhpContent);
        expect(tokens[2].type).toBe(TokenType.PhpTagEnd);

        const phpContent = source.slice(tokens[1].start, tokens[1].end);
        expect(phpContent).toContain('?');
    });
});
