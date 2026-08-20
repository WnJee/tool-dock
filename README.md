# ToolDock

面向浏览器的个人工具工作台。编解码、加密、格式化和时间转换全部在本地完成；电影和电视剧目录通过 Cloudflare Pages Functions 安全访问 TMDB。

## 功能

### 编码与加密

- Base64、Base64URL、Base58、Base32、Hex 和 URL 编解码，支持中文与 Emoji
- MD5、SHA-1、SHA-256 和 SHA-512 哈希摘要
- AES-256-GCM、ChaCha20-Poly1305 与 SM4-CBC 加解密，使用 PBKDF2 派生密钥并校验密文完整性
- 一键生成加密安全的 256 位随机密码

### 代码格式化

- JSON 格式化、压缩、转义、反转义和可折叠树形查看
- XML 格式化、压缩和语法校验
- HTML 和 JavaScript 语法感知格式化
- YAML 与 Properties 互转，支持嵌套对象、数组和 Properties 续行

### 时间戳转换

- 自动识别秒、毫秒、微秒 Unix 时间戳、本地日期时间和 ISO 8601
- 同时显示本地时间、ISO 8601、UTC / RFC 2822、本地时区和 Unix 时间戳
- 支持按天、小时、分、秒进行时间加减，并可将运算结果写回继续计算

### 随机测试数据

- 生成成套的国内收货用户和美国账单用户信息
- 生成常见手机号、固话和 QQ、163、Gmail、Outlook 邮箱
- 生成符合常见正则约束的基础、标准、强密码和 PIN

### 工作台

- 每日签到清单、当日进度、筛选和本地提醒
- TMDB 电影和电视剧目录，支持名称、演员/导演、类型、地区、年份、评分和排序筛选
- 内嵌 Codex 模型雷达与 IPPure，并可新增、编辑和删除自定义常用网站
- 节点订阅：维护节点、启用/停用并生成可供 Clash / Mihomo 导入的固定 `/api/subscription` 订阅地址
- 顶部统一的备份与恢复入口，可迁移主题、页面状态、收藏、最近使用、自定义网站和签到数据
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
├── crypto-utils.ts     编解码、哈希与对称加密
├── formatter-utils.ts  格式化与 YAML / Properties 转换
├── timestamp-utils.ts  时间识别、格式输出和时间运算
├── movie-api.ts        电影/电视剧前端 API 客户端
├── storage.ts          本地存储读取
└── App.tsx             全局状态与页面装配

functions/api/
├── movies.ts           TMDB 电影 Pages Function
└── tv.ts               TMDB 电视剧 Pages Function
```

工具目录位于 `src/config/catalog.ts`，四个本地工具分别使用独立页面和工具模块。HTML / JavaScript 格式化器会按需加载，避免增大首屏包体。

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

节点订阅的跨设备使用需要在 Cloudflare Pages 绑定 KV 命名空间 `NODE_SUBSCRIPTIONS`，并设置加密变量 `NODE_ADMIN_TOKEN`。在“节点订阅”页面填写同一个管理令牌后，保存节点会同步到 KV；Clash / Mihomo 客户端使用页面显示的固定 `/api/subscription` 地址即可拉取当前启用节点。接口返回纯文本 Base64 节点列表，不是 JSON；未配置 KV 时，页面仍可在当前浏览器本地维护和复制订阅内容，但远程订阅地址不会包含本地数据。

导入第三方 HTTP / HTTPS 订阅时，页面会通过 `functions/api/fetch-subscription.ts` 走同源 Pages Function 代理请求，避免浏览器 CORS 限制，然后继续解析其中的真实节点。该接口仅允许 HTTP / HTTPS，单次响应限制为 2 MB。

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

- 编解码、哈希、对称加密、格式化和时间工具的输入不会上传到服务器。
- 电影和电视剧搜索条件会发送到本站的 Pages Function，并用于查询 TMDB；不保存搜索记录。
- 主题、收藏、最近使用、当前页面和自定义常用网站保存在浏览器 `localStorage`。
- 外部网站区域会直接连接对应第三方站点，并受对方隐私政策和 iframe 策略约束。
