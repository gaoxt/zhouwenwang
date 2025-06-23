# API 密钥配置指南

本应用支持两种方式配置 Gemini API 密钥：

## 方式一：配置文件预配置（推荐）

您可以直接在配置文件中设置 API 密钥，这样就无需在设置页面每次输入。

### 配置步骤：

1. 打开 `src/masters/config.ts` 文件
2. 找到 `API_CONFIG` 配置项：
   ```typescript
   export const API_CONFIG = {
     // Gemini API密钥 - 可以在这里预配置，留空则需要用户在设置中配置
     GEMINI_API_KEY: '', // 在这里填入您的Gemini API密钥
   };
   ```
3. 将您的 Gemini API 密钥填入 `GEMINI_API_KEY` 字段：
   ```typescript
   export const API_CONFIG = {
     GEMINI_API_KEY: 'AIzaSyC...您的完整API密钥...', 
   };
   ```
4. 保存文件

### 优势：
- ✅ 一次配置，永久使用
- ✅ 无需在设置页面重复输入
- ✅ 团队项目可以统一配置
- ✅ 更安全，不会意外清除

## 方式二：设置页面配置

如果您不想在代码中保存 API 密钥，可以在应用的设置页面配置：

1. 打开应用设置页面
2. 在 "API配置" 标签页中输入您的 Gemini API 密钥
3. 点击保存

### 注意事项：
- ⚠️ 如果配置文件中已经设置了 API 密钥，将优先使用配置文件中的密钥
- ⚠️ 设置页面的配置会保存在浏览器本地存储中，清除浏览器数据时会丢失

## 获取 Gemini API 密钥

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录您的 Google 账号
3. 创建新的 API 密钥
4. 复制生成的 API 密钥（通常以 `AIza` 开头）

## 安全提醒

- 🔒 请妥善保管您的 API 密钥，不要分享给他人
- 🔒 如果密钥泄露，请立即在 Google AI Studio 中删除并重新生成
- 🔒 在公开的代码仓库中，请确保不要提交包含真实 API 密钥的文件

## 故障排除

### 问题：显示 "请先在配置文件或设置中配置有效的Gemini API密钥"
- 检查 API 密钥格式是否正确（应以 `AIza` 开头）
- 验证 API 密钥是否有效且未过期
- 确保网络连接正常

### 问题：API 调用失败
- 检查 API 密钥是否正确
- 确认 Google AI Studio 中的 API 密钥状态
- 检查是否超出了 API 调用限制

如有其他问题，请查看应用日志或联系技术支持。 