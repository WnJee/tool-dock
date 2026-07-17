# ToolDock

面向 PC 浏览器的个人工具工作台。所有编码、解码和数据处理都在浏览器本地完成，不依赖自建后端。

## 第一版功能

- Base64 编码 / 解码（支持中文与 Emoji）
- Base58 编码 / 解码
- JSON 格式化、压缩、错误提示和可折叠树形查看
- URL 编码 / 解码
- 时间戳、ISO、CTS 和本地时间转换
- 内嵌 Codex 模型雷达与 IPPure
- 收藏、最近使用、深浅主题、侧栏收起
- `Command/Ctrl + K` 全局搜索
- 外部站点刷新、全屏和新标签页打开
- 每日签到网站清单、当日进度、筛选和本地提醒

## 本地运行

```bash
npm install
npm run dev
```

打开终端显示的本地地址，默认是 <http://127.0.0.1:5173/>。

## 检查与构建

```bash
npm test
npm run build
```

生产文件会生成在 `dist/`，可直接部署到 Cloudflare Pages、Vercel 或其他静态托管服务。

Cloudflare Pages 推荐配置：

- Build command：`npm run build`
- Output directory：`dist`
- Node.js：22 或 24

## 数据与隐私

- 工具输入不会上传到服务器。
- 主题、收藏、最近使用和当前页面保存在浏览器 `localStorage`。
- 外部网站区域会直接连接对应第三方站点，并受对方隐私政策和 iframe 策略约束。
