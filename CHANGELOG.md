# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.4.6](https://github.com/alanhe421/vsc-extension-gitlink-issues/compare/v1.4.5...v1.4.6) (2025-03-18)

### [1.4.5](https://github.com/alanhe421/vsc-extension-gitlink-issues/compare/v1.4.4...v1.4.5) (2025-03-18)


### Features

* integrate js-base64 for base64 encoding in image URL generation; update package dependencies ([f14a780](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/f14a780b0428b23f2061aa7af1984881542f81e8))

### [1.4.4](https://github.com/alanhe421/vsc-extension-gitlink-issues/compare/v1.4.3...v1.4.4) (2025-03-17)


### Features

* add HTML and TypeScript files for code snippet image generation; implement webview panel with language selection and image handling features ([cc11d43](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/cc11d43705cdcd57b4b22375a2053b011eb639ea))
* enhance webview with dropdown menu for image actions and add remote image opening functionality ([736c655](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/736c65550e43e3dff508286504f4197068a25b10))
* implement remote image URL generation and enhance code image panel with file name support; update webview styles for better display ([a52ddcc](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/a52ddcc19ba8c128020142e2d4232c58aa8b574f))
* update image action button to copy functionality and simplify image generation process without style modifications ([ce4faef](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/ce4faef85b94f125d13e02301a49621c2a61aaa6))

### [1.4.3](https://github.com/alanhe421/vsc-extension-gitlink-issues/compare/v1.4.2...v1.4.3) (2025-03-17)


### Features

* add highlightjs-line-numbers.js for line numbering support in code snippets; update package.json and index.html accordingly ([22ff1db](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/22ff1db515d831fab0561eaf19895a1adb9b612a))
* add selection change listener in CodeImagePanel to update content based on editor selection; store supported languages ([faaaba9](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/faaaba9a5998cde7e4dbbc5589631982dcd03df5))
* add setting to use remote service for code snippet images in README ([2494d4d](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/2494d4dcb26483abf5f2d8c961e93af84d31e476))

### [1.4.2](https://github.com/alanhe421/vsc-extension-gitlink-issues/compare/v1.4.1...v1.4.2) (2025-03-17)

### [1.4.1](https://github.com/alanhe421/vsc-extension-gitlink-issues/compare/v1.4.0...v1.4.1) (2025-03-17)


### Features

* add html2canvas support for capturing code snippets as images; update resource handling in CodeImagePanel ([dad62c0](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/dad62c0474ce8e6589a2318cde40f398637eddf6))
* integrate highlight.js for code syntax highlighting and add support for multiple programming languages ([031eb34](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/031eb3476e9fef7f6f3e322ee61891f1911b5e0c))
* update localization strings for image handling and code snippets in English and Chinese; enhance button labels in CodeImagePanel for better user experience ([ecadcd7](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/ecadcd7840a83dcf1cf9b5bd4c53e35bbe968c11))


### Bug Fixes

* update localization strings to English for better clarity and consistency in package.nls.json; change button labels in CodeImagePanel to English ([b591a4f](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/b591a4f11c04de09248d491b1dbbd070f9d0d06e))

## [1.4.0](https://github.com/alanhe421/vsc-extension-gitlink-issues/compare/v1.3.2...v1.4.0) (2025-03-17)


### Features

* add configuration option to use remote service for code snippet images and update localization descriptions ([c857b1a](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/c857b1aa5e975dd3b9537a8e5603368417b7468d))
* add utility functions for Git repository detection, remote URL extraction, and Git URL construction ([a608127](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/a608127a9f56c0a0fd6ae926ccbbc44a1fd53e96))
* implement CodeImagePanel for displaying code snippets as images and update activation logic to use it ([76c6b60](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/76c6b602f6178acc3c9b180a1885b893313566e6))


### Bug Fixes

* include language parameter in carbon URL for improved code snippet rendering ([2dce06f](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/2dce06f84b79efa9abeb8a13968581c491726c13))

### [1.3.3](https://github.com/alanhe421/vsc-extension-gitlink-issues/compare/v1.3.2...v1.3.3) (2025-03-16)


### Bug Fixes

* include language parameter in carbon URL for improved code snippet rendering ([2dce06f](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/2dce06f84b79efa9abeb8a13968581c491726c13))

### [1.3.2](https://github.com/alanhe421/vsc-extension-gitlink-issues/compare/v1.3.0...v1.3.2) (2025-03-14)


### Features

* add localization support for messages and commands in English and Chinese, and update package configuration for l10n ([dc19a74](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/dc19a74cd0bc9d378fb0abee986bca2f5660c240))

## [1.3.0](https://github.com/alanhe421/vsc-extension-gitlink-issues/compare/v1.1.0...v1.3.0) (2025-03-13)


### Features

* add "Create GitHub Snippet Image" command and update README with new feature ([4ffba75](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/4ffba75ab929e177013d6faee66af75a60476562))
* localize extension messages and commands for better user experience ([93be06d](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/93be06d58e8b4266ffc0a00a78b9a5b5711b931f))


### Bug Fixes

* update error messages for carbon snippets to use "code snippets" for clarity in English and Chinese localization ([d387996](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/d3879963ce0db9fbb49806ee40e7af3354102c3f))

## [1.2.0](https://github.com/alanhe421/vsc-extension-gitlink-issues/compare/v1.1.0...v1.2.0) (2025-03-13)


### Features

* add "Create GitHub Snippet Image" command and update README with new feature ([4ffba75](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/4ffba75ab929e177013d6faee66af75a60476562))

## [1.1.0](https://github.com/alanhe421/vsc-extension-gitlink-issues/compare/v1.0.0...v1.1.0) (2025-03-12)


### Features

* add remote selection memory configuration option ([56b66b2](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/56b66b219f103be27434878ef5f589ce263214a0))
* implement SessionState class for managing remote selection ([560e28d](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/560e28d4e3801fae39c3c20d3c511d7a217e65d2))

## [1.0.0](https://github.com/alanhe421/vsc-extension-gitlink-issues/compare/v0.1.9...v1.0.0) (2025-03-11)


### Features

* add support for Aliyun Codeup Git platform (codeup.aliyun.com) ([8ebbcac](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/8ebbcacc511bfa3c8a5581b2575b7042e3d39c05))
* add support for WeChat Git platform (git.weixin.qq.com) ([fbe0348](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/fbe03489553b758f97a1ff5568504241ed71fdc5))

### 0.1.9 (2025-03-06)


### Features

* add 'Copy GitHub Markdown Snippet' command and reorganize command groups in package.json ([70abfb2](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/70abfb26efd8e534f8410061705f5ac8228c0941))
* add command to copy GitHub Markdown link to clipboard ([0f72747](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/0f7274745329e7e5795bf2fc58fc25c1c395ecc7))
* add command to copy GitHub Markdown link to gitlink group ([890a06e](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/890a06ef562bd9072fd93674ddeffcebef039a96))
* add compact menu configuration option for GitLink ([c367a96](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/c367a964eba1e3be21f4ff7ea178280735ba69dc))
* add Gitee.com platform mapping to domain configuration ([68b37ae](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/68b37aebb06b8b59c92f0d9c712c9aa2d036d297))
* add GitLab support to custom Git hosting platforms configuration ([c44cb58](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/c44cb58a83a662da8a076ad508feafff924162ed))
* add keywords to package.json for improved discoverability ([4969476](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/49694765a5db4d6a22716e619d9503145e0ae76a))
* add line number support in Git URL construction for improved link sharing ([29f16f5](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/29f16f5b25766c3297c00f1848ed42985a9b48f4))
* add markdown descriptions for Git hosting platforms and domain mapping in package.json ([d8a0f59](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/d8a0f595f5e81f0ac06ea0341a285da7dec95b3b))
* add repository field to package.json for GitHub URL ([cdaba70](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/cdaba7010982767993f30caddff9294ee205a5ed))
* add support for additional GitHub domain in package.json ([2daaf4c](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/2daaf4ca1e89b0fe597749fcb2dee79e80e46d16))
* bump version to 0.1.0 in package.json and package-lock.json ([4ce6051](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/4ce60519dcdba6b38552dd4529acad48a42672b5))
* bump version to 0.1.1 in package.json and package-lock.json ([a6280de](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/a6280de878cc7c274bab7be3491528940dfb26c3))
* bump version to 0.1.2 in package.json and package-lock.json ([a5db320](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/a5db320131639354883f087d066f5dec2842e2e9))
* bump version to 0.1.3 in package.json and package-lock.json ([e8dfa67](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/e8dfa67be97ea16687fc0fb97a677cbf1045eb84))
* bump version to 0.1.4 in package.json and package-lock.json ([d9fda07](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/d9fda0718102819212568aad327f262f35e03035))
* bump version to 0.1.5 in package.json and package-lock.json ([43f2dab](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/43f2dab82ea053f22d8494f5671c2220dc60451b))
* bump version to 0.1.6 and reorganize menu items for GitHub markdown link ([6acb84f](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/6acb84fd9e702b1838cb4a677d572f561cf0ec9a))
* encode branch names in URL to handle special characters for compatibility with certain git services ([9ca6f45](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/9ca6f4501b41ae234c37b4cd4fc958739b161647))
* enhance getGitUrl to support multiple file URLs and update clipboard handling ([464517c](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/464517c4b2319558ba3c21f6778f9c85f9c36136))
* enhance remote URL retrieval and update version to 0.0.8 in package.json ([2880ebe](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/2880ebee9f428dc406998de4e5e9777360e5e718))
* refactor command registration to handle optional URI parameters ([89c1bf8](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/89c1bf8d7e54a7767e648388c11437d13a059873))
* refactor message handling and add 'Copy GitHub Markdown Snippet' command ([7f4b4a9](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/7f4b4a992fea5be1a27255f523a81dddde14b9fd))
* update getGitUrl function to accept all URIs for improved handling ([3134ac7](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/3134ac7f576885e5427892255136bb7dbff7efbe))
* update gitlink command groups in package.json for better organization ([8bc0334](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/8bc0334d31829842897682ce5a72467c0f732210))
* update language detection method and enhance README with new command ([20e2271](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/20e22719e1a0755a8c1c8ef73d16e7e4c7938872))
* update version to 0.0.10 in package.json and package-lock.json ([1a0fc36](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/1a0fc36f2d592f0546e370785f598387407c39cf))
* update version to 0.0.11 in package.json and package-lock.json ([7c9f553](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/7c9f553c49a261c373233b425e981446907ee910))
* update version to 0.0.9 and change repository URL in package.json ([7955ef3](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/7955ef3c29343eda9635255b65045da6276fe3cf))
* update vscode:publish script to include packaging step ([5ae97ac](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/5ae97acc93de6f423e151974e0da01510e01c97b))


### Bug Fixes

* enhance Git repository detection with additional warning messages ([b040b14](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/b040b1415ec5331a69b9e7aa5e0a72d9f29b4a4f))
* improve cwd determination in getGitRootPath function for better Git root path retrieval ([a87f4a1](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/a87f4a1103ad40b0b106177647e7aba191e72f45))
* improve error message for undetected Git platform in extension.ts ([a15bc68](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/a15bc68397365ab8d39337cbb50dcafb370ff394))
* improve URL display in open external command ([47c6508](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/47c65083014eceab4dd0dace1f379231de725069))
* update package.json for naming convention and version bump ([17a3ca0](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/17a3ca091ecb2f0655b59414c9c48b57110a2bba))
* update package.json scripts for improved packaging and publishing ([20191ba](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/20191ba5c064971d9ca0013d03322f46fb18c22c))
* update Visual Studio Marketplace installs badge to be clickable ([8539268](https://github.com/alanhe421/vsc-extension-gitlink-issues/commit/8539268d17fdab23731c161bea6bf43c117ada07))

### 0.1.8 (2025-03-03)

# Change Log

All notable changes to the "gitlink" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Initial release