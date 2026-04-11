#!/usr/bin/env node
import * as fs   from 'fs';
import * as path from 'path';
import { format }          from './formatter';
import { DEFAULT_OPTIONS, FormatOptions } from './types';

// ─── Argument parsing ─────────────────────────────────────────────────────────

interface CliOptions {
    check:      boolean;  // exit 1 if any file needs formatting
    write:      boolean;  // overwrite files in place
    printWidth: number;
    files:      string[];
}

function parseArgs(argv: string[]): CliOptions {
    const opts: CliOptions = {
        check:      false,
        write:      false,
        printWidth: DEFAULT_OPTIONS.printWidth,
        files:      [],
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        switch (arg) {
            case '--check':  opts.check = true;  break;
            case '--write':  opts.write = true;  break;
            case '--print-width':
            case '--printWidth':
                opts.printWidth = parseInt(argv[++i], 10);
                break;
            default:
                if (!arg.startsWith('-')) opts.files.push(arg);
        }
    }
    return opts;
}

// ─── File discovery ───────────────────────────────────────────────────────────

/** Recursively collects .pine files under a directory. */
function walkDir(dir: string, results: string[] = []): string[] {
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDir(full, results);
        } else if (entry.name.endsWith('.pine')) {
            results.push(full);
        }
    }
    return results;
}

/**
 * Resolves a file path or simple glob pattern to an array of .pine file paths.
 * Supports: exact paths, directories, and patterns ending in `*` / `**\/*.pine`.
 */
function resolvePattern(pattern: string): string[] {
    if (!pattern.includes('*')) {
        if (!fs.existsSync(pattern)) return [];
        const stat = fs.statSync(pattern);
        return stat.isDirectory() ? walkDir(pattern) : [pattern];
    }
    // Glob: walk from the portion before the first wildcard
    const base = pattern.split(/[*?]/)[0].replace(/[\\/]+$/, '') || '.';
    return walkDir(base).filter(f => f.endsWith('.pine'));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
    const cliOpts = parseArgs(process.argv.slice(2));

    if (cliOpts.files.length === 0) {
        console.error(
            'Usage: pine-format [--check] [--write] [--print-width N] <file.pine|dir|glob> ...',
        );
        process.exit(1);
    }

    const files = cliOpts.files.flatMap(resolvePattern);

    if (files.length === 0) {
        console.error('No .pine files found matching the provided patterns.');
        process.exit(1);
    }

    const fmtOpts: Partial<FormatOptions> = { printWidth: cliOpts.printWidth };
    let hasChanges = false;

    for (const file of files) {
        let source: string;
        try {
            source = fs.readFileSync(file, 'utf8');
        } catch (err) {
            console.error(`Cannot read ${file}: ${(err as Error).message}`);
            continue;
        }

        let formatted: string;
        try {
            formatted = format(source, fmtOpts);
        } catch (err) {
            console.error(`Error formatting ${file}: ${(err as Error).message}`);
            continue;
        }

        if (source === formatted) {
            if (!cliOpts.check) console.log(`  ok  ${file}`);
        } else {
            hasChanges = true;
            if (cliOpts.check) {
                console.warn(` FAIL ${file}  (needs formatting)`);
            } else if (cliOpts.write) {
                fs.writeFileSync(file, formatted, 'utf8');
                console.log(` fmt  ${file}`);
            } else {
                // Default: print the formatted result to stdout
                process.stdout.write(formatted);
            }
        }
    }

    if (cliOpts.check && hasChanges) {
        process.exit(1);
    }
}

main();
