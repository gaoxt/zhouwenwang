/**
 * 渲染风格类型（简化版 - 只包含显示信息）
 */
export interface RenderStyle {
  id: string;
  name: string;
  description: string;
}

/**
 * 图像数据接口
 */
export interface ImageData {
  file: File;
  base64: string;
  mimeType: string;
  preview: string; // data URL for preview
}

/**
 * 生成请求数据
 */
export interface GenerationRequest {
  image: string; // base64图像
  renderStyle: RenderStyle;
  prompt: string;
  additionalContext?: string;
}

/**
 * 生成结果数据
 */
export interface GenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  generationTime?: number;
}

/**
 * 历史记录数据
 */
export interface QinShiData {
  originalImage: string;
  generatedImage: string;
  renderStyle: RenderStyle;
  timestamp: number;
} 