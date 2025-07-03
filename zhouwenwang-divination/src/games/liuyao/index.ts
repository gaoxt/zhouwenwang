/**
 * 六爻占卜模块统一导出
 * 提供六爻游戏相关的所有功能和组件
 */

// 导出核心逻辑
export {
  generateHexagram,
  generatePlumBlossomHexagram,
  formatHexagram,
  getMovingLinesDescription,
  getDivinationTimeDescription,
  HEXAGRAM_NAMES,
  YAO_TYPES
} from './logic';

// 导出类型定义
export type {
  LiuYaoResult,
  CoinDivination,
  PlumBlossomDivination
} from './logic';

// 导出页面组件
export { default as LiuYaoPage } from './LiuYaoPage'; 