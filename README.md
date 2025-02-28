# GitLink - VS Code Extension

这个 VS Code 扩展允许你在 Git 托管平台的网页版中打开当前正在编辑的文件或在资源管理器中选择的文件，也可以复制链接到剪贴板。支持自定义 Git 托管平台和 URL 模板。

## 功能

- 在编辑器中右键点击文件，选择 "Open in GitHub" 选项，在浏览器中打开文件
- 在编辑器中右键点击文件，选择 "Copy GitHub Link" 选项，复制链接到剪贴板
- 在资源管理器中右键点击文件，选择 "Open in GitHub" 选项，在浏览器中打开文件
- 在资源管理器中右键点击文件，选择 "Copy GitHub Link" 选项，复制链接到剪贴板
- 自动检测 Git 仓库信息，并构建正确的 URL
- 支持 SSH 和 HTTPS 格式的远程 URL
- 在加载项目时自动检测是否为支持的 Git 托管平台，如果不是则提示用户
- 支持自定义 Git 托管平台和 URL 模板
- 支持域名到平台的映射配置

## 使用方法

1. 在 VS Code 中打开一个 Git 仓库项目
2. 在编辑器中打开一个文件，或在资源管理器中选择一个文件
3. 右键点击，选择 "Open in GitHub" 选项在浏览器中打开，或选择 "Copy GitHub Link" 选项复制链接
4. 如果选择打开，默认浏览器将打开该文件在 Git 托管平台上的页面
5. 如果选择复制，链接将被复制到剪贴板，可以粘贴到其他地方使用

## 要求

- 项目必须是一个 Git 仓库
- 项目必须有一个名为 "origin" 的远程仓库

## 扩展设置

此扩展提供以下设置：

* `gitlink.platforms`: 自定义 Git 托管平台配置，包含以下字段：
  * `name`: 平台名称（用户自定义）
  * `urlTemplate`: URL 模板，支持以下变量：
    * `{repo:path}`: 仓库路径（例如 username/repo）
    * `{branch}`: 当前分支名称
    * `{file:path}`: 文件相对路径
    * `{file:name}`: 文件名
    * `{file:dir}`: 文件所在目录路径

* `gitlink.domainRegistry`: 域名到平台的映射配置，包含以下字段：
  * `domain`: 域名（例如 github.com, gitlab.com）
  * `platform`: 平台名称，必须与 `gitlink.platforms` 中定义的平台名称匹配

### 配置示例

```json
"gitlink.platforms": [
  {
    "name": "GitHub",
    "urlTemplate": "https://github.com/{repo:path}/blob/{branch}/{file:path}"
  },
  {
    "name": "GitLab",
    "urlTemplate": "https://gitlab.com/{repo:path}/-/blob/{branch}/{file:path}"
  },
  {
    "name": "Bitbucket",
    "urlTemplate": "https://bitbucket.org/{repo:path}/src/{branch}/{file:path}"
  },
  {
    "name": "Azure DevOps",
    "urlTemplate": "https://dev.azure.com/{repo:path}/_git/{repo:path}?path={file:path}&version=GB{branch}"
  }
],
"gitlink.domainRegistry": [
  {
    "domain": "github.com",
    "platform": "GitHub"
  },
  {
    "domain": "gitlab.com",
    "platform": "GitLab"
  },
  {
    "domain": "bitbucket.org",
    "platform": "Bitbucket"
  },
  {
    "domain": "dev.azure.com",
    "platform": "Azure DevOps"
  }
]
```

## 已知问题

- 如果项目不是支持的 Git 托管平台，扩展会在加载时提示用户，并提供打开设置的选项

## 发布说明

### 0.0.1

初始版本，实现基本功能：
- 在 Git 托管平台中打开文件
- 复制 Git 托管平台链接到剪贴板
- 自动检测项目是否为支持的 Git 托管平台
- 支持自定义 Git 托管平台和 URL 模板

---

**Enjoy!**
