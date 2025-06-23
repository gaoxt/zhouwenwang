// Electron 环境检测和工具类

declare global {
  interface Window {
    electronAPI?: {
      getVersion: () => Promise<string>;
      getPlatform: () => string;
      isElectron: () => boolean;
    };
  }
}

/**
 * 检测是否在 Electron 环境中运行
 */
export const isElectron = (): boolean => {
  // 方法1：检查 electronAPI
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    return window.electronAPI.isElectron();
  }
  
  // 方法2：检查 user agent
  if (typeof navigator !== 'undefined') {
    return navigator.userAgent.toLowerCase().includes('electron');
  }
  
  return false;
};

/**
 * 获取 Electron 应用版本
 */
export const getElectronVersion = async (): Promise<string | null> => {
  if (isElectron() && window.electronAPI?.getVersion) {
    try {
      return await window.electronAPI.getVersion();
    } catch (error) {
      console.error('获取 Electron 版本失败:', error);
      return null;
    }
  }
  return null;
};

/**
 * 获取平台信息
 */
export const getPlatform = (): string => {
  if (isElectron() && window.electronAPI?.getPlatform) {
    return window.electronAPI.getPlatform();
  }
  
  // 回退到 Web API
  return navigator.platform || 'unknown';
};

/**
 * 获取运行环境信息
 */
export const getEnvironmentInfo = async () => {
  const electron = isElectron();
  
  return {
    isElectron: electron,
    platform: getPlatform(),
    userAgent: navigator.userAgent,
    version: electron ? await getElectronVersion() : null,
  };
}; 