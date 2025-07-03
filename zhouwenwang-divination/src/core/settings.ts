/**
 * 设置管理逻辑
 * 与Zustand store交互，提供设置的读取、保存和验证功能
 */

import type { Settings } from '../types';
import type { StorageResult } from './types';
import { StorageKeys } from './types';
import { getItem, setItem, clearAllAppData } from './storage';
import { forceCleanAllHistory } from './history';
import { getDefaultServerUrl } from '../utils/url';

/**
 * 默认设置配置
 */
export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  sidebarCollapsed: false,
  serverUrl: getDefaultServerUrl(),
};

/**
 * 验证设置对象是否有效
 * @param settings 设置对象
 * @returns 验证结果
 */
export function validateSettings(settings: any): settings is Settings {
  if (!settings || typeof settings !== 'object') {
    return false;
  }

  // 检查必需字段
  if (typeof settings.apiKey !== 'string') {
    return false;
  }

  if (typeof settings.sidebarCollapsed !== 'boolean') {
    return false;
  }

  // 检查可选字段
  if (settings.serverUrl !== undefined && typeof settings.serverUrl !== 'string') {
    return false;
  }

  return true;
}

/**
 * 从本地存储加载设置
 * @returns 设置加载结果
 */
export function loadSettings(): StorageResult<Settings> {
  try {
    const result = getItem<Settings>(StorageKeys.SETTINGS);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error,
        data: DEFAULT_SETTINGS
      };
    }

    // 如果没有存储的设置，返回默认设置
    if (!result.data) {
      return {
        success: true,
        data: DEFAULT_SETTINGS
      };
    }

    // 验证加载的设置
    if (!validateSettings(result.data)) {
      console.warn('存储的设置格式无效，使用默认设置');
      return {
        success: false,
        error: '设置格式无效',
        data: DEFAULT_SETTINGS
      };
    }

    // 合并默认设置，确保所有字段都存在
    const mergedSettings: Settings = {
      ...DEFAULT_SETTINGS,
      ...result.data
    };

    return {
      success: true,
      data: mergedSettings
    };
  } catch (error) {
    console.error('加载设置失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '加载设置失败',
      data: DEFAULT_SETTINGS
    };
  }
}

/**
 * 保存设置到本地存储
 * @param settings 要保存的设置
 * @returns 保存结果
 */
export function saveSettings(settings: Settings): StorageResult<void> {
  try {
    // 验证设置
    if (!validateSettings(settings)) {
      return {
        success: false,
        error: '设置格式无效'
      };
    }

    // 保存到本地存储
    const result = setItem(StorageKeys.SETTINGS, settings);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('保存设置失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存设置失败'
    };
  }
}

/**
 * 重置设置为默认值
 * @returns 重置结果
 */
export function resetSettings(): StorageResult<Settings> {
  try {
    const result = saveSettings(DEFAULT_SETTINGS);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error,
        data: DEFAULT_SETTINGS
      };
    }

    return {
      success: true,
      data: DEFAULT_SETTINGS
    };
  } catch (error) {
    console.error('重置设置失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '重置设置失败',
      data: DEFAULT_SETTINGS
    };
  }
}

/**
 * 验证API密钥格式
 * @param apiKey API密钥
 * @returns 是否有效
 */
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // 移除首尾空格
  const trimmedKey = apiKey.trim();
  
  // 检查长度（Gemini API密钥通常比较长）
  if (trimmedKey.length < 10) {
    return false;
  }

  // 检查基本格式（字母数字字符、下划线、横线）
  const apiKeyPattern = /^[A-Za-z0-9_-]+$/;
  if (!apiKeyPattern.test(trimmedKey)) {
    return false;
  }

  return true;
}

/**
 * 更新API密钥
 * @param apiKey 新的API密钥
 * @returns 更新结果
 */
export function updateApiKey(apiKey: string): StorageResult<Settings> {
  try {
    // 加载当前设置
    const loadResult = loadSettings();
    const currentSettings = loadResult.data || DEFAULT_SETTINGS;

    // 创建新设置
    const newSettings: Settings = {
      ...currentSettings,
      apiKey: apiKey.trim()
    };

    // 保存新设置
    const saveResult = saveSettings(newSettings);
    
    if (!saveResult.success) {
      return {
        success: false,
        error: saveResult.error,
        data: currentSettings
      };
    }

    return {
      success: true,
      data: newSettings
    };
  } catch (error) {
    console.error('更新API密钥失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新API密钥失败',
      data: DEFAULT_SETTINGS
    };
  }
}

/**
 * 切换侧边栏折叠状态
 * @returns 更新结果
 */
export function toggleSidebarCollapsed(): StorageResult<Settings> {
  try {
    // 加载当前设置
    const loadResult = loadSettings();
    const currentSettings = loadResult.data || DEFAULT_SETTINGS;

    // 切换侧边栏状态
    const newSettings: Settings = {
      ...currentSettings,
      sidebarCollapsed: !currentSettings.sidebarCollapsed
    };

    // 保存新设置
    const saveResult = saveSettings(newSettings);
    
    if (!saveResult.success) {
      return {
        success: false,
        error: saveResult.error,
        data: currentSettings
      };
    }

    return {
      success: true,
      data: newSettings
    };
  } catch (error) {
    console.error('切换侧边栏状态失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '切换侧边栏状态失败',
      data: DEFAULT_SETTINGS
    };
  }
}

/**
 * 清除所有应用数据
 * @returns 清除结果
 */
export async function clearAllData(): Promise<StorageResult<void>> {
  try {
    // 清除所有定义的存储键
    const result = clearAllAppData();
    
    if (!result.success) {
      console.warn('清除标准应用数据失败:', result.error);
    }

    // 强制清除历史记录
    const historyResult = await forceCleanAllHistory();
    if (!historyResult.success) {
      console.warn('强制清除历史记录失败:', historyResult.error);
    }

    // 强制清除所有可能的历史数据键（兼容旧版本）
    const legacyKeys = [
      'divination-history',
      'zhouwenwang-history', 
      'divination_history',
      'history',
      'records'
    ];

    let hasError = false;
    const errors: string[] = [];

    legacyKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`已删除遗留存储键: ${key}`);
      } catch (error) {
        hasError = true;
        const errorMsg = `删除键 ${key} 失败: ${error}`;
        errors.push(errorMsg);
        console.warn(errorMsg);
      }
    });

    // 额外安全措施：扫描并删除所有以应用前缀开头的键
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('zhouwenwang') || key.includes('divination'))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`已删除应用相关存储键: ${key}`);
        } catch (error) {
          console.warn(`删除键 ${key} 失败:`, error);
        }
      });
    } catch (error) {
      console.warn('扫描存储键失败:', error);
    }

    if (hasError && errors.length > 0) {
      return {
        success: false,
        error: `部分数据清除失败: ${errors.join(', ')}`
      };
    }

    console.log('所有应用数据已清除');
    return {
      success: true
    };
  } catch (error) {
    console.error('清除应用数据失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '清除应用数据失败'
    };
  }
}

/**
 * 导出设置数据
 * @returns 导出的设置JSON字符串
 */
export function exportSettings(): StorageResult<string> {
  try {
    const loadResult = loadSettings();
    
    if (!loadResult.success || !loadResult.data) {
      return {
        success: false,
        error: loadResult.error || '无法加载设置数据'
      };
    }

    // 创建导出数据对象
    const exportData = {
      settings: loadResult.data,
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    
    return {
      success: true,
      data: jsonString
    };
  } catch (error) {
    console.error('导出设置失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '导出设置失败'
    };
  }
}

/**
 * 导入设置数据
 * @param jsonString 导入的JSON字符串
 * @returns 导入结果
 */
export function importSettings(jsonString: string): StorageResult<Settings> {
  try {
    const importData = JSON.parse(jsonString);
    
    if (!importData.settings) {
      return {
        success: false,
        error: '导入数据格式无效'
      };
    }

    if (!validateSettings(importData.settings)) {
      return {
        success: false,
        error: '导入的设置数据无效'
      };
    }

    const saveResult = saveSettings(importData.settings);
    
    if (!saveResult.success) {
      return {
        success: false,
        error: saveResult.error,
        data: DEFAULT_SETTINGS
      };
    }

    return {
      success: true,
      data: importData.settings
    };
  } catch (error) {
    console.error('导入设置失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '导入设置失败',
      data: DEFAULT_SETTINGS
    };
  }
}

/**
 * 导出所有占卜记录数据
 * @returns 导出的占卜记录JSON字符串
 */
export async function exportDivinationRecords(): Promise<StorageResult<string>> {
  try {
    // 导入getAllRecords函数
    const { getAllRecords } = await import('./history');
    
    // 获取所有占卜记录
    const allRecords = await getAllRecords();
    
    // 创建导出数据对象
    const exportData = {
      records: allRecords,
      totalCount: allRecords.length,
      exportTime: new Date().toISOString(),
      version: '1.0.0',
      description: '周文王占卜记录导出文件'
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    
    return {
      success: true,
      data: jsonString
    };
  } catch (error) {
    console.error('导出占卜记录失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '导出占卜记录失败'
    };
  }
} 