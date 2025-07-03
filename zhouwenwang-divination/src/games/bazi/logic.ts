/**
 * 八字推命核心逻辑模块
 * 实现天干地支计算、生肖本命佛星座计算、八字排盘等功能
 */

import { 
  TIANGAN as HEAVENLY_STEMS,
  DIZHI as EARTHLY_BRANCHES,
  ZODIAC_ANIMALS,
  WUXING_MAPPING,
  getFourPillarsGanZhi,
  getTimeRangeByHour,
  getWuxing,
  getZodiacAnimal,
  type FourPillarsGanZhi
} from '../../utils/ganzhiUtils';

// 本命佛对应关系
export const GUARDIAN_BUDDHA = {
  '鼠': '千手观音菩萨',
  '牛': '虚空藏菩萨', 
  '虎': '虚空藏菩萨',
  '兔': '文殊菩萨',
  '龙': '普贤菩萨',
  '蛇': '普贤菩萨',
  '马': '大势至菩萨',
  '羊': '大日如来',
  '猴': '大日如来',
  '鸡': '不动尊菩萨',
  '狗': '阿弥陀佛',
  '猪': '阿弥陀佛'
} as const;

// 星座定义
export const CONSTELLATIONS = [
  { name: '摩羯座', start: [12, 22], end: [1, 19] },
  { name: '水瓶座', start: [1, 20], end: [2, 18] },
  { name: '双鱼座', start: [2, 19], end: [3, 20] },
  { name: '白羊座', start: [3, 21], end: [4, 19] },
  { name: '金牛座', start: [4, 20], end: [5, 20] },
  { name: '双子座', start: [5, 21], end: [6, 21] },
  { name: '巨蟹座', start: [6, 22], end: [7, 22] },
  { name: '狮子座', start: [7, 23], end: [8, 22] },
  { name: '处女座', start: [8, 23], end: [9, 22] },
  { name: '天秤座', start: [9, 23], end: [10, 23] },
  { name: '天蝎座', start: [10, 24], end: [11, 22] },
  { name: '射手座', start: [11, 23], end: [12, 21] }
] as const;

/**
 * 出生信息接口
 */
export interface BirthInfo {
  name: string;
  gender: '男' | '女';
  birthDate: Date;
  isLunar: boolean; // 是否农历
  birthTime: number; // 出生时辰（0-23）
}

/**
 * 四柱数据结构
 */
export interface FourPillars {
  year: { stem: string; branch: string; };
  month: { stem: string; branch: string; };
  day: { stem: string; branch: string; };
  hour: { stem: string; branch: string; };
}

/**
 * 八字排盘数据结构
 */
export interface BaZiChartData {
  id: string;
  timestamp: number;
  
  // 基本信息
  name: string;
  gender: '男' | '女';
  birthDate: Date;
  isLunar: boolean;
  birthTime: number; // 出生时辰（0-23）
  
  // 计算结果
  zodiacAnimal: string;
  guardianBuddha: string;
  constellation: string;
  fourPillars: FourPillars;
  
  // 五行分析
  wuxingAnalysis: {
    [key: string]: number; // 五行计数
  };
  
  // 性格分析要点
  personalityTraits: string[];
  
  // 命理要点
  keyPoints: string[];
}

/**
 * 简化的农历转阳历函数（仅供演示）
 * 实际应用中需要使用专业的历法转换库
 */
function lunarToSolar(lunarDate: Date): Date {
  // 这里只是一个简化实现，实际应该使用专业的农历转换库
  // 简单地增加大约18-50天作为概估
  const solarDate = new Date(lunarDate);
  solarDate.setDate(solarDate.getDate() + 30);
  return solarDate;
}

/**
 * 计算天干地支（使用通用工具类）
 */
function calculateGanZhi(date: Date): { year: string; month: string; day: string; hour: string; stemBranch: FourPillars } {
  const ganZhiResult = getFourPillarsGanZhi(date);
  
  // 解析四柱干支为单独的天干地支
  const fourPillars: FourPillars = {
    year: {
      stem: ganZhiResult.year.charAt(0),
      branch: ganZhiResult.year.charAt(1)
    },
    month: {
      stem: ganZhiResult.month.charAt(0),
      branch: ganZhiResult.month.charAt(1)
    },
    day: {
      stem: ganZhiResult.day.charAt(0),
      branch: ganZhiResult.day.charAt(1)
    },
    hour: {
      stem: ganZhiResult.hour.charAt(0),
      branch: ganZhiResult.hour.charAt(1)
    }
  };
  
  return {
    year: ganZhiResult.year,
    month: ganZhiResult.month,
    day: ganZhiResult.day,
    hour: ganZhiResult.hour,
    stemBranch: fourPillars
  };
}

/**
 * 计算星座
 */
function calculateConstellation(month: number, day: number): string {
  for (const constellation of CONSTELLATIONS) {
    const [startMonth, startDay] = constellation.start;
    const [endMonth, endDay] = constellation.end;
    
    // 处理跨年的星座（如摩羯座）
    if (startMonth > endMonth) {
      if (month === startMonth && day >= startDay) return constellation.name;
      if (month === endMonth && day <= endDay) return constellation.name;
      if (month > startMonth || month < endMonth) return constellation.name;
    } else {
      if (month === startMonth && day >= startDay) return constellation.name;
      if (month === endMonth && day <= endDay) return constellation.name;
      if (month > startMonth && month < endMonth) return constellation.name;
    }
  }
  
  return '摩羯座'; // 默认值
}

/**
 * 五行分析
 */
function analyzeWuxing(fourPillars: FourPillars): { [key: string]: number } {
  const wuxingCount: { [key: string]: number } = {
    '金': 0, '木': 0, '水': 0, '火': 0, '土': 0
  };
  
  // 统计四柱中各五行的数量
  Object.values(fourPillars).forEach(pillar => {
    const stemWuxing = getWuxing(pillar.stem);
    const branchWuxing = getWuxing(pillar.branch);
    
    if (stemWuxing) wuxingCount[stemWuxing]++;
    if (branchWuxing) wuxingCount[branchWuxing]++;
  });
  
  return wuxingCount;
}

/**
 * 生成性格特征分析
 */
function generatePersonalityTraits(dayStem: string, wuxingAnalysis: { [key: string]: number }): string[] {
  const traits: string[] = [];
  
  // 根据日干分析性格
  switch (dayStem) {
    case '甲':
      traits.push('性格直率，具有领导才能，富有创新精神');
      break;
    case '乙':
      traits.push('温和细腻，善于协调，具有艺术天赋');
      break;
    case '丙':
      traits.push('热情开朗，积极向上，具有感染力');
      break;
    case '丁':
      traits.push('聪明细致，善于思考，富有智慧');
      break;
    case '戊':
      traits.push('稳重可靠，脚踏实地，具有责任感');
      break;
    case '己':
      traits.push('温厚包容，善于服务，具有奉献精神');
      break;
    case '庚':
      traits.push('刚毅果断，意志坚强，具有执行力');
      break;
    case '辛':
      traits.push('精明敏锐，注重品质，具有审美眼光');
      break;
    case '壬':
      traits.push('聪明灵活，适应性强，具有变通能力');
      break;
    case '癸':
      traits.push('温润如水，善于感知，具有直觉力');
      break;
  }
  
  // 根据五行平衡分析
  const maxWuxing = Object.entries(wuxingAnalysis).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  const minWuxing = Object.entries(wuxingAnalysis).reduce((a, b) => a[1] < b[1] ? a : b)[0];
  
  traits.push(`五行中${maxWuxing}较旺，${minWuxing}相对较弱`);
  
  return traits;
}

/**
 * 生成命理要点
 */
function generateKeyPoints(chartData: BaZiChartData): string[] {
  const points: string[] = [];
  
  points.push(`生肖${chartData.zodiacAnimal}，本命佛为${chartData.guardianBuddha}`);
  points.push(`星座${chartData.constellation}，具有该星座的典型特征`);
  
  // 分析五行平衡
  const wuxing = chartData.wuxingAnalysis;
  const totalCount = Object.values(wuxing).reduce((sum, count) => sum + count, 0);
  
  Object.entries(wuxing).forEach(([element, count]) => {
    const percentage = ((count / totalCount) * 100).toFixed(1);
    if (count > 0) {
      points.push(`五行${element}占比${percentage}%`);
    }
  });
  
  return points;
}

/**
 * 生成八字排盘
 */
export function generateBaZiChart(birthInfo: BirthInfo): BaZiChartData {
  // 如果是农历，转换为阳历
  let solarDate = birthInfo.isLunar ? lunarToSolar(birthInfo.birthDate) : new Date(birthInfo.birthDate);
  
  // 设置正确的出生时辰
  solarDate = new Date(solarDate);
  solarDate.setHours(birthInfo.birthTime, 0, 0, 0);
  
  // 计算四柱
  const ganZhiResult = calculateGanZhi(solarDate);
  
  // 计算生肖
  const zodiacAnimal = getZodiacAnimal(solarDate.getFullYear());
  
  // 计算本命佛
  const guardianBuddha = GUARDIAN_BUDDHA[zodiacAnimal as keyof typeof GUARDIAN_BUDDHA];
  
  // 计算星座
  const constellation = calculateConstellation(solarDate.getMonth() + 1, solarDate.getDate());
  
  // 五行分析
  const wuxingAnalysis = analyzeWuxing(ganZhiResult.stemBranch);
  
  const chartData: BaZiChartData = {
    id: `bazi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    name: birthInfo.name,
    gender: birthInfo.gender,
    birthDate: birthInfo.birthDate,
    isLunar: birthInfo.isLunar,
    birthTime: birthInfo.birthTime,
    zodiacAnimal,
    guardianBuddha,
    constellation,
    fourPillars: ganZhiResult.stemBranch,
    wuxingAnalysis,
    personalityTraits: generatePersonalityTraits(ganZhiResult.stemBranch.day.stem, wuxingAnalysis),
    keyPoints: []
  };
  
  // 生成命理要点
  chartData.keyPoints = generateKeyPoints(chartData);
  
  return chartData;
}

/**
 * 格式化八字显示
 */
export function formatBaZiChart(chartData: BaZiChartData): string {
  const { fourPillars } = chartData;
  return `${fourPillars.year.stem + fourPillars.year.branch} ${fourPillars.month.stem + fourPillars.month.branch} ${fourPillars.day.stem + fourPillars.day.branch} ${fourPillars.hour.stem + fourPillars.hour.branch}`;
}

/**
 * 获取五行颜色（参考奇门遁甲的配色方案）
 */
export function getWuxingColor(wuxing: string): string {
  const colors = {
    '金': '#FFD700', // 金色
    '木': '#22C55E', // 绿色
    '水': '#3B82F6', // 蓝色
    '火': '#EF4444', // 红色
    '土': '#8B4513'  // 棕色
  };
  return colors[wuxing as keyof typeof colors] || '#CCCCCC';
}

/**
 * 获取干支五行（使用通用工具类）
 */
export function getGanZhiWuxing(ganOrZhi: string): string {
  return getWuxing(ganOrZhi);
}

// 导出通用的时辰计算函数，保持API兼容性
export { getTimeRangeByHour }; 