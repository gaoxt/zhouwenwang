/**
 * 历史管理模块
 * 负责占卜记录的存储、检索和管理
 */

import type { DivinationRecord } from '../types';
import { getItem, setItem, removeItem } from './storage';
import { StorageKeys } from './types';

/** 历史记录在localStorage中的键名 */
const HISTORY_STORAGE_KEY = StorageKeys.DIVINATION_RECORDS;

/** 最大历史记录数量 */
const MAX_HISTORY_RECORDS = 100;

/**
 * 历史记录的存储结构
 */
interface HistoryStorage {
  /** 按游戏类型分组的记录 */
  records: Record<string, DivinationRecord[]>;
  /** 最后更新时间 */
  lastUpdated: number;
}

/**
 * 获取历史记录存储对象
 * @returns 历史记录存储对象
 */
async function getHistoryStorage(): Promise<HistoryStorage> {
  const result = await getItem<HistoryStorage>(HISTORY_STORAGE_KEY);
  
  if (result.success && result.data) {
    return result.data;
  }
  
  // 返回默认的空存储结构
  return {
    records: {},
    lastUpdated: Date.now()
  };
}

/**
 * 保存历史记录存储对象
 * @param storage 历史记录存储对象
 */
async function saveHistoryStorage(storage: HistoryStorage): Promise<void> {
  storage.lastUpdated = Date.now();
  const result = await setItem(HISTORY_STORAGE_KEY, storage);
  
  if (!result.success) {
    throw new Error(result.error || '保存历史记录失败');
  }
}

/**
 * 添加占卜记录
 * @param record 占卜记录
 * @throws 当存储失败时抛出异常
 */
export async function addRecord(record: DivinationRecord): Promise<void> {
  try {
    const storage = await getHistoryStorage();
    
    // 确保记录类型的数组存在
    if (!storage.records[record.type]) {
      storage.records[record.type] = [];
    }
    
    // 添加新记录到数组开头
    storage.records[record.type].unshift(record);
    
    // 限制记录数量
    if (storage.records[record.type].length > MAX_HISTORY_RECORDS) {
      storage.records[record.type] = storage.records[record.type].slice(0, MAX_HISTORY_RECORDS);
    }
    
    await saveHistoryStorage(storage);
    
    console.log(`已添加 ${record.type} 类型的占卜记录:`, record.id);
    
  } catch (error) {
    console.error('添加历史记录失败:', error);
    throw new Error('保存占卜记录失败');
  }
}

/**
 * 获取指定类型的占卜记录
 * @param type 游戏类型
 * @returns 占卜记录数组（按时间倒序）
 */
export async function getRecords(type: string): Promise<DivinationRecord[]> {
  try {
    const storage = await getHistoryStorage();
    return storage.records[type] || [];
  } catch (error) {
    console.error('获取历史记录失败:', error);
    return [];
  }
}

/**
 * 获取所有类型的占卜记录
 * @returns 按时间倒序排列的所有记录
 */
export async function getAllRecords(): Promise<DivinationRecord[]> {
  try {
    const storage = await getHistoryStorage();
    const allRecords: DivinationRecord[] = [];
    
    // 收集所有类型的记录
    Object.values(storage.records).forEach(records => {
      allRecords.push(...records);
    });
    
    // 按时间戳倒序排序
    return allRecords.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('获取所有历史记录失败:', error);
    return [];
  }
}

/**
 * 清除历史记录
 * @param type 游戏类型（可选），如果不提供则清除所有记录
 */
export async function clearHistory(type?: string): Promise<void> {
  try {
    if (type) {
      // 清除特定类型的记录
      const storage = await getHistoryStorage();
      delete storage.records[type];
      await saveHistoryStorage(storage);
      console.log(`已清除 ${type} 类型的历史记录`);
    } else {
      // 清除所有记录
      await removeItem(HISTORY_STORAGE_KEY);
      console.log('已清除所有历史记录');
    }
  } catch (error) {
    console.error('清除历史记录失败:', error);
    throw new Error('清除历史记录失败');
  }
}



/**
 * 强制清除所有历史记录（包括兼容旧版本的键名）
 * @returns 清除结果
 */
export async function forceCleanAllHistory(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('开始强制清除所有历史记录...');

    // 清除当前标准键
    await removeItem(HISTORY_STORAGE_KEY);
    console.log(`已清除标准历史记录: ${HISTORY_STORAGE_KEY}`);

    // 清除所有可能的历史记录键（兼容旧版本）
    const possibleKeys = [
      'divination-history',
      'zhouwenwang-history',
      'divination_history',
      'zhouwenwang_records',
      'history',
      'records'
    ];

    for (const key of possibleKeys) {
      try {
        localStorage.removeItem(key);
        console.log(`已清除遗留历史记录键: ${key}`);
      } catch (error) {
        console.warn(`清除键 ${key} 失败:`, error);
      }
    }

    console.log('强制清除历史记录完成');
    return { success: true };
  } catch (error) {
    console.error('强制清除历史记录失败:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '强制清除历史记录失败' 
    };
  }
}

/**
 * 获取历史记录统计信息
 * @returns 统计信息对象
 */
export async function getHistoryStats(): Promise<{
  totalRecords: number;
  recordsByType: Record<string, number>;
  oldestRecord?: DivinationRecord;
  newestRecord?: DivinationRecord;
}> {
  try {
    const storage = await getHistoryStorage();
    const stats = {
      totalRecords: 0,
      recordsByType: {} as Record<string, number>,
      oldestRecord: undefined as DivinationRecord | undefined,
      newestRecord: undefined as DivinationRecord | undefined
    };
    
    let allRecords: DivinationRecord[] = [];
    
    // 统计各类型记录数量
    Object.entries(storage.records).forEach(([type, records]) => {
      stats.recordsByType[type] = records.length;
      stats.totalRecords += records.length;
      allRecords.push(...records);
    });
    
    // 找到最早和最新的记录
    if (allRecords.length > 0) {
      allRecords.sort((a, b) => a.timestamp - b.timestamp);
      stats.oldestRecord = allRecords[0];
      stats.newestRecord = allRecords[allRecords.length - 1];
    }
    
    return stats;
  } catch (error) {
    console.error('获取历史统计失败:', error);
    return {
      totalRecords: 0,
      recordsByType: {},
    };
  }
}

/**
 * 根据ID查找记录
 * @param id 记录ID
 * @returns 找到的记录或null
 */
export async function findRecordById(id: string): Promise<DivinationRecord | null> {
  try {
    const storage = await getHistoryStorage();
    
    for (const records of Object.values(storage.records)) {
      const found = records.find(record => record.id === id);
      if (found) {
        return found;
      }
    }
    
    return null;
  } catch (error) {
    console.error('查找记录失败:', error);
    return null;
  }
}

/**
 * 删除指定ID的记录
 * @param id 记录ID
 * @returns 是否删除成功
 */
export async function deleteRecord(id: string): Promise<boolean> {
  try {
    const storage = await getHistoryStorage();
    let deleted = false;
    
    // 在所有类型中查找并删除记录
    Object.keys(storage.records).forEach(type => {
      const index = storage.records[type].findIndex(record => record.id === id);
      if (index !== -1) {
        storage.records[type].splice(index, 1);
        deleted = true;
      }
    });
    
    if (deleted) {
      await saveHistoryStorage(storage);
      console.log(`已删除记录: ${id}`);
    }
    
    return deleted;
  } catch (error) {
    console.error('删除记录失败:', error);
    return false;
  }
}

/**
 * 检查历史存储是否可用
 * @returns 是否可用
 */
export function isHistoryAvailable(): boolean {
  try {
    // 简单测试localStorage是否可用
    const testKey = '__history_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
} 