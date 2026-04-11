import { Token } from './types';
/**
 * Tokenizes Pine Script v6 source into a flat token array.
 *
 * Strings and comments are emitted as single opaque tokens so the formatter
 * never inspects or modifies their contents.
 */
export declare function tokenize(source: string): Token[];
//# sourceMappingURL=tokenizer.d.ts.map