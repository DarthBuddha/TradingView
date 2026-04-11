/**
 * Pine Script v6 indentation rules.
 *
 * Block code:         indentation must be a multiple of 4.
 * Non-paren wrap:     continuation indent must NOT be a multiple of 4.
 * Inside-paren wrap:  any indentation is valid (Pine v6 December 2025 update).
 */
/**
 * Rounds a space count to the nearest multiple of `indentSize` (default 4).
 * Used to normalize accidentally mis-indented block-level lines.
 */
export declare function normalizeBlockIndent(spaces: number, indentSize?: number): number;
/**
 * Computes a safe continuation indent for a line that wraps OUTSIDE parentheses.
 *
 * Pine v6 rule: the total indent must NOT be a multiple of 4.
 * Since block indents are always multiples of 4, we add `extra` spaces.
 * `extra` defaults to 2 — (multiple-of-4) + 2 is never a multiple of 4.
 *
 * Examples (indentSize = 4):
 *   block=0  + 2 = 2  ✓ (2 % 4 = 2)
 *   block=4  + 2 = 6  ✓ (6 % 4 = 2)
 *   block=8  + 2 = 10 ✓ (10 % 4 = 2)
 *   block=12 + 2 = 14 ✓ (14 % 4 = 2)
 */
export declare function safeContinuationIndent(blockIndent: number, extra?: number, indentSize?: number): number;
/**
 * Returns true when a non-paren-wrapped continuation has a Pine-valid indent.
 * Valid = NOT a multiple of 4.
 */
export declare function isValidContinuationIndent(indent: number, indentSize?: number): boolean;
//# sourceMappingURL=indent.d.ts.map