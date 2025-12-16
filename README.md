# 周文王占卜系统 🔮

一个现代化的中华传统占卜系统，融合古代智慧与现代AI技术，为用户提供专业的六爻、奇门遁甲、八字推命、手相分析、周公解梦等占卜服务。

## ✨ 项目特色

- 🎯 传承千年占卜智慧，结合AI技术提供深度解读
- 🔮 支持六爻、奇门遁甲、八字推命、手相分析、周公解梦等经典占卜术
- 📊 **人生K线图**: 基于八字命理的100年人生运势可视化分析，量化评分系统
- 👨‍🏫 9位历史名家虚拟大师，不同风格的专业解读（古代圣贤+当代名人）
- 🔒 后端API代理服务，保护API密钥安全
- 📱 响应式设计，支持桌面端和移动端
- 💾 完整的占卜历史管理功能

## 📱 项目展示

<table>
  <tr>
    <td align="center">
      <img src="zhouwenwang-divination/public/img/home.png" alt="主页界面" width="400"/>
      <br/>
      <b>🏠 主页界面</b>
      <br/>
      <sub>简洁优雅的主页设计，提供多种占卜方式选择</sub>
    </td>
    <td align="center">
      <img src="zhouwenwang-divination/public/img/liuyao.png" alt="六爻占卜界面" width="400"/>
      <br/>
      <b>🔮 六爻占卜</b>
      <br/>
      <sub>传统六爻占卜，包含摇卦动画和详细解读</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="zhouwenwang-divination/public/img/qimen.png" alt="奇门遁甲界面" width="400"/>
      <br/>
      <b>⭐ 奇门遁甲</b>
      <br/>
      <sub>专业奇门遁甲分析，提供时局预测和策略建议</sub>
    </td>
    <td align="center">
      <img src="zhouwenwang-divination/public/img/palmistry.png" alt="手相分析界面" width="400"/>
      <br/>
      <b>✋ 手相分析</b>
      <br/>
      <sub>AI驱动的手相识别分析，深度解读手纹命理</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="zhouwenwang-divination/public/img/k1.png" alt="人生K线图界面1" width="400"/>
      <br/>
      <b>📊 人生K线图 - 运势分析</b>
      <br/>
      <sub>基于八字命理的100年人生运势可视化分析，量化评分系统</sub>
    </td>
    <td align="center">
      <img src="zhouwenwang-divination/public/img/k2.png" alt="人生K线图界面2" width="400"/>
      <br/>
      <b>📊 人生K线图 - 详细解读</b>
      <br/>
      <sub>AI智能分析，提供早年、中年、晚年等不同阶段的详细运势解读</sub>
    </td>
  </tr>
</table>

## 🔧 技术栈

- **前端**: React 19 + TypeScript + Vite 6
- **后端**: Node.js + Express (API代理服务)
- **样式**: Tailwind CSS 4.1
- **状态管理**: Zustand
- **AI服务**: Google Gemini API
- **桌面应用**: Electron

## 🎭 虚拟大师团队

### 🏛️ 古代圣贤
- **周文王** (西周) - 易学之祖，精通八卦理论
- **诸葛亮** (三国) - 智谋无双，精通奇门遁甲
- **鬼谷子** (战国) - 纵横家始祖，善于观人识心
- **袁守诚** (唐朝) - 著名术士，精通算命卜卦
- **李博文** (明朝) - 易学大师，博学多才
- **陈图南** (宋朝) - 相学宗师，精通面相手相

### 🎬 当代名人
- **大张伟** (当代) - 音乐人兼综艺咖，幽默风趣的现代解读
- **雷佳音** (当代) - 知名演员，诚恳接地气的朴实风格
- **刘小光** (当代) - 东北二人转演员，浓厚东北味儿的幽默解读

## 🚀 安装步骤

### 环境要求

- **Node.js 20+** (推荐使用 Node.js 20 LTS 或更高版本)
- npm 10+

> ⚠️ **重要提示**: 项目依赖（如 `electron@34.5.8`、`vite@6.3.5` 等）需要 Node.js 20+ 才能正常运行。使用 Node.js 18 会导致依赖安装警告和潜在的运行时兼容性问题。
>
> 如果当前使用的是 Node.js 18，请升级到 Node.js 20 LTS：
> - 访问 [Node.js 官网](https://nodejs.org/) 下载安装
> - 或使用 nvm: `nvm install 20 && nvm use 20`

### 1. 克隆项目

```bash
git clone <repository-url>
cd zhouwenwang-divination
```

### 2. 检查 Node.js 版本

```bash
node --version  # 应该显示 v20.x.x 或更高版本
```

如果版本低于 20，请先升级 Node.js。

### 3. 安装依赖

```bash
npm install
```

> 💡 **提示**: 如果安装过程中出现引擎兼容性警告（`npm warn EBADENGINE`），说明 Node.js 版本不符合要求，请升级到 Node.js 20+。

### 4. 配置API密钥

获取 Google Gemini API 密钥：
- 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
- 创建新的API密钥

**配置方式（二选一）：**

**方式一：启动后端代理服务（推荐，安全）**

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 配置环境变量
cp env.example .env
# 编辑 .env 文件，设置 GEMINI_API_KEY=你的API密钥

# 启动后端服务
npm start
```

后端服务启动在 `http://localhost:3001`，API密钥安全保存在服务器端。

**方式二：直接使用API密钥**

在前端直接配置API密钥（简单自用）：

```typescript
// 编辑 src/masters/config.ts
export const API_CONFIG = {
  GEMINI_API_KEY: 'AIzaSyC...您的API密钥...', 
};
```

或在设置页面中输入密钥。

### 5. 启动开发环境

**如果使用后端代理服务：**

```bash
# 1. 启动后端服务（新终端窗口）
cd backend
npm start

# 2. 启动前端服务（另一个终端窗口）
npm run dev

# 或启动 Electron 桌面版本
npm run electron-dev
```

**如果直接使用API密钥：**

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
├── backend/               # 后端API代理服务
│   ├── server.js         # Express服务器
│   ├── env.example       # 环境变量示例
│   └── package.json      # 后端依赖
├── public/               # 静态资源
├── src/                  # 前端源代码
│   ├── components/       # React 组件
│   ├── games/           # 占卜模块
│   ├── masters/         # AI大师系统
│   └── core/            # 核心功能
├── electron/            # Electron 主进程
├── release/             # 构建输出（不提交到git）
└── dist/                # Web构建输出
```

## 📋 可用脚本

```bash
# 前端开发
npm run dev              # 启动 Web 开发服务器
npm run electron-dev     # 启动 Electron 开发环境

# 后端服务
cd backend
npm install             # 安装后端依赖
npm start               # 启动后端API代理服务
npm run dev             # 启动后端开发模式（自动重启）

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