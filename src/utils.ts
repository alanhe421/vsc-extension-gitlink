import { exec } from 'child_process';
import { Base64 } from 'js-base64';
import path from 'path';
import { promisify } from 'util';
import vscode from 'vscode';
import { SessionState } from './types/session-state';
import { DomainMapping, DomainResult, Platform } from './types/types';

export const execAsync = promisify(exec);

// 检测项目是否为 Git 仓库，并检查是否有匹配的平台
export async function detectGitRepository() {
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
      showMessage(vscode.l10n.t('Not a Git repository'), 'warning');
      return; // 不是 Git 仓库，不显示提示
    }
  } catch (error) {
    console.error('Error detecting Git repository:', error);
  }
}

// 从远程 URL 中提取域名
export function extractRepoInfoFromRemoteUrl(remoteUrl: string): DomainResult {
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
export function getPlatformForDomain(domain: string): Platform | null {
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
export async function getGitUrl(commandSource: 'explorer' | 'editor', sessionState: SessionState, allUris?: vscode.Uri[]): Promise<{
  url: string;
  fileName: string
}[] | null> {
  // Get the current file path and selected lines
  let allFilePaths = commandSource === 'explorer' ? allUris?.map(uri => uri.fsPath) : [vscode.window.activeTextEditor?.document.uri.fsPath] as string[];
  if (!allFilePaths?.length) {
    showMessage(vscode.l10n.t('No file is currently open'), 'error');
    return null;
  }
  let firstFilePath = allFilePaths[0];
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
  const gitRootPath = await getGitRootPath(firstFilePath);
  if (!gitRootPath) {
    showMessage(vscode.l10n.t('This file is not under Git version control'), 'error');
    return null;
  }

  // Get the remote URL
  const remoteUrl = await getGitRemoteUrl(gitRootPath, sessionState);
  if (!remoteUrl) {
    showMessage(vscode.l10n.t('No Git remote URL found'), 'error');
    return null;
  }

  // 从远程 URL 中提取域名
  const domainResult = extractRepoInfoFromRemoteUrl(remoteUrl);
  if (!domainResult.domain) {
    showMessage(vscode.l10n.t('Failed to extract domain from remote URL'), 'error');
    return null;
  }

  console.log('domainResult', domainResult);

  // 根据域名获取匹配的平台
  const platform = getPlatformForDomain(domainResult.domain);
  if (!platform) {
    const message = vscode.l10n.t('GitLink could not detect which platform you use for remote URL "{0}". You can configure custom platforms in settings.', remoteUrl);
    const openSettings = vscode.l10n.t('Open Settings');
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
    showMessage(vscode.l10n.t('Failed to get current branch'), 'error');
    return null;
  }

  // Extract repository path from remote URL
  const repoPath = extractRepoPath(remoteUrl);
  if (!repoPath) {
    showMessage(vscode.l10n.t('Failed to extract repository path from remote URL'), 'error');
    return null;
  }

  const gitUrls: { url: string; fileName: string }[] = [];
  for (const fp of allFilePaths) {
    // Get the relative path from the git root
    const relativePath = path.relative(gitRootPath, fp).replace(/\\/g, '/');
    const fileName = path.basename(fp);
    const fileDirPath = path.dirname(relativePath);

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
      commandSource,
    });
    if (!gitUrl) {
      showMessage(vscode.l10n.t('error.construct.url'), 'error');
      return null;
    }
    gitUrls.push({
      url: gitUrl,
      fileName,
    });
  }
  return gitUrls;
}

// 从远程 URL 中提取仓库路径
export function extractRepoPath(remoteUrl: string): string | null {
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
export function constructGitUrl({
  platform,
  repoPath,
  branch,
  filePath,
  fileName,
  fileDirPath,
  lineStart,
  lineEnd,
  domainResult,
  commandSource,
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
    url = url.replace(/{branch}/g, encodeURIComponent(branch)); // 一些git服务，比如coding，对于包含/的分支名会有问题，这里直接编码
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

export async function getGitRootPath(filePath: string): Promise<string | null> {
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
export async function getGitRemotes(gitRootPath: string): Promise<string[]> {
  try {
    const { stdout } = await execAsync('git remote', { cwd: gitRootPath });
    return stdout.trim().split('\n').filter(remote => remote.length > 0);
  } catch (error) {
    console.error('Error getting git remotes:', error);
    return [];
  }
}

// 改造后的函数
export async function getGitRemoteUrl(gitRootPath: string, sessionState: SessionState): Promise<string | null> {
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
      const config = vscode.workspace.getConfiguration('gitlink');
      const rememberRemoteSelection = config.get('rememberRemoteSelection');
      // 从会话存储中获取之前选择的远程仓库
      const sessionSelectedRemote = sessionState.getSelectedRemote();

      // 如果启用了记住远程选择，并且会话中有保存的选择，则使用它
      if (rememberRemoteSelection && sessionSelectedRemote && remotes.includes(sessionSelectedRemote)) {
        selectedRemote = sessionSelectedRemote;
      } else {
        // 有多个远程仓库，显示选择框
        const quickPickOptions: vscode.QuickPickOptions = {
          placeHolder: vscode.l10n.t('Select a git remote'),
          canPickMany: false,
        };

        selectedRemote = await vscode.window.showQuickPick(remotes, quickPickOptions);

        // 如果用户取消了选择，返回 null
        if (!selectedRemote) {
          return null;
        }

        // 如果启用了记住远程选择，则将选择保存到会话存储中
        if (rememberRemoteSelection) {
          sessionState.setSelectedRemote(selectedRemote);
        }
      }
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
    showMessage(vscode.l10n.t('Error getting git remote URL: {0}', error instanceof Error ? error.message : String(error)), 'error');
    return null;
  }
}

export async function getCurrentBranch(gitRootPath: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: gitRootPath });
    return stdout.trim();
  } catch (error) {
    console.error('Error getting current branch:', error);
    return null;
  }
}

/**
 *
 * // 判断命令来源
 * 如果 uri 存在，则认为是编辑器来源
 * 如果 uri 不存在，则认为是资源管理器/直接命令来源
 */
export function getCommandSource(allUris?: vscode.Uri[]): 'explorer' | 'editor' {
  let source = 'explorer';
  if (!allUris?.length && vscode.window.activeTextEditor) {
    source = 'editor';
  }
  return source as 'explorer' | 'editor';
}

/**
 * 显示消息
 * @param message 消息内容
 * @param level
 * @param others
 */
export function showMessage(message: string, level: 'info' | 'error' | 'warning' = 'info', ...others: any[]) {
  const method = {
    'info': vscode.window.showInformationMessage,
    'warning': vscode.window.showWarningMessage,
    'error': vscode.window.showErrorMessage,
  }[level];
  return method('GitLink: ' + message, ...others);
}


export function getRemoteImageUrl(code: string, language: string) {
  const base64Content = Base64.encode(code);  // 使用 js-base64 进行编码
  return `https://ray.so/#theme=candy&background=white&padding=128&code=${base64Content}&language=${mapLanguageId(language)}`;
}


/**
 * @see https://github.com/highlightjs/highlight.js/blob/main/SUPPORTED_LANGUAGES.md
 * 添加语言标识符映射函数，VSC中针对部分语言的ID在high中无法识别，因此这里做了映射
 */
export function mapLanguageId(languageId: string): string {
  const languageMap: Record<string, string> = {
    'typescriptreact': 'typescript',
    'javascriptreact': 'javascript',
    'shellscript': 'bash',
    'jsonc': 'json',
    'html': 'xml',
  };
  return languageMap[languageId] || languageId;
}
