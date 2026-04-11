import { FormatOptions } from '../types';
import { safeContinuationIndent } from './indent';

// ─── Wrap point discovery ─────────────────────────────────────────────────────

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
export function findWrapPoints(
    line: string,
    startParenDepth = 0,
    startBracketDepth = 0,
): WrapPoint[] {
    const points: WrapPoint[] = [];
    let parenDepth   = startParenDepth;
    let bracketDepth = startBracketDepth;
    let inString: string | null = null;

    for (let i = 0; i < line.length; i++) {
        const ch   = line[i];
        const next = line[i + 1] ?? '';
        const prev = line[i - 1] ?? '';

        // ── String handling ───────────────────────────────────────────────────
        if (inString) {
            if (ch === '\\') { i++; continue; } // skip escaped char
            if (ch === inString) inString = null;
            continue;
        }
        if (ch === '"' || ch === "'") { inString = ch; continue; }

        // ── Comment — nothing past here is code ───────────────────────────────
        if (ch === '/' && next === '/') break;

        // ── Depth tracking ────────────────────────────────────────────────────
        if (ch === '(') { parenDepth++;   continue; }
        if (ch === ')') { parenDepth--;   continue; }
        if (ch === '[') { bracketDepth++; continue; }
        if (ch === ']') { bracketDepth--; continue; }

        const insideParens = parenDepth > 0 || bracketDepth > 0;

        // ── Wrap after a comma (function arguments) ───────────────────────────
        if (ch === ',') {
            points.push({ index: i + 1, insideParens, reason: 'comma' });
            continue;
        }

        // ── Ternary ? — wrap BEFORE ───────────────────────────────────────────
        // Exclude ?. (null-coalescing in other languages; rare in Pine but safe to skip)
        if (ch === '?' && next !== '.') {
            points.push({ index: i, insideParens, reason: 'ternary-q' });
            continue;
        }

        // ── Ternary : — wrap BEFORE (exclude := and =>  and ::) ──────────────
        if (
            ch === ':'
            && next !== '='
            && prev !== '='
            && prev !== '>'
            && next !== ':'
        ) {
            points.push({ index: i, insideParens, reason: 'ternary-colon' });
            continue;
        }

        // ── Boolean `and` / `or` keywords — wrap BEFORE ──────────────────────
        // Match the start of a keyword at a word boundary.
        if (ch === 'a' && line.slice(i, i + 4) === 'and ' && /\s/.test(prev)) {
            points.push({ index: i, insideParens, reason: 'bool-and' });
        }
        if (ch === 'o' && line.slice(i, i + 3) === 'or ' && /\s/.test(prev)) {
            points.push({ index: i, insideParens, reason: 'bool-or' });
        }
    }

    return points;
}

// ─── Net depth calculator ─────────────────────────────────────────────────────

/**
 * Returns the net change in paren and bracket depth for a text segment.
 * Skips string interiors and comments.
 */
export function netDepthChange(text: string): { netParens: number; netBrackets: number } {
    let netParens   = 0;
    let netBrackets = 0;
    let inString: string | null = null;

    for (let i = 0; i < text.length; i++) {
        const ch   = text[i];
        const next = text[i + 1] ?? '';

        if (inString) {
            if (ch === '\\') { i++; continue; }
            if (ch === inString) inString = null;
            continue;
        }
        if (ch === '"' || ch === "'") { inString = ch; continue; }
        if (ch === '/' && next === '/') break;

        if (ch === '(') netParens++;
        if (ch === ')') netParens--;
        if (ch === '[') netBrackets++;
        if (ch === ']') netBrackets--;
    }

    return { netParens, netBrackets };
}

// ─── Line wrapper ─────────────────────────────────────────────────────────────

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
export function wrapLine(
    line: string,
    options: FormatOptions,
    startParenDepth = 0,
    startBracketDepth = 0,
): string[] {
    if (line.length <= options.printWidth) return [line];

    const leadingSpaces = line.length - line.trimStart().length;
    const wrapPoints    = findWrapPoints(line, startParenDepth, startBracketDepth);

    // Prefer the rightmost wrap point that keeps part1 within printWidth.
    let best: WrapPoint | null = null;
    for (const point of wrapPoints) {
        if (point.index <= options.printWidth) {
            best = point;
        }
    }

    // Fallback: use the first wrap point even if part1 still exceeds limit.
    if (!best && wrapPoints.length > 0) {
        best = wrapPoints[0];
    }

    // No wrap point found — cannot shorten this line.
    if (!best) return [line];

    const part1 = line.slice(0, best.index).trimEnd();
    const rest  = line.slice(best.index).trimStart();

    // Compute continuation indent based on paren context.
    const continuationIndent = best.insideParens
        // Inside parens: free indentation.  +6 gives clear visual separation.
        ? leadingSpaces + 6
        // Outside parens: must NOT be a multiple of 4.
        : safeContinuationIndent(leadingSpaces, options.continuationIndent, options.indentSize);

    const continuation = ' '.repeat(continuationIndent) + rest;

    // Track depth up to the wrap point for the recursive call.
    const { netParens, netBrackets } = netDepthChange(part1);

    return [
        part1,
        ...wrapLine(
            continuation,
            options,
            Math.max(0, startParenDepth + netParens),
            Math.max(0, startBracketDepth + netBrackets),
        ),
    ];
}
