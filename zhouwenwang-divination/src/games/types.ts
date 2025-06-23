/**
 * Games模块类型定义
 * 包含各种占卜游戏的特定数据结构
 */

import type { Game } from '../types';

/**
 * 游戏注册表接口
 */
export interface GameRegistry {
  [key: string]: Game;
}

/**
 * 六爻相关类型定义
 */
export namespace LiuYao {
  /**
   * 爻的类型 (阴爻/阳爻)
   */
  export type YaoType = 'yin' | 'yang';

  /**
   * 爻的变化状态
   */
  export type YaoChange = 'static' | 'changing';

  /**
   * 单个爻的定义
   */
  export interface Yao {
    /** 爻的类型 */
    type: YaoType;
    /** 是否为变爻 */
    change: YaoChange;
    /** 爻的位置 (1-6，从下往上) */
    position: number;
  }

  /**
   * 卦象定义
   */
  export interface Hexagram {
    /** 卦名 */
    name: string;
    /** 卦象编号 */
    number: number;
    /** 六个爻的组合 */
    yaos: Yao[];
    /** 卦辞 */
    description?: string;
  }

  /**
   * 六爻占卜数据
   */
  export interface DivinationData {
    /** 本卦 */
    originalHexagram: Hexagram;
    /** 变卦（如果有变爻） */
    changedHexagram?: Hexagram;
    /** 占卜时间 */
    timestamp: number;
    /** 用户问题 */
    question?: string;
  }
}

/**
 * 奇门遁甲相关类型定义
 */
export namespace QiMen {
  /**
   * 天干
   */
  export type TianGan = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

  /**
   * 地支
   */
  export type DiZhi = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';

  /**
   * 八门
   */
  export type BaMen = '休门' | '生门' | '伤门' | '杜门' | '景门' | '死门' | '惊门' | '开门';

  /**
   * 九星
   */
  export type JiuXing = '天蓬' | '天芮' | '天冲' | '天辅' | '天禽' | '天心' | '天柱' | '天任' | '天英';

  /**
   * 八神
   */
  export type BaShen = '值符' | '腾蛇' | '太阴' | '六合' | '白虎' | '玄武' | '九地' | '九天';

  /**
   * 奇门遁甲盘格
   */
  export interface QiMenPan {
    /** 年月日时 */
    datetime: {
      year: { gan: TianGan; zhi: DiZhi };
      month: { gan: TianGan; zhi: DiZhi };
      day: { gan: TianGan; zhi: DiZhi };
      hour: { gan: TianGan; zhi: DiZhi };
    };
    /** 九宫格数据 */
    grid: QiMenGrid[];
    /** 用局 */
    ju: number;
  }

  /**
   * 九宫格单元
   */
  export interface QiMenGrid {
    /** 宫位 (1-9) */
    position: number;
    /** 天干 */
    tianGan: TianGan;
    /** 地支 */
    diZhi: DiZhi;
    /** 门 */
    men: BaMen;
    /** 星 */
    xing: JiuXing;
    /** 神 */
    shen: BaShen;
  }

  /**
   * 奇门遁甲占卜数据
   */
  export interface DivinationData {
    /** 起盘时间 */
    timestamp: number;
    /** 奇门盘 */
    pan: QiMenPan;
    /** 用神宫位 */
    yongShenPosition?: number;
    /** 用户问题 */
    question?: string;
  }
}

/**
 * 手相分析相关类型定义
 */
export namespace Palmistry {
  /**
   * 手相图片信息
   */
  export interface PalmImage {
    /** 图片数据URL */
    dataUrl: string;
    /** 文件名 */
    fileName: string;
    /** 文件大小（字节） */
    fileSize: number;
    /** 图片尺寸 */
    dimensions: {
      width: number;
      height: number;
    };
  }

  /**
   * 手相特征
   */
  export interface PalmFeatures {
    /** 生命线 */
    lifeLine: string;
    /** 智慧线 */
    wisdomLine: string;
    /** 感情线 */
    emotionLine: string;
    /** 事业线 */
    careerLine?: string;
    /** 财运线 */
    wealthLine?: string;
    /** 手掌形状 */
    palmShape: string;
    /** 手指特征 */
    fingerFeatures: string;
  }

  /**
   * 手相占卜数据
   */
  export interface DivinationData {
    /** 手相图片 */
    image: PalmImage;
    /** 分析的手相特征 */
    features?: PalmFeatures;
    /** 占卜时间 */
    timestamp: number;
    /** 用户问题 */
    question?: string;
  }
} 