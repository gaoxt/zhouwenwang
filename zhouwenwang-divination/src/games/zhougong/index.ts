/**
 * 周公解梦模块统一导出
 * 提供周公解梦相关的所有功能和组件
 */

// 导出核心逻辑
export {
  analyzeDream,
  getFortuneDescription,
  getCategoryColor,
  getRandomDreamAdvice,
  isValidDreamDescription,
  dreamCategories,
  DREAM_CATEGORIES
} from './logic';

// 导出类型定义
export type {
  DreamAnalysisResult,
  DreamCategoryInfo,
  ZhouGongResult
} from './logic';

// 导出页面组件
export { default as ZhouGongPage } from './ZhouGongPage'; 