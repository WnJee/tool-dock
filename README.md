# ToolDock

面向浏览器的个人工具工作台。编解码、加密、格式化和时间转换全部在本地完成；电影和电视剧目录通过 Cloudflare Pages Functions 安全访问 TMDB。

## 功能

### 编码与加密

- Base64、Base58、Base32、Hex 和 URL 编解码，支持中文与 Emoji
- MD5、SHA-1、SHA-256 和 SHA-512 哈希摘要
- AES-256-GCM 加解密，使用 PBKDF2 派生密钥，密文内含随机盐和 IV

### 代码格式化

- JSON 格式化、压缩、转义、反转义和可折叠树形查看
- XML 格式化、压缩和语法校验
- HTML 和 JavaScript 语法感知格式化
- YAML 与 Properties 互转，支持嵌套对象、数组和 Properties 续行

### 时间戳转换

- 自动识别秒、毫秒、微秒 Unix 时间戳、本地日期时间和 ISO 8601
- 同时显示本地时间、ISO 8601、UTC / RFC 2822、本地时区和 Unix 时间戳
- 支持按天、小时、分、秒进行时间加减，并可将运算结果写回继续计算

### 工作台

- 每日签到清单、当日进度、筛选和本地提醒
- TMDB 电影和电视剧目录，支持名称、演员/导演、类型、地区、年份、评分和排序筛选
- 内嵌 Codex 模型雷达与 IPPure，支持刷新、全屏和新标签页打开
- 收藏、最近使用、深浅主题、可收起侧栏和 `Command/Ctrl + K` 全局搜索

## 本地运行

```bash
npm install
npm run dev
```

打开终端显示的本地地址，默认是 <http://127.0.0.1:5173/>。

本地开发服务器会将 `/api` 代理到已部署的 ToolDock Pages Function，因此影片库可以直接预览真实数据，也不需要把 TMDB 凭据保存在本机。

## 项目结构

```text
src/
├── components/         通用布局、命令面板和输出组件
├── config/             工具与内嵌网站目录
├── pages/              工作台、工具、签到、影视目录和内嵌站点页
├── crypto-utils.ts     编解码、哈希与 AES-GCM
├── formatter-utils.ts  格式化与 YAML / Properties 转换
├── timestamp-utils.ts  时间识别、格式输出和时间运算
├── movie-api.ts        电影/电视剧前端 API 客户端
├── storage.ts          本地存储读取
└── App.tsx             全局状态与页面装配

functions/api/
├── movies.ts           TMDB 电影 Pages Function
└── tv.ts               TMDB 电视剧 Pages Function
```

工具目录位于 `src/config/catalog.ts`，三个本地工具分别使用独立页面和工具模块。HTML / JavaScript 格式化器会按需加载，避免增大首屏包体。

## 检查与构建

```bash
npm test
npm run build
```

生产文件会生成在 `dist/`。测试覆盖本地工具核心算法以及电影/电视剧 Pages Functions。

Cloudflare Pages 推荐配置：

- Build command：`npm run build`
- Output directory：`dist`
- Node.js：22 或 24

影片库和电视剧目录还需要在 Cloudflare Pages 项目的设置中添加加密变量 `TMDB_READ_TOKEN`（推荐，值为 Read Access Token）或 `TMDB_API_KEY`。前端不会接触凭据，所有 TMDB 请求都由 `functions/api/movies.ts` 和 `functions/api/tv.ts` 转发。

## 部署到 Cloudflare Pages

首次使用需要登录：

```bash
npx wrangler login
```

之后运行一条命令即可依次执行测试、生产构建和 Pages 部署：

```bash
npm run deploy:pages
```

脚本默认部署到 `tool-dock` 项目的 `main` 分支，生产地址为 <https://tool-dock.pages.dev/>。其他项目或分支可以通过环境变量覆盖：

```bash
CLOUDFLARE_PAGES_PROJECT=my-project CLOUDFLARE_PAGES_BRANCH=preview npm run deploy:pages
```

## 数据与隐私

- 编解码、哈希、AES、格式化和时间工具的输入不会上传到服务器。
- 电影和电视剧搜索条件会发送到本站的 Pages Function，并用于查询 TMDB；不保存搜索记录。
- 主题、收藏、最近使用和当前页面保存在浏览器 `localStorage`。
- 外部网站区域会直接连接对应第三方站点，并受对方隐私政策和 iframe 策略约束。
