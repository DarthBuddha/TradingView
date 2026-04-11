"use strict";
/**
 * Pine Script v6 Formatter — Shared Types
 *
 * Key Pine v6 indentation rules (December 2025 update):
 *   - Block code must be indented in multiples of 4.
 *   - Continuation lines INSIDE parentheses may use any indentation (zero or more spaces).
 *   - Continuation lines OUTSIDE parentheses must NOT start at a multiple-of-4 indentation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_OPTIONS = void 0;
exports.DEFAULT_OPTIONS = {
    printWidth: 120,
    indentSize: 4,
    continuationIndent: 2,
    normalizeIndent: true,
    trimTrailingWhitespace: true,
};
//# sourceMappingURL=types.js.map