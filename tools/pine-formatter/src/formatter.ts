import { FormatOptions, DEFAULT_OPTIONS, DepthChange } from './types';
import { normalizeBlockIndent } from './rules/indent';
import { wrapLine, netDepthChange } from './rules/wrap';

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Net paren/bracket depth change across a line (skips strings and comments). */
function lineDepthChange(line: string): DepthChange {
    return netDepthChange(line);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Formats Pine Script v6 source applying TradingView-safe style rules:
 *
 * Pass 1 — Indentation normalization:
 *   - Block-level lines are re-indented to the nearest multiple of `indentSize` (4).
 *   - Lines that are continuations inside open parentheses are left exactly as-is
 *     (Pine v6 December 2025: any indentation is valid inside parentheses).
 *   - Trailing whitespace is trimmed.
 *
 * Pass 2 — Line wrapping:
 *   - Lines exceeding `printWidth` (default 120) are wrapped at safe break points
 *     (commas, ternary operators, boolean keywords).
 *   - Inside-paren continuations use `leadingSpaces + 6` for readability.
 *   - Non-paren continuations use `safeContinuationIndent` — never a multiple of 4.
 */
export function format(source: string, opts: Partial<FormatOptions> = {}): string {
    const options: FormatOptions = { ...DEFAULT_OPTIONS, ...opts };
    const physicalLines = source.split('\n');

    // ── Pass 1: Normalize indentation ────────────────────────────────────────

    const stage1: string[] = [];
    let parenDepth   = 0;
    let bracketDepth = 0;

    for (const rawLine of physicalLines) {
        const stripped       = rawLine.trimStart();
        const leadingSpaces  = rawLine.length - stripped.length;
        const isContinuation = parenDepth > 0 || bracketDepth > 0;
        const isEmpty        = stripped === '';
        const isCommentOnly  = stripped.startsWith('//');
        // Lines that start with a continuation-operator are non-paren continuations.
        // Normalising them to a multiple of 4 would break Pine v6 syntax rules, so
        // preserve their indentation exactly, same as paren-depth continuations.
        const isOpContinuation =
            (stripped.startsWith('?') && stripped[1] !== '.') ||    // ternary ?
            (stripped.startsWith(':') && stripped[1] !== '=') ||    // ternary : (not :=)
            /^(and|or)\s/.test(stripped);                           // boolean keywords

        let outLine: string;

        if (isEmpty) {
            // Blank lines: preserve as empty (no trailing spaces)
            outLine = '';
        } else if (isContinuation || isCommentOnly || isOpContinuation) {
            // Inside open parens: free indentation — preserve exactly as-is.
            // Comment-only lines: indentation is meaningful for readability, preserve.
            // Operator-continuation lines (?, :, and, or): must NOT be a multiple of 4
            // per Pine v6 rules — preserve whatever the author wrote.
            outLine = rawLine;
        } else if (options.normalizeIndent) {
            // Block-level line: round indent to nearest multiple of indentSize.
            const normalized = normalizeBlockIndent(leadingSpaces, options.indentSize);
            outLine = ' '.repeat(normalized) + stripped;
        } else {
            outLine = rawLine;
        }

        if (options.trimTrailingWhitespace) {
            outLine = outLine.trimEnd();
        }

        stage1.push(outLine);

        const change = lineDepthChange(rawLine);
        parenDepth   = Math.max(0, parenDepth   + change.netParens);
        bracketDepth = Math.max(0, bracketDepth + change.netBrackets);
    }

    // ── Pass 2: Wrap long lines ───────────────────────────────────────────────

    const output: string[] = [];
    parenDepth   = 0;
    bracketDepth = 0;

    for (const line of stage1) {
        if (line.length > options.printWidth) {
            const wrapped = wrapLine(line, options, parenDepth, bracketDepth);
            output.push(...wrapped);
            for (const wl of wrapped) {
                const change = lineDepthChange(wl);
                parenDepth   = Math.max(0, parenDepth   + change.netParens);
                bracketDepth = Math.max(0, bracketDepth + change.netBrackets);
            }
        } else {
            output.push(line);
            const change = lineDepthChange(line);
            parenDepth   = Math.max(0, parenDepth   + change.netParens);
            bracketDepth = Math.max(0, bracketDepth + change.netBrackets);
        }
    }

    // ── Ensure single trailing newline ────────────────────────────────────────

    while (output.length > 0 && output[output.length - 1] === '') {
        output.pop();
    }
    output.push('');

    return output.join('\n');
}
