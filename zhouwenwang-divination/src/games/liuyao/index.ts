/**
 * 六爻占卜模块统一导出
 * 提供六爻游戏相关的所有功能和组件
 */

// 导出核心逻辑
export {
  generateYao,
  generateHexagram,
  tossCoin,
  binaryToHexagramName,
  getYaoSymbol,
  getYaoName,
  isValidYao,
  isValidHexagram,
  YAO_VALUES,
  COIN_VALUES
} from './logic';

// 导出类型定义
export type {
  YaoInfo,
  LiuYaoResult
} from './logic';

// 导出页面组件
export { default as LiuYaoPage } from './LiuYaoPage'; 