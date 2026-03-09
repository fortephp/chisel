import { describe, test, expect } from "vitest";
import { tokenize, TokenType, tokenContent, reconstructFromTokens } from "../../src/lexer/index.js";
import { Directives } from "../../src/lexer/directives.js";

describe('Echo with Heredoc/Comment Skipping', () => {
    test('echo with block comment containing braces', () => {
        const source = '{{ $x /* {{ }} */ }}';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('echo with line comment containing braces', () => {
        const source = '{{ $x // {{ }}\n}}';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('echo with hash comment containing braces', () => {
        const source = '{{ $x # {{ }}\n}}';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('echo with single-quoted string containing braces', () => {
        const source = "{{ $x = '{{ }}' }}";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('echo with double-quoted string containing braces', () => {
        const source = '{{ $x = "{{ }}" }}';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('echo with backtick string containing braces', () => {
        const source = '{{ $x = `echo "{{ }}"` }}';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('echo with heredoc containing braces', () => {
        const source = "{{ $thing = <<<'THING'\n    {{ }} { }\nTHING\n}}";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoEnd);

        const content = tokenContent(source, tokens[1]);
        expect(content).toContain("<<<'THING'");
        expect(content).toContain('{{ }} { }');
        expect(content).toContain('THING');
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('all the painful things', () => {
        const source = "{{ $thing = <<<'THING'\n    {{ }} { }\nTHING;\n/*\n*/\nasdf\n// asdf\n#asdf\n}}";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoEnd);

        const content = tokenContent(source, tokens[1]);
        expect(content).toContain("<<<'THING'");
        expect(content).toContain('{{ }} { }');
        expect(content).toContain('THING;');
        expect(content).toContain('/*');
        expect(content).toContain('*/');
        expect(content).toContain('// asdf');
        expect(content).toContain('#asdf');
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });
});

describe('Raw Echo with Heredoc/Comment Skipping', () => {
    test('raw echo with heredoc containing braces', () => {
        const source = "{!! $thing = <<<'THING'\n    {!! !!} { }\nTHING;\n!!}";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.RawEchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.RawEchoEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('raw echo with block comment containing braces', () => {
        const source = '{!! $x /* {!! !!} */ !!}';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.RawEchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.RawEchoEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('raw echo with line comment containing braces', () => {
        const source = '{!! $x // {!! !!}\n!!}';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.RawEchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.RawEchoEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('raw echo with single-quoted string containing braces', () => {
        const source = "{!! $x = '{!! !!}' !!}";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.RawEchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.RawEchoEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });
});

describe('Triple Echo with Heredoc/Comment Skipping', () => {
    test('triple echo with heredoc containing braces', () => {
        const source = "{{{ $thing = <<<'THING'\n    {{{ }}} { }\nTHING;\n}}}";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.TripleEchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.TripleEchoEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('triple echo with block comment containing braces', () => {
        const source = '{{{ $x /* {{{ }}} */ }}}';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.TripleEchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.TripleEchoEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('triple echo with line comment containing braces', () => {
        const source = '{{{ $x // {{{ }}}\n}}}';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.TripleEchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.TripleEchoEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('triple echo with nested triple echo properly skipped in string', () => {
        const source = "{{{ $x = '{{{ }}}' }}}";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.TripleEchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.TripleEchoEnd);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });
});

describe('Directive Args with Heredoc/Comment Skipping', () => {
    test('directive args with heredoc containing parens', () => {
        const source = "@php($thing = <<<'THING'\n    ( ) ( )\nTHING\n)";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokens[1].type).toBe(TokenType.DirectiveArgs);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('directive args with block comment containing parens', () => {
        const source = '@if($x /* ( ) */ )';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokens[1].type).toBe(TokenType.DirectiveArgs);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('directive args with line comment containing parens', () => {
        const source = '@if($x // ( )\n)';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokens[1].type).toBe(TokenType.DirectiveArgs);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('directive args with string containing parens', () => {
        const source = "@section('name (with) parens')";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokens[1].type).toBe(TokenType.DirectiveArgs);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('directive args with hash comment containing parens', () => {
        const source = '@if($x # ( )\n)';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokens[1].type).toBe(TokenType.DirectiveArgs);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('directive args with backtick string containing parens', () => {
        const source = '@php(`echo "( )"`)';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokens[1].type).toBe(TokenType.DirectiveArgs);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('directive args with double-quoted string containing parens', () => {
        const source = '@section("name (with) parens")';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokens[1].type).toBe(TokenType.DirectiveArgs);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('directive args with nested parens and mixed skip scenarios', () => {
        const source = "@section('outer', [\n    'data' => '( )',\n    'heredoc' => <<<'DOC'\n        ( ) ( )\nDOC\n    /* ( ) */,\n    'nested' => ['( )']\n])";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokens[1].type).toBe(TokenType.DirectiveArgs);

        const args = tokenContent(source, tokens[1]);
        expect(args).toContain("'outer'");
        expect(args).toContain("'data' => '( )'");
        expect(args).toContain("<<<'DOC'");
        expect(args).toContain('/* ( ) */');
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });
});
