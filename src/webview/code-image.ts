import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { CodeLanguage } from '../types/language';
import { showMessage } from '../utils';

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

    public static createOrShow(
        extensionContext: vscode.ExtensionContext,
        code: string,
        language: string,
        options: {
            resources: { core: string; style: string };
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
                    vscode.Uri.joinPath(extensionContext.extensionUri, 'node_modules/@highlightjs/cdn-assets')
                ]
            }
        );

        CodeImagePanel.currentPanel = new CodeImagePanel(panel, extensionContext);
        CodeImagePanel.currentPanel.setContent(code, language, options);
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

    public setContent(
        code: string,
        language: string,
        options: {
            resources: { core: string; style: string };
            languages: CodeLanguage[];
        }
    ) {
        this._panel.webview.html = this._getHtmlContent(code, language, options);
    }

    private _getHtmlContent(
        code: string,
        language: string,
        options: {
            resources: { core: string; style: string };
            languages: CodeLanguage[];
        }
    ): string {
        const { resources, languages } = options;

        // 获取本地资源的 URI
        const highlightJsUri = this._panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionContext.extensionUri, resources.core)
        ).toString();
        const styleUri = this._panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionContext.extensionUri, resources.style)
        ).toString();

        // 检查语言是否在支持列表中，如果不在则使用 text
        const isLanguageSupported = languages.some(lang => lang.id === language);
        const defaultLanguage = isLanguageSupported ? language : 'text';

        // 生成语言选项，确保 text 选项始终存在
        const hasTextOption = languages.some(lang => lang.id === 'text');
        const allLanguages = hasTextOption ? languages : [...languages, { id: 'text', name: 'Plain Text' }];
        
        const languageOptions = allLanguages
            .map(lang => `<option value="${lang.id}"${lang.id === defaultLanguage ? ' selected' : ''}">${lang.name}</option>`)
            .join('\n');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="${styleUri}">
                <script src="${highlightJsUri}"></script>
                <script>
                    // 初始化 highlight.js
                    hljs.highlightAll();
                </script>
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        background-image: linear-gradient(140deg, rgb(207, 47, 152), rgb(106, 61, 236));
                        color: #fff;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .toolbar {
                        margin-bottom: 20px;
                        display: flex;
                        gap: 10px;
                        justify-content: flex-end;
                    }
                    .window {
                        background: #2d2d2d;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 20px 68px rgba(0, 0, 0, 0.55);
                    }
                    .titlebar {
                        background: #1a1a1a;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        padding: 0 12px;
                        -webkit-app-region: drag;
                        user-select: none;
                    }
                    .window-controls {
                        display: flex;
                        gap: 8px;
                        margin-right: 8px;
                    }
                    .window-control {
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        border: none;
                        padding: 0;
                        margin: 0;
                    }
                    .window-control.close {
                        background: #ff5f56;
                    }
                    .window-control.minimize {
                        background: #ffbd2e;
                    }
                    .window-control.maximize {
                        background: #27c93f;
                    }
                    .window-title {
                        color: #808080;
                        font-size: 14px;
                        flex-grow: 1;
                        text-align: center;
                        margin-left: -52px; /* 补偿窗口控制按钮的宽度，使标题居中 */
                    }
                    .content {
                        padding: 20px;
                    }
                    button {
                        padding: 8px 16px;
                        border: none;
                        border-radius: 4px;
                        background: #2ea043;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                    }
                    button:hover {
                        background: #2c974b;
                    }
                    .language-select {
                        padding: 8px;
                        border-radius: 4px;
                        background: #2d2d2d;
                        color: white;
                        border: 1px solid #404040;
                    }
                    #editor {
                        background: #2d2d2d;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        overflow-x: auto;
                        font-family: 'Fira Code', 'Consolas', monospace;
                    }
                    #editor pre {
                        margin: 0;
                    }
                    #editor code {
                        font-family: 'Fira Code', 'Consolas', monospace;
                        font-size: 14px;
                        line-height: 1.5;
                    }
                    #canvas {
                        display: none;
                    }
                    /* 调整 highlight.js 的样式 */
                    .hljs {
                        background: transparent !important;
                        padding: 0 !important;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="toolbar">
                        <select id="language" class="language-select" onchange="updateLanguage()">
                            ${languageOptions}
                        </select>
                        <button onclick="copyImage()">${vscode.l10n.t('Copy Image')}</button>
                        <button onclick="downloadImage()">${vscode.l10n.t('Download Image')}</button>
                    </div>
                    <div class="window">
                        <div class="titlebar">
                            <div class="window-controls">
                                <div class="window-control close"></div>
                                <div class="window-control minimize"></div>
                                <div class="window-control maximize"></div>
                            </div>
                            <div class="window-title">${vscode.l10n.t('Code Snippet')}</div>
                        </div>
                        <div class="content">
                            <div id="editor">
                                <pre><code class="language-${language}">${this._escapeHtml(code)}</code></pre>
                            </div>
                        </div>
                    </div>
                    <canvas id="canvas"></canvas>
                </div>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
                <script>
                    const vscode = acquireVsCodeApi();
                    const editor = document.getElementById('editor');
                    const languageSelect = document.getElementById('language');
                    const codeElement = editor.querySelector('code');
                    
                    // 设置初始语言
                    languageSelect.value = '${defaultLanguage}';
                    codeElement.className = 'language-${defaultLanguage}';
                    hljs.highlightElement(codeElement);
                    
                    // 更新语言
                    function updateLanguage() {
                        const newLanguage = languageSelect.value;
                        codeElement.className = 'language-' + newLanguage;
                        hljs.highlightElement(codeElement);
                    }

                    // 生成图片时需要包含整个窗口
                    async function generateImage() {
                        try {
                            const windowElement = document.querySelector('.window');
                            const canvas = await html2canvas(windowElement, {
                                backgroundColor: '#2d2d2d',
                                scale: 2
                            });
                            return { canvas, dataUrl: canvas.toDataURL('image/png') };
                        } catch (error) {
                            vscode.postMessage({
                                command: 'error',
                                text: 'Error generating image: ' + error.message
                            });
                            return null;
                        }
                    }

                    // 复制图片到剪贴板
                    async function copyImage() {
                        const result = await generateImage();
                        if (result) {
                            try {
                                const blob = await new Promise(resolve => result.canvas.toBlob(resolve));
                                if (blob) {
                                    await navigator.clipboard.write([
                                        new ClipboardItem({ 'image/png': blob })
                                    ]);
                                    vscode.postMessage({
                                        command: 'info',
                                        text: vscode.l10n.t('Image copied to clipboard')
                                    });
                                }
                            } catch (error) {
                                vscode.postMessage({
                                    command: 'error',
                                    text: vscode.l10n.t('Error copying image: {0}', error.message)
                                });
                            }
                        }
                    }

                    // 下载图片
                    async function downloadImage() {
                        const result = await generateImage();
                        if (result) {
                            vscode.postMessage({
                                command: 'downloadImage',
                                data: result.dataUrl
                            });
                        }
                    }
                </script>
            </body>
            </html>
        `;
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