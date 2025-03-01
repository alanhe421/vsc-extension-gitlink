// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { Platform, DomainMapping, DomainResult } from './types';

const execAsync = promisify(exec);

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "gitlink" is now active!');

	// 在扩展激活时检测项目
	detectGitRepository();
	// Register the "Open in GitHub" command
	const openInGitHubDisposable = vscode.commands.registerCommand('gitlink.openInGitHub', async (uri: vscode.Uri, context?: vscode.Uri) => {
		try {
			// 判断命令来源
			const source = getCommandSource(context);
			console.log("Command source:", source);

			const gitUrl = await getGitUrl(uri, source);
			if (!gitUrl) {
				return; // Error messages are already shown in getGitUrl
			}

			// Open the URL in the default browser
			vscode.env.openExternal(vscode.Uri.parse(gitUrl));
			showMessage(`Opening ${gitUrl}`);
		} catch (error) {
			showMessage(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error');
		}
	});

	// Register the "Copy GitHub Link" command
	const copyGitHubLinkDisposable = vscode.commands.registerCommand('gitlink.copyGitHubLink', async (uri: vscode.Uri, context?: vscode.Uri) => {
		try {
			const source = getCommandSource(context);
			console.log("Command source:", source);
			const gitUrl = await getGitUrl(uri, source);
			if (!gitUrl) {
				return; // Error messages are already shown in getGitUrl
			}

			// Copy the URL to clipboard
			await vscode.env.clipboard.writeText(gitUrl);
			showMessage(`Git link copied to clipboard: ${gitUrl}`);
		} catch (error) {
			showMessage(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error');
		}
	});

	// Register the "Open Settings" command
	const openSettingsDisposable = vscode.commands.registerCommand('gitlink.openSettings', () => {
		vscode.commands.executeCommand('workbench.action.openSettings', 'gitlink');
	});

	// Register the "Copy GitHub Markdown Link" command
	const copyGitHubMarkdownLinkDisposable = vscode.commands.registerCommand(
		'gitlink.copyGitHubMarkdownLink',
		async (uri: vscode.Uri, context: vscode.Uri) => {
			try {
				// 获取普通链接
				const gitUrl = await getGitUrl(uri, getCommandSource(context));
				if (!gitUrl) {
					return;
				}

				// 如果没有合适的文本，使用文件名
				const linkText = path.basename(uri?.fsPath ||
					vscode.window.activeTextEditor?.document.uri.fsPath ||
					'Link');

				// 格式化 Markdown 链接
				const markdownLink = `[${linkText}](${gitUrl})`;

				// 复制到剪贴板
				await vscode.env.clipboard.writeText(markdownLink);
				showMessage('Markdown link copied to clipboard');
			} catch (error) {
				showMessage(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error');
			}
		}
	);

	// Register the "Copy GitHub Markdown Snippet" command
	const copyGitHubMarkdownSnippetDisposable = vscode.commands.registerCommand('gitlink.copyGitHubMarkdownSnippet', async (uri: vscode.Uri, context?: vscode.Uri) => {
		try {
			const source = getCommandSource(context);
			console.log("Command source for snippet:", source);
			const gitUrl = await getGitUrl(uri, source);
			if (!gitUrl) {
				return; // Error messages are already shown in getGitUrl
			}

			let clipboardContent = "";

			const linkText = path.basename(uri?.fsPath ||
				vscode.window.activeTextEditor?.document.uri.fsPath ||
				'Link');

			// 只有当命令来源是编辑器时，才添加代码块
			if (source === 'editor') {
				const activeEditor = vscode.window.activeTextEditor;
				if (activeEditor && activeEditor.document.uri.fsPath === uri.fsPath) {
					// 获取选中的代码
					const selection = activeEditor.selection;
					let codeContent = "";
					let language = "";

					if (!selection.isEmpty) {
						// 有选中的代码
						codeContent = activeEditor.document.getText(selection);
						console.log('languageId', activeEditor.document.languageId);
						language = activeEditor.document.languageId; // 去掉点号
						// 映射一些常见语言的文件扩展名
						language = mapLanguageExtension(language);

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
				// 非编辑器来源，只复制链接
				clipboardContent = `[${linkText}](${gitUrl})`;
			}

			// 复制内容到剪贴板
			await vscode.env.clipboard.writeText(clipboardContent);

			// 根据复制的内容类型显示不同的消息
			if (clipboardContent === gitUrl) {
				showMessage(`Git link copied to clipboard: ${gitUrl}`);
			} else {
				showMessage(`Markdown code snippet copied to clipboard`);
			}
		} catch (error) {
			showMessage(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error');
		}
	});

	context.subscriptions.push(openInGitHubDisposable, copyGitHubLinkDisposable, openSettingsDisposable, copyGitHubMarkdownLinkDisposable, copyGitHubMarkdownSnippetDisposable);
}

// 检测项目是否为 Git 仓库，并检查是否有匹配的平台
async function detectGitRepository() {
	console.log('detectGitRepository start');
	try {
		// 获取当前工作区文件夹
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			return; // 没有打开的工作区
		}

		const workspaceRoot = workspaceFolders[0].uri.fsPath;

		// 检查是否为 Git 仓库
		const gitRootPath = await getGitRootPath(workspaceRoot);
		if (!gitRootPath) {
			showMessage('Not a Git repository', 'warning');
			return; // 不是 Git 仓库，不显示提示
		}
	} catch (error) {
		console.error('Error detecting Git repository:', error);
	}
}

// 从远程 URL 中提取域名
function extractRepoInfoFromRemoteUrl(remoteUrl: string): DomainResult {
	let domain = '';
	let pathSegments: string[] = [];

	try {
		if (remoteUrl.startsWith('https://') || remoteUrl.startsWith('http://')) {
			// 处理 HTTPS URL
			const url = new URL(remoteUrl);
			domain = url.hostname;

			// 提取路径段，并去掉 .git 后缀
			const pathname = url.pathname.endsWith('.git')
				? url.pathname.slice(0, -4) // 去掉 .git 后缀
				: url.pathname;
			pathSegments = pathname.split('/').filter(part => part.length > 0);
		} else if (remoteUrl.includes('@')) {
			// 处理 SSH URL，例如 git@github.com:username/repo.git
			const match = remoteUrl.match(/@([^:]+):(.+?)(?:\.git)?$/);
			if (match && match[1] && match[2]) {
				domain = match[1];

				// 提取路径段，.git 后缀已在正则表达式中处理
				pathSegments = match[2].split('/').filter(part => part.length > 0);
			}
		}
	} catch (error) {
		console.error('Error extracting domain from remote URL:', error);
	}

	return { domain, remoteUrl, pathSegments };
}

// 根据域名获取匹配的平台
function getPlatformForDomain(domain: string): Platform | null {
	try {
		// 从配置中获取域名注册表
		const config = vscode.workspace.getConfiguration('gitlink');
		const domainRegistry: DomainMapping[] = config.get('domainRegistry') || [];
		const platforms: Platform[] = config.get('platforms') || [];

		if (!domain) {
			return null;
		}

		// 在域名注册表中查找匹配的平台
		const mapping = domainRegistry.find(m => domain.includes(m.domain));
		if (!mapping) {
			return null;
		}

		// 在平台列表中查找匹配的平台
		return platforms.find(p => p.name === mapping.platform) || null;
	} catch (error) {
		console.error('Error getting platform for domain:', error);
		return null;
	}
}

// Common function to get Git URL for both commands
async function getGitUrl(uri: vscode.Uri, commandSource: 'explorer' | 'editor'): Promise<string | null> {
	// Get the current file path and selected lines
	let filePath = commandSource === 'explorer' ? uri.fsPath : vscode.window.activeTextEditor?.document.uri.fsPath;
	if (!filePath) {
		showMessage('No file is currently open', 'error');
		return null;
	}
	let lineStart: number | undefined;
	let lineEnd: number | undefined;
	const activeEditor = vscode.window.activeTextEditor;

	if (activeEditor) {
		// Get the current selection or cursor position
		const selection = activeEditor.selection;
		if (!selection.isEmpty) {
			// User has selected a range of lines
			lineStart = selection.start.line + 1; // VSCode is 0-based, most platforms are 1-based
			lineEnd = selection.end.line + 1;
		} else {
			// User has just positioned the cursor
			lineStart = selection.active.line + 1;
			lineEnd = lineStart;
		}
		console.log(`Selected lines: ${lineStart}-${lineEnd}`);
	}


	// Get the git repository root
	const gitRootPath = await getGitRootPath(filePath);
	if (!gitRootPath) {
		showMessage('This file is not under Git version control', 'error');
		return null;
	}

	// Get the remote URL
	const remoteUrl = await getGitRemoteUrl(gitRootPath);
	if (!remoteUrl) {
		showMessage('No Git remote URL found', 'error');
		return null;
	}

	// 从远程 URL 中提取域名
	const domainResult = extractRepoInfoFromRemoteUrl(remoteUrl);
	if (!domainResult.domain) {
		showMessage('Failed to extract domain from remote URL', 'error');
		return null;
	}

	console.log('domainResult', domainResult);

	// 根据域名获取匹配的平台
	const platform = getPlatformForDomain(domainResult.domain);
	if (!platform) {
		const message = `GitLink could not detect which platform you use for remote URL "${remoteUrl}". You can configure custom platforms in settings.`;
		showMessage(message, 'error');

		// 提供按钮引导到配置部分
		const openSettings = 'Open Settings';
		showMessage(message, 'error', openSettings).then(selection => {
			if (selection === openSettings) {
				vscode.commands.executeCommand('gitlink.openSettings');
			}
		});

		return null;
	}

	// Get the current branch or commit
	const branch = await getCurrentBranch(gitRootPath);
	if (!branch) {
		showMessage('Failed to get current branch', 'error');
		return null;
	}

	// Get the relative path from the git root
	const relativePath = path.relative(gitRootPath, filePath).replace(/\\/g, '/');
	const fileName = path.basename(filePath);
	const fileDirPath = path.dirname(relativePath);

	// Extract repository path from remote URL
	const repoPath = extractRepoPath(remoteUrl);
	if (!repoPath) {
		showMessage('Failed to extract repository path from remote URL', 'error');
		return null;
	}

	// Construct the URL using the platform's template
	const gitUrl = constructGitUrl({
		platform,
		repoPath,
		branch,
		filePath: relativePath,
		fileName,
		fileDirPath,
		lineStart,
		lineEnd,
		domainResult,
		commandSource
	});
	if (!gitUrl) {
		showMessage('Failed to construct Git URL', 'error');
		return null;
	}

	return gitUrl;
}

// 从远程 URL 中提取仓库路径
function extractRepoPath(remoteUrl: string): string | null {
	try {
		// 处理 SSH URL，例如 git@github.com:username/repo.git
		const sshMatch = remoteUrl.match(/git@[^:]+:(.+?)(?:\.git)?$/);
		if (sshMatch && sshMatch[1]) {
			return sshMatch[1];
		}

		// 处理 HTTPS URL，例如 https://github.com/username/repo.git
		const httpsMatch = remoteUrl.match(/https?:\/\/[^\/]+\/(.+?)(?:\.git)?$/);
		if (httpsMatch && httpsMatch[1]) {
			return httpsMatch[1];
		}

		return null;
	} catch (error) {
		console.error('Error extracting repo path:', error);
		return null;
	}
}

// 使用平台模板构建 Git URL
function constructGitUrl({
	platform,
	repoPath,
	branch,
	filePath,
	fileName,
	fileDirPath,
	lineStart,
	lineEnd,
	domainResult,
	commandSource
}: {
	platform: Platform;
	repoPath: string;
	branch: string;
	filePath: string;
	fileName: string;
	fileDirPath: string;
	lineStart?: number;
	lineEnd?: number;
	domainResult: DomainResult;
	commandSource: 'editor' | 'explorer';
}): string | null {
	try {
		let url = platform.urlTemplate;
		const { domain, pathSegments } = domainResult;

		// 替换模板中的变量
		url = url.replace(/{repo:path}/g, repoPath);
		url = url.replace(/{branch}/g, branch);
		url = url.replace(/{file:path}/g, filePath);
		url = url.replace(/{file:name}/g, fileName);
		url = url.replace(/{file:dir}/g, fileDirPath);
		url = url.replace(/{remote:url}/g, domain);

		// 处理行号
		if (commandSource === 'editor' && lineStart !== undefined && lineEnd !== undefined) {
			// 来自编辑器且有行号信息，直接替换变量
			url = url.replace(/{line:start}/g, lineStart.toString());
			url = url.replace(/{line:end}/g, lineEnd.toString());
		} else {
			// 来自资源管理器或没有行号信息，清理整个行号部分
			// 先尝试替换常见的行号模式（如 #L{line:start}-L{line:end}）
			url = url.replace(/#L{line:start}[-~]?L?{line:end}/g, '');
			url = url.replace(/#L{line:start}/g, '');

			// 清理任何剩余的行号标记
			url = url.replace(/{line:start}/g, '');
			url = url.replace(/{line:end}/g, '');
		}

		// 替换路径段变量 {remote:url:path:n}
		if (pathSegments && pathSegments.length > 0) {
			console.log('Path segments:', pathSegments);
			console.log('URL template before path segment replacement:', url);

			// 使用字符串替换方法而不是正则表达式的exec方法
			// 这样可以确保所有匹配都被替换
			for (let i = 0; i < pathSegments.length; i++) {
				const pattern = `{remote:url:path:${i}}`;
				const replacement = pathSegments[i];
				console.log(`Replacing ${pattern} with ${replacement}`);

				// 全局替换所有匹配项
				while (url.includes(pattern)) {
					url = url.replace(pattern, replacement);
				}
			}

			// 替换任何剩余的 {remote:url:path:n} 为空字符串
			url = url.replace(/{remote:url:path:\d+}/g, '');

			console.log('URL after path segment replacement:', url);
		}

		return url;
	} catch (error) {
		console.error('Error constructing Git URL:', error);
		return null;
	}
}

async function getGitRootPath(filePath: string): Promise<string | null> {
	try {
		console.log('getGitRootPath start', filePath);
		// 如果是文件则使用其所在目录作为cwd，如果是目录则直接使用该目录
		const cwd = (await vscode.workspace.fs.stat(vscode.Uri.file(filePath))).type === vscode.FileType.File
			? path.dirname(filePath)
			: filePath;
		console.log('getGitRootPath cwd', cwd);
		const { stdout } = await execAsync('git rev-parse --show-toplevel', { cwd });
		return stdout.trim();
	} catch (error) {
		console.error('Error getting git root path:', error);
		return null;
	}
}

// 获取所有远程仓库
async function getGitRemotes(gitRootPath: string): Promise<string[]> {
	try {
		const { stdout } = await execAsync('git remote', { cwd: gitRootPath });
		return stdout.trim().split('\n').filter(remote => remote.length > 0);
	} catch (error) {
		console.error('Error getting git remotes:', error);
		return [];
	}
}

// 改造后的函数
async function getGitRemoteUrl(gitRootPath: string): Promise<string | null> {
	try {
		// 获取所有远程仓库
		const remotes = await getGitRemotes(gitRootPath);

		if (remotes.length === 0) {
			return null;
		}

		let selectedRemote: string | undefined;

		// 如果只有一个远程仓库，直接使用它
		if (remotes.length === 1) {
			selectedRemote = remotes[0];
		} else {
			// 有多个远程仓库，显示选择框
			const quickPickOptions: vscode.QuickPickOptions = {
				placeHolder: 'Select a git remote',
				canPickMany: false
			};

			selectedRemote = await vscode.window.showQuickPick(remotes, quickPickOptions);

			// 如果用户取消了选择，返回 null
			if (!selectedRemote) {
				return null;
			}
		}

		// 获取选定远程仓库的 URL
		const { stdout } = await execAsync(`git remote get-url ${selectedRemote}`, { cwd: gitRootPath });
		return stdout.trim();
	} catch (error) {
		console.error('Error getting git remote URL:', error);
		showMessage(`Error getting git remote URL: ${error instanceof Error ? error.message : String(error)}`, 'error');
		return null;
	}
}

async function getCurrentBranch(gitRootPath: string): Promise<string | null> {
	try {
		const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: gitRootPath });
		return stdout.trim();
	} catch (error) {
		console.error('Error getting current branch:', error);
		return null;
	}
}

function getCommandSource(context?: vscode.Uri): 'explorer' | 'editor' {
	// 判断命令来源
	let source = "explorer";
	if (!context && vscode.window.activeTextEditor) {
		source = "editor";
	}
	return source as 'explorer' | 'editor';
}

// 添加语言扩展名映射函数
function mapLanguageExtension(extension: string): string {
	const mapping: Record<string, string> = {
		'js': 'javascript',
		'jsx': 'jsx',
		'ts': 'typescript',
		'tsx': 'tsx',
		'py': 'python',
		'rb': 'ruby',
		'cs': 'csharp',
		'go': 'go',
		'java': 'java',
		'php': 'php',
		'sh': 'bash',
		'c': 'c',
		'cpp': 'cpp',
		'h': 'c',
		'hpp': 'cpp',
		'md': 'markdown',
		'json': 'json',
		'yaml': 'yaml',
		'yml': 'yaml',
		'xml': 'xml',
		'html': 'html',
		'css': 'css',
		'scss': 'scss',
		'rs': 'rust',
		'': 'text'  // 默认为纯文本
	};

	return mapping[extension.toLowerCase()] || extension;
}

/**
 * 显示消息
 * @param message 消息内容
 * @param level
 * @param others
 */
function showMessage(message: string, level: 'info' | 'error' | 'warning' = 'info', ...others: any[]) {
	const method = {
		'info': vscode.window.showInformationMessage,
		'warning': vscode.window.showWarningMessage,
		'error': vscode.window.showErrorMessage
	}[level];
	return method('GitLink: ' + message, ...others);
}

// This method is called when your extension is deactivated
export function deactivate() { }
