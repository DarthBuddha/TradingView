"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = format;
const types_1 = require("./types");
const indent_1 = require("./rules/indent");
const wrap_1 = require("./rules/wrap");
// ─── Internal helpers ─────────────────────────────────────────────────────────
/** Net paren/bracket depth change across a line (skips strings and comments). */
function lineDepthChange(line) {
    return (0, wrap_1.netDepthChange)(line);
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
function format(source, opts = {}) {
    const options = { ...types_1.DEFAULT_OPTIONS, ...opts };
    const physicalLines = source.split('\n');
    // ── Pass 1: Normalize indentation ────────────────────────────────────────
    const stage1 = [];
    let parenDepth = 0;
    let bracketDepth = 0;
    for (const rawLine of physicalLines) {
        const stripped = rawLine.trimStart();
        const leadingSpaces = rawLine.length - stripped.length;
        const isContinuation = parenDepth > 0 || bracketDepth > 0;
        const isEmpty = stripped === '';
        const isCommentOnly = stripped.startsWith('//');
        let outLine;
        if (isEmpty) {
            // Blank lines: preserve as empty (no trailing spaces)
            outLine = '';
        }
        else if (isContinuation || isCommentOnly) {
            // Inside open parens: free indentation — preserve exactly as-is.
            // Comment-only lines: indentation is meaningful for readability, preserve.
            outLine = rawLine;
        }
        else if (options.normalizeIndent) {
            // Block-level line: round indent to nearest multiple of indentSize.
            const normalized = (0, indent_1.normalizeBlockIndent)(leadingSpaces, options.indentSize);
            outLine = ' '.repeat(normalized) + stripped;
        }
        else {
            outLine = rawLine;
        }
        if (options.trimTrailingWhitespace) {
            outLine = outLine.trimEnd();
        }
        stage1.push(outLine);
        const change = lineDepthChange(rawLine);
        parenDepth = Math.max(0, parenDepth + change.netParens);
        bracketDepth = Math.max(0, bracketDepth + change.netBrackets);
    }
    // ── Pass 2: Wrap long lines ───────────────────────────────────────────────
    const output = [];
    parenDepth = 0;
    bracketDepth = 0;
    for (const line of stage1) {
        if (line.length > options.printWidth) {
            const wrapped = (0, wrap_1.wrapLine)(line, options, parenDepth, bracketDepth);
            output.push(...wrapped);
            for (const wl of wrapped) {
                const change = lineDepthChange(wl);
                parenDepth = Math.max(0, parenDepth + change.netParens);
                bracketDepth = Math.max(0, bracketDepth + change.netBrackets);
            }
        }
        else {
            output.push(line);
            const change = lineDepthChange(line);
            parenDepth = Math.max(0, parenDepth + change.netParens);
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
//# sourceMappingURL=formatter.js.map