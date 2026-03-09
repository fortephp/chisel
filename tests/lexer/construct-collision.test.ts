import { describe, test, expect } from "vitest";
import { tokenize, TokenType, ErrorReason } from "../../src/lexer/index.js";
import { Directives } from "../../src/lexer/directives.js";

describe('Echo Construct Collisions', () => {
    test('echo inside echo', () => {
        const source = '{{ $x {{ $y }} }}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(6);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoStart);
        expect(tokens[3].type).toBe(TokenType.EchoContent);
        expect(tokens[4].type).toBe(TokenType.EchoEnd);
        expect(tokens[5].type).toBe(TokenType.Text);
    });

    test('raw echo inside echo', () => {
        const source = '{{ $x {!! $y !!} }}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(6);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.RawEchoStart);
        expect(tokens[3].type).toBe(TokenType.EchoContent);
        expect(tokens[4].type).toBe(TokenType.RawEchoEnd);
        expect(tokens[5].type).toBe(TokenType.Text);
    });

    test('triple echo inside echo', () => {
        const source = '{{ $x {{{ $y }}} }}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(6);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.TripleEchoStart);
        expect(tokens[3].type).toBe(TokenType.EchoContent);
        expect(tokens[4].type).toBe(TokenType.TripleEchoEnd);
        expect(tokens[5].type).toBe(TokenType.Text);
    });

    test('directive inside echo', () => {
        const source = '{{ $x @if($y) }}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(5);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.Directive);
        expect(tokens[3].type).toBe(TokenType.DirectiveArgs);
        expect(tokens[4].type).toBe(TokenType.Text);
    });
});

describe('Raw Echo Construct Collisions', () => {
    test('echo inside raw echo', () => {
        const source = '{!! $x {{ $y }} !!}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(6);
        expect(tokens[0].type).toBe(TokenType.RawEchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoStart);
        expect(tokens[3].type).toBe(TokenType.EchoContent);
        expect(tokens[4].type).toBe(TokenType.EchoEnd);
        expect(tokens[5].type).toBe(TokenType.Text);
    });

    test('raw echo inside raw echo', () => {
        const source = '{!! $x {!! $y !!} !!}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(6);
        expect(tokens[0].type).toBe(TokenType.RawEchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.RawEchoStart);
        expect(tokens[3].type).toBe(TokenType.EchoContent);
        expect(tokens[4].type).toBe(TokenType.RawEchoEnd);
        expect(tokens[5].type).toBe(TokenType.Text);
    });
});

describe('Triple Echo Construct Collisions', () => {
    test('echo inside triple echo', () => {
        const source = '{{{ $x {{ $y }} }}}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(6);
        expect(tokens[0].type).toBe(TokenType.TripleEchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoStart);
        expect(tokens[3].type).toBe(TokenType.EchoContent);
        expect(tokens[4].type).toBe(TokenType.EchoEnd);
        expect(tokens[5].type).toBe(TokenType.Text);
    });

    test('triple echo inside triple echo', () => {
        const source = '{{{ $x {{{ $y }}} }}}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(6);
        expect(tokens[0].type).toBe(TokenType.TripleEchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.TripleEchoStart);
        expect(tokens[3].type).toBe(TokenType.EchoContent);
        expect(tokens[4].type).toBe(TokenType.TripleEchoEnd);
        expect(tokens[5].type).toBe(TokenType.Text);
    });
});

describe('Partial Content Handling', () => {
    test('partial content before collision', () => {
        const source = '{{ $var = "value"; {{ $nested }} }}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(6);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);

        const content = source.slice(tokens[1].start, tokens[1].end);
        expect(content).toBe(' $var = "value"; ');
    });

    test('no partial content when collision is immediate', () => {
        const source = '{{ @if($x) }}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);

        const tokens = result.tokens;
        expect(tokens).toHaveLength(5);
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.Directive);
        expect(tokens[3].type).toBe(TokenType.DirectiveArgs);
        expect(tokens[4].type).toBe(TokenType.Text);
    });

    test('user example: nested echo', () => {
        const source = '{{ $iAmEchoOne {{ $iAmEchoTwo }} }}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);

        const tokens = result.tokens;
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoStart);
        expect(tokens[3].type).toBe(TokenType.EchoContent);
        expect(tokens[4].type).toBe(TokenType.EchoEnd);
    });
});

describe('PHP Tag Construct Collisions', () => {
    test('php tag inside echo', () => {
        const source = '{{ $var <?php echo "test"; ?> }}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);
        expect(result.tokens.length).toBeGreaterThan(0);
    });

    test('php short tag inside raw echo', () => {
        const source = '{!! $html <?= $value ?> !!}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);
        expect(result.tokens.length).toBeGreaterThan(0);
    });

    test('php tag inside triple echo', () => {
        const source = '{{{ $var <?= $old ?> }}}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);
        expect(result.tokens.length).toBeGreaterThan(0);
    });

    test('php tag with partial content before collision', () => {
        const source = '{{ $x = 1; <?php $y = 2; ?> }}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);

        const contentTokens = result.tokens.filter(t => t.type === TokenType.EchoContent);
        expect(contentTokens.length).toBeGreaterThan(0);

        const firstContent = contentTokens[0];
        const content = source.slice(firstContent.start, firstContent.end);
        expect(content).toBe(' $x = 1; ');
    });

    test('no false positive for less-than in echo', () => {
        const source = '{{ $a < $b }}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(0);

        const tokens = result.tokens;
        expect(tokens[0].type).toBe(TokenType.EchoStart);
        expect(tokens[1].type).toBe(TokenType.EchoContent);
        expect(tokens[2].type).toBe(TokenType.EchoEnd);
    });
});

describe('Blade Block Construct Collisions', () => {
    test('php block inside echo', () => {
        const source = '{{ $var @php $x = 1; @endphp }}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);
        expect(result.tokens.length).toBeGreaterThan(0);
    });

    test('verbatim block inside echo', () => {
        const source = '{{ $var @verbatim {{ raw }} @endverbatim }}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);
        expect(result.tokens.length).toBeGreaterThan(0);
    });

    test('php block inside raw echo', () => {
        const source = '{!! $html @php echo "test"; @endphp !!}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);
        expect(result.tokens.length).toBeGreaterThan(0);
    });

    test('verbatim block inside triple echo', () => {
        const source = '{{{ $var @verbatim test @endverbatim }}}';
        const result = tokenize(source, Directives.withDefaults());

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toBe(ErrorReason.ConstructCollision);
        expect(result.tokens.length).toBeGreaterThan(0);
    });
});
