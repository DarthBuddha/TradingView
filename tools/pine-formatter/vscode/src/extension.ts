import * as vscode from 'vscode';

// The formatter source lives one level up in the monorepo (tools/pine-formatter/src/).
// vscode/tsconfig.json sets rootDir to ".." so both trees compile into vscode/out/:
//   vscode/out/src/formatter.js   ← from ../src/formatter.ts
//   vscode/out/vscode/src/extension.js ← from this file
// The relative import below resolves correctly in the compiled output.
import { format }      from '../../src/formatter';
import { FormatOptions } from '../../src/types';

// ─── Configuration helpers ────────────────────────────────────────────────────

function getFormatOptions(
    config: vscode.WorkspaceConfiguration,
): Partial<FormatOptions> {
    return {
        printWidth:         config.get<number>('printWidth',         120),
        indentSize:         config.get<number>('indentSize',          4),
        continuationIndent: config.get<number>('continuationIndent',  2),
        normalizeIndent:    config.get<boolean>('normalizeIndent',  true),
    };
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatDocument(
    document: vscode.TextDocument,
    config: vscode.WorkspaceConfiguration,
): vscode.TextEdit[] {
    const source    = document.getText();
    const options   = getFormatOptions(config);
    let formatted: string;

    try {
        formatted = format(source, options);
    } catch (err) {
        vscode.window.showErrorMessage(
            `Pine Formatter: ${(err as Error).message}`,
        );
        return [];
    }

    if (source === formatted) return [];

    const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(source.length),
    );
    return [vscode.TextEdit.replace(fullRange, formatted)];
}

function formatRange(
    document: vscode.TextDocument,
    range: vscode.Range,
    config: vscode.WorkspaceConfiguration,
): vscode.TextEdit[] {
    const source  = document.getText(range);
    const options = getFormatOptions(config);
    let formatted: string;

    try {
        formatted = format(source, options);
    } catch (err) {
        vscode.window.showErrorMessage(
            `Pine Formatter: ${(err as Error).message}`,
        );
        return [];
    }

    if (source === formatted) return [];
    return [vscode.TextEdit.replace(range, formatted)];
}

// ─── Extension lifecycle ──────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
    const selector: vscode.DocumentSelector = { language: 'pine' };

    // Full-document formatter
    const docFormatter = vscode.languages.registerDocumentFormattingEditProvider(
        selector,
        {
            provideDocumentFormattingEdits(
                document: vscode.TextDocument,
                _opts: vscode.FormattingOptions,
                _token: vscode.CancellationToken,
            ): vscode.TextEdit[] {
                const cfg = vscode.workspace.getConfiguration('pineFormatter');
                return formatDocument(document, cfg);
            },
        },
    );

    // Selection / range formatter
    const rangeFormatter = vscode.languages.registerDocumentRangeFormattingEditProvider(
        selector,
        {
            provideDocumentRangeFormattingEdits(
                document: vscode.TextDocument,
                range: vscode.Range,
                _opts: vscode.FormattingOptions,
                _token: vscode.CancellationToken,
            ): vscode.TextEdit[] {
                const cfg = vscode.workspace.getConfiguration('pineFormatter');
                return formatRange(document, range, cfg);
            },
        },
    );

    // Status bar item — visible when a .pine file is active
    const statusBar = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right, 100,
    );
    statusBar.text    = '$(symbol-ruler) Pine Fmt';
    statusBar.tooltip = 'Pine Script Formatter active (120-char, v6-safe)';

    const syncStatusBar = (editor: vscode.TextEditor | undefined): void => {
        if (editor?.document.languageId === 'pine') {
            statusBar.show();
        } else {
            statusBar.hide();
        }
    };

    context.subscriptions.push(
        docFormatter,
        rangeFormatter,
        statusBar,
        vscode.window.onDidChangeActiveTextEditor(syncStatusBar),
    );

    syncStatusBar(vscode.window.activeTextEditor);
}

export function deactivate(): void { /* nothing to clean up */ }
