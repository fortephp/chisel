import { describe, it, expect } from "vitest";
import { tokenize, TokenType, reconstructFromTokens, Directives, ErrorReason } from "../../src/lexer/index.js";

describe('PHP Blocks', () => {
    it('basic php block', () => {
        const source = "@php\n$var = 'value';\n@endphp";

        const registry = Directives.withDefaults();
        const result = tokenize(source, registry);

        expect(result.errors).toHaveLength(0);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.PhpBlockStart);
        expect(tokens[1].type).toBe(TokenType.PhpBlock);
        expect(tokens[2].type).toBe(TokenType.PhpBlockEnd);

        const phpContent = source.slice(tokens[1].start, tokens[1].end);
        expect(phpContent).toBe("\n$var = 'value';\n");

        const reconstructed = reconstructFromTokens(tokens, source);
        expect(reconstructed).toBe(source);
    });

    it('php block with blade syntax', () => {
        const source = "@php\n$data = ['name' => '{{ $user }}'];\n@endphp";

        const registry = Directives.withDefaults();
        const result = tokenize(source, registry);

        expect(result.errors).toHaveLength(0);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.PhpBlockStart);
        expect(tokens[1].type).toBe(TokenType.PhpBlock);
        expect(tokens[2].type).toBe(TokenType.PhpBlockEnd);

        const phpContent = source.slice(tokens[1].start, tokens[1].end);
        expect(phpContent).toContain('{{ $user }}');
    });

    it('php directive with args', () => {
        const source = '@php($condition)';

        const registry = Directives.withDefaults();
        const result = tokenize(source, registry);

        expect(result.errors).toHaveLength(0);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokens[1].type).toBe(TokenType.DirectiveArgs);
    });

    it('uppercase php', () => {
        const source = "@PHP\n$var = 1;\n@ENDPHP";

        const registry = Directives.withDefaults();
        const result = tokenize(source, registry);

        expect(result.errors).toHaveLength(0);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.PhpBlockStart);
        expect(tokens[1].type).toBe(TokenType.PhpBlock);
        expect(tokens[2].type).toBe(TokenType.PhpBlockEnd);
    });

    it('mixed case php', () => {
        const source = "@PhP\n$var = 1;\n@EnDpHp";

        const registry = Directives.withDefaults();
        const result = tokenize(source, registry);

        expect(result.errors).toHaveLength(0);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(3);
        expect(tokens[1].type).toBe(TokenType.PhpBlock);
    });

    it('empty php block', () => {
        const source = '@php@endphp';

        const registry = Directives.withDefaults();
        const result = tokenize(source, registry);

        expect(result.errors).toHaveLength(0);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.PhpBlockStart);
        expect(tokens[1].type).toBe(TokenType.PhpBlockEnd);
    });

    it('unclosed php block', () => {
        const source = "@php\n$var = 'value';\nNo closing tag";

        const registry = Directives.withDefaults();
        const result = tokenize(source, registry);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.UnexpectedEof);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.PhpBlockStart);
        expect(tokens[1].type).toBe(TokenType.PhpBlock);
    });

    it('endphp without php', () => {
        const source = '@endphp';

        const registry = Directives.withDefaults();
        const result = tokenize(source, registry);

        expect(result.errors).toHaveLength(0);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe(TokenType.PhpBlockEnd);
    });

    it('phpfoo should not start php block', () => {
        const source = "@phpfoo\n$var = 1;\n@endphp";

        const registry = Directives.withDefaults();
        const result = tokenize(source, registry);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.Text);
        expect(tokens[1].type).toBe(TokenType.Text);
        expect(tokens[2].type).toBe(TokenType.PhpBlockEnd);
    });

    it('endphpfoo should not end php block', () => {
        const source = "@php\n$var = 1;\n@endphpfoo\n@endphp";

        const registry = Directives.withDefaults();
        const result = tokenize(source, registry);

        expect(result.errors).toHaveLength(0);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.PhpBlockStart);
        expect(tokens[1].type).toBe(TokenType.PhpBlock);
        expect(tokens[2].type).toBe(TokenType.PhpBlockEnd);

        const phpContent = source.slice(tokens[1].start, tokens[1].end);
        expect(phpContent).toContain('@endphpfoo');
    });

    it('multiple php blocks', () => {
        const source = "@php\n$one = 1;\n@endphp\n<p>HTML</p>\n@php\n$two = 2;\n@endphp";

        const registry = Directives.withDefaults();
        const result = tokenize(source, registry);

        expect(result.errors).toHaveLength(0);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    it('preserves whitespace', () => {
        const source = "@php\n    $var = 'value';\n        $another = 'test';\n@endphp";

        const registry = Directives.withDefaults();
        const result = tokenize(source, registry);

        expect(result.errors).toHaveLength(0);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    it('php block with surrounding blade', () => {
        const source = "{{ $before }}\n@php\n$code = 'test';\n@endphp\n{{ $after }}";

        const registry = Directives.withDefaults();
        const result = tokenize(source, registry);

        expect(result.errors).toHaveLength(0);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    it('@php@endphp emits correct tokens', () => {
        const source = '@php@endphp';
        const result = tokenize(source);

        expect(result.tokens).toHaveLength(2);
        expect(result.tokens[0].type).toBe(TokenType.PhpBlockStart);
        expect(result.tokens[0].start).toBe(0);
        expect(result.tokens[0].end).toBe(4);
        expect(result.tokens[1].type).toBe(TokenType.PhpBlockEnd);
        expect(result.tokens[1].start).toBe(4);
        expect(result.tokens[1].end).toBe(11);
    });

    it('@php with content then @endphp', () => {
        const source = "@php\n$x = 1;\n@endphp";
        const result = tokenize(source);

        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[0].type).toBe(TokenType.PhpBlockStart);
        expect(result.tokens[1].type).toBe(TokenType.PhpBlock);
        expect(result.tokens[2].type).toBe(TokenType.PhpBlockEnd);
    });

    it('@endphp outside PHP block still emits PhpBlockEnd', () => {
        const source = '🐘 @endphp 🐘';
        const result = tokenize(source);

        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[0].type).toBe(TokenType.Text);
        expect(result.tokens[1].type).toBe(TokenType.PhpBlockEnd);
        expect(result.tokens[2].type).toBe(TokenType.Text);
    });

    it('goofy php/endphp on character boundaries', () => {
        const source = 'text @php$x=1;@endphp more';
        const result = tokenize(source);

        expect(result.tokens).toHaveLength(5);
        expect(result.tokens[0].type).toBe(TokenType.Text);
        expect(result.tokens[1].type).toBe(TokenType.PhpBlockStart);
        expect(result.tokens[2].type).toBe(TokenType.PhpBlock);
        expect(result.tokens[3].type).toBe(TokenType.PhpBlockEnd);
        expect(result.tokens[4].type).toBe(TokenType.Text);
    });
});
