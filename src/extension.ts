// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';
import * as vscode from 'vscode';

const execAsync = promisify(exec);

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "gitlink" is now active!');

	// Register the "Open in GitHub" command
	const openInGitHubDisposable = vscode.commands.registerCommand('gitlink.openInGitHub', async (uri?: vscode.Uri) => {
		try {
			const githubUrl = await getGitHubUrl(uri);
			if (!githubUrl) {
				return; // Error messages are already shown in getGitHubUrl
			}

			// Open the URL in the default browser
			vscode.env.openExternal(vscode.Uri.parse(githubUrl));
			vscode.window.showInformationMessage(`Opening ${githubUrl}`);
		} catch (error) {
			vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
		}
	});

	// Register the "Copy GitHub Link" command
	const copyGitHubLinkDisposable = vscode.commands.registerCommand('gitlink.copyGitHubLink', async (uri?: vscode.Uri) => {
		try {
			const githubUrl = await getGitHubUrl(uri);
			if (!githubUrl) {
				return; // Error messages are already shown in getGitHubUrl
			}

			// Copy the URL to clipboard
			await vscode.env.clipboard.writeText(githubUrl);
			vscode.window.showInformationMessage(`GitHub link copied to clipboard: ${githubUrl}`);
		} catch (error) {
			vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
		}
	});

	context.subscriptions.push(openInGitHubDisposable, copyGitHubLinkDisposable);
}

// Common function to get GitHub URL for both commands
async function getGitHubUrl(uri?: vscode.Uri): Promise<string | null> {
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
		vscode.window.showErrorMessage('Not a git repository');
		return null;
	}

	// Get the remote URL
	const remoteUrl = await getGitRemoteUrl(gitRootPath);
	if (!remoteUrl) {
		vscode.window.showErrorMessage('No GitHub remote URL found');
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

	// Construct the GitHub URL
	const githubUrl = constructGitHubUrl(remoteUrl, branch, relativePath);
	if (!githubUrl) {
		vscode.window.showErrorMessage('Failed to construct GitHub URL');
		return null;
	}

	return githubUrl;
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

function constructGitHubUrl(remoteUrl: string, branch: string, relativePath: string): string | null {
	// Extract the GitHub repository path from the remote URL
	let repoPath: string | null = null;
	
	// Handle SSH URLs like git@github.com:username/repo.git
	const sshMatch = remoteUrl.match(/git@github\.com:(.+)\.git$/);
	if (sshMatch) {
		repoPath = sshMatch[1];
	}
	
	// Handle HTTPS URLs like https://github.com/username/repo.git
	const httpsMatch = remoteUrl.match(/https:\/\/github\.com\/(.+)\.git$/);
	if (httpsMatch) {
		repoPath = httpsMatch[1];
	}
	
	if (!repoPath) {
		return null;
	}
	
	// Construct the GitHub URL
	return `https://github.com/${repoPath}/blob/${branch}/${relativePath}`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
