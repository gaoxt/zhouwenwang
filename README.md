# 周文王占卜系统 🔮

一个现代化的中华传统占卜系统，融合古代智慧与现代AI技术，为用户提供专业的六爻、奇门遁甲、手相分析等占卜服务。

## ✨ 项目特色

- 🎯 传承千年占卜智慧，结合AI技术提供深度解读
- 🔮 支持六爻、奇门遁甲、手相分析等经典占卜术
- 👨‍🏫 6位历史名家虚拟大师，不同风格的专业解读
- 📱 响应式设计，支持桌面端和移动端
- 💾 完整的占卜历史管理功能

## 🔧 技术栈

- **前端**: React 19 + TypeScript + Vite 6
- **样式**: Tailwind CSS 4.1
- **状态管理**: Zustand
- **AI服务**: Google Gemini API
- **桌面应用**: Electron

## 🚀 安装步骤

### 环境要求

- Node.js 18+ 
- npm

### 1. 克隆项目

```bash
git clone <repository-url>
cd zhouwenwang-divination
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置API密钥

获取 Google Gemini API 密钥：
- 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
- 创建新的API密钥

**配置方式（二选一）：**

**方式一：代码预配置（推荐）**
```typescript
// 编辑 src/masters/config.ts
export const API_CONFIG = {
  GEMINI_API_KEY: 'AIzaSyC...您的API密钥...', 
};
```

**方式二：设置页面配置**
- 启动应用后进入设置页面
- 在"API配置"中输入密钥

### 4. 启动开发环境

```bash
# Web 版本
npm run dev

# Electron 桌面版本
npm run electron-dev
```

访问 `http://localhost:5173` 开始使用！

## 📦 打包部署

### Web 版本打包

```bash
npm run build
```

构建文件将生成在 `dist/` 目录

### 桌面应用打包

#### Windows 打包

```bash
# 打包 Windows 应用
npm run dist-win

# 或者打包所有平台
npm run dist
```

生成文件：
- `release/周文王占卜 Setup 0.0.0.exe` - Windows 安装包
- `release/win-unpacked/` - 免安装版本

#### macOS 打包

**注意：macOS DMG 打包必须在 macOS 系统上进行**

```bash
# 在 macOS 系统上执行
git clone <repository-url>
cd zhouwenwang-divination
npm install
npm run dist-mac
```

生成文件：
- `release/周文王占卜-0.0.0.dmg` - macOS 安装包
- `release/周文王占卜-0.0.0-mac.zip` - ZIP 压缩包

支持架构：
- Intel Mac (x64)
- Apple Silicon (arm64) - M1/M2/M3 芯片

#### Linux 打包

```bash
npm run dist-linux
```

生成文件：
- `release/周文王占卜-0.0.0.AppImage` - Linux 应用

### 清理构建缓存

如果遇到构建问题，可以清理缓存：

```bash
npm run dist-clean
```

## 🏗️ 项目结构

```
zhouwenwang-divination/
├── public/                 # 静态资源
├── src/                    # 源代码
│   ├── components/         # React 组件
│   ├── games/             # 占卜模块
│   ├── masters/           # AI大师系统
│   └── core/              # 核心功能
├── electron/              # Electron 主进程
├── release/               # 构建输出（不提交到git）
└── dist/                  # Web构建输出
```

## 📋 可用脚本

```bash
# 开发
npm run dev              # 启动 Web 开发服务器
npm run electron-dev     # 启动 Electron 开发环境

# 构建
npm run build           # 构建 Web 版本
npm run dist            # 打包所有平台桌面应用
npm run dist-win        # 仅打包 Windows
npm run dist-mac        # 仅打包 macOS（需在 macOS 上运行）
npm run dist-linux      # 仅打包 Linux

# 工具
npm run lint            # 代码检查
npm run dist-clean      # 清理构建缓存
```

---

**愿古代智慧与现代科技的结合，为您指引人生方向！** 🌟 