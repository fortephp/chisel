import { describe, test, it, expect } from "vitest";
import { tokenize, TokenType, tokenContent, reconstructFromTokens, Directives, ErrorReason } from "../../src/lexer/index.js";

function tokenizeAndVerify(source: string) {
    const result = tokenize(source, Directives.acceptAll());
    expect(reconstructFromTokens(result.tokens, source)).toBe(source);
    return result.tokens;
}

describe('Basic Tokenization', () => {
    test('tokenizes simple text', () => {
        const { tokens } = tokenize('Hello world');
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe(TokenType.Text);
        expect(tokens[0].start).toBe(0);
        expect(tokens[0].end).toBe(11);
        expect(tokenContent('Hello world', tokens[0])).toBe('Hello world');
    });

    test('handles empty input', () => {
        const { tokens } = tokenize('');
        expect(tokens).toHaveLength(0);
    });

    test('token length calculation', () => {
        const { tokens } = tokenize('Test');
        expect(tokens[0].end - tokens[0].start).toBe(4);
        expect(tokens[0].end === tokens[0].start).toBe(false);
    });

    test('zero-width tokens', () => {
        const token = { type: TokenType.SyntheticClose, start: 10, end: 10 };
        expect(token.end - token.start).toBe(0);
        expect(token.end === token.start).toBe(true);
    });
});

describe('Lexer Fault Tolerance', () => {
    describe('Incomplete Blade Delimiters', () => {
        it.each([
            '{{', '{{{', '{{--', '{!!', '{{ ', '{{ $', '{{ $x', '{!! ', '{!! $x',
        ])('handles incomplete echo start: %s', (input) => {
            tokenizeAndVerify(input);
        });

        it('handles incomplete echo with content', () => {
            let tokens = tokenizeAndVerify('{{ $variable');
            expect(tokens.length).toBeGreaterThan(0);
            tokens = tokenizeAndVerify('{!! $html');
            expect(tokens.length).toBeGreaterThan(0);
            tokens = tokenizeAndVerify('{{{ $escaped');
            expect(tokens.length).toBeGreaterThan(0);
        });

        it.each([
            '{{ $x !!}', '{!! $x }}', '{{{ $x }}', '{{ $x }}}',
        ])('handles mismatched echo delimiters: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Incomplete Blade Comments', () => {
        it.each([
            '{{--', '{{-- comment', '{{-- comment --', '{{-- }} --', '{{-- {!! !!} --',
        ])('handles incomplete blade comments: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Incomplete HTML Elements', () => {
        it.each([
            '<', '<d', '<div', '<div ', '<div c', '<div class', '<div class=',
            '<div class="', '<div class="foo', '<div class="foo"', '<div class="foo" ',
        ])('handles incomplete opening tags: %s', (input) => {
            tokenizeAndVerify(input);
        });

        it.each([
            '</', '</d', '</div', '</div ',
        ])('handles incomplete closing tags: %s', (input) => {
            tokenizeAndVerify(input);
        });

        it.each([
            '<', '>', '< >', '> <', '<<', '>>', '<><', '><>',
        ])('handles orphan angle brackets: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Incomplete HTML Comments', () => {
        it.each([
            '<!--', '<!-', '<!-- comment', '<!-- comment -', '<!-- comment --', '<!--->', '<!--->',
        ])('handles incomplete HTML comments: %s', (input) => {
            tokenizeAndVerify(input);
        });

        it.each([
            '<!>', '<!x>', '<!DOCTYPE', '<!DOCTYPE ', '<!DOCTYPE html',
        ])('handles bogus comments: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('IE Conditional Comments', () => {
        it.each([
            '<!--[if', '<!--[if IE', '<!--[if IE]>', '<!--[if IE]>content',
            '<![endif]', '<![endif]-->',
        ])('handles incomplete conditional comments: %s', (input) => {
            tokenizeAndVerify(input);
        });

        it.each([
            '<!--[if IE]>content<![endif]-->',
            '<!--[if lt IE 9]><html class="compat"><![endif]-->',
            '<!--[if !IE]><!--><p>Non-IE</p><!--<![endif]-->',
        ])('handles complete conditional comments: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Incomplete PHP Blocks', () => {
        it.each([
            '<?', '<?p', '<?php', '<?php ', '<?php echo', '<?php echo $x',
            '<?php echo $x;', '<?=', '<?= $x',
        ])('handles incomplete PHP syntax: %s', (input) => {
            tokenizeAndVerify(input);
        });

        it.each([
            '<?php echo "{{ $x }}"; ?>',
            '<?php if ($x): ?><div><?php endif; ?>',
            '<?php /* {{ $x }} */ ?>',
        ])('handles PHP blocks with blade-like content: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Incomplete Directives', () => {
        it.each([
            '@', '@i', '@if', '@if(', '@if($x', '@if($x)', '@foreach',
            '@foreach(', '@foreach($x', '@foreach($x as', '@foreach($x as $y',
        ])('handles incomplete directive syntax: %s', (input) => {
            tokenizeAndVerify(input);
        });

        it.each([
            '@@', '@@if', '@@if($x)', '@@@if',
        ])('handles escaped directives: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('CDATA Sections', () => {
        it.each([
            '<![CDATA[', '<![CDATA[content', '<![CDATA[content]', '<![CDATA[content]]',
        ])('handles incomplete CDATA: %s', (input) => {
            tokenizeAndVerify(input);
        });

        it.each([
            '<![CDATA[content]]>', '<![CDATA[ <div> ]]>', '<![CDATA[ {{ $x }} ]]>',
        ])('handles complete CDATA: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Generic Type Arguments (TSX)', () => {
        it.each([
            '<Map<', '<Map<Rec', '<Map<Rec>', '<Map<Rec>>',
            '<Map<<Rec', '<Map<<Rec<Rec<<>',
        ])('handles incomplete generic types: %s', (input) => {
            tokenizeAndVerify(input);
        });

        it.each([
            '<Table<User> />',
            '<Map<Record<string, number>>> data="ok"></Map>',
            '<List<Array<Item>> items={data} />',
        ])('handles complete generic types: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Alpine.js Attributes', () => {
        it.each([
            '<div :class>', '<div @click>', '<div :class="{ active: isActive }">',
            '<div @click="handle()">', '<div @click.prevent="open = !open">',
            '<div x-data="{ open: false }">', '<div :class @click :disabled>',
        ])('handles Alpine-style attributes: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Dynamic Attributes', () => {
        it.each([
            '<div {{ $attrs }}>',
            '<div {{ $a }}="{{ $b }}">',
            '<div {{ $a }}={{ $b }}>',
            '<div {!! $attrs !!}>',
            '<div class="{{ $class }}">',
            '<div data-json=\'{"a":"{{ $b }}"}\'>'
        ])('handles Blade in attributes: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Script and Style Tags', () => {
        it.each([
            '<script>{{', '<script>{{ $x', '<script>{!! $x', '<script>@if($x)',
        ])('handles script with incomplete Blade: %s', (input) => {
            tokenizeAndVerify(input);
        });

        it.each([
            '<script>{{ $x }}</script>',
            '<script>{!! json_encode($data) !!}</script>',
            '<script>if(a<b){console.log("{{ $x }}")}</script>',
        ])('handles script with complete Blade: %s', (input) => {
            tokenizeAndVerify(input);
        });

        it.each([
            '<style>{{ $x }}</style>',
            '<style>.a { color: {{ $color }}; }</style>',
            '<style>.{{ $class }} { }</style>',
        ])('handles style with Blade: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Quote Edge Cases', () => {
        it.each([
            '<div class="{{ $a ? "b" : \'c\' }}">',
            "<div onclick=\"alert('{{ $x }}')\">",
            '<div data-json=\'{"key":"{{ $val }}"}\'>'
        ])('handles complex quoting: %s', (input) => {
            tokenizeAndVerify(input);
        });

        it.each([
            '<div class="', "<div class='", '<div class="foo', "<div class='foo",
        ])('handles unclosed quotes: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Whitespace Edge Cases', () => {
        it.each([
            '', ' ', '  ', "\n", "\t", "\r\n", "  \n  \t  ",
        ])('handles various whitespace: %j', (input) => {
            tokenizeAndVerify(input);
        });

        it.each([
            "{{\n$x\n}}", "@if($x)\n@endif", "<div\nclass=\"foo\"\n>", "<!--\ncomment\n-->",
        ])('handles whitespace in constructs: %j', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Unicode Content', () => {
        it.each([
            '<div>{{ $émoji }}</div>',
            '<div class="日本語">{{ $中文 }}</div>',
            '{{ $emoji }}🎉{{ $more }}',
            '<div title="Ñoño">',
            '<!-- Комментарий -->',
        ])('handles unicode in various contexts: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Nested Constructs', () => {
        it.each([
            '<div><div><div>{{ $deep }}</div></div></div>',
            '@if($a)@if($b)@if($c)x@endif@endif@endif',
            '{{ {{ $x }} }}',
            '{{{ $x }}}',
            '{{{{{{ $x }}}}}}',
        ])('handles deeply nested structures: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Mixed Contexts', () => {
        it.each([
            '<div {{ $x }} @if($y) class="a" @endif>{{ $content }}</div>',
            '@if($x)<p @endif>',
            '<?php if ($x): ?><div @if($y)>{{ $z }}</div>@endif<?php endif; ?>',
            '<!-- {{ $blade }} --> @if($x) {!! $html !!} @endif',
        ])('handles multiple constructs together: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Self-closing and Void Elements', () => {
        it.each([
            '<br/>', '<br />', '<input type="{{ $type }}"/>',
            '<img src="{{ $src }}" />', '<x-component :prop="$value"/>',
        ])('handles self-closing elements: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Component Syntax', () => {
        it.each([
            '<x-alert />', '<x-alert>content</x-alert>',
            '<x-slot name="header">{{ $title }}</x-slot>',
            '<x-admin.panel>', '<livewire:counter />',
        ])('handles Blade components: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Extremely Long Content', () => {
        it('handles very long strings', () => {
            const long = 'a'.repeat(10000);
            tokenizeAndVerify(`<div>${long}</div>`);
            tokenizeAndVerify('{{ $x }}'.repeat(101));
        });

        it('handles many tokens', () => {
            tokenizeAndVerify('<div></div>'.repeat(100));
            tokenizeAndVerify('{{ $x }}'.repeat(100));
        });
    });

    describe('DOCTYPE Edge Cases', () => {
        it.each([
            '<!DOCTYPE html>', '<!doctype html>',
            '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN">',
            '<!DOCTYPE html><html {{ $attrs }}>',
            '<!doctype ', '<!DOCTYPE',
        ])('handles DOCTYPE variations: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('XML Declarations', () => {
        it.each([
            '<?xml version="1.0"?>', '<?xml version="1.0" encoding="UTF-8"?>',
            '<?xml', '<?xml ',
        ])('handles XML declarations: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });

    describe('Malformed Structures', () => {
        it.each([
            '<div<span>', '<div>>', '<<div>', '<div></span>',
            '<div><span></div></span>', '<div class class="foo">', '<div =value>',
        ])('handles malformed HTML: %s', (input) => {
            tokenizeAndVerify(input);
        });

        it.each([
            '@if @else @endif', '@if($x)@if($y)@endif',
            '{{ $x {{ $y }} }}', '@if(@if($x))',
        ])('handles malformed Blade: %s', (input) => {
            tokenizeAndVerify(input);
        });
    });
});

describe('Text Tokenization', () => {
    test('tokenizes simple text', () => {
        const { tokens } = tokenize('Hello world');
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe(TokenType.Text);
        expect(tokens[0].start).toBe(0);
        expect(tokens[0].end).toBe(11);
    });

    test('handles empty input', () => {
        const { tokens } = tokenize('');
        expect(tokens).toHaveLength(0);
    });

    test('single brace in text', () => {
        const { tokens } = tokenize('This { is } text');
        expect(tokens).toHaveLength(1);
        expect(tokens[0].type).toBe(TokenType.Text);
    });

    test('simple echo', () => {
        const { tokens } = tokenize('{{ $var }}');
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[1].start).toBe(2);
        expect(tokens[1].end).toBe(8);
        expect(tokens[2].type).toBe(TokenType.EchoEnd);
    });

    test('echo with text', () => {
        const { tokens } = tokenize('Hello {{ $name }}!');
        expect(tokens).toHaveLength(5);
        expect(tokens[0].type).toBe(TokenType.Text);
        expect(tokens[1].type).toBe(TokenType.EchoStart);
        expect(tokens[2].type).toBe(TokenType.EchoContent);
        expect(tokens[3].type).toBe(TokenType.EchoEnd);
        expect(tokens[4].type).toBe(TokenType.Text);
    });

    test('nested echo', () => {
        const { tokens } = tokenize("{{ ['a' => ['b' => 'c']] }}");
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoEnd);
    });

    test('abandoned echo (error recovery)', () => {
        const { tokens } = tokenize('{{ $var');
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
    });

    test('empty echo', () => {
        const { tokens } = tokenize('{{}}');
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoEnd);
    });

    test('raw echo', () => {
        const { tokens } = tokenize('{!! $html !!}');
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.RawEchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[1].start).toBe(3);
        expect(tokens[1].end).toBe(10);
        expect(tokens[2].type).toBe(TokenType.RawEchoEnd);
    });

    test('abandoned raw echo (error recovery)', () => {
        const { tokens } = tokenize('{!! $html');
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.RawEchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
    });

    test('triple echo', () => {
        const { tokens } = tokenize('{{{ $var }}}');
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.TripleEchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.TripleEchoEnd);
    });

    test('nested triple echo (construct collision)', () => {
        const result = tokenize('{{{ {{{ $var }}} }}}');
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);
        expect(result.tokens).toHaveLength(6);
        expect(result.tokens[0].type).toBe(TokenType.TripleEchoStart);
        expect(result.tokens[1].type).toBe(TokenType.EchoContent);
        expect(result.tokens[2].type).toBe(TokenType.TripleEchoStart);
        expect(result.tokens[3].type).toBe(TokenType.EchoContent);
        expect(result.tokens[4].type).toBe(TokenType.TripleEchoEnd);
        expect(result.tokens[5].type).toBe(TokenType.Text);
    });

    test('abandoned triple echo (error recovery)', () => {
        const { tokens } = tokenize('{{{ $var');
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.TripleEchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
    });

    test('multiple echo types', () => {
        const { tokens } = tokenize('{{ $a }} text {!! $b !!} more {{{ $c }}}');
        expect(tokens).toHaveLength(11);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoEnd);
        expect(tokens[3].type).toBe(TokenType.Text);
        expect(tokens[4].type).toBe(TokenType.RawEchoStart);
        expect(tokens[5].type).toBe(TokenType.EchoContent);
        expect(tokens[6].type).toBe(TokenType.RawEchoEnd);
        expect(tokens[7].type).toBe(TokenType.Text);
        expect(tokens[8].type).toBe(TokenType.TripleEchoStart);
        expect(tokens[9].type).toBe(TokenType.EchoContent);
        expect(tokens[10].type).toBe(TokenType.TripleEchoEnd);
    });

    test('exact token positions', () => {
        const source = 'Hello {{ $name }}!';
        const { tokens } = tokenize(source);
        expect(tokenContent(source, tokens[0])).toBe('Hello ');
        expect(tokenContent(source, tokens[2])).toBe(' $name ');
        expect(tokenContent(source, tokens[4])).toBe('!');
    });

    test('error recovery behavior', () => {
        const { tokens } = tokenize('{{ unclosed');
        expect(tokens).toHaveLength(2);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
    });
});
