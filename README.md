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
- 每条记录都由 `crypto.getRandomValues` 现场构造（姓名、手机号、邮箱、地址、密码逐段随机组合），不存在固定的候选池轮换

### 图片处理

- 批量压缩与格式转换：PNG / JPEG / WebP 互转，可限制最大宽高并调整画质
- 图片拼接：横向、纵向和网格三种排布，支持间距、留白、背景色与排序，「显示间距与留白」开关可一键贴合成无缝长图
- 网格可切换「填满单元格」（等比放大后居中裁剪，单元格无留白）与完整显示（等比缩放后居中留白）
- 拼接模式采用左右两栏：左侧添加图片与参数，右侧全高预览；预览支持「完整」缩图、「宽度」撑满后纵向滚动，以及在浏览器新标签页打开原图
- 支持拖拽、点击选择与剪贴板粘贴，列表内可以前后调整顺序
- 画布受单边 16384px 与总像素 16.7M 约束，超限会直接提示而不是输出空图
- 全部基于 Canvas 与 `ImageBitmap` 在本地完成，图片不会离开浏览器

### 文本处理

- 清洗：去除行首尾空白、删除空行、去重（保留首次出现）
- 大小写转换在去重之前执行，避免 `Apple` / `apple` 折叠后重新出现重复行
- 行过滤：按关键字或正则保留、剔除匹配行
- 排序与编号：升序、降序、按长度排序、反转、添加自定义起始行号
- 大小写：全大写、全小写、标题式、单词首字母等转换
- 输出：添加前后缀、合并分隔符、生成 JSON 数组字面量，并统计行数、字符、CJK 与字节

### 工作台

- 每日签到清单、当日进度、筛选和本地提醒
- TMDB 电影和电视剧目录，支持名称、演员/导演、类型、地区、年份、评分和排序筛选
- 内嵌 Codex 模型雷达与 IPPure，并可新增、编辑和删除自定义常用网站
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
├── components/
│   ├── common/             跨页面复用组件：页面外壳、工具栏、Tabs、分段控件、收藏按钮
│   ├── layout/             侧栏、顶栏与页面标题
│   ├── tools/              输入/输出编辑器、JSON 树、复制状态
│   ├── CommandPalette.tsx  全局搜索
│   ├── SettingsDrawer.tsx  备份与恢复抽屉
│   └── SiteManagerDialog.tsx
├── config/catalog.ts       工具与内嵌网站目录
├── hooks/useClipboard.ts   统一的复制反馈状态
├── lib/                    纯函数领域模块，全部可在 Node 下直接单测
│   ├── crypto.ts           编解码、哈希与对称加密
│   ├── formatter.ts        格式化与 YAML / Properties 转换
│   ├── timestamp.ts        时间识别、格式输出和时间运算
│   ├── random-data.ts      合成测试数据
│   ├── image.ts            图片加载、压缩、格式转换与拼接
│   ├── text.ts             文本清洗、排序、大小写与统计管道
│   ├── site.ts / backup.ts / checkin.ts / movie.ts / storage.ts / utils.ts / format.ts
│   └── *.test.ts           与模块同目录的 Vitest 用例
├── pages/                  工作台、工具、签到、影视目录和内嵌站点页
├── App.tsx                 全局状态与页面装配
├── styles.css              设计令牌与全部组件样式
└── types.ts                共享类型

functions/api/
├── movies.ts               TMDB 电影 Pages Function
└── tv.ts                   TMDB 电视剧 Pages Function
```

工具目录位于 `src/config/catalog.ts`，每个工具页通过 `ToolPageShell` + `ToolToolbar` + `Tabs` / `SegmentedControl` 装配，业务算法放在 `src/lib/`，因此新增工具只需要实现一个 `lib` 模块和一个页面。HTML / JavaScript 格式化器会按需加载，避免增大首屏包体。

## 检查与构建

```bash
npm run typecheck   # tsc -b
npm test            # vitest run
npm run format      # prettier --write .
npm run verify      # typecheck + test + 生产构建
npm run build
```

生产文件会生成在 `dist/`。测试覆盖本地工具核心算法以及电影/电视剧 Pages Functions；`.github/workflows/ci.yml` 会在推送到 `main` 和 PR 时执行同样的检查。

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

- 编解码、哈希、对称加密、格式化、时间、随机数据、图片和文本工具的输入都在浏览器本地处理，不会上传到服务器。
- 电影和电视剧搜索条件会发送到本站的 Pages Function，并用于查询 TMDB；不保存搜索记录。
- 主题、收藏、最近使用、当前页面和自定义常用网站保存在浏览器 `localStorage`。
- 外部网站区域会直接连接对应第三方站点，并受对方隐私政策和 iframe 策略约束。
