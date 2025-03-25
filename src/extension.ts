// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import { CodeImagePanel } from './code-image';
import { CodeLanguage } from './types/language';
import { SessionState } from './types/session-state';
import { detectGitRepository, getCommandSource, getGitUrl, getRemoteImageUrl, showMessage } from './utils';

function getHighlightLanguages(extensionPath: string): CodeLanguage[] {
	const languagesPath = path.join(extensionPath, 'node_modules', '@highlightjs/cdn-assets', 'languages');
	const files = fs.readdirSync(languagesPath);
	
	return files
		.filter(file => file.endsWith('.min.js'))
		.map(file => {
			const id = file.replace('.min.js', '');
			// 将 id 转换为更友好的显示名称
			const name = id
				.split('-')
				.map(word => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ');
			return { id, name };
		});
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log(vscode.l10n.t('Congratulations, your extension "GitLink" is now active!'));
	const sessionState = new SessionState();
	// 在扩展激活时检测项目
	detectGitRepository();

	const supportedLanguages = getHighlightLanguages(context.extensionPath);

	// Register the "Open in GitHub" command
	const openInGitHubDisposable = vscode.commands.registerCommand('gitlink.openInGitHub', async (uri?: vscode.Uri, allUris?: vscode.Uri[]) => {
		try {
			// 判断命令来源
			const source = getCommandSource(allUris);
			console.log("Command source:", source);

			const gitUrls = await getGitUrl(source, sessionState, allUris);
			if (!gitUrls?.length) {
				return; // Error messages are already shown in getGitUrl
			}

			// Open the URL in the default browser
			gitUrls.forEach(gitUrl => {
				vscode.env.openExternal(vscode.Uri.parse(gitUrl.url));
			});
			showMessage(vscode.l10n.t('Opening {0}', gitUrls.map(gitUrl => gitUrl.url).join(', ')));
		} catch (error) {
			showMessage(vscode.l10n.t('Error opening URL: {0}', error instanceof Error ? error.message : String(error)), 'error');
		}
	});

	// Register the "Copy GitHub Link" command
	const copyGitHubLinkDisposable = vscode.commands.registerCommand('gitlink.copyGitHubLink', async (uri?: vscode.Uri, allUris?: vscode.Uri[]) => {
		try {
			const source = getCommandSource(allUris);
			console.log("Command source:", source);
			const gitUrls = await getGitUrl(source, sessionState, allUris);
			if (!gitUrls?.length) {
				return; // Error messages are already shown in getGitUrl
			}

			// Copy the URL to clipboard
			await vscode.env.clipboard.writeText(gitUrls.map(gitUrl => gitUrl.url).join('\n'));
			showMessage(vscode.l10n.t('Git link copied to clipboard: {0}', gitUrls.map(gitUrl => gitUrl.url).join(', ')));
		} catch (error) {
			showMessage(vscode.l10n.t('Error copying link: {0}', error instanceof Error ? error.message : String(error)), 'error');
		}
	});

	// Register the "Open Settings" command
	const openSettingsDisposable = vscode.commands.registerCommand('gitlink.openSettings', () => {
		vscode.commands.executeCommand('workbench.action.openSettings', 'gitlink');
	});

	// Register the "Copy GitHub Markdown Link" command
	const copyGitHubMarkdownLinkDisposable = vscode.commands.registerCommand(
		'gitlink.copyGitHubMarkdownLink',
		async (uri?: vscode.Uri, allUris?: vscode.Uri[]) => {
			try {
				// 获取普通链接
				const gitUrls = await getGitUrl(getCommandSource(allUris), sessionState, allUris);
				if (!gitUrls?.length) {
					return;
				}

				let markdownLinks = '';
				gitUrls.forEach(gitUrl => {
					// 如果没有合适的文本，使用文件名
					const linkText = gitUrl.fileName || 'Link';

					// 格式化 Markdown 链接
					const markdownLink = `[${linkText}](${gitUrl.url})`;
					markdownLinks += markdownLink + '\n';
				});
				// 复制到剪贴板
				await vscode.env.clipboard.writeText(markdownLinks);
				showMessage(vscode.l10n.t('Markdown link copied to clipboard'));
			} catch (error) {
				showMessage(vscode.l10n.t('Error copying Markdown link: {0}', error instanceof Error ? error.message : String(error)), 'error');
			}
		}
	);

	// Register the "Copy GitHub Markdown Snippet" command
	const copyGitHubMarkdownSnippetDisposable = vscode.commands.registerCommand('gitlink.copyGitHubMarkdownSnippet', async (uri?: vscode.Uri, allUris?: vscode.Uri[]) => {
		try {
			const source = getCommandSource(allUris);
			console.log("Command source for snippet:", source);
			const gitUrls = await getGitUrl(source, sessionState, allUris);
			if (!gitUrls?.length) {
				return; // Error messages are already shown in getGitUrl
			}

			let clipboardContent = "";

			// 只有当命令来源是编辑器时，才添加代码块
			if (source === 'editor') {
				const activeEditor = vscode.window.activeTextEditor;
				let { url: gitUrl, fileName: linkText } = gitUrls[0];
				if (activeEditor && activeEditor.document.uri.fsPath === uri?.fsPath) {
					// 获取选中的代码
					const selection = activeEditor.selection;
					let codeContent = "";
					let language = "";

					if (!selection.isEmpty) {
						// 有选中的代码
						codeContent = activeEditor.document.getText(selection);
						console.log('languageId', activeEditor.document.languageId);
						language = activeEditor.document.languageId; // 去掉点号
						// 构建 Markdown 代码块格式，使用文件名作为链接文本
						clipboardContent = `[${linkText}](${gitUrl})\n\n\`\`\`${language}\n${codeContent}\n\`\`\``;
					} else {
						// 无选中代码，只复制链接
						clipboardContent = gitUrl;
					}
				} else {
					// 编辑器打开的不是当前文件
					clipboardContent = `[${linkText}](${gitUrl})`;
				}
			} else {
				gitUrls?.forEach(gitUrl => {
					let { url, fileName: linkText } = gitUrl;
					if (linkText) {
						// 非编辑器来源，只复制链接
						clipboardContent += `[${linkText}](${url})\n`;
					}
				});
			}

			// 复制内容到剪贴板
			await vscode.env.clipboard.writeText(clipboardContent);

			// 根据复制的内容类型显示不同的消息
			if (source === 'editor') {
				showMessage(vscode.l10n.t('Markdown code snippet copied to clipboard'));
			} else {
				showMessage(vscode.l10n.t('Git link copied to clipboard: {0}', gitUrls.map(gitUrl => gitUrl.url).join(', ')));
			}
		} catch (error) {
			showMessage(vscode.l10n.t('Error copying Markdown snippet: {0}', error instanceof Error ? error.message : String(error)), 'error');
		}
	});

	// Register the "Copy GitHub Snippet Image" command
	const copyGitHubSnippetImageDisposable = vscode.commands.registerCommand('gitlink.copyGitHubSnippetImage', async (uri?: vscode.Uri, allUris?: vscode.Uri[]) => {
		try {
			const source = getCommandSource(allUris);
			console.log("Command source for snippet:", source);
			// 只有当命令来源是编辑器时，才添加代码块
			if (source === 'editor') {
				const activeEditor = vscode.window.activeTextEditor;
				if (activeEditor && activeEditor.document.uri.fsPath === uri?.fsPath) {
					// 获取选中的代码
					const selection = activeEditor.selection;
					if (!selection.isEmpty) {
						// 检查是否使用 ray.so
						const useRemote = vscode.workspace.getConfiguration('gitlink').get('useRemoteForCodeImage');
						
						const codeContent = activeEditor.document.getText(selection);
						const language = activeEditor.document.languageId;
						const fileName = path.basename(activeEditor.document.fileName);
						const remoteImageUrl = getRemoteImageUrl(codeContent, language);
						function openRemoteImage() {
							// 使用VSCode的命令打开URL
							vscode.env.openExternal(vscode.Uri.parse(remoteImageUrl)).then(() => {
								showMessage(vscode.l10n.t('Code snippet opened in browser'));
							}, (error) => {
								showMessage(vscode.l10n.t('Error opening Code: {0}', error instanceof Error ? error.message : String(error)), 'error');
							});
						}
						if (useRemote) {
							// 使用VSCode的命令打开URL
							openRemoteImage();
						} else {
							// 使用本地生成，传递资源路径和支持的语言列表
							CodeImagePanel.createOrShow(context, codeContent, language, {
								languages: supportedLanguages,
								remoteImageUrl,
								fileName,
							});
						}
					}
				}
			}
		} catch (error) {
			showMessage(vscode.l10n.t('Error opening Code snippet: {0}', error instanceof Error ? error.message : String(error)), 'error');
		}
	});

	context.subscriptions.push(openInGitHubDisposable, copyGitHubLinkDisposable, openSettingsDisposable,
		copyGitHubMarkdownLinkDisposable, copyGitHubMarkdownSnippetDisposable, copyGitHubSnippetImageDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
