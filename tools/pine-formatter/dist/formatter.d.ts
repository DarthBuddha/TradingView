import { FormatOptions } from './types';
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
export declare function format(source: string, opts?: Partial<FormatOptions>): string;
//# sourceMappingURL=formatter.d.ts.map