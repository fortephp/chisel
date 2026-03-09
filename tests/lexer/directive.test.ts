import { describe, test, expect } from "vitest";
import { tokenize, TokenType, tokenContent, reconstructFromTokens, ErrorReason } from "../../src/lexer/index.js";
import { Directives } from "../../src/lexer/directives.js";

describe('Simple Directives', () => {
    test('simple directive', () => {
        const source = '@if';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokenContent(source, tokens[0])).toBe('@if');
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('directive with args', () => {
        const source = '@if($condition)';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokenContent(source, tokens[0])).toBe('@if');
        expect(tokens[1].type).toBe(TokenType.DirectiveArgs);
        expect(tokenContent(source, tokens[1])).toBe('($condition)');
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('directive with complex args', () => {
        const source = "@section('title', ['class' => 'active'])";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokens[1].type).toBe(TokenType.DirectiveArgs);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });
});

describe('Directives with Text', () => {
    test('directive with surrounding text', () => {
        const source = 'Before @if After';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.Text);
        expect(tokenContent(source, tokens[0])).toBe('Before ');
        expect(tokens[1].type).toBe(TokenType.Directive);
        expect(tokenContent(source, tokens[1])).toBe('@if');
        expect(tokens[2].type).toBe(TokenType.Text);
        expect(tokenContent(source, tokens[2])).toBe(' After');
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('multiple directives', () => {
        const source = '@if @endif';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokenContent(source, tokens[0])).toBe('@if');
        expect(tokens[1].type).toBe(TokenType.Text);
        expect(tokenContent(source, tokens[1])).toBe(' ');
        expect(tokens[2].type).toBe(TokenType.Directive);
        expect(tokenContent(source, tokens[2])).toBe('@endif');
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });
});

describe('Unknown Directives', () => {
    test('unknown directive', () => {
        const source = '@unknownDirective';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe(TokenType.Text);
        expect(tokenContent(source, tokens[0])).toBe('@unknownDirective');
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('at sign in email', () => {
        const source = 'Email: user@example.com';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe(TokenType.Text);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('at sign alone', () => {
        const source = '@ ';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.Text);
        expect(tokenContent(source, tokens[0])).toBe('@');
        expect(tokens[1].type).toBe(TokenType.Text);
        expect(tokenContent(source, tokens[1])).toBe(' ');
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });
});

describe('Nested Arguments', () => {
    test('directive nested parens', () => {
        const source = "@section('name', fn($x) => $x)";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokens[1].type).toBe(TokenType.DirectiveArgs);
        expect(tokenContent(source, tokens[1])).toBe("('name', fn($x) => $x)");
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('directive nested arrays', () => {
        const source = "@component('alert', ['data' => ['nested' => ['value']]])";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(2);
        expect(tokens[1].type).toBe(TokenType.DirectiveArgs);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('directive args with quotes', () => {
        const source = "@if('It\\'s a \"test\"')";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(2);
        expect(tokens[1].type).toBe(TokenType.DirectiveArgs);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });
});

describe('Common Directives', () => {
    test('foreach directive', () => {
        const source = '@foreach($items as $item)';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokenContent(source, tokens[0])).toBe('@foreach');
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('section directive', () => {
        const source = "@section('content')";
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(2);
        expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    });

    test('csrf directive', () => {
        const source = '@csrf';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });
});

describe('Edge Cases', () => {
    describe('Directive with Dot', () => {
        test('directive followed by dot at EOF', () => {
            const source = '<div @click.';
            const result = tokenize(source, Directives.withDefaults());
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
        });

        test('it tokenizes directive-like things followed by dot', () => {
            const source = '<div id="root" :class="{ open: isOpen }" @click.';
            const result = tokenize(source, Directives.withDefaults());
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
        });

        test.each([
            '<div @click.',
            '<div @click.prevent',
            '<div @if.',
            '<div @foreach.',
            '<div @click(',
            '<div @click>',
        ])('directive followed by various punctuation: %s', (source) => {
            const result = tokenize(source, Directives.withDefaults());
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
        });

        test('directive with vue modifiers', () => {
            const source = '<div @click.prevent.stop="handler">';
            const result = tokenize(source, Directives.acceptAll());

            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
            expect(result.tokens.some(t => t.type === TokenType.Directive)).toBe(false);
            expect(
                result.tokens.some(
                    t => t.type === TokenType.AttributeName && tokenContent(source, t) === "@click.prevent.stop",
                ),
            ).toBe(true);
        });

        test('directive with alpine modifiers', () => {
            const source = '<div @click.outside="close">';
            const result = tokenize(source, Directives.acceptAll());
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
        });
    });

    describe('Directive Partial Cases', () => {
        test('partial directive at EOF', () => {
            const source = '<div @';
            const result = tokenize(source, Directives.withDefaults());
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
        });

        test('directive without name', () => {
            const source = '<div @ >';
            const result = tokenize(source, Directives.withDefaults());
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
        });

        test.each([
            '<div @click!',
            '<div @click?',
            '<div @click;',
            '<div @click:',
            '<div @click[',
            '<div @click]',
        ])('directive with special chars after name: %s', (source) => {
            const result = tokenize(source, Directives.withDefaults());
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
        });
    });

    describe('Directive with Args Edge Cases', () => {
        test('directive with empty args', () => {
            const source = '@if()';
            const result = tokenize(source, Directives.withDefaults());
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
        });

        test('directive with unclosed args at EOF', () => {
            const source = '@if($condition';
            const result = tokenize(source, Directives.withDefaults());

            expect(result.errors.length).toBeGreaterThan(0);
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
        });

        test('directive with args containing dots', () => {
            const source = '@if($user->profile->isActive())';
            const result = tokenize(source, Directives.withDefaults());
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
        });

        test('directive with args containing function calls', () => {
            const source = '@if(count($items) > 0)';
            const result = tokenize(source, Directives.withDefaults());
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
        });
    });

    describe('Directive Position Edge Cases', () => {
        test('directive at start of file', () => {
            const source = '@section("content")';
            const result = tokenize(source, Directives.withDefaults());
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
            expect(result.tokens[0].type).toBe(TokenType.Directive);
        });

        test('directive at end of file', () => {
            const source = 'Some text @endsection';
            const result = tokenize(source, Directives.withDefaults());
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
            const lastToken = result.tokens[result.tokens.length - 1];
            expect(lastToken.type).toBe(TokenType.Directive);
        });

        test('directive in middle of text', () => {
            const source = 'Before @if($x) After';
            const result = tokenize(source, Directives.withDefaults());
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
            const types = result.tokens.map(t => t.type);
            expect(types).toContain(TokenType.Text);
            expect(types).toContain(TokenType.Directive);
        });

        test('consecutive directives', () => {
            const source = '@if($x)@foreach($items as $item)@endif';
            const result = tokenize(source, Directives.withDefaults());
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
            const directiveCount = result.tokens.filter(t => t.type === TokenType.Directive).length;
            expect(directiveCount).toBe(3);
        });
    });

    describe('Directive Word Boundaries', () => {
        test('email with @ should not be directive', () => {
            const source = 'Contact: user@example.com';
            const result = tokenize(source, Directives.withDefaults());
            expect(result.tokens.some(t => t.type === TokenType.Directive)).toBe(false);
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
        });

        test('@ in middle of word should not be directive', () => {
            const source = 'some@thing';
            const result = tokenize(source, Directives.withDefaults());
            expect(result.tokens.some(t => t.type === TokenType.Directive)).toBe(false);
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
        });

        test('@ after space should be directive', () => {
            const source = 'text @if($x)';
            const result = tokenize(source, Directives.withDefaults());
            expect(result.tokens.some(t => t.type === TokenType.Directive)).toBe(true);
            expect(reconstructFromTokens(result.tokens, source)).toBe(source);
        });
    });

    describe('Case-Insensitive Matching', () => {
        test('directive case insensitive', () => {
            const source = '@IF($x) @ForEach($items) @CSRF';
            const result = tokenize(source, Directives.withDefaults());
            const tokens = result.tokens;

            expect(result.errors).toHaveLength(0);
            expect(tokens).toHaveLength(7);
            expect(tokens[0].type).toBe(TokenType.Directive);
            expect(tokenContent(source, tokens[0])).toBe('@IF');
            expect(tokens[1].type).toBe(TokenType.DirectiveArgs);
            expect(tokens[3].type).toBe(TokenType.Directive);
            expect(tokenContent(source, tokens[3])).toBe('@ForEach');
            expect(tokens[4].type).toBe(TokenType.DirectiveArgs);
            expect(tokens[6].type).toBe(TokenType.Directive);
            expect(tokenContent(source, tokens[6])).toBe('@CSRF');
            expect(reconstructFromTokens(tokens, source)).toBe(source);
        });

        test('directive mixed case', () => {
            const source = "@CsRf @EnDiF @sEcTiOn('test')";
            const result = tokenize(source, Directives.withDefaults());
            const tokens = result.tokens;

            expect(result.errors).toHaveLength(0);
            expect(tokens[0].type).toBe(TokenType.Directive);
            expect(tokens[2].type).toBe(TokenType.Directive);
            expect(tokens[4].type).toBe(TokenType.Directive);
            expect(reconstructFromTokens(tokens, source)).toBe(source);
        });
    });

    describe('Dynamic Registration', () => {
        test('dynamic directive registration', () => {
            const source = '@myCustomDirective @anotherDirective';
            const registry = Directives.empty();
            registry.register('myCustomDirective');
            registry.register('anotherDirective');

            const result = tokenize(source, registry);
            const tokens = result.tokens;

            expect(result.errors).toHaveLength(0);
            expect(tokens).toHaveLength(3);
            expect(tokens[0].type).toBe(TokenType.Directive);
            expect(tokenContent(source, tokens[0])).toBe('@myCustomDirective');
            expect(tokens[2].type).toBe(TokenType.Directive);
            expect(tokenContent(source, tokens[2])).toBe('@anotherDirective');
            expect(reconstructFromTokens(tokens, source)).toBe(source);
        });

        test('dynamic registration case insensitive', () => {
            const source = '@MYCUSTOMDIRECTIVE @myCustomDirective @MyCuStOmDiReCtIvE';
            const registry = Directives.empty();
            registry.register('myCustomDirective');

            const result = tokenize(source, registry);
            const tokens = result.tokens;

            expect(result.errors).toHaveLength(0);
            expect(tokens).toHaveLength(5);
            expect(tokens[0].type).toBe(TokenType.Directive);
            expect(tokens[2].type).toBe(TokenType.Directive);
            expect(tokens[4].type).toBe(TokenType.Directive);
            expect(reconstructFromTokens(tokens, source)).toBe(source);
        });
    });

    describe('Accept-All Mode', () => {
        test('accept all mode', () => {
            const source = '@unknownDirective @customThing @whatever';
            const result = tokenize(source, Directives.acceptAll());
            const tokens = result.tokens;

            expect(result.errors).toHaveLength(0);
            expect(tokens).toHaveLength(5);
            expect(tokens[0].type).toBe(TokenType.Directive);
            expect(tokenContent(source, tokens[0])).toBe('@unknownDirective');
            expect(tokens[2].type).toBe(TokenType.Directive);
            expect(tokenContent(source, tokens[2])).toBe('@customThing');
            expect(tokens[4].type).toBe(TokenType.Directive);
            expect(tokenContent(source, tokens[4])).toBe('@whatever');
            expect(reconstructFromTokens(tokens, source)).toBe(source);
        });

        test('accept all with args', () => {
            const source = "@unknownDirective('arg1', 'arg2')";
            const result = tokenize(source, Directives.acceptAll());
            const tokens = result.tokens;

            expect(result.errors).toHaveLength(0);
            expect(tokens).toHaveLength(2);
            expect(tokens[0].type).toBe(TokenType.Directive);
            expect(tokens[1].type).toBe(TokenType.DirectiveArgs);
            expect(reconstructFromTokens(tokens, source)).toBe(source);
        });

        test('accept all still respects email-like patterns', () => {
            const source = 'Email: user@example.com';
            const result = tokenize(source, Directives.acceptAll());
            const tokens = result.tokens;

            expect(result.errors).toHaveLength(0);
            expect(tokens).toHaveLength(1);
            expect(tokens[0].type).toBe(TokenType.Text);
            expect(reconstructFromTokens(tokens, source)).toBe(source);
        });
    });

    test('directive at start of line', () => {
        const source = "@if($x)\n@endif";
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokens[2].type).toBe(TokenType.Text);
        expect(tokens[3].type).toBe(TokenType.Directive);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });

    test('directive exact offsets', () => {
        const source = 'Text @if(true) More';
        const result = tokenize(source, Directives.withDefaults());
        const tokens = result.tokens;

        expect(result.errors).toHaveLength(0);
        expect(tokens[0].start).toBe(0);
        expect(tokens[0].end).toBe(5);
        expect(tokens[1].start).toBe(5);
        expect(tokens[1].end).toBe(8);
        expect(tokens[2].start).toBe(8);
        expect(tokens[2].end).toBe(14);
        expect(tokens[3].start).toBe(14);
        expect(tokens[3].end).toBe(19);
        expect(reconstructFromTokens(tokens, source)).toBe(source);
    });
});

describe('Directive Error Handling', () => {
    test('unclosed directive args', () => {
        const source = "@section('name";
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.UnexpectedEof);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokens[1].type).toBe(TokenType.DirectiveArgs);
    });

    test('unclosed nested directive args', () => {
        const source = "@section(['name' => 'value'";
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.UnexpectedEof);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.Directive);
        expect(tokens[1].type).toBe(TokenType.DirectiveArgs);
    });
});

describe('Directive Whitespace Tokenization', () => {
    test('emits whitespace token between directive name and args', () => {
        const source = '@if   ($count === 1)';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[0].type).toBe(TokenType.Directive);
        expect(tokenContent(source, result.tokens[0])).toBe('@if');
        expect(result.tokens[1].type).toBe(TokenType.Whitespace);
        expect(tokenContent(source, result.tokens[1])).toBe('   ');
        expect(result.tokens[2].type).toBe(TokenType.DirectiveArgs);
        expect(tokenContent(source, result.tokens[2])).toBe('($count === 1)');
    });

    test('handles single space between directive and args', () => {
        const source = '@foreach ($items as $item)';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.tokens).toHaveLength(3);
        expect(result.tokens[0].type).toBe(TokenType.Directive);
        expect(result.tokens[1].type).toBe(TokenType.Whitespace);
        expect(result.tokens[2].type).toBe(TokenType.DirectiveArgs);
        expect(tokenContent(source, result.tokens[1])).toBe(' ');
    });

    test('handles no whitespace between directive and args', () => {
        const source = '@if($count === 1)';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.tokens).toHaveLength(2);
        expect(result.tokens[0].type).toBe(TokenType.Directive);
        expect(result.tokens[1].type).toBe(TokenType.DirectiveArgs);
    });

    test('handles directive without args', () => {
        const source = '@csrf';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.tokens).toHaveLength(1);
        expect(result.tokens[0].type).toBe(TokenType.Directive);
    });
});
