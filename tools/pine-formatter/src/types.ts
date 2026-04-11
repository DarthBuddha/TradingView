/**
 * Pine Script v6 Formatter — Shared Types
 *
 * Key Pine v6 indentation rules (December 2025 update):
 *   - Block code must be indented in multiples of 4.
 *   - Continuation lines INSIDE parentheses may use any indentation (zero or more spaces).
 *   - Continuation lines OUTSIDE parentheses must NOT start at a multiple-of-4 indentation.
 */

// ─── Formatting Options ───────────────────────────────────────────────────────

export interface FormatOptions {
    /** Maximum line width before wrapping. Default: 120 */
    printWidth: number;

    /**
     * Block indentation size in spaces. Pine Script requires 4.
     * Default: 4
     */
    indentSize: number;

    /**
     * Extra spaces added to block indentation for non-parenthesized line continuations.
     *
     * Pine v6 rule: the total continuation indent must NOT be a multiple of 4.
     * Since block indents are always multiples of 4, adding any value where
     * (extra % 4 !== 0) produces a safe result. Default: 2 (always safe).
     */
    continuationIndent: number;

    /**
     * When true, round each block-level line's leading indentation to the
     * nearest multiple of `indentSize`. Default: true
     */
    normalizeIndent: boolean;

    /** Trim trailing whitespace on all lines. Default: true */
    trimTrailingWhitespace: boolean;
}

export const DEFAULT_OPTIONS: FormatOptions = {
    printWidth: 120,
    indentSize: 4,
    continuationIndent: 2,
    normalizeIndent: true,
    trimTrailingWhitespace: true,
};

// ─── Tokenizer ────────────────────────────────────────────────────────────────

export type TokenKind =
    | 'keyword'       // if, else, for, while, switch, var, varip, …
    | 'type_keyword'  // float, int, bool, string, color, line, …
    | 'identifier'    // user-defined names
    | 'number'        // numeric literals
    | 'string'        // quoted string literals (single or double quote)
    | 'operator'      // :=, =>, ==, !=, +, -, *, /, …
    | 'paren_open'    // (
    | 'paren_close'   // )
    | 'bracket_open'  // [
    | 'bracket_close' // ]
    | 'comma'         // ,
    | 'comment'       // // line comment
    | 'whitespace'    // spaces / tabs
    | 'newline'       // \n
    | 'unknown';      // anything else (., ;, …)

export interface Token {
    kind: TokenKind;
    value: string;
    /** Character offset in the original source string. */
    pos: number;
}

// ─── Depth tracking ───────────────────────────────────────────────────────────

/** Net paren / bracket depth change for a single line of text. */
export interface DepthChange {
    netParens: number;
    netBrackets: number;
}
