import { isElectron } from './electron';

/**
 * 获取资源文件的正确路径
 * @param resourcePath 资源文件相对路径（如 'liuyao.mp4'）
 * @returns 正确的资源路径
 */
export const getResourcePath = (resourcePath: string): string => {
  // 移除开头的斜杠
  const cleanPath = resourcePath.startsWith('/') ? resourcePath.slice(1) : resourcePath;
  
  if (isElectron()) {
    // 在 Electron 环境中，使用相对于当前 HTML 文件的路径
    return `./${cleanPath}`;
  } else {
    // 在 Web 环境中，使用绝对路径
    return `/${cleanPath}`;
  }
};

/**
 * 获取视频文件路径
 * @param videoName 视频文件名（如 'liuyao.mp4'）
 * @returns 正确的视频路径
 */
export const getVideoPath = (videoName: string): string => {
  return getResourcePath(videoName);
};

/**
 * 获取图片文件路径
 * @param imageName 图片文件名（如 'icon.png'）
 * @returns 正确的图片路径
 */
export const getImagePath = (imageName: string): string => {
  return getResourcePath(imageName);
}; 