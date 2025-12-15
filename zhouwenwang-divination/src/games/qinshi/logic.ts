import type { RenderStyle, ImageData, QinShiData } from './types';

/**
 * 渲染风格配置（简化版 - 只包含显示信息）
 */
export const RENDER_STYLES: RenderStyle[] = [
  {
    id: 'chibi',
    name: 'Q版古风',
    description: '古风Q版造型，头身比2:1，圆润可爱'
  },
  {
    id: 'shuimo',
    name: '水墨国画',
    description: '中国传统水墨画风，淡雅写意，如仙如画'
  },
  {
    id: 'cyberpunk',
    name: '赛博古风',
    description: '古典与科技融合，霓虹古韵，未来国风美学'
  }
];

/**
 * 根据ID获取渲染风格
 */
export const getRenderStyleById = (id: string): RenderStyle | undefined => {
  return RENDER_STYLES.find(style => style.id === id);
};

/**
 * 获取所有渲染风格
 */
export const getAllRenderStyles = (): RenderStyle[] => {
  return RENDER_STYLES;
};

/**
 * 验证上传的图像文件
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: '请选择图片文件' };
  }

  // 检查文件大小 (10MB = 10 * 1024 * 1024 bytes)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { isValid: false, error: '图片文件不能超过10MB' };
  }

  // 检查支持的格式
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    return { isValid: false, error: '请选择JPG、PNG或WebP格式的图片' };
  }

  return { isValid: true };
};

/**
 * 将文件转换为Base64字符串
 */
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // 移除data:image/xxx;base64,前缀，只保留base64数据
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('文件读取失败'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
  });
};

// 导出类型
export type { RenderStyle, ImageData, QinShiData }; 