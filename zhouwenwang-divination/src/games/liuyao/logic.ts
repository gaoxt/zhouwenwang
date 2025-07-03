/**
 * 六爻占卜核心逻辑模块
 * 实现铜钱起卦、梅花易数起卦、卦象解析等功能
 */

import { 
  getFourPillarsGanZhi, 
  getTimeRangeByHour,
  type FourPillarsGanZhi 
} from '../../utils/ganzhiUtils';

// 六十四卦名称
export const HEXAGRAM_NAMES = [
  '乾为天', '坤为地', '水雷屯', '山水蒙', '水天需', '天水讼', '地水师', '水地比',
  '风天小畜', '天泽履', '地天泰', '天地否', '天火同人', '火天大有', '地山谦', '雷地豫',
  '泽雷随', '山风蛊', '地泽临', '风地观', '火雷噬嗑', '山火贲', '山地剥', '地雷复',
  '天雷无妄', '山天大畜', '山雷颐', '泽风大过', '坎为水', '离为火', '泽山咸', '雷风恒',
  '天山遁', '雷天大壮', '火地晋', '地火明夷', '风火家人', '火泽睽', '水山蹇', '雷水解',
  '山泽损', '风雷益', '泽天夬', '天风姤', '泽地萃', '地风升', '泽水困', '水风井',
  '泽火革', '火风鼎', '震为雷', '艮为山', '风山渐', '雷泽归妹', '雷火丰', '火山旅',
  '巽为风', '兑为泽', '风水涣', '水泽节', '风泽中孚', '雷山小过', '水火既济', '火水未济'
];

// 爻值对应的阴阳和动静
export const YAO_TYPES = {
  6: { name: '老阴', symbol: '⚋', isMoving: true },  // 变爻
  7: { name: '少阳', symbol: '⚊', isMoving: false }, // 静爻
  8: { name: '少阴', symbol: '⚋', isMoving: false }, // 静爻
  9: { name: '老阳', symbol: '⚊', isMoving: true }   // 变爻
} as const;

/**
 * 六爻结果数据结构
 */
export interface LiuYaoResult {
  id: string;
  timestamp: number;
  
  // 起卦信息
  method: 'coins' | 'plum';
  divinationTime?: FourPillarsGanZhi; // 起卦时间的干支信息
  
  // 卦象数据
  originalHexagram: {
    number: number;
    name: string;
    yaos: number[]; // 从下到上的爻值 [6,7,8,9,7,8]
    yaoTypes: string[]; // 对应的爻性质 ['老阴','少阳'...]
    symbols: string[]; // 对应的符号 ['⚋','⚊'...]
  };
  
  // 变卦数据（如果有动爻）
  changedHexagram?: {
    number: number;
    name: string;
    yaos: number[];
    yaoTypes: string[];
    symbols: string[];
  };
  
  // 动爻信息
  movingLines: number[]; // 动爻位置 [1,3,5] 表示初爻、三爻、五爻动
  
  // 世应位置
  worldYao: number;    // 世爻位置（1-6）
  responseYao: number; // 应爻位置（1-6）
  
  // 用户问题
  question?: string;
}

/**
 * 铜钱起卦信息
 */
export interface CoinDivination {
  coins: Array<{
    throw: number;      // 第几次投掷
    heads: number;      // 正面数量
    tails: number;      // 反面数量
    yaoValue: number;   // 爻值 (6,7,8,9)
    yaoType: string;    // 爻类型
  }>;
}

/**
 * 梅花易数起卦信息
 */
export interface PlumBlossomDivination {
  upperTrigram: number; // 上卦数
  lowerTrigram: number; // 下卦数
  movingLine: number;   // 动爻位置
  calculation: string;  // 计算过程说明
}

/**
 * 三钱起卦法
 * @param divinationTime 起卦时间（可选）
 * @returns LiuYaoResult 六爻结果
 */
export function generateHexagram(divinationTime?: Date): LiuYaoResult {
  const yaos: number[] = [];
  const yaoTypes: string[] = [];
  const symbols: string[] = [];
  const coinDetails: CoinDivination['coins'] = [];
  
  // 投掷六次铜钱，从下往上建卦
  for (let i = 0; i < 6; i++) {
    const heads = Math.floor(Math.random() * 4); // 0-3个正面
    const tails = 3 - heads; // 反面数量
    
    // 计算爻值：正面为3（奇数），反面为2（偶数）
    const yaoValue = heads * 3 + tails * 2;
    
    yaos.push(yaoValue);
    
    const yaoType = YAO_TYPES[yaoValue as keyof typeof YAO_TYPES];
    yaoTypes.push(yaoType.name);
    symbols.push(yaoType.symbol);
    
    coinDetails.push({
      throw: i + 1,
      heads,
      tails,
      yaoValue,
      yaoType: yaoType.name
    });
  }
  
  // 计算本卦卦号
  const originalNumber = calculateHexagramNumber(yaos);
  
  // 计算动爻
  const movingLines = yaos
    .map((yao, index) => ({ yao, position: index + 1 }))
    .filter(item => YAO_TYPES[item.yao as keyof typeof YAO_TYPES].isMoving)
    .map(item => item.position);
  
  // 计算变卦（如果有动爻）
  let changedHexagram = undefined;
  if (movingLines.length > 0) {
    const changedYaos = yaos.map((yao, index) => {
      if (movingLines.includes(index + 1)) {
        // 老阴变少阳，老阳变少阴
        return yao === 6 ? 7 : yao === 9 ? 8 : yao;
      }
      return yao;
    });
    
    const changedNumber = calculateHexagramNumber(changedYaos);
    const changedYaoTypes = changedYaos.map(yao => YAO_TYPES[yao as keyof typeof YAO_TYPES].name);
    const changedSymbols = changedYaos.map(yao => YAO_TYPES[yao as keyof typeof YAO_TYPES].symbol);
    
    changedHexagram = {
      number: changedNumber,
      name: HEXAGRAM_NAMES[changedNumber],
      yaos: changedYaos,
      yaoTypes: changedYaoTypes,
      symbols: changedSymbols
    };
  }
  
  // 计算世应位置（简化算法）
  const { worldYao, responseYao } = calculateWorldResponse(originalNumber);
  
  // 获取起卦时间信息
  const timeInfo = divinationTime ? getFourPillarsGanZhi(divinationTime) : undefined;
  
  return {
    id: `liuyao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    method: 'coins',
    divinationTime: timeInfo,
    originalHexagram: {
      number: originalNumber,
      name: HEXAGRAM_NAMES[originalNumber],
      yaos,
      yaoTypes,
      symbols
    },
    changedHexagram,
    movingLines,
    worldYao,
    responseYao
  };
}

/**
 * 梅花易数起卦法
 * @param year 年
 * @param month 月  
 * @param day 日
 * @param hour 时
 * @param question 问题（可选）
 * @param divinationTime 起卦时间（可选）
 * @returns LiuYaoResult 六爻结果
 */
export function generatePlumBlossomHexagram(
  year: number, 
  month: number, 
  day: number, 
  hour: number,
  question?: string,
  divinationTime?: Date
): LiuYaoResult {
  // 梅花易数算法
  const upperSum = (year + month + day) % 8 || 8;
  const lowerSum = (year + month + day + hour) % 8 || 8;
  const movingLinePos = ((year + month + day + hour) % 6) || 6;
  
  // 根据卦数转换为64卦
  const upperTrigram = upperSum;
  const lowerTrigram = lowerSum;
  
  // 构建原始六爻（八卦转六爻的简化方法）
  const yaos = buildYaosFromTrigrams(upperTrigram, lowerTrigram);
  const yaoTypes = yaos.map(yao => YAO_TYPES[yao as keyof typeof YAO_TYPES].name);
  const symbols = yaos.map(yao => YAO_TYPES[yao as keyof typeof YAO_TYPES].symbol);
  
  // 设置动爻
  const originalYaos = [...yaos];
  originalYaos[movingLinePos - 1] = originalYaos[movingLinePos - 1] === 7 ? 9 : 6; // 设为动爻
  
  const originalNumber = calculateHexagramNumber(originalYaos);
  const movingLines = [movingLinePos];
  
  // 计算变卦
  const changedYaos = originalYaos.map((yao, index) => {
    if (index + 1 === movingLinePos) {
      return yao === 6 ? 7 : yao === 9 ? 8 : yao;
    }
    return yao;
  });
  
  const changedNumber = calculateHexagramNumber(changedYaos);
  const changedYaoTypes = changedYaos.map(yao => YAO_TYPES[yao as keyof typeof YAO_TYPES].name);
  const changedSymbols = changedYaos.map(yao => YAO_TYPES[yao as keyof typeof YAO_TYPES].symbol);
  
  const { worldYao, responseYao } = calculateWorldResponse(originalNumber);
  
  // 获取起卦时间信息
  const timeInfo = divinationTime ? getFourPillarsGanZhi(divinationTime) : undefined;
  
  return {
    id: `liuyao_plum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    method: 'plum',
    divinationTime: timeInfo,
    originalHexagram: {
      number: originalNumber,
      name: HEXAGRAM_NAMES[originalNumber],
      yaos: originalYaos,
      yaoTypes: originalYaos.map(yao => YAO_TYPES[yao as keyof typeof YAO_TYPES].name),
      symbols: originalYaos.map(yao => YAO_TYPES[yao as keyof typeof YAO_TYPES].symbol)
    },
    changedHexagram: {
      number: changedNumber,
      name: HEXAGRAM_NAMES[changedNumber],
      yaos: changedYaos,
      yaoTypes: changedYaoTypes,
      symbols: changedSymbols
    },
    movingLines,
    worldYao,
    responseYao,
    question
  };
}

/**
 * 根据八卦数构建六爻
 */
function buildYaosFromTrigrams(upper: number, lower: number): number[] {
  // 八卦对应的三爻模式 (7=阳爻, 8=阴爻)
  const trigramPatterns: { [key: number]: number[] } = {
    1: [7, 7, 7], // 乾
    2: [8, 8, 8], // 坤  
    3: [7, 8, 8], // 震
    4: [8, 7, 8], // 巽
    5: [8, 7, 7], // 坎
    6: [7, 8, 7], // 离
    7: [8, 8, 7], // 艮
    8: [7, 7, 8]  // 兑
  };
  
  const lowerYaos = trigramPatterns[lower] || [7, 7, 7];
  const upperYaos = trigramPatterns[upper] || [7, 7, 7];
  
  return [...lowerYaos, ...upperYaos];
}

/**
 * 根据爻值计算卦号（0-63）
 */
function calculateHexagramNumber(yaos: number[]): number {
  // 将爻值转换为二进制，老阴和少阴为0，老阳和少阳为1
  let binary = '';
  for (let i = yaos.length - 1; i >= 0; i--) { // 从上爻到下爻
    binary += (yaos[i] === 7 || yaos[i] === 9) ? '1' : '0';
  }
  
  return parseInt(binary, 2);
}

/**
 * 计算世应位置（简化算法）
 */
function calculateWorldResponse(hexagramNumber: number): { worldYao: number; responseYao: number } {
  // 这里使用简化的算法，实际应用中需要更复杂的八宫归属判断
  const worldYao = (hexagramNumber % 6) + 1;
  const responseYao = worldYao === 6 ? 3 : worldYao === 5 ? 2 : worldYao === 4 ? 1 : worldYao + 3;
  
  return { worldYao, responseYao };
}

/**
 * 格式化六爻卦象显示
 */
export function formatHexagram(result: LiuYaoResult): string {
  const { originalHexagram, changedHexagram, movingLines } = result;
  
  let display = `本卦：${originalHexagram.name}\n`;
  
  // 显示爻象（从上到下）
  for (let i = 5; i >= 0; i--) {
    const position = i + 1;
    const isMoving = movingLines.includes(position);
    const symbol = originalHexagram.symbols[i];
    const yaoName = ['初', '二', '三', '四', '五', '上'][i];
    
    display += `${yaoName}爻：${symbol} ${originalHexagram.yaoTypes[i]}${isMoving ? ' (动)' : ''}\n`;
  }
  
  if (changedHexagram) {
    display += `\n变卦：${changedHexagram.name}\n`;
  }
  
  if (result.divinationTime) {
    const time = result.divinationTime;
    display += `\n起卦时间：${time.year}年 ${time.month}月 ${time.day}日 ${time.hour}时\n`;
  }
  
  display += `\n世爻：${result.worldYao}爻，应爻：${result.responseYao}爻`;
  
  return display;
}

/**
 * 获取动爻描述
 */
export function getMovingLinesDescription(movingLines: number[]): string {
  if (movingLines.length === 0) {
    return '无动爻，静卦';
  }
  
  const yaoNames = ['初', '二', '三', '四', '五', '上'];
  const descriptions = movingLines.map(line => `${yaoNames[line - 1]}爻动`);
  
  return descriptions.join('，');
}

/**
 * 获取起卦时间的时辰描述
 */
export function getDivinationTimeDescription(date: Date): string {
  const hour = date.getHours();
  return getTimeRangeByHour(hour);
}