# GitLink - VS Code Extension

A VS Code extension that allows you to open the web version of files in your Git repository.


![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/AlanHe.cn-alanhe-gitlink)

![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/AlanHe.cn-alanhe-gitlink)

[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/AlanHe.cn-alanhe-gitlink)](https://marketplace.visualstudio.com/items?itemName=AlanHe.cn-alanhe-gitlink)

![Localization Status](https://img.shields.io/badge/i18n-English%20%7C%20简体中文-blue)

> **Note for JetBrains IDE users**: If you're using IntelliJ IDEA, WebStorm, or other JetBrains IDEs, we recommend using [GitLink by Ben Gibson](https://github.com/ben-gibson/GitLink) which provides similar functionality for JetBrains platforms.

![screenshot1.gif](https://static.1991421.cn/2025/418260403-7729ab71-81f8-4d20-bf41-dca3c0a82ded.gif)
![2025-03-02-110100.jpeg](https://static.1991421.cn/2025/2025-03-02-110100.jpeg)

## Features

- Right-click on a file in the editor and select "Open in GitHub" to open the file in your browser.
- Right-click on a file in the editor and select "Copy GitHub Link" to copy the link to your clipboard.
- Right-click on a file in the explorer and select "Open in GitHub" to open the file in your browser.
- Right-click on a file in the explorer and select "Copy GitHub Link" to copy the link to your clipboard.
- Right-click on a file in the explorer and select "Copy GitHub Markdown" to copy the markdown link to your clipboard.
- Right-click on a file in the explorer and select "Copy GitHub Markdown Snippet" to copy the markdown snippet to your clipboard.
- Right-click on a file in the explorer and select "Create GitHub Snippet Image" to open ray.so and create a Code Snippet Image.
- Support multi-file copy in explorer.
- Supports both SSH and HTTPS remote URL formats.
- Automatically detects if the project uses a supported Git hosting platform when loading, and prompts the user if not
- Supports custom Git hosting platforms and URL templates

## Built-in Supported Platforms

- [GitHub](https://github.com)
- [GitLab](https://gitlab.com)
- [腾讯Coding.net](https://coding.net)
- [腾讯工蜂](https://git.code.tencent.com)
- [Gitee](https://gitee.com)
- [微信开发者代码管理](https://git.weixin.qq.com)
- [阿里云Codeup](https://codeup.aliyun.com)

You can also add your own platform by configuring the `gitlink.platforms` and `gitlink.domainRegistry` settings.

## Extension Settings

This extension provides the following settings:

* `gitlink.platforms`: Custom Git hosting platform configuration, with the following fields:
  * `name`: Platform name (user-defined)
  * `urlTemplate`: URL template, supporting the following variables:
    * `{repo:path}`: Repository path (e.g., username/repo)
    * `{branch}`: Current branch name
    * `{file:path}`: Relative file path
    * `{file:name}`: File name
    * `{file:dir}`: File directory path
    * `{remote:url}`: Remote repository domain (e.g., github.com)
    * `{remote:url:path:n}`: The nth segment of the remote URL path (index starts from 0) (e.g., for git@github.com:alanhe421/alfred-workflows.git, {remote:url:path:0} is alanhe421, {remote:url:path:1} is alfred-workflows)
    * `{line:start}`: Line number (e.g., 1)
    * `{line:end}`: Line number (e.g., 10)

* `gitlink.domainRegistry`: Domain-to-platform mapping configuration, with the following fields:
  * `domain`: Domain (e.g., github.com, gitlab.com)
  * `platform`: Platform name, must match a platform name defined in `gitlink.platforms`

* `gitlink.useCompactMenu`: Whether to use compact menu style. When enabled, all GitLink commands will be grouped under a single submenu to reduce clutter in context menus. When disabled, main commands will appear directly in the context menu. Default is false.

* `gitlink.rememberRemoteSelection`: Whether to remember the remote selection for the current session. When enabled, the extension will remember your remote selection for the current session. You'll only be prompted to select a remote once per project session. When disabled, you'll be prompted each time. Default is false.

* `gitlink.useRemoteForCodeImage`: Whether to use remote service for code snippet images. When enabled, the extension will use the remote service - ray.so to create code snippet images. When disabled, the extension will use the local service to create code snippet images. Default is false.

## Internationalization

GitLink supports multiple languages:

- English
- 简体中文 (Simplified Chinese)

The extension automatically detects your VS Code language setting and displays the interface in the appropriate language.

## Sponsor

- [PayPal ](https://www.paypal.com/paypalme/alanhe421)
- [微信打赏](https://github.com/alanhe421/alfred-workflows/blob/master/.github/wechat-award.jpg)

<a href="https://www.buymeacoffee.com/alanhg" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" >

## Known Issues

- If the project is not using a supported Git hosting platform, the extension will prompt the user when loading and provide an option to open settings

**Enjoy!**
