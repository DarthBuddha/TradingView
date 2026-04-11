import { format } from '../src/formatter';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns indentation depth (leading space count) of the first non-empty line. */
function indentOf(s: string): number {
    const line = s.split('\n').find(l => l.trim() !== '') ?? '';
    return line.length - line.trimStart().length;
}

/** Returns the indentation of line at 0-based index (after trimEnd). */
function indentOfLine(formatted: string, lineIndex: number): number {
    const lines = formatted.trimEnd().split('\n');
    const line  = lines[lineIndex] ?? '';
    return line.length - line.trimStart().length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Indentation normalization
// ─────────────────────────────────────────────────────────────────────────────

describe('indentation normalization', () => {
    test('preserves correct 4-space block indent', () => {
        const input  = 'if cond\n    x := 1';
        const output = format(input);
        expect(output).toBe('if cond\n    x := 1\n');
    });

    test('rounds 2-space indent up to 4', () => {
        const input  = 'if cond\n  x := 1';
        const output = format(input);
        expect(indentOfLine(output, 1)).toBe(4);
    });

    test('rounds 6-space indent to nearest 4 (=8)', () => {
        const input  = 'if a\n    if b\n      x := 1'; // 6 spaces → 8
        const output = format(input);
        expect(indentOfLine(output, 2)).toBe(8);
    });

    test('preserves 8-space double-block indent', () => {
        const input  = 'if a\n    if b\n        x := 1';
        const output = format(input);
        expect(output).toBe('if a\n    if b\n        x := 1\n');
    });

    test('top-level line with 0 indent stays at 0', () => {
        const input  = 'x := 1';
        const output = format(input);
        expect(indentOfLine(output, 0)).toBe(0);
    });

    test('does not normalise lines inside open parentheses', () => {
        // Lines 1–3 are inside the `indicator(` paren — any indent is valid.
        const input = 'indicator(\n      title = "T",\n      overlay = true\n)';
        const output = format(input);
        // Continuation indent should be preserved exactly (6 spaces)
        expect(indentOfLine(output, 1)).toBe(6);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Trailing whitespace
// ─────────────────────────────────────────────────────────────────────────────

describe('trailing whitespace', () => {
    test('trims trailing spaces from code lines', () => {
        const output = format('x := 1   \ny := 2  ');
        expect(output).toBe('x := 1\ny := 2\n');
    });

    test('does not add trailing whitespace to blank lines', () => {
        const output = format('x := 1\n\ny := 2');
        const lines  = output.split('\n');
        expect(lines[1]).toBe('');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Empty lines
// ─────────────────────────────────────────────────────────────────────────────

describe('empty lines', () => {
    test('preserves blank separator lines', () => {
        const output = format('x := 1\n\ny := 2');
        expect(output).toContain('\n\n');
    });

    test('preserves multiple consecutive blank lines', () => {
        const output = format('x := 1\n\n\ny := 2');
        expect(output).toContain('\n\n\n');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Comment preservation
// ─────────────────────────────────────────────────────────────────────────────

describe('comment preservation', () => {
    test('preserves comment-only lines verbatim', () => {
        const input  = '// @version=6\nx := 1';
        const output = format(input);
        expect(output.split('\n')[0]).toBe('// @version=6');
    });

    test('preserves inline trailing comments', () => {
        const input  = 'x := 1 // value';
        const output = format(input);
        expect(output.trimEnd()).toBe('x := 1 // value');
    });

    test('does not count parens inside comments for depth tracking', () => {
        // If `(` in comment incorrectly increments depth, the next line would be treated
        // as a continuation (indent preserved rather than normalised).
        const input  = '// open paren (\nx := 1'; // 0 depth expected after comment line
        const output = format(input);
        expect(indentOfLine(output, 1)).toBe(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// String content is not modified
// ─────────────────────────────────────────────────────────────────────────────

describe('string content', () => {
    test('preserves spaces inside string literals', () => {
        const input  = "x := '  spaces  '";
        const output = format(input);
        expect(output).toContain("'  spaces  '");
    });

    test('does not count parens inside strings for depth tracking', () => {
        // '(' inside a string must not affect parenDepth
        const input  = "x := str.replace('(', ')', src)\ny := 1";
        const output = format(input);
        // y := 1 is still a top-level block-level line → indent 0
        expect(indentOfLine(output, 1)).toBe(0);
    });

    test('handles escaped quotes inside strings', () => {
        const input  = 'msg := "He said \\"hello\\""';
        const output = format(input);
        expect(output).toContain('\\"hello\\"');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Line wrapping
// ─────────────────────────────────────────────────────────────────────────────

describe('line wrapping', () => {
    test('does not wrap lines within printWidth', () => {
        const line   = 'x := ta.sma(close, 20)';
        const output = format(line, { printWidth: 120 });
        expect(output.trimEnd()).toBe(line);
    });

    test('wraps a function call at a comma when over printWidth', () => {
        const long = 'result := someFunction' +
            '(argument1, argument2, argument3, argument4, argument5, argument6)';
        const output = format(long, { printWidth: 60 });
        const lines  = output.trimEnd().split('\n');
        expect(lines.length).toBeGreaterThan(1);
        lines.forEach(l => expect(l.length).toBeLessThanOrEqual(60 + 20)); // allow some slack for last segment
    });

    test('first segment of a wrapped line is within printWidth', () => {
        const long = 'result := someFunction' +
            '(argument1, argument2, argument3, argument4, argument5, argument6)';
        const output = format(long, { printWidth: 60 });
        const first  = output.split('\n')[0];
        expect(first.length).toBeLessThanOrEqual(60);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pine v6 continuation indent rules
// ─────────────────────────────────────────────────────────────────────────────

describe('Pine v6 continuation indent rules', () => {
    test('non-paren continuation indent is NOT a multiple of 4', () => {
        // Force a non-paren wrap: expression with no open paren, > 60 chars
        const input = 'longVarName := someIdentifier + anotherIdentifierValue + ' +
            'yetMoreIdentifierValue + extraExtra';
        const output = format(input, { printWidth: 60 });
        const lines  = output.trimEnd().split('\n');

        if (lines.length > 1) {
            const indent = lines[1].length - lines[1].trimStart().length;
            expect(indent % 4).not.toBe(0);
        }
    });

    test('safeContinuationIndent never returns a multiple of 4', () => {
        const { safeContinuationIndent } = require('../src/rules/indent');
        // Test multiple base indent values (all multiples of 4)
        [0, 4, 8, 12, 16].forEach(base => {
            const result = safeContinuationIndent(base, 2, 4);
            expect(result % 4).not.toBe(0);
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Idempotency
// ─────────────────────────────────────────────────────────────────────────────

describe('idempotency', () => {
    test('formatting twice gives the same result as once', () => {
        const input = [
            '//@version=6',
            "indicator(title = 'Test', overlay = true)",
            '',
            'bool cond = close > open',
            'float val  = cond ? high : low',
            '',
            'if cond',
            '    val := high',
            '    if val > 100',
            '        val := 100',
        ].join('\n');

        const once  = format(input);
        const twice = format(once);
        expect(once).toBe(twice);
    });

    test('already-formatted source is returned unchanged', () => {
        const input = 'x := 1\ny := 2\n';
        expect(format(input)).toBe(input);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Trailing newline
// ─────────────────────────────────────────────────────────────────────────────

describe('trailing newline', () => {
    test('output always ends with exactly one newline', () => {
        expect(format('x := 1')).toMatch(/\n$/);
        expect(format('x := 1\n')).toMatch(/\n$/);
        expect(format('x := 1\n\n\n')).toMatch(/[^\n]\n$/);
    });
});
