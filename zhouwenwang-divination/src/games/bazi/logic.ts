/**
 * 八字推命核心逻辑模块
 * 实现天干地支计算、生肖本命佛星座计算、八字排盘等功能
 */

// 基础常数定义
export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

// 生肖动物
export const ZODIAC_ANIMALS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'] as const;

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

// 五行对应关系
export const WUXING_MAPPING = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火', 
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
  '子': '水', '亥': '水',
  '寅': '木', '卯': '木',
  '巳': '火', '午': '火',
  '申': '金', '酉': '金',
  '辰': '土', '戌': '土', '丑': '土', '未': '土'
} as const;

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
 * 计算天干地支
 */
function calculateGanZhi(date: Date): { year: string; month: string; day: string; hour: string; stemBranch: FourPillars } {
  // 1900年庚子年作为基准
  const baseYear = 1900;
  const currentYear = date.getFullYear();
  const yearOffset = currentYear - baseYear;
  
  // 年干支计算
  const yearStemIndex = (yearOffset + 6) % 10; // 1900年是庚年，庚在天干中是第7位（索引6）
  const yearBranchIndex = yearOffset % 12;
  
  // 月干支计算（需要考虑节气，这里简化处理）
  const month = date.getMonth() + 1;
  const monthBranchIndex = (month + 1) % 12; // 正月为寅月
  const monthStemIndex = (yearStemIndex * 2 + monthBranchIndex) % 10;
  
  // 日干支计算
  const baseDate = new Date(1900, 0, 1); // 1900年1月1日
  const daysDiff = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  const dayStemIndex = (daysDiff + 6) % 10; // 1900年1月1日是庚日
  const dayBranchIndex = (daysDiff + 6) % 12;
  
  // 时干支计算
  const hour = date.getHours();
  const hourBranchIndex = Math.floor((hour + 1) / 2) % 12; // 23-1点为子时
  const hourStemIndex = (dayStemIndex * 2 + hourBranchIndex) % 10;
  
  const fourPillars: FourPillars = {
    year: {
      stem: HEAVENLY_STEMS[yearStemIndex],
      branch: EARTHLY_BRANCHES[yearBranchIndex]
    },
    month: {
      stem: HEAVENLY_STEMS[monthStemIndex],
      branch: EARTHLY_BRANCHES[monthBranchIndex]
    },
    day: {
      stem: HEAVENLY_STEMS[dayStemIndex],
      branch: EARTHLY_BRANCHES[dayBranchIndex]
    },
    hour: {
      stem: HEAVENLY_STEMS[hourStemIndex],
      branch: EARTHLY_BRANCHES[hourBranchIndex]
    }
  };
  
  return {
    year: fourPillars.year.stem + fourPillars.year.branch,
    month: fourPillars.month.stem + fourPillars.month.branch,
    day: fourPillars.day.stem + fourPillars.day.branch,
    hour: fourPillars.hour.stem + fourPillars.hour.branch,
    stemBranch: fourPillars
  };
}

/**
 * 计算生肖
 */
function calculateZodiacAnimal(year: number): string {
  // 以1900年（鼠年）为基准
  const baseYear = 1900;
  const offset = (year - baseYear) % 12;
  return ZODIAC_ANIMALS[offset];
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
    const stemWuxing = WUXING_MAPPING[pillar.stem as keyof typeof WUXING_MAPPING];
    const branchWuxing = WUXING_MAPPING[pillar.branch as keyof typeof WUXING_MAPPING];
    
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
  const zodiacAnimal = calculateZodiacAnimal(solarDate.getFullYear());
  
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
 * 获取干支五行
 */
export function getGanZhiWuxing(ganOrZhi: string): string {
  return WUXING_MAPPING[ganOrZhi as keyof typeof WUXING_MAPPING] || '土';
}

/**
 * 计算时辰对应的时间范围
 * 传统时辰划分：子丑寅卯辰巳午未申酉戌亥
 */
export function getTimeRangeByHour(hour: number): string {
  // 十二时辰对应的时间段
  const timeRanges = [
    { name: '子时', range: '23:00-01:00', hours: [23, 0] },
    { name: '丑时', range: '01:00-03:00', hours: [1, 2] },
    { name: '寅时', range: '03:00-05:00', hours: [3, 4] },
    { name: '卯时', range: '05:00-07:00', hours: [5, 6] },
    { name: '辰时', range: '07:00-09:00', hours: [7, 8] },
    { name: '巳时', range: '09:00-11:00', hours: [9, 10] },
    { name: '午时', range: '11:00-13:00', hours: [11, 12] },
    { name: '未时', range: '13:00-15:00', hours: [13, 14] },
    { name: '申时', range: '15:00-17:00', hours: [15, 16] },
    { name: '酉时', range: '17:00-19:00', hours: [17, 18] },
    { name: '戌时', range: '19:00-21:00', hours: [19, 20] },
    { name: '亥时', range: '21:00-23:00', hours: [21, 22] }
  ];
  
  // 查找对应的时辰
  for (const timeSlot of timeRanges) {
    if (timeSlot.hours.includes(hour)) {
      return `${timeSlot.range} (${timeSlot.name})`;
    }
  }
  
  // 默认返回子时（不应该走到这里）
  return '23:00-01:00 (子时)';
} 