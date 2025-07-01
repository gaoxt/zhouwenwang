/**
 * Gemini API 配置常量
 * 统一管理所有与 Gemini API 相关的配置
 */

/**
 * 应用API密钥配置
 * 如果在这里配置了API密钥，将优先使用此配置
 * 如果为空，则需要用户在设置中配置
 */
export const API_CONFIG = {
  // Gemini API密钥 - 可以在这里预配置，留空则需要用户在设置中配置
  GEMINI_API_KEY: '' as string, // 在这里填入您的Gemini API密钥，例如：'AIzaSyC...'
};

/**
 * Gemini API 配置
 */
export const GEMINI_CONFIG = {
  // 模型配置
  MODELS: {
    // 主要模型 - 用于文本生成和分析
    PRIMARY: 'gemini-2.5-flash-lite-preview-06-17',
    // 视觉模型 - 用于图像分析（手相等）
    VISION: 'gemini-2.5-flash-lite-preview-06-17',
    // 备用模型（如果主模型不可用）
    FALLBACK: 'gemini-2.0-flash-lite-001'
  },
  
  // API 端点配置
  ENDPOINTS: {
    // API基础URL
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
    // 模型列表端点（用于验证API密钥）
    MODELS_LIST: 'https://generativelanguage.googleapis.com/v1beta/models'
  },
  
  // 生成配置
  GENERATION_CONFIG: {
    // 创造性控制（0.0-2.0，值越高越有创造性）
    temperature: 0.7,
    // 采样策略参数
    topK: 32,
    topP: 1,
    // 最大输出令牌数
    maxOutputTokens: 4096,
    // 停止序列 - 确保输出为中文
    stopSequences: [],
    // 候选响应数量
    candidateCount: 1,
  },
  
  // 请求配置
  REQUEST_CONFIG: {
    // 标准超时时间（文本生成）
    TIMEOUT: 30000, // 30秒
    // 图像分析超时时间
    VISION_TIMEOUT: 60000, // 60秒
    // API密钥验证超时时间
    VALIDATION_TIMEOUT: 10000, // 10秒
  },
  
  // 文件配置
  FILE_CONFIG: {
    // 支持的图像格式
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    // 最大文件大小（1MB）
    MAX_FILE_SIZE: 1 * 1024 * 1024,
  }
} as const;

/**
 * 构建 Gemini API URL
 * @param modelId 模型ID
 * @param apiKey API密钥
 * @param endpoint 端点类型，默认为 'generateContent'
 * @returns 完整的API URL
 */
export function buildGeminiApiUrl(
  modelId: string, 
  apiKey: string, 
  endpoint: string = 'generateContent'
): string {
  return `${GEMINI_CONFIG.ENDPOINTS.BASE_URL}/${modelId}:${endpoint}?key=${apiKey}`;
}

/**
 * 构建模型列表API URL（用于验证）
 * @param apiKey API密钥
 * @returns 模型列表API URL
 */
export function buildModelsListUrl(apiKey: string): string {
  return `${GEMINI_CONFIG.ENDPOINTS.MODELS_LIST}?key=${apiKey}`;
}

/**
 * 验证API密钥格式
 * @param apiKey API密钥
 * @returns 是否为有效格式
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  const trimmedKey = apiKey.trim();
  return trimmedKey.length >= 20 && trimmedKey.startsWith('AIza');
}

/**
 * 验证图像文件类型
 * @param mimeType 文件MIME类型
 * @returns 是否为支持的图像类型
 */
export function isSupportedImageType(mimeType: string): boolean {
  return (GEMINI_CONFIG.FILE_CONFIG.SUPPORTED_IMAGE_TYPES as readonly string[]).includes(mimeType);
}

/**
 * 验证文件大小
 * @param fileSize 文件大小（字节）
 * @returns 是否在允许范围内
 */
export function isValidFileSize(fileSize: number): boolean {
  return fileSize > 0 && fileSize <= GEMINI_CONFIG.FILE_CONFIG.MAX_FILE_SIZE;
}

/**
 * 获取API密钥
 * 优先使用配置中的API密钥，如果为空则从用户设置中获取
 * @param userApiKey 用户在设置中配置的API密钥
 * @returns 最终使用的API密钥
 */
export function getActiveApiKey(userApiKey?: string): string {
  // 优先使用配置中的API密钥
  if (API_CONFIG.GEMINI_API_KEY && API_CONFIG.GEMINI_API_KEY.trim().length > 0) {
    return API_CONFIG.GEMINI_API_KEY.trim();
  }
  
  // 如果配置中没有，使用用户设置的API密钥
  return (userApiKey || '').trim();
}

/**
 * 检查是否有可用的API密钥
 * @param userApiKey 用户在设置中配置的API密钥
 * @returns 是否有可用的API密钥
 */
export function hasValidApiKey(userApiKey?: string): boolean {
  const activeKey = getActiveApiKey(userApiKey);
  return activeKey.length > 0 && isValidApiKeyFormat(activeKey);
} 