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
	const openInGitHubDisposable = vscode.commands.registerCommand('gitlink.openInGitHub', async (uri?: vscode.Uri) => {
		try {
			const gitUrl = await getGitUrl(uri);
			if (!gitUrl) {
				return; // Error messages are already shown in getGitUrl
			}

			// Open the URL in the default browser
			vscode.env.openExternal(vscode.Uri.parse(gitUrl));
			vscode.window.showInformationMessage(`Opening ${gitUrl}`);
		} catch (error) {
			vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
		}
	});

	// Register the "Copy GitHub Link" command
	const copyGitHubLinkDisposable = vscode.commands.registerCommand('gitlink.copyGitHubLink', async (uri?: vscode.Uri) => {
		try {
			const gitUrl = await getGitUrl(uri);
			if (!gitUrl) {
				return; // Error messages are already shown in getGitUrl
			}

			// Copy the URL to clipboard
			await vscode.env.clipboard.writeText(gitUrl);
			vscode.window.showInformationMessage(`Git link copied to clipboard: ${gitUrl}`);
		} catch (error) {
			vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
		}
	});

	// Register the "Open Settings" command
	const openSettingsDisposable = vscode.commands.registerCommand('gitlink.openSettings', () => {
		vscode.commands.executeCommand('workbench.action.openSettings', 'gitlink');
	});

	context.subscriptions.push(openInGitHubDisposable, copyGitHubLinkDisposable, openSettingsDisposable);
}

// 检测项目是否为 Git 仓库，并检查是否有匹配的平台
async function detectGitRepository() {
	console.log('gitlink: detectGitRepository start');
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
			vscode.window.showWarningMessage('GitLink: Not a Git repository');
			return; // 不是 Git 仓库，不显示提示
		}

		// 获取远程 URL
		const remoteUrl = await getGitRemoteUrl(gitRootPath);
		if (!remoteUrl) {
			vscode.window.showWarningMessage('GitLink: No remote URL found');
			return; // 没有远程 URL，不显示提示
		}

		// 从远程 URL 中提取域名
		const repoInfo = extractRepoInfoFromRemoteUrl(remoteUrl);
		if (!repoInfo.domain) {
			vscode.window.showWarningMessage('GitLink: Failed to extract domain from remote URL');
			return; // 无法提取域名，不显示提示
		}

		// 检查是否有匹配的平台
		const platform = getPlatformForDomain(repoInfo.domain);
		if (!platform) {
			// 显示提示消息，并提供按钮引导到配置部分
			const message = `GitLink could not detect which platform you use for remote URL: ${remoteUrl}. You can configure custom platforms in settings.`;
			const openSettings = 'Open Settings';

			vscode.window.showWarningMessage(message, openSettings).then(selection => {
				if (selection === openSettings) {
					vscode.commands.executeCommand('gitlink.openSettings');
				}
			});
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
async function getGitUrl(uri?: vscode.Uri): Promise<string | null> {
	// Get the current file path
	let filePath: string;
	if (uri) {
		filePath = uri.fsPath;
	} else {
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			vscode.window.showErrorMessage('No file is currently open');
			return null;
		}
		filePath = activeEditor.document.uri.fsPath;
	}

	// Get the git repository root
	const gitRootPath = await getGitRootPath(filePath);
	if (!gitRootPath) {
		vscode.window.showErrorMessage('This file is not under Git version control');
		return null;
	}

	// Get the remote URL
	const remoteUrl = await getGitRemoteUrl(gitRootPath);
	if (!remoteUrl) {
		vscode.window.showErrorMessage('No Git remote URL found');
		return null;
	}

	// 从远程 URL 中提取域名
	const domainResult = extractRepoInfoFromRemoteUrl(remoteUrl);
	if (!domainResult.domain) {
		vscode.window.showErrorMessage('Failed to extract domain from remote URL');
		return null;
	}

	console.log('domainResult', domainResult);

	// 根据域名获取匹配的平台
	const platform = getPlatformForDomain(domainResult.domain);
	if (!platform) {
		const message = `GitLink could not detect which platform you use for remote URL "${remoteUrl}". You can configure custom platforms in settings.`;
		vscode.window.showErrorMessage(message);

		// 提供按钮引导到配置部分
		const openSettings = 'Open Settings';
		vscode.window.showErrorMessage(message, openSettings).then(selection => {
			if (selection === openSettings) {
				vscode.commands.executeCommand('gitlink.openSettings');
			}
		});

		return null;
	}

	// Get the current branch or commit
	const branch = await getCurrentBranch(gitRootPath);
	if (!branch) {
		vscode.window.showErrorMessage('Failed to get current branch');
		return null;
	}

	// Get the relative path from the git root
	const relativePath = path.relative(gitRootPath, filePath).replace(/\\/g, '/');
	const fileName = path.basename(filePath);
	const fileDirPath = path.dirname(relativePath);

	// Extract repository path from remote URL
	const repoPath = extractRepoPath(remoteUrl);
	if (!repoPath) {
		vscode.window.showErrorMessage('Failed to extract repository path from remote URL');
		return null;
	}

	// Construct the URL using the platform's template
	const gitUrl = constructGitUrl(platform, repoPath, branch, relativePath, fileName, fileDirPath, domainResult.domain, domainResult.pathSegments);
	if (!gitUrl) {
		vscode.window.showErrorMessage('Failed to construct Git URL');
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
function constructGitUrl(platform: Platform, repoPath: string, branch: string, filePath: string, fileName: string, fileDirPath: string, domain: string, pathSegments?: string[]): string | null {
	try {
		let url = platform.urlTemplate;

		// 替换模板中的变量
		url = url.replace(/{repo:path}/g, repoPath);
		url = url.replace(/{branch}/g, branch);
		url = url.replace(/{file:path}/g, filePath);
		url = url.replace(/{file:name}/g, fileName);
		url = url.replace(/{file:dir}/g, fileDirPath);
		url = url.replace(/{remote:url}/g, domain);

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
		const { stdout } = await execAsync('git rev-parse --show-toplevel', { cwd: path.dirname(filePath) });
		return stdout.trim();
	} catch (error) {
		console.error('Error getting git root path:', error);
		return null;
	}
}

async function getGitRemoteUrl(gitRootPath: string): Promise<string | null> {
	try {
		const { stdout } = await execAsync('git remote get-url origin', { cwd: gitRootPath });
		return stdout.trim();
	} catch (error) {
		console.error('Error getting git remote URL:', error);
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

// This method is called when your extension is deactivated
export function deactivate() {}
