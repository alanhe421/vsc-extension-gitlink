# GitLink - VS Code Extension

这个 VS Code 扩展允许你在 GitHub 网页版中打开当前正在编辑的文件或在资源管理器中选择的文件。

## 功能

- 在编辑器中右键点击文件，选择 "Open in GitHub" 选项
- 在资源管理器中右键点击文件，选择 "Open in GitHub" 选项
- 自动检测 Git 仓库信息，并构建正确的 GitHub URL
- 支持 SSH 和 HTTPS 格式的 GitHub 远程 URL

## 使用方法

1. 在 VS Code 中打开一个 Git 仓库项目
2. 在编辑器中打开一个文件，或在资源管理器中选择一个文件
3. 右键点击，选择 "Open in GitHub" 选项
4. 默认浏览器将打开该文件在 GitHub 上的页面

## 要求

- 项目必须是一个 Git 仓库
- 项目必须有一个名为 "origin" 的远程仓库，指向 GitHub

## 扩展设置

此扩展不需要任何特殊设置。

## 已知问题

- 目前仅支持 GitHub 仓库，不支持其他 Git 托管服务（如 GitLab、Bitbucket 等）

## 发布说明

### 0.0.1

初始版本，实现基本功能：
- 在 GitHub 中打开文件

---

**Enjoy!**
