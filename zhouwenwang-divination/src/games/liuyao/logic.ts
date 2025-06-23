/**
 * 六爻占卜游戏核心逻辑
 * 实现虚拟硬币投掷机制和卦象生成
 */

import type { LiuYao } from '../types';

/**
 * 爻的数值定义
 * 6 = 老阴 (——x——)  变阳
 * 7 = 少阳 (———————)  不变
 * 8 = 少阴 (——  ——)  不变
 * 9 = 老阳 (———————)  变阴
 */
export const YAO_VALUES = {
  OLD_YIN: 6,      // 老阴，会变成阳爻
  YOUNG_YANG: 7,   // 少阳，不变
  YOUNG_YIN: 8,    // 少阴，不变
  OLD_YANG: 9      // 老阳，会变成阴爻
} as const;

/**
 * 单次投币结果
 * 正面 = 3，反面 = 2
 */
export const COIN_VALUES = {
  HEADS: 3,  // 正面（阳）
  TAILS: 2   // 反面（阴）
} as const;

/**
 * 爻的基本信息接口
 */
export interface YaoInfo {
  /** 爻的数值 (6,7,8,9) */
  value: number;
  /** 是否为变爻 */
  changing: boolean;
  /** 爻的类型 */
  type: LiuYao.YaoType;
  /** 变化状态 */
  change: LiuYao.YaoChange;
}

/**
 * 六爻占卜完整结果
 */
export interface LiuYaoResult {
  /** 六个爻的数组，从下往上 (初爻到上爻) */
  yaos: YaoInfo[];
  /** 本卦 */
  originalHexagram: string;
  /** 变卦（如果有变爻） */
  changedHexagram?: string;
  /** 是否有变爻 */
  hasChangingLines: boolean;
  /** 变爻的位置数组 */
  changingPositions: number[];
  /** 占卜时间戳 */
  timestamp: number;
}

/**
 * 模拟单次硬币投掷
 * @returns 硬币结果 (2或3)
 */
export function tossCoin(): number {
  return Math.random() < 0.5 ? COIN_VALUES.TAILS : COIN_VALUES.HEADS;
}

/**
 * 生成单个爻
 * 通过三次硬币投掷确定爻的类型和变化状态
 * @returns 爻的信息
 */
export function generateYao(): YaoInfo {
  // 进行三次硬币投掷
  const toss1 = tossCoin();
  const toss2 = tossCoin();
  const toss3 = tossCoin();
  
  // 计算总和
  const total = toss1 + toss2 + toss3;
  
  // 确定爻的类型和变化状态
  let type: LiuYao.YaoType;
  let changing: boolean;
  let change: LiuYao.YaoChange;
  
  switch (total) {
    case YAO_VALUES.OLD_YIN:     // 6 = 老阴（变阳）
      type = 'yin';
      changing = true;
      change = 'changing';
      break;
    case YAO_VALUES.YOUNG_YANG:  // 7 = 少阳（不变）
      type = 'yang';
      changing = false;
      change = 'static';
      break;
    case YAO_VALUES.YOUNG_YIN:   // 8 = 少阴（不变）
      type = 'yin';
      changing = false;
      change = 'static';
      break;
    case YAO_VALUES.OLD_YANG:    // 9 = 老阳（变阴）
      type = 'yang';
      changing = true;
      change = 'changing';
      break;
    default:
      // 这种情况理论上不会发生，但为了类型安全
      type = 'yin';
      changing = false;
      change = 'static';
      console.warn(`意外的爻值: ${total}`);
  }
  
  return {
    value: total,
    changing,
    type,
    change
  };
}

/**
 * 生成完整的六爻卦象
 * @returns 六爻占卜结果
 */
export function generateHexagram(): LiuYaoResult {
  // 生成六个爻（从初爻到上爻）
  const yaos: YaoInfo[] = [];
  for (let i = 0; i < 6; i++) {
    yaos.push(generateYao());
  }
  
  // 检查变爻
  const changingPositions = yaos
    .map((yao, index) => yao.changing ? index + 1 : null)
    .filter((pos): pos is number => pos !== null);
  
  const hasChangingLines = changingPositions.length > 0;
  
  // 生成本卦的二进制表示（从下往上）
  const originalBinary = yaos
    .map(yao => yao.type === 'yang' ? '1' : '0')
    .join('');
  
  // 生成变卦的二进制表示（如果有变爻）
  let changedBinary: string | undefined;
  if (hasChangingLines) {
    changedBinary = yaos
      .map(yao => {
        if (yao.changing) {
          // 老阴变阳，老阳变阴
          return yao.type === 'yin' ? '1' : '0';
        }
        return yao.type === 'yang' ? '1' : '0';
      })
      .join('');
  }
  
  return {
    yaos,
    originalHexagram: originalBinary,
    changedHexagram: changedBinary,
    hasChangingLines,
    changingPositions,
    timestamp: Date.now()
  };
}

/**
 * 将二进制字符串转换为卦象名称
 * 完整的64卦对照表
 * @param binary 六位二进制字符串 (从下往上：初爻到上爻)
 * @returns 卦象名称
 */
export function binaryToHexagramName(binary: string): string {
  // 完整的64卦映射表
  // 二进制：从右到左是初爻到上爻，1=阳爻，0=阴爻
  const hexagramNames: Record<string, string> = {
    // 第1-8卦
    '111111': '乾为天',      // 1
    '000000': '坤为地',      // 2
    '100010': '水雷屯',      // 3
    '010001': '山水蒙',      // 4
    '111010': '水天需',      // 5
    '010111': '天水讼',      // 6
    '010000': '地水师',      // 7
    '000010': '水地比',      // 8
    
    // 第9-16卦
    '111011': '风天小畜',    // 9
    '110111': '天泽履',      // 10
    '111000': '地天泰',      // 11
    '000111': '天地否',      // 12
    '101111': '天火同人',    // 13
    '111101': '火天大有',    // 14
    '001000': '地山谦',      // 15
    '000100': '雷地豫',      // 16
    
    // 第17-24卦
    '100110': '泽雷随',      // 17
    '011001': '山风蛊',      // 18
    '110000': '地泽临',      // 19
    '000011': '风地观',      // 20
    '100101': '火雷噬嗑',    // 21
    '101001': '山火贲',      // 22
    '000001': '山地剥',      // 23
    '100000': '地雷复',      // 24
    
    // 第25-32卦
    '100111': '天雷无妄',    // 25
    '111001': '山天大畜',    // 26
    '100001': '山雷颐',      // 27
    '011110': '泽风大过',    // 28
    '010010': '坎为水',      // 29
    '101101': '离为火',      // 30
    '001110': '泽山咸',      // 31
    '011100': '雷风恒',      // 32
    
    // 第33-40卦
    '001111': '天山遁',      // 33
    '111100': '雷天大壮',    // 34
    '000101': '火地晋',      // 35
    '101000': '地火明夷',    // 36
    '101011': '风火家人',    // 37
    '110101': '火泽睽',      // 38
    '001010': '水山蹇',      // 39
    '010100': '雷水解',      // 40
    
    // 第41-48卦
    '110001': '山泽损',      // 41  ← 这就是你遇到的卦象！
    '100011': '风雷益',      // 42
    '111110': '泽天夬',      // 43
    '011111': '天风姤',      // 44
    '000110': '泽地萃',      // 45
    '011000': '地风升',      // 46
    '010110': '泽水困',      // 47
    '011010': '水风井',      // 48
    
    // 第49-56卦
    '101110': '泽火革',      // 49
    '011101': '火风鼎',      // 50
    '100100': '震为雷',      // 51
    '001001': '艮为山',      // 52
    '001011': '风山渐',      // 53
    '110100': '雷泽归妹',    // 54
    '101100': '雷火丰',      // 55
    '001101': '火山旅',      // 56
    
    // 第57-64卦
    '011011': '巽为风',      // 57
    '110110': '兑为泽',      // 58
    '010011': '风水涣',      // 59
    '110010': '水泽节',      // 60
    '110011': '风泽中孚',    // 61
    '001100': '雷山小过',    // 62
    '101010': '水火既济',    // 63
    '010101': '火水未济'     // 64
  };
  
  return hexagramNames[binary] || `未知卦象(${binary})`;
}

/**
 * 获取爻的显示符号
 * @param yao 爻的信息
 * @returns 爻的显示符号
 */
export function getYaoSymbol(yao: YaoInfo): string {
  if (yao.changing) {
    return yao.type === 'yin' ? '——x——' : '——o——';  // x表示老阴，o表示老阳
  } else {
    return yao.type === 'yin' ? '——  ——' : '———————';  // 少阴和少阳
  }
}

/**
 * 获取爻的中文名称
 * @param position 爻的位置 (1-6)
 * @returns 爻的中文名称
 */
export function getYaoName(position: number): string {
  const names = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
  return names[position - 1] || `第${position}爻`;
}

/**
 * 验证生成的爻是否有效
 * @param yao 爻的信息
 * @returns 是否有效
 */
export function isValidYao(yao: YaoInfo): boolean {
  const validValues = [YAO_VALUES.OLD_YIN, YAO_VALUES.YOUNG_YANG, YAO_VALUES.YOUNG_YIN, YAO_VALUES.OLD_YANG] as const;
  
  if (!validValues.includes(yao.value as typeof validValues[number])) {
    return false;
  }
  
  // 验证类型和变化状态的一致性
  switch (yao.value) {
    case YAO_VALUES.OLD_YIN:
      return yao.type === 'yin' && yao.changing && yao.change === 'changing';
    case YAO_VALUES.YOUNG_YANG:
      return yao.type === 'yang' && !yao.changing && yao.change === 'static';
    case YAO_VALUES.YOUNG_YIN:
      return yao.type === 'yin' && !yao.changing && yao.change === 'static';
    case YAO_VALUES.OLD_YANG:
      return yao.type === 'yang' && yao.changing && yao.change === 'changing';
    default:
      return false;
  }
}

/**
 * 验证生成的卦象是否有效
 * @param result 六爻结果
 * @returns 是否有效
 */
export function isValidHexagram(result: LiuYaoResult): boolean {
  // 检查是否有6个爻
  if (result.yaos.length !== 6) {
    return false;
  }
  
  // 检查每个爻是否有效
  if (!result.yaos.every(isValidYao)) {
    return false;
  }
  
  // 检查变爻位置的一致性
  const actualChangingPositions = result.yaos
    .map((yao, index) => yao.changing ? index + 1 : null)
    .filter((pos): pos is number => pos !== null);
  
  if (actualChangingPositions.length !== result.changingPositions.length) {
    return false;
  }
  
  for (let i = 0; i < actualChangingPositions.length; i++) {
    if (actualChangingPositions[i] !== result.changingPositions[i]) {
      return false;
    }
  }
  
  // 检查是否有变卦的逻辑一致性
  if (result.hasChangingLines && !result.changedHexagram) {
    return false;
  }
  
  if (!result.hasChangingLines && result.changedHexagram) {
    return false;
  }
  
  return true;
}

/**
 * 八卦映射表
 * 每个八卦由三个爻组成，对应一个三位二进制数
 */
const EIGHT_TRIGRAMS: Record<string, { name: string; symbol: string; nature: string }> = {
  '111': { name: '乾', symbol: '☰', nature: '天' },
  '110': { name: '兑', symbol: '☱', nature: '泽' },
  '101': { name: '离', symbol: '☲', nature: '火' },
  '100': { name: '震', symbol: '☳', nature: '雷' },
  '011': { name: '巽', symbol: '☴', nature: '风' },
  '010': { name: '坎', symbol: '☵', nature: '水' },
  '001': { name: '艮', symbol: '☶', nature: '山' },
  '000': { name: '坤', symbol: '☷', nature: '地' }
};

/**
 * 获取卦象的详细结构信息
 * @param binary 六位二进制字符串 (从下往上：初爻到上爻)
 * @returns 卦象的详细结构
 */
export function getHexagramStructure(binary: string): {
  name: string;
  upperTrigram: { name: string; symbol: string; nature: string };
  lowerTrigram: { name: string; symbol: string; nature: string };
  description: string;
} {
  if (binary.length !== 6) {
    throw new Error('二进制字符串必须是6位');
  }
  
  // 分离上卦和下卦 (从下往上排列)
  const lowerTrigramBinary = binary.slice(0, 3); // 下卦：初爻、二爻、三爻
  const upperTrigramBinary = binary.slice(3, 6); // 上卦：四爻、五爻、上爻
  
  const upperTrigram = EIGHT_TRIGRAMS[upperTrigramBinary];
  const lowerTrigram = EIGHT_TRIGRAMS[lowerTrigramBinary];
  
  if (!upperTrigram || !lowerTrigram) {
    return {
      name: `未知卦象(${binary})`,
      upperTrigram: { name: '未知', symbol: '?', nature: '未知' },
      lowerTrigram: { name: '未知', symbol: '?', nature: '未知' },
      description: '未知卦象'
    };
  }
  
  const hexagramName = binaryToHexagramName(binary);
  
  // 生成描述：如 "山风蛊 艮上巽下"
  const simpleName = hexagramName.replace(/[为]/g, '');
  const description = `${upperTrigram.nature}${lowerTrigram.nature}${simpleName} ${upperTrigram.name}上${lowerTrigram.name}下`;
  
  return {
    name: hexagramName,
    upperTrigram,
    lowerTrigram,
    description
  };
}