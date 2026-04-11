import { FormatOptions } from '../types';
export interface WrapPoint {
    /** Index in the line string where the break should be inserted. */
    index: number;
    /** True when the wrap point sits inside an open parenthesis or bracket. */
    insideParens: boolean;
    /** Human-readable reason, useful for debugging. */
    reason: 'comma' | 'ternary-q' | 'ternary-colon' | 'bool-and' | 'bool-or';
}
/**
 * Scans a line left-to-right for candidate wrap points, respecting:
 *   - String boundaries (single and double quote, with escape handling)
 *   - Line-comment boundaries (// stops scanning)
 *   - Parenthesis / bracket depth
 *
 * Returns all found wrap points in order of appearance.
 */
export declare function findWrapPoints(line: string, startParenDepth?: number, startBracketDepth?: number): WrapPoint[];
/**
 * Returns the net change in paren and bracket depth for a text segment.
 * Skips string interiors and comments.
 */
export declare function netDepthChange(text: string): {
    netParens: number;
    netBrackets: number;
};
/**
 * Wraps a single line that exceeds `options.printWidth`.
 *
 * Returns an array of lines (may recurse if the remainder is still too long).
 *
 * Pine v6 wrapping rules applied:
 *   - Inside parentheses: continuation indent is free — uses `leadingSpaces + 6`
 *     for readability (6 is always non-multiple-of-4, but that doesn't matter here).
 *   - Outside parentheses: continuation indent MUST NOT be a multiple of 4.
 *     Uses `safeContinuationIndent(leadingSpaces, options.continuationIndent)`.
 */
export declare function wrapLine(line: string, options: FormatOptions, startParenDepth?: number, startBracketDepth?: number): string[];
//# sourceMappingURL=wrap.d.ts.map