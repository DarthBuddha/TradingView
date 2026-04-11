#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const formatter_1 = require("./formatter");
const types_1 = require("./types");
function parseArgs(argv) {
    const opts = {
        check: false,
        write: false,
        printWidth: types_1.DEFAULT_OPTIONS.printWidth,
        files: [],
    };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        switch (arg) {
            case '--check':
                opts.check = true;
                break;
            case '--write':
                opts.write = true;
                break;
            case '--print-width':
            case '--printWidth':
                opts.printWidth = parseInt(argv[++i], 10);
                break;
            default:
                if (!arg.startsWith('-'))
                    opts.files.push(arg);
        }
    }
    return opts;
}
// ─── File discovery ───────────────────────────────────────────────────────────
/** Recursively collects .pine files under a directory. */
function walkDir(dir, results = []) {
    if (!fs.existsSync(dir))
        return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDir(full, results);
        }
        else if (entry.name.endsWith('.pine')) {
            results.push(full);
        }
    }
    return results;
}
/**
 * Resolves a file path or simple glob pattern to an array of .pine file paths.
 * Supports: exact paths, directories, and patterns ending in `*` / `**\/*.pine`.
 */
function resolvePattern(pattern) {
    if (!pattern.includes('*')) {
        if (!fs.existsSync(pattern))
            return [];
        const stat = fs.statSync(pattern);
        return stat.isDirectory() ? walkDir(pattern) : [pattern];
    }
    // Glob: walk from the portion before the first wildcard
    const base = pattern.split(/[*?]/)[0].replace(/[\\/]+$/, '') || '.';
    return walkDir(base).filter(f => f.endsWith('.pine'));
}
// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
    const cliOpts = parseArgs(process.argv.slice(2));
    if (cliOpts.files.length === 0) {
        console.error('Usage: pine-format [--check] [--write] [--print-width N] <file.pine|dir|glob> ...');
        process.exit(1);
    }
    const files = cliOpts.files.flatMap(resolvePattern);
    if (files.length === 0) {
        console.error('No .pine files found matching the provided patterns.');
        process.exit(1);
    }
    const fmtOpts = { printWidth: cliOpts.printWidth };
    let hasChanges = false;
    for (const file of files) {
        let source;
        try {
            source = fs.readFileSync(file, 'utf8');
        }
        catch (err) {
            console.error(`Cannot read ${file}: ${err.message}`);
            continue;
        }
        let formatted;
        try {
            formatted = (0, formatter_1.format)(source, fmtOpts);
        }
        catch (err) {
            console.error(`Error formatting ${file}: ${err.message}`);
            continue;
        }
        if (source === formatted) {
            if (!cliOpts.check)
                console.log(`  ok  ${file}`);
        }
        else {
            hasChanges = true;
            if (cliOpts.check) {
                console.warn(` FAIL ${file}  (needs formatting)`);
            }
            else if (cliOpts.write) {
                fs.writeFileSync(file, formatted, 'utf8');
                console.log(` fmt  ${file}`);
            }
            else {
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
//# sourceMappingURL=cli.js.map