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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
// The formatter source lives one level up in the monorepo (tools/pine-formatter/src/).
// vscode/tsconfig.json sets rootDir to ".." so both trees compile into vscode/out/:
//   vscode/out/src/formatter.js   ← from ../src/formatter.ts
//   vscode/out/vscode/src/extension.js ← from this file
// The relative import below resolves correctly in the compiled output.
const formatter_1 = require("../../src/formatter");
// ─── Configuration helpers ────────────────────────────────────────────────────
function getFormatOptions(config) {
    return {
        printWidth: config.get('printWidth', 120),
        indentSize: config.get('indentSize', 4),
        continuationIndent: config.get('continuationIndent', 2),
        normalizeIndent: config.get('normalizeIndent', true),
    };
}
// ─── Format helpers ───────────────────────────────────────────────────────────
function formatDocument(document, config) {
    const source = document.getText();
    const options = getFormatOptions(config);
    let formatted;
    try {
        formatted = (0, formatter_1.format)(source, options);
    }
    catch (err) {
        vscode.window.showErrorMessage(`Pine Formatter: ${err.message}`);
        return [];
    }
    if (source === formatted)
        return [];
    const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(source.length));
    return [vscode.TextEdit.replace(fullRange, formatted)];
}
function formatRange(document, range, config) {
    const source = document.getText(range);
    const options = getFormatOptions(config);
    let formatted;
    try {
        formatted = (0, formatter_1.format)(source, options);
    }
    catch (err) {
        vscode.window.showErrorMessage(`Pine Formatter: ${err.message}`);
        return [];
    }
    if (source === formatted)
        return [];
    return [vscode.TextEdit.replace(range, formatted)];
}
// ─── Extension lifecycle ──────────────────────────────────────────────────────
function activate(context) {
    const selector = { language: 'pine' };
    // Full-document formatter
    const docFormatter = vscode.languages.registerDocumentFormattingEditProvider(selector, {
        provideDocumentFormattingEdits(document, _opts, _token) {
            const cfg = vscode.workspace.getConfiguration('pineFormatter');
            return formatDocument(document, cfg);
        },
    });
    // Selection / range formatter
    const rangeFormatter = vscode.languages.registerDocumentRangeFormattingEditProvider(selector, {
        provideDocumentRangeFormattingEdits(document, range, _opts, _token) {
            const cfg = vscode.workspace.getConfiguration('pineFormatter');
            return formatRange(document, range, cfg);
        },
    });
    // Status bar item — visible when a .pine file is active
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = '$(symbol-ruler) Pine Fmt';
    statusBar.tooltip = 'Pine Script Formatter active (120-char, v6-safe)';
    const syncStatusBar = (editor) => {
        if (editor?.document.languageId === 'pine') {
            statusBar.show();
        }
        else {
            statusBar.hide();
        }
    };
    context.subscriptions.push(docFormatter, rangeFormatter, statusBar, vscode.window.onDidChangeActiveTextEditor(syncStatusBar));
    syncStatusBar(vscode.window.activeTextEditor);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map