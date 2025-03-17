import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { CodeLanguage } from '../types/language';
import { showMessage } from '../utils';

const readHtml = async (htmlPath: string, panel: vscode.WebviewPanel) =>
    (fs.readFileSync(htmlPath, {
        encoding: 'utf8'
    }))
      .replace(/%CSP_SOURCE%/gu, panel.webview.cspSource)
      .replace(
        /(src|href)="([^"]*)"/gu,
        (_, type, src) =>
          `${type}="${panel.webview.asWebviewUri(
            vscode.Uri.file(path.resolve(htmlPath, '..', src))
          )}"`
      );
      
export class CodeImagePanel {
    public static currentPanel: CodeImagePanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionContext: vscode.ExtensionContext;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionContext: vscode.ExtensionContext) {
        this._panel = panel;
        this._extensionContext = extensionContext;

        // 设置 Webview 内容
        this._update();

        // 监听面板关闭事件
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public static async createOrShow(
        extensionContext: vscode.ExtensionContext,
        code: string,
        language: string,
        options: {
            languages: CodeLanguage[];
        }
    ) {
        // 如果已经有面板了，就显示它
        if (CodeImagePanel.currentPanel) {
            CodeImagePanel.currentPanel._panel.reveal(vscode.ViewColumn.Beside);
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
        }
    ) {
        this._panel.webview.html = await this._getHtmlContent(code, language, options);
        this._update(); // 重新设置消息监听器
    }

    private async _getHtmlContent(
        code: string,
        language: string,
        options: {
            languages: CodeLanguage[];
        }
    ): Promise<string> {
        const { languages } = options;
        // 检查语言是否在支持列表中，如果不在则使用 text
        const isLanguageSupported = languages.some(lang => lang.id === language);
        const defaultLanguage = isLanguageSupported ? language : 'text';

        // 生成语言选项，确保 text 选项始终存在
        const hasTextOption = languages.some(lang => lang.id === 'text');
        const allLanguages = hasTextOption ? languages : [...languages, { id: 'text', name: 'Plain Text' }];
        
        const languageOptions = allLanguages
            .map(lang => `<option value="${lang.id}"${lang.id === defaultLanguage ? ' selected' : ''}">${lang.name}</option>`)
            .join('\n');

        // 读取HTML模板
        let htmlTemplate =  await readHtml(
            path.resolve(this._extensionContext.extensionPath, 'src/webview/index.html'),
            this._panel
          );

        // 替换占位符
        htmlTemplate = htmlTemplate
            .replace(/%LANGUAGE_OPTIONS%/g, languageOptions)
            .replace(/%LANGUAGE%/g, language)
            .replace(/%DEFAULT_LANGUAGE%/g, defaultLanguage)
            .replace(/%CODE%/g, this._escapeHtml(code))
            .replace(/%COPY_IMAGE_TEXT%/g, vscode.l10n.t('Copy Image'))
            .replace(/%DOWNLOAD_IMAGE_TEXT%/g, vscode.l10n.t('Download Image'))
            .replace(/%CODE_SNIPPET_TEXT%/g, vscode.l10n.t('Code Snippet'))
            .replace(/%COPIED_TEXT%/g, vscode.l10n.t('Image copied to clipboard'))
            .replace(/%COPY_ERROR_TEXT%/g, vscode.l10n.t('Error copying image'));

        return htmlTemplate;
    }

    // 转义 HTML 特殊字符
    private _escapeHtml(text: string): string {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    public dispose() {
        CodeImagePanel.currentPanel = undefined;

        // 清理资源
        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
} 