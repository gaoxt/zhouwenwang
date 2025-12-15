/**
 * 全局类型定义文件
 * 包含应用程序中使用的所有核心数据结构接口
 */

/**
 * 占卜记录中的大师信息接口
 * 用于在占卜记录中存储大师的基本信息
 */
export interface DivinationMasterInfo {
  /** 大师的唯一标识符 */
  id: string;
  /** 大师姓名 */
  name: string;
  /** 大师描述信息 */
  description: string;
}

/**
 * 占卜记录接口
 * 用于存储用户的占卜历史记录
 */
export interface DivinationRecord {
  /** 记录的唯一标识符 */
  id: string;
  /** 占卜类型 (如: liuyao, qimen, palmistry) */
  type: string;
  /** 创建时间戳 */
  timestamp: number;
  /** 占卜数据，具体结构由不同游戏类型决定 */
  data: any;
  /** 使用的大师信息，包含ID、姓名和描述 */
  master: DivinationMasterInfo | null;
  /** AI大师的分析结果 */
  analysis?: string;
}

/**
 * 大师接口
 * 定义AI占卜大师的基本信息和提示词
 */
export interface Master {
  /** 大师的唯一标识符 */
  id: string;
  /** 大师姓名 */
  name: string;
  /** 大师描述信息 */
  description: string;
  /** 用于AI分析的提示词模板 */
  prompt: string;
  /** 大师对应的图标名称（Lucide图标） */
  icon?: string;
  /** 大师所属朝代 */
  dynasty?: string;
}

/**
 * 游戏接口
 * 定义占卜游戏的基本结构和功能
 */
export interface Game {
  /** 游戏的唯一标识符 */
  id: string;
  /** 游戏显示名称 */
  name: string;
  /** 游戏路由路径 */
  path: string;
  /** 游戏React组件 */
  component: React.FC<any>;
  /** 生成占卜数据的函数（可选） */
  generateData?: () => any;
  /** 侧边栏显示的图标组件（可选） */
  icon?: React.ComponentType<{ size?: number }>;
  /** 游戏描述 */
  description?: string;
  /** 游戏排序权重 */
  order?: number;
  /** 是否隐藏该游戏（可选） */
  hidden?: boolean;
}

/**
 * 应用设置接口
 * 存储用户的应用程序配置
 */
export interface Settings {
  /** Gemini API密钥 */
  apiKey: string;
  /** 侧边栏是否折叠 */
  sidebarCollapsed: boolean;
  /** Gemini响应服务器URL（可选，用于代理请求） */
  serverUrl?: string;
}

/**
 * API响应接口
 * 定义与外部API交互的响应结构
 */
export interface APIResponse<T = any> {
  /** 请求是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误消息 */
  error?: string;
}

/**
 * 应用状态接口
 * 定义全局应用状态的结构
 */
export interface AppState {
  /** 当前选中的大师 */
  selectedMaster: Master | null;
  /** 应用设置 */
  settings: Settings;
  /** 是否正在加载 */
  loading: boolean;
  /** 错误消息 */
  error: string | null;
} 