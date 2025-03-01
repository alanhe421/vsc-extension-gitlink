/**
 * GitLink 扩展的类型定义文件
 */

/**
 * 代码托管平台定义
 */
export interface Platform {
	/**
	 * 平台名称，比如GitHub/腾讯Coding
	 */
	name: string;
	/**
	 * 平台URL模板，比如https://github.com/{repo:path}/blob/{branch}/{file:path}
	 * 支持的变量：
	 * {repo:path}：仓库路径，比如username/repo
	 * {branch}：分支，比如main
	 * {file:path}：文件路径，比如src/index.js
	 * {file:name}：文件名，比如index.js
	 * {file:dir}：文件目录，比如src
	 * {remote:url}：远程仓库域名，比如github.com
	 * {remote:url:path:n}：远程URL路径的第n个段（索引从0开始），比如对于git@github.com:alanhe421/alfred-workflows.git，
	 *                      {remote:url:path:0}为alanhe421，{remote:url:path:1}为alfred-workflows
	 * {user}：用户名或组织名（已废弃，请使用{remote:url:path:0}代替）
	 */
	urlTemplate: string;
}

/**
 * 域名与平台的映射关系
 */
export interface DomainMapping {
	domain: string;
	platform: string;
}

/**
 * 从远程 URL 中提取域名的结果
 */
export interface DomainResult {
	domain: string;
	remoteUrl: string;
	pathSegments: string[]; // 路径段数组
} 