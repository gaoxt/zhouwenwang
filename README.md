# 周文王占卜系统 🔮

一个现代化的中华传统占卜系统，融合古代智慧与现代AI技术，为用户提供专业的六爻、奇门遁甲、手相分析等占卜服务。

## ✨ 项目亮点

- 🎯 **传统与现代的完美结合** - 传承千年占卜智慧，结合AI技术提供深度解读
- 🔮 **多种占卜方式** - 支持六爻、奇门遁甲、手相分析等经典占卜术
- 👨‍🏫 **AI大师团队** - 6位历史名家虚拟大师，不同风格的专业解读
- 📱 **现代化界面** - 响应式设计，支持桌面端和移动端
- 💾 **历史记录** - 完整的占卜历史管理，随时回顾过往预测
- ⚡ **实时分析** - 流式文本显示，提供沉浸式占卜体验

## 🎭 AI大师阵容

| 大师 | 朝代 | 专长 | 特色 |
|------|------|------|------|
| 👑 周文王 | 西周 | 易经八卦 | 易学之祖，深谙八卦变化之理 |
| 💡 诸葛亮 | 三国 | 奇门遁甲 | 智谋无双，精通战略分析 |
| 👁️ 鬼谷子 | 战国 | 观人识心 | 纵横家始祖，洞察人性本质 |
| 🧭 袁守诚 | 唐朝 | 算命卜卦 | 预知吉凶，精通各种占卜术 |
| 📚 李博文 | 明朝 | 易经注解 | 博学多才，融汇各家之长 |
| ✋ 陈图南 | 宋朝 | 面相手相 | 相学宗师，善观人生命运 |

## 🔧 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 6
- **样式方案**: Tailwind CSS 4.1
- **状态管理**: Zustand
- **路由管理**: React Router DOM 7
- **动画效果**: Framer Motion
- **AI服务**: Google Gemini API
- **图标库**: Lucide React
- **Markdown**: React Markdown + Remark GFM

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd zhouwenwang-divination
```

2. **安装依赖**
```bash
cd zhouwenwang-divination
npm install
```

3. **配置API密钥**

获取 Google Gemini API 密钥：
- 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
- 创建新的API密钥

配置方式（二选一）：

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

4. **启动应用**
```bash
npm run dev
```

访问 `http://localhost:5173` 开始使用！

## 📖 使用指南

### 🔮 六爻占卜
1. 选择六爻占卜模式
2. 输入您要询问的问题
3. 点击"开始摇卦"
4. 选择大师进行解卦
5. 获得详细的卦象分析

### ⭐ 奇门遁甲
1. 进入奇门遁甲页面
2. 设置起局时间（可选择当前时间）
3. 输入要预测的事项
4. 选择专业大师
5. 获得局势分析和建议

### ✋ 手相分析
1. 选择手相分析功能
2. 上传清晰的手掌照片
3. 选择擅长相术的大师
4. 获得详细的手相解读

### 🎯 快速提问
- 使用预设问题快速开始占卜
- 支持自定义问题
- 可保存常用问题模板

### 📚 历史管理
- 查看完整的占卜历史
- 支持按时间、类型筛选
- 可重新查看任意历史记录
- 支持导出和分享

## 🏗️ 项目结构

```
zhouwenwang-divination/
├── public/                  # 静态资源
│   ├── masters/            # 大师配置文件
│   │   └── config.json     # 大师数据配置
│   ├── liuyao.mp4         # 六爻动画
│   ├── qimen.mp4          # 奇门动画
│   └── palmistry.mp4      # 手相动画
├── src/
│   ├── components/         # React 组件
│   │   ├── common/        # 通用组件
│   │   └── layout/        # 布局组件
│   ├── games/             # 占卜游戏模块
│   │   ├── liuyao/        # 六爻占卜
│   │   ├── qimen/         # 奇门遁甲
│   │   └── palmistry/     # 手相分析
│   ├── masters/           # AI大师系统
│   ├── core/              # 核心功能模块
│   ├── pages/             # 页面组件
│   └── types/             # 类型定义
├── API_CONFIG.md          # API配置指南
├── SECURITY_GUIDE.md      # 安全指南
└── TROUBLESHOOTING.md     # 故障排除指南
```

## 🎨 功能特性

### 核心功能
- ✅ 多种传统占卜方式
- ✅ AI驱动的智能解读
- ✅ 个性化大师选择
- ✅ 完整的历史记录
- ✅ 响应式设计
- ✅ 暗色主题界面
- ✅ 流式文本动画
- ✅ 设置个性化定制

### 高级功能
- 🔄 实时占卜状态管理
- 💾 本地数据持久化
- 🎭 大师角色动态切换
- 📱 移动端适配优化
- 🎨 美观的UI动效
- 🔧 灵活的配置系统

## 🛠️ 开发指南

### 添加新的占卜方式
1. 在 `src/games/` 下创建新模块
2. 定义占卜逻辑和数据结构
3. 创建对应的页面组件
4. 注册路由和导航
5. 更新大师配置

### 自定义AI大师
1. 编辑 `public/masters/config.json`
2. 添加新大师的基本信息
3. 配置专用提示词
4. 测试不同占卜场景

### 主题定制
- 编辑 `tailwind.config.js` 自定义色彩
- 修改 `src/index.css` 调整全局样式
- 使用设计系统的品牌色彩变量

## 🔐 安全说明

- 🔑 API密钥采用安全存储机制
- 🚫 不在客户端暴露敏感信息
- 🛡️ 输入验证和错误处理
- 📊 使用记录本地加密存储

## 📋 环境变量

项目支持以下环境变量配置：

```env
# Google Gemini API 密钥
VITE_GEMINI_API_KEY=your_api_key_here

# 应用配置
VITE_APP_NAME=周文王占卜系统
VITE_APP_VERSION=1.0.0
```

## 🐛 常见问题

### API相关
- **Q**: 显示"请配置API密钥"？
- **A**: 按照配置指南设置Gemini API密钥

### 功能相关  
- **Q**: 手相识别不准确？
- **A**: 确保上传清晰的手掌正面照片

### 性能相关
- **Q**: 响应速度慢？  
- **A**: 检查网络连接和API调用频率

详细故障排除请查看 [TROUBLESHOOTING.md](./zhouwenwang-divination/TROUBLESHOOTING.md)

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- 感谢中华传统文化的智慧传承
- 感谢 Google Gemini 提供的 AI 服务
- 感谢开源社区的技术支持

## 📞 联系方式

- 项目地址: [GitHub Repository](https://github.com/your-username/zhouwenwang-divination)
- 问题反馈: [Issues](https://github.com/your-username/zhouwenwang-divination/issues)

---

**愿古代智慧与现代科技的结合，为您指引人生方向！** 🌟 