/**
 * Masters模块类型定义
 * 包含与AI大师系统相关的特定类型
 */

import type { Master } from '../types';

/**
 * 游戏类型提示词配置
 */
export interface GamePromptConfig {
  /** 基础角色设定 */
  baseRole: string;
  /** 分析风格描述 */
  analysisStyle: string;
  /** 无效图片提示（仅用于图像分析类游戏） */
  invalidImagePrompt?: string;
}

/**
 * 扩展的大师接口，支持游戏专用提示词
 */
export interface ExtendedMaster extends Master {
  /** 针对不同游戏类型的专用提示词配置 */
  gamePrompts?: {
    [gameType: string]: GamePromptConfig;
  };
}

/**
 * 大师配置文件结构
 * 用于从config.json文件加载大师数据
 */
export interface MasterConfig {
  /** 配置文件版本 */
  version: string;
  /** 大师列表 */
  masters: ExtendedMaster[];
}

/**
 * AI分析请求参数
 */
export interface AnalysisRequest {
  /** 占卜数据 */
  data: any;
  /** 选择的大师 */
  master: Master;
  /** 占卜类型 */
  type: string;
  /** 用户问题（可选） */
  question?: string;
}

/**
 * AI分析响应
 */
export interface AnalysisResponse {
  /** 分析结果文本 */
  analysis: string;
  /** 置信度 (0-1) */
  confidence?: number;
  /** 处理时间（毫秒） */
  processingTime?: number;
}

/**
 * Gemini API请求配置
 */
export interface GeminiRequestConfig {
  /** API密钥 */
  apiKey: string;
  /** 模型名称 */
  model: string;
  /** 温度参数 */
  temperature?: number;
  /** 最大输出token数 */
  maxOutputTokens?: number;
  /** 候选响应数量 */
  candidateCount?: number;
}

/**
 * 大师服务错误类型
 */
export enum MasterServiceError {
  INVALID_API_KEY = 'INVALID_API_KEY',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
} 