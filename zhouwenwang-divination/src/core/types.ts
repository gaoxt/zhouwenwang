/**
 * Core模块类型定义
 * 包含核心功能相关的类型定义
 */

import type { Settings } from '../types';

/**
 * 本地存储键名常量
 */
export enum StorageKeys {
  SETTINGS = 'zhouwenwang_settings',
  DIVINATION_RECORDS = 'zhouwenwang_records',
  SELECTED_MASTER = 'zhouwenwang_selected_master',
  USER_PREFERENCES = 'zhouwenwang_preferences'
}

/**
 * 存储操作结果
 */
export interface StorageResult<T = any> {
  /** 操作是否成功 */
  success: boolean;
  /** 返回的数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
}

/**
 * 历史记录查询选项
 */
export interface HistoryQueryOptions {
  /** 占卜类型过滤 */
  type?: string;
  /** 大师过滤 */
  master?: string;
  /** 开始时间 */
  startDate?: number;
  /** 结束时间 */
  endDate?: number;
  /** 限制数量 */
  limit?: number;
  /** 排序方式 */
  sortBy?: 'timestamp' | 'type' | 'master';
  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 历史记录统计信息
 */
export interface HistoryStats {
  /** 总记录数 */
  total: number;
  /** 按类型分组的统计 */
  byType: Record<string, number>;
  /** 按大师分组的统计 */
  byMaster: Record<string, number>;
  /** 最早记录时间 */
  earliest?: number;
  /** 最新记录时间 */
  latest?: number;
}

/**
 * 用户偏好设置
 */
export interface UserPreferences {
  /** 主题设置 */
  theme: 'light' | 'dark' | 'auto';
  /** 语言设置 */
  language: 'zh-CN' | 'en-US';
  /** 动画效果开关 */
  animations: boolean;
  /** 声音效果开关 */
  soundEffects: boolean;
  /** 自动保存间隔（秒） */
  autoSaveInterval: number;
  /** 历史记录保留天数 */
  historyRetentionDays: number;
}

/**
 * 应用配置接口
 */
export interface AppConfig {
  /** 应用版本 */
  version: string;
  /** API配置 */
  api: {
    /** Gemini API端点 */
    geminiEndpoint: string;
    /** 请求超时时间（毫秒） */
    timeout: number;
    /** 重试次数 */
    retryCount: number;
  };
  /** 默认设置 */
  defaults: {
    settings: Settings;
    preferences: UserPreferences;
  };
}

/**
 * 错误类型枚举
 */
export enum CoreError {
  STORAGE_NOT_AVAILABLE = 'STORAGE_NOT_AVAILABLE',
  INVALID_DATA_FORMAT = 'INVALID_DATA_FORMAT',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * 操作日志接口
 */
export interface OperationLog {
  /** 操作ID */
  id: string;
  /** 操作类型 */
  type: 'create' | 'read' | 'update' | 'delete';
  /** 操作对象 */
  target: string;
  /** 操作时间 */
  timestamp: number;
  /** 操作结果 */
  success: boolean;
  /** 错误信息（如果失败） */
  error?: string;
  /** 额外信息 */
  metadata?: Record<string, any>;
} 