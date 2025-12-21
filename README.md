# Bread - 阅读增强扩展

专为阅读设计的浏览器扩展，让网页阅读更简单高效。

## 核心功能

- **智能高亮** - 自动提取并高亮搜索关键词
- **仿生阅读** - 英文单词前半部分加粗显示，提升阅读速度
- **阅读引导** - 垂直条纹引导视线流动
- **智能翻译** - 按需翻译，节省资源
- **链接目标提示** - 通过图标区分新标签页和当前页面的链接
- **AI助手** - 集成DeepSeek和OpenAI API，提供智能页面分析和对话功能

## 开发与构建

### 环境要求

- Node.js 18+
- pnpm 8+
- Firefox浏览器（用于开发测试）

### 安装依赖

```bash
pnpm install
```

### 开发模式

启动完整的开发环境，自动监听文件变化并重新加载扩展：

```bash
pnpm run dev:all
```

或者分别运行：

```bash
# 只监听源代码变化进行构建
pnpm run dev

# 只运行web-ext监听构建后的代码
pnpm run dev:ext
```

### 构建生产版本

```bash
pnpm run build
```

### 代码质量检查

```bash
# 类型检查
pnpm run compile

# 代码格式化
pnpm run fmt

# 代码检查
pnpm run lint

# 自动修复代码问题
pnpm run lint:fix
```

### 清理构建产物

```bash
pnpm run clean
```

## 发布到Firefox Add-ons

### 准备工作

1. 在Firefox Add-ons开发者中心注册账号
2. 创建`.env.submit`文件，添加以下内容：

```
FIREFOX_JWT_ISSUER=your_api_key_here
FIREFOX_JWT_SECRET=your_api_secret_here
```

### 发布流程

```bash
# 发布到公开渠道
pnpm run submit

# 发布到非公开渠道
pnpm run submit:unlisted
```

## 项目结构

```
Bread/
├── src/                    # 源代码目录
│   ├── background.ts      # 背景脚本
│   ├── content-scripts/   # 内容脚本
│   ├── popup/            # 弹窗界面
│   └── ai/               # AI服务模块
├── public/                # 静态资源
│   ├── icon/             # 扩展图标
│   └── popup/            # 弹窗HTML模板
├── dist/                  # 构建输出目录
├── scripts/               # 构建脚本
└── manifest.json         # 扩展清单文件
```

## AI功能配置

扩展支持以下AI服务：

1. **OpenAI** - 使用OpenAI API
2. **DeepSeek** - 使用DeepSeek API
3. **模拟模式** - 本地模拟响应，无需API密钥

配置方法：

1. 点击扩展图标打开弹窗
2. 进入"AI配置"标签页
3. 选择AI服务提供商
4. 输入API密钥和端点URL
5. 配置会自动保存

## 支持平台

- Firefox 最新版本

## 许可证

Apache-2.0

**让每一页都成为愉悦的阅读体验** 🍞
