# GitLink - VS Code Extension

A VS Code extension that allows you to open the web version of files in your Git repository.


![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/AlanHe.cn-alanhe-gitlink)

![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/AlanHe.cn-alanhe-gitlink)

Currently supports [GitHub](https://github.com), [GitLab](https://gitlab.com), [Tencent Coding.net](https://coding.net), and other Git hosting platforms through custom configuration.

> **Note for JetBrains IDE users**: If you're using IntelliJ IDEA, WebStorm, or other JetBrains IDEs, we recommend using [GitLink by Ben Gibson](https://github.com/ben-gibson/GitLink) which provides similar functionality for JetBrains platforms.

![screenshot1.gif](https://private-user-images.githubusercontent.com/9245110/418260403-7729ab71-81f8-4d20-bf41-dca3c0a82ded.gif?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDA4MTg1NTMsIm5iZiI6MTc0MDgxODI1MywicGF0aCI6Ii85MjQ1MTEwLzQxODI2MDQwMy03NzI5YWI3MS04MWY4LTRkMjAtYmY0MS1kY2EzYzBhODJkZWQuZ2lmP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI1MDMwMSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTAzMDFUMDgzNzMzWiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9ODc3ZDIwNDE0YWQxY2ZjMTU4YTM5NmQwODZlMjY1ODg2YWRmYzVhNGI2ZDBmMmQzMzhhZTBjYjQxNmYzZGU5NSZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.NmD945P7bEtWxBUFo3dx4Fq71N10AI7rh-MoADaCqSo)

## Features

- Right-click on a file in the editor and select "Open in GitHub" to open the file in your browser
- Right-click on a file in the editor and select "Copy GitHub Link" to copy the link to your clipboard
- Right-click on a file in the explorer and select "Open in GitHub" to open the file in your browser
- Right-click on a file in the explorer and select "Copy GitHub Link" to copy the link to your clipboard
- Automatically detects Git repository information and constructs the correct URL
- Supports both SSH and HTTPS remote URL formats
- Automatically detects if the project uses a supported Git hosting platform when loading, and prompts the user if not
- Supports custom Git hosting platforms and URL templates
- Supports domain-to-platform mapping configuration

## Usage

1. Open a Git repository project in VS Code
2. Open a file in the editor or select a file in the explorer
3. Right-click and select "Open in GitHub" to open in the browser, or select "Copy GitHub Link" to copy the link
4. If you choose to open, your default browser will open the file's page on the Git hosting platform
5. If you choose to copy, the link will be copied to your clipboard for use elsewhere

## Requirements

- The project must be a Git repository
- The project must have a remote repository named "origin"

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
    * `{user}`: Username or organization name (deprecated, use {remote:url:path:0} instead)

* `gitlink.domainRegistry`: Domain-to-platform mapping configuration, with the following fields:
  * `domain`: Domain (e.g., github.com, gitlab.com)
  * `platform`: Platform name, must match a platform name defined in `gitlink.platforms`

### Configuration Example

```json
"gitlink.platforms": [
  {
    "name": "GitHub",
    "urlTemplate": "https://{remote:url}/{repo:path}/blob/{branch}/{file:path}"
  },
  {
    "name": "GitLab",
    "urlTemplate": "https://{remote:url}/{repo:path}/-/blob/{branch}/{file:path}"
  },
  {
    "name": "Bitbucket",
    "urlTemplate": "https://{remote:url}/{repo:path}/src/{branch}/{file:path}"
  },
  {
    "name": "Azure DevOps",
    "urlTemplate": "https://{remote:url}/{repo:path}/_git/{repo:path}?path={file:path}&version=GB{branch}"
  },
  {
    "name": "Coding",
    "urlTemplate": "https://{remote:url}/{remote:url:path:0}/{remote:url:path:1}/blob/{branch}/{file:path}"
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
  },
  {
    "domain": "e.coding.net",
    "platform": "Coding"
  }
]
```

## Known Issues

- If the project is not using a supported Git hosting platform, the extension will prompt the user when loading and provide an option to open settings

**Enjoy!**
