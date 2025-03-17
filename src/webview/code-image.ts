import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { execAsync, showMessage } from '../utils';

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

    public static createOrShow(extensionContext: vscode.ExtensionContext, code: string, language: string) {
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
                localResourceRoots: []
            }
        );

        CodeImagePanel.currentPanel = new CodeImagePanel(panel, extensionContext);
        CodeImagePanel.currentPanel.setContent(code, language);
    }

    private async _update() {
        // 设置消息监听
        this._panel.webview.onDidReceiveMessage(
            async message => {
                try {
                    switch (message.command) {
                        case 'copyImage':
                            await this._handleCopyImage(message.data);
                            break;

                        case 'downloadImage':
                            await this._handleDownloadImage(message.data);
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

    private async _handleCopyImage(imageData: string) {
        try {
            const data = imageData.replace(/^data:image\/png;base64,/, '');
            const tempDir = os.tmpdir();
            const tempFilePath = path.join(tempDir, 'code-image.png');
            fs.writeFileSync(tempFilePath, Buffer.from(data, 'base64'));

            // 根据操作系统使用不同的复制命令
            const platform = process.platform;
            if (platform === 'darwin') {
                // macOS
                await execAsync(`osascript -e 'set the clipboard to (read (POSIX file "${tempFilePath}") as JPEG picture)'`);
            } else if (platform === 'win32') {
                // Windows
                await execAsync(`powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::SetImage([System.Drawing.Image]::FromFile('${tempFilePath}'))"`);
            } else {
                // Linux (需要安装 xclip)
                await execAsync(`xclip -selection clipboard -t image/png -i "${tempFilePath}"`);
            }
            showMessage(vscode.l10n.t('Image copied to clipboard'));
        } catch (error) {
            showMessage(vscode.l10n.t('Error copying image: {0}', error instanceof Error ? error.message : String(error)), 'error');
        }
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

    public setContent(code: string, language: string) {
        this._panel.webview.html = this._getHtmlContent(code, language);
    }

    private _getHtmlContent(code: string, language: string): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
                <!-- 加载常用语言包 -->
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/go.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/python.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/typescript.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/javascript.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/xml.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/css.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/json.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/markdown.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/java.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/rust.min.js"></script>
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
                            <option value="apache">Apache</option>
                            <option value="bash">Bash</option>
                            <option value="c">C</option>
                            <option value="cpp">C++</option>
                            <option value="csharp">C#</option>
                            <option value="css">CSS</option>
                            <option value="diff">Diff</option>
                            <option value="docker">Docker</option>
                            <option value="go">Go</option>
                            <option value="graphql">GraphQL</option>
                            <option value="hcl">HCL</option>
                            <option value="html">HTML</option>
                            <option value="java">Java</option>
                            <option value="javascript">JavaScript</option>
                            <option value="json">JSON</option>
                            <option value="kotlin">Kotlin</option>
                            <option value="less">Less</option>
                            <option value="lua">Lua</option>
                            <option value="makefile">Makefile</option>
                            <option value="markdown">Markdown</option>
                            <option value="nginx">Nginx</option>
                            <option value="objectivec">Objective-C</option>
                            <option value="perl">Perl</option>
                            <option value="php">PHP</option>
                            <option value="python">Python</option>
                            <option value="r">R</option>
                            <option value="ruby">Ruby</option>
                            <option value="rust">Rust</option>
                            <option value="scala">Scala</option>
                            <option value="scss">SCSS</option>
                            <option value="sql">SQL</option>
                            <option value="swift">Swift</option>
                            <option value="typescript">TypeScript</option>
                            <option value="vim">Vim</option>
                            <option value="yaml">YAML</option>
                        </select>
                        <button onclick="copyImage()">复制图片</button>
                        <button onclick="downloadImage()">下载图片</button>
                    </div>
                    <div class="window">
                        <div class="titlebar">
                            <div class="window-controls">
                                <div class="window-control close"></div>
                                <div class="window-control minimize"></div>
                                <div class="window-control maximize"></div>
                            </div>
                            <div class="window-title">Code Snippet</div>
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
                    languageSelect.value = '${language}';
                    
                    // 初始化代码高亮
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
                            return canvas.toDataURL('image/png');
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
                        const imageData = await generateImage();
                        if (imageData) {
                            vscode.postMessage({
                                command: 'copyImage',
                                data: imageData
                            });
                        }
                    }

                    // 下载图片
                    async function downloadImage() {
                        const imageData = await generateImage();
                        if (imageData) {
                            vscode.postMessage({
                                command: 'downloadImage',
                                data: imageData
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