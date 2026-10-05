# Yirong Qiang — Personal Website

基于 Astro、TypeScript 和原生 CSS 的个人学术主页，面向 GitHub Pages 输出纯静态网页。个人简介、研究成果和项目资料集中维护，视觉交互在浏览器中运行，无需后端服务。

本项目提供可部署的站点源码与自动发布流程；交付时未创建远程仓库，也未将网站上线。默认目标网址为 `https://apromisedland.github.io/`，同时支持项目仓库子路径与自定义域名。

## 本地运行

需要 Node.js **22.12 或更新版本**（推荐 22.x 或 24.x LTS），以及随 Node.js 安装的 npm。依赖版本由 `package-lock.json` 锁定。

```sh
npm ci
npm run dev
```

在浏览器中打开终端显示的本地地址，默认是 `http://localhost:4321/`。

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动开发服务器，修改后即时更新 |
| `npm run check` | 执行 Astro 与 TypeScript 检查 |
| `npm run build` | 生成可发布的 `dist/` 目录 |
| `npm run preview` | 在本地预览已构建的站点 |
| `npm test` | 验收已构建站点的布局、链接、隐私与可访问性 |

常规发布前检查：

```sh
npm run check
npm run build
npm run preview
```

本机已安装 Chrome，可直接使用，无需下载 Chromium。在 PowerShell 中执行：

```powershell
$env:BROWSER_CHANNEL = 'chrome'
npm run build
npm test
```

测试会自行启动随机本地端口，覆盖 390×844、768×1024、1440×1000，先触发全部内容入场再截图。根路径截图保存在 `test-results/root/`，项目子路径截图保存在 `test-results/Profile/`；同时检查完整图示、站内资源、分享元数据、本地字体、无 JavaScript 阅读、键盘焦点、减少动画偏好及严重可访问性问题。测试只请求本地构建资源，不访问论文等外部网站。Edge 可将 `BROWSER_CHANNEL` 设为 `msedge`；没有已安装浏览器的环境可执行 `npx playwright install chromium`，并移除 `BROWSER_CHANNEL` 后运行测试。

如果本地保留了原始 `CV.docx`，测试会临时提取其中的手机号，与发布文本对比，不记录号码。在不含原始 CV 的干净 checkout 中，这项来源对比会跳过，页面手机号格式检测与 Word 文件泄漏检查仍然执行。子路径验收时，构建和测试须使用相同的 `BASE_PATH`。

## 内容维护

- **个人资料、论文与项目**：编辑 `src/data/profile.ts`，保持作者顺序、会议年份、论文状态与原始来源一致。更新外部链接后检查目标页面是否可访问。
- **图片**：将公开展示的图片放入 `public/images/`，使用清晰、稳定的文件名；素材出处与许可证记录在 `ASSET_SOURCES.md`。
- **公开 CV**：当前使用用户提供的 `public/cv/CV_YirongQiang.pdf`，所有下载入口指向该文件。文件名保持不变即可直接替换；发布前确认 PDF 仅含希望公开的信息。
- **原始资料**：根目录的 `CV*.docx` 与 `CV*.pdf` 仅作为本地资料，不提交到 Git，也不放入 `public/`。只有 `public/cv/` 下指定的 PDF 随站点发布。

`scripts/build_cv.py` 保留为可选的 CV 候选稿生成工具，默认输出 `tmp/cv/Yirong-Qiang-CV-generated.pdf`，不会覆盖当前用户提供的公开 PDF。使用时先执行 `npm ci`，再通过已验证的 Python 解释器绝对路径运行脚本（需 `reportlab`）。脚本保留原始 `CV.docx` 中完整履历并移除手机号，论文元信息同步自 `src/data/profile.ts`。生成后需逐页核对正文和隐私，再决定是否作为新的公开 CV。不要把依赖安装进共享 Python runtime。

静态资源会随构建复制到 `dist/`。部署流程只上传 `dist/`，无需把整个源码目录作为 Pages 发布内容。

## GitHub Pages 部署

### 推荐：账号主页

1. 在 GitHub 创建名为 **`apromisedland.github.io`** 的仓库，并将站点源码及 `package-lock.json` 推送到 `main` 或 `master` 分支。
2. 打开仓库 **Settings → Pages → Build and deployment**，将 **Source** 设为 **GitHub Actions**。
3. 打开 **Actions → Deploy to GitHub Pages**，手动运行一次流程；后续对 `main` 或 `master` 的推送会自动触发。
4. 等待 `Check and build` 与 `Publish site` 都成功，通过部署记录中的链接访问网站。账号主页默认地址为 `https://apromisedland.github.io/`。

流程先安装锁定依赖，执行 `npm run check` 和 `npm run build`，再发布 `dist/`。GitHub Pages 的 URL 与子路径由 `actions/configure-pages` 读取，无需为工作流填写站点密钥。

如果仓库配置了部署环境分支保护，请允许实际用于发布的 `main` 或 `master` 分支访问 `github-pages` 环境。

### 项目仓库与子路径

也可以将源码放到其他仓库，例如 `Profile`，对应地址为 `https://apromisedland.github.io/Profile/`。仍按上述步骤启用 GitHub Actions；工作流会自动把站点 origin 与项目子路径分别传给 Astro。

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `SITE_URL` | `https://apromisedland.github.io` | 站点 origin，仅含协议与域名，不包含项目路径 |
| `BASE_PATH` | `/` | 站点路径；项目仓库示例为 `/Profile/` |

在 Windows PowerShell 中模拟项目子路径：

```powershell
$env:SITE_URL = 'https://apromisedland.github.io'
$env:BASE_PATH = '/Profile/'
npm run build
npm test
npm run preview
```

随后访问预览服务器的 `/Profile/` 路径，并检查图片、CV 下载和站内导航。测试完成后可在同一个 PowerShell 会话中恢复默认配置：

```powershell
Remove-Item Env:SITE_URL -ErrorAction SilentlyContinue
Remove-Item Env:BASE_PATH -ErrorAction SilentlyContinue
npm run build
```

### 自定义域名

本项目不预置 `CNAME`。需要自定义域名时，先在仓库 **Settings → Pages → Custom domain** 配置域名，再按照 GitHub 文档设置 DNS 与 HTTPS，最后重新运行发布流程。工作流会读取 Pages 中的实际 origin 与路径；不要把完整项目 URL 同时填入 `SITE_URL` 与 `BASE_PATH`。

## 验证与排查

- 本地预览时检查桌面与手机布局、键盘导航、动态效果偏好、论文链接和 CV 下载。
- 图片或样式在项目仓库下出现 404 时，核对 `BASE_PATH`，并确认资源链接使用站点的路径处理方式。
- `Read GitHub Pages configuration` 失败时，先确认仓库的 Pages Source 已设置为 **GitHub Actions**。
- 构建失败时查看 `Check and build` 日志；发布失败时查看 `Publish site` 日志及 `github-pages` 环境的分支规则。

参考：[GitHub Pages 简介](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)、[配置发布来源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)、[Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[自定义域名](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)。
