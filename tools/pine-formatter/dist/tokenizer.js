"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenize = tokenize;
// ─── Pine Script v6 vocabulary ────────────────────────────────────────────────
const KEYWORDS = new Set([
    'if', 'else', 'for', 'in', 'to', 'by', 'while', 'switch', 'break',
    'continue', 'return', 'var', 'varip', 'type', 'enum', 'method',
    'import', 'export', 'true', 'false', 'na', 'and', 'or', 'not',
    'indicator', 'strategy', 'library', 'series', 'simple', 'const',
]);
const TYPE_KEYWORDS = new Set([
    'float', 'int', 'bool', 'string', 'color', 'line', 'label', 'box',
    'array', 'matrix', 'map', 'table',
]);
const MULTI_CHAR_OPS = [
    ':=', '=>', '==', '!=', '<=', '>=',
    '+=', '-=', '*=', '/=', '%=',
];
// ─── Tokenizer ────────────────────────────────────────────────────────────────
/**
 * Tokenizes Pine Script v6 source into a flat token array.
 *
 * Strings and comments are emitted as single opaque tokens so the formatter
 * never inspects or modifies their contents.
 */
function tokenize(source) {
    const tokens = [];
    let pos = 0;
    const peek = (offset = 0) => source[pos + offset] ?? '';
    const consume = () => source[pos++];
    while (pos < source.length) {
        const start = pos;
        const ch = peek();
        // ── Newline ───────────────────────────────────────────────────────────
        if (ch === '\n') {
            consume();
            tokens.push({ kind: 'newline', value: '\n', pos: start });
            continue;
        }
        // CR — skip (treat CRLF as LF only)
        if (ch === '\r') {
            consume();
            continue;
        }
        // ── Whitespace ────────────────────────────────────────────────────────
        if (ch === ' ' || ch === '\t') {
            let ws = '';
            while (pos < source.length && (peek() === ' ' || peek() === '\t')) {
                ws += consume();
            }
            tokens.push({ kind: 'whitespace', value: ws, pos: start });
            continue;
        }
        // ── Line comment (//) ─────────────────────────────────────────────────
        if (ch === '/' && peek(1) === '/') {
            let comment = '';
            while (pos < source.length && peek() !== '\n') {
                comment += consume();
            }
            tokens.push({ kind: 'comment', value: comment, pos: start });
            continue;
        }
        // ── String literal ────────────────────────────────────────────────────
        if (ch === '"' || ch === "'") {
            const quote = ch;
            let str = consume(); // opening quote
            while (pos < source.length) {
                const c = peek();
                if (c === '\n')
                    break; // unterminated string — stop at EOL
                if (c === '\\') {
                    str += consume(); // backslash
                    if (pos < source.length)
                        str += consume(); // escaped char
                }
                else {
                    str += consume();
                    if (c === quote)
                        break; // closing quote found
                }
            }
            tokens.push({ kind: 'string', value: str, pos: start });
            continue;
        }
        // ── Number literal ────────────────────────────────────────────────────
        if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(peek(1)))) {
            let num = '';
            // Integer part
            while (pos < source.length && /[0-9]/.test(peek())) {
                num += consume();
            }
            // Decimal part
            if (peek() === '.' && /[0-9]/.test(peek(1))) {
                num += consume(); // dot
                while (pos < source.length && /[0-9]/.test(peek())) {
                    num += consume();
                }
            }
            // Scientific notation
            if (peek() === 'e' || peek() === 'E') {
                num += consume();
                if (peek() === '+' || peek() === '-')
                    num += consume();
                while (pos < source.length && /[0-9]/.test(peek())) {
                    num += consume();
                }
            }
            tokens.push({ kind: 'number', value: num, pos: start });
            continue;
        }
        // ── Identifier / keyword / type ───────────────────────────────────────
        if (/[a-zA-Z_]/.test(ch)) {
            let ident = '';
            while (pos < source.length && /[a-zA-Z0-9_]/.test(peek())) {
                ident += consume();
            }
            const kind = KEYWORDS.has(ident)
                ? 'keyword'
                : TYPE_KEYWORDS.has(ident)
                    ? 'type_keyword'
                    : 'identifier';
            tokens.push({ kind, value: ident, pos: start });
            continue;
        }
        // ── Multi-character operators ─────────────────────────────────────────
        const twoChar = source.slice(pos, pos + 2);
        if (MULTI_CHAR_OPS.includes(twoChar)) {
            tokens.push({ kind: 'operator', value: twoChar, pos: start });
            pos += 2;
            continue;
        }
        // ── Single-character operators ────────────────────────────────────────
        if ('+-*/%<>!?:'.includes(ch)) {
            tokens.push({ kind: 'operator', value: consume(), pos: start });
            continue;
        }
        // ── Grouping & punctuation ────────────────────────────────────────────
        if (ch === '(') {
            tokens.push({ kind: 'paren_open', value: consume(), pos: start });
            continue;
        }
        if (ch === ')') {
            tokens.push({ kind: 'paren_close', value: consume(), pos: start });
            continue;
        }
        if (ch === '[') {
            tokens.push({ kind: 'bracket_open', value: consume(), pos: start });
            continue;
        }
        if (ch === ']') {
            tokens.push({ kind: 'bracket_close', value: consume(), pos: start });
            continue;
        }
        if (ch === ',') {
            tokens.push({ kind: 'comma', value: consume(), pos: start });
            continue;
        }
        // ── Anything else (., @, ;, …) ───────────────────────────────────────
        tokens.push({ kind: 'unknown', value: consume(), pos: start });
    }
    return tokens;
}
//# sourceMappingURL=tokenizer.js.map