/**
 * 本地存储工具
 * 提供类型安全的localStorage操作，包含错误处理和JSON序列化
 */

import type { StorageResult } from './types';
import { StorageKeys } from './types';

/**
 * 检查localStorage是否可用
 * @returns 是否支持localStorage
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('localStorage不可用:', error);
    return false;
  }
}

/**
 * 从localStorage获取数据
 * @param key 存储键名
 * @returns 存储结果
 */
export function getItem<T = any>(key: string | StorageKeys): StorageResult<T> {
  try {
    if (!isStorageAvailable()) {
      return {
        success: false,
        error: '本地存储不可用'
      };
    }

    const item = localStorage.getItem(key);
    
    if (item === null) {
      return {
        success: true,
        data: undefined
      };
    }

    try {
      const parsedData = JSON.parse(item);
      return {
        success: true,
        data: parsedData
      };
    } catch (parseError) {
      // 如果不是JSON格式，直接返回字符串
      return {
        success: true,
        data: item as T
      };
    }
  } catch (error) {
    console.error('获取存储数据失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取数据失败'
    };
  }
}

/**
 * 向localStorage存储数据
 * @param key 存储键名
 * @param value 要存储的值
 * @returns 存储结果
 */
export function setItem<T = any>(key: string | StorageKeys, value: T): StorageResult<void> {
  try {
    if (!isStorageAvailable()) {
      return {
        success: false,
        error: '本地存储不可用'
      };
    }

    let serializedValue: string;
    
    if (typeof value === 'string') {
      serializedValue = value;
    } else {
      serializedValue = JSON.stringify(value);
    }

    localStorage.setItem(key, serializedValue);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('存储数据失败:', error);
    
    // 检查是否是配额超出错误
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      return {
        success: false,
        error: '存储空间已满，请清理数据后重试'
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '存储数据失败'
    };
  }
}

/**
 * 从localStorage删除数据
 * @param key 存储键名
 * @returns 删除结果
 */
export function removeItem(key: string | StorageKeys): StorageResult<void> {
  try {
    if (!isStorageAvailable()) {
      return {
        success: false,
        error: '本地存储不可用'
      };
    }

    localStorage.removeItem(key);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('删除存储数据失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除数据失败'
    };
  }
}

/**
 * 清空所有应用相关的localStorage数据
 * @returns 清理结果
 */
export function clearAllAppData(): StorageResult<void> {
  try {
    if (!isStorageAvailable()) {
      return {
        success: false,
        error: '本地存储不可用'
      };
    }

    // 获取所有应用相关的键名
    const appKeys = Object.values(StorageKeys);
    
    // 删除每个应用键
    for (const key of appKeys) {
      const result = removeItem(key);
      if (!result.success) {
        console.warn(`删除键 ${key} 失败:`, result.error);
      }
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('清空应用数据失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '清空数据失败'
    };
  }
}

/**
 * 获取localStorage使用情况
 * @returns 存储使用信息
 */
export function getStorageInfo(): {
  isAvailable: boolean;
  used: number;
  total: number;
  percentage: number;
} {
  if (!isStorageAvailable()) {
    return {
      isAvailable: false,
      used: 0,
      total: 0,
      percentage: 0
    };
  }

  try {
    // 估算已使用的存储空间
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        used += key.length + (value?.length || 0);
      }
    }

    // localStorage通常限制为5MB
    const total = 5 * 1024 * 1024;
    const percentage = (used / total) * 100;

    return {
      isAvailable: true,
      used,
      total,
      percentage: Math.round(percentage * 100) / 100
    };
  } catch (error) {
    console.error('获取存储信息失败:', error);
    return {
      isAvailable: true,
      used: 0,
      total: 0,
      percentage: 0
    };
  }
}

/**
 * 批量操作：设置多个键值对
 * @param items 键值对对象
 * @returns 批量设置结果
 */
export function setMultipleItems(items: Record<string, any>): StorageResult<void> {
  try {
    const failedKeys: string[] = [];
    
    for (const [key, value] of Object.entries(items)) {
      const result = setItem(key, value);
      if (!result.success) {
        failedKeys.push(key);
        console.warn(`设置键 ${key} 失败:`, result.error);
      }
    }
    
    if (failedKeys.length > 0) {
      return {
        success: false,
        error: `以下键设置失败: ${failedKeys.join(', ')}`
      };
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('批量设置数据失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '批量设置失败'
    };
  }
}

/**
 * 批量操作：获取多个键的值
 * @param keys 键名数组
 * @returns 批量获取结果
 */
export function getMultipleItems<T = any>(keys: string[]): StorageResult<Record<string, T>> {
  try {
    const result: Record<string, T> = {};
    const failedKeys: string[] = [];
    
    for (const key of keys) {
      const itemResult = getItem<T>(key);
      if (itemResult.success) {
        if (itemResult.data !== undefined) {
          result[key] = itemResult.data;
        }
      } else {
        failedKeys.push(key);
        console.warn(`获取键 ${key} 失败:`, itemResult.error);
      }
    }
    
    if (failedKeys.length > 0) {
      return {
        success: false,
        error: `以下键获取失败: ${failedKeys.join(', ')}`,
        data: result
      };
    }
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('批量获取数据失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '批量获取失败'
    };
  }
} 