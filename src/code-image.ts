import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { CodeLanguage } from './types/language';
import { getRemoteImageUrl, mapLanguageId, showMessage } from './utils';

const readHtml = async (htmlPath: string, panel: vscode.WebviewPanel) =>
    (fs.readFileSync(htmlPath, {
        encoding: 'utf8'
    }))
      .replace(/%CSP_SOURCE%/gu, panel.webview.cspSource)
      .replace(
        /(src|href)="([^"]*)"/gu,
        (_, type, src) =>
          `${type}="${panel.webview.asWebviewUri(
            vscode.Uri.file(path.resolve(htmlPath, '../../../', src))
          )}"`
      );

export class CodeImagePanel {
    public static currentPanel: CodeImagePanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionContext: vscode.ExtensionContext;
    private _disposables: vscode.Disposable[] = [];
    private _selectionChangeDisposable: vscode.Disposable | undefined;
    private _languages: CodeLanguage[] = [];  // 保存支持的语言列表

    private constructor(panel: vscode.WebviewPanel, extensionContext: vscode.ExtensionContext) {
        this._panel = panel;
        this._extensionContext = extensionContext;

        // 只在构造函数中设置一次消息监听
        this._update();

        // 监听面板关闭事件
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // 监听编辑器选择变化
        this._startListeningForSelectionChanges();
    }

    private _startListeningForSelectionChanges() {
        // 释放旧的监听器（如果存在）
        if (this._selectionChangeDisposable) {
            this._selectionChangeDisposable.dispose();
        }

        // 设置新的监听器
        this._selectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection(async (e) => {
            const editor = vscode.window.activeTextEditor;
            if (editor && !editor.selection.isEmpty) {
                const code = editor.document.getText(editor.selection);
                const language = editor.document.languageId;
                const fileName = path.basename(editor.document.fileName);
                const remoteImageUrl = getRemoteImageUrl(code, language);

                // 更新面板内容，使用保存的语言列表
                await this.setContent(code, language, {
                    languages: this._languages,
                    remoteImageUrl,
                    fileName
                });
            }
        });

        // 添加到待释放列表
        this._disposables.push(this._selectionChangeDisposable);
    }

    public static async createOrShow(
        extensionContext: vscode.ExtensionContext,
        code: string,
        language: string,
        options: {
            remoteImageUrl: string;
            fileName: string;
            languages: CodeLanguage[];
        }
    ) {
        // 如果已经有面板了，就更新它的内容而不是只显示
        if (CodeImagePanel.currentPanel) {
            CodeImagePanel.currentPanel._panel.reveal(vscode.ViewColumn.Beside);
            // 保存语言列表
            CodeImagePanel.currentPanel._languages = options.languages;
            // 更新内容
            await CodeImagePanel.currentPanel.setContent(code, language, options);
            return;
        }

        // 否则，创建一个新面板
        const panel = vscode.window.createWebviewPanel(
            'codeImage',
            'Code Snippet Image',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionContext.extensionUri),
                ]
            }
        );

        CodeImagePanel.currentPanel = new CodeImagePanel(panel, extensionContext);
        // 保存语言列表
        CodeImagePanel.currentPanel._languages = options.languages;
        await CodeImagePanel.currentPanel.setContent(code, language, options);
    }

    private async _update() {
        // 设置消息监听
        this._panel.webview.onDidReceiveMessage(
            async message => {
                try {
                    switch (message.command) {
                        case 'downloadImage':
                            await this._handleDownloadImage(message.data);
                            break;

                        case 'info':
                            showMessage(message.text);
                            break;

                        case 'openExternal':
                            vscode.env.openExternal(vscode.Uri.parse(message.url));
                            break;

                        case 'error':
                            showMessage(message.text, 'error');
                            break;
                    }
                } catch (error) {
                    showMessage(vscode.l10n.t('Error: {0}', error instanceof Error ? error.message : String(error)), 'error');
                }
            },
            undefined,
            this._disposables
        );
    }

    private async _handleDownloadImage(imageData: string) {
        try {
            const data = imageData.replace(/^data:image\/png;base64,/, '');
            const defaultPath = path.join(os.homedir(), 'Downloads', 'code-image.png');
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(defaultPath),
                filters: {
                    'Images': ['png']
                }
            });
            if (saveUri) {
                fs.writeFileSync(saveUri.fsPath, Buffer.from(data, 'base64'));
                showMessage(vscode.l10n.t('Image saved'));
            }
        } catch (error) {
            showMessage(vscode.l10n.t('Error saving image: {0}', error instanceof Error ? error.message : String(error)), 'error');
        }
    }

    public async setContent(
        code: string,
        language: string,
        options: {
            languages: CodeLanguage[];
            remoteImageUrl: string;
            fileName: string;
        }
    ) {
        this._panel.webview.html = await this._getHtmlContent(code, mapLanguageId(language), options);
    }

    private async _getHtmlContent(
        code: string,
        language: string,
        options: {
            languages: CodeLanguage[];
            remoteImageUrl: string;
            fileName: string;
        }
    ): Promise<string> {
        const { languages } = options;

        // 检查语言是否在支持列表中，如果不在则使用 text
        const isLanguageSupported = languages.some(lang => lang.id === language);
        const defaultLanguage = isLanguageSupported ? language : 'plaintext';
        const allLanguages = languages;
        const languageOptions = allLanguages
            .map((lang) => ({
                id: lang.id,
                label: lang.name,
                value: lang.id,
                selected: lang.id === defaultLanguage
            }))

        // 读取HTML模板
        let htmlTemplate = await readHtml(
            path.resolve(this._extensionContext.extensionPath, 'resources/webview/index.html'),
            this._panel
        );

        const baseUrl = this._panel.webview.asWebviewUri(vscode.Uri.file(path.resolve(this._extensionContext.extensionPath))).toString();

        // 替换占位符
        htmlTemplate = htmlTemplate
            .replace(/%LANGUAGE_OPTIONS%/g, JSON.stringify(languageOptions))
            .replace(/%LANGUAGE%/g, language)
            .replace(/%DEFAULT_LANGUAGE%/g, defaultLanguage)
            .replace(/%CODE%/g, encodeURIComponent(code))
            .replace(/%COPY_IMAGE_TEXT%/g, vscode.l10n.t('Copy Image'))
            .replace(/%DOWNLOAD_IMAGE_TEXT%/g, vscode.l10n.t('Download Image'))
            .replace(/%CODE_SNIPPET_TEXT%/g, options.fileName)
            .replace(/%COPIED_TEXT%/g, vscode.l10n.t('Image copied to clipboard'))
            .replace(/%COPY_ERROR_TEXT%/g, vscode.l10n.t('Error copying image'))
            .replace(/%REMOTE_IMAGE_URL%/g, options.remoteImageUrl)
            .replace(/%BASE_URL%/g, baseUrl)
            .replace(/%OPEN_REMOTE_IMAGE_TEXT%/g, vscode.l10n.t('Open in Ray.so'));

        return htmlTemplate;
    }

    public dispose() {
        CodeImagePanel.currentPanel = undefined;

        // 清理资源
        this._panel.dispose();

        // 释放选择变化监听器
        if (this._selectionChangeDisposable) {
            this._selectionChangeDisposable.dispose();
        }

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
