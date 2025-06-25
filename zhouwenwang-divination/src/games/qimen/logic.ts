/**
 * 奇门遁甲核心逻辑模块
 * 实现时间计算、起盘算法和数据结构
 */

// 基础常数定义
export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

export const NINE_STARS = [
  '天蓬', '天芮', '天冲', '天辅', '天禽', '天心', '天柱', '天任', '天英'
] as const;

export const EIGHT_DOORS = [
  '休门', '死门', '伤门', '杜门', '中门', '开门', '惊门', '生门', '景门'
] as const;

export const EIGHT_DEITIES = [
  '值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'
] as const;

// 九宫位置定义（洛书排列）
export const NINE_PALACES = [
  { position: 4, name: '四宫（巽）', direction: '东南' },
  { position: 9, name: '九宫（离）', direction: '南' },
  { position: 2, name: '二宫（坤）', direction: '西南' },
  { position: 3, name: '三宫（震）', direction: '东' },
  { position: 5, name: '五宫（中）', direction: '中央' },
  { position: 7, name: '七宫（兑）', direction: '西' },
  { position: 8, name: '八宫（艮）', direction: '东北' },
  { position: 1, name: '一宫（坎）', direction: '北' },
  { position: 6, name: '六宫（乾）', direction: '西北' }
] as const;

// 节气定义（简化版本，用于确定旬首）
export const SOLAR_TERMS = [
  { name: '立春', date: '2024-02-04' },
  { name: '惊蛰', date: '2024-03-05' },
  { name: '清明', date: '2024-04-04' },
  { name: '立夏', date: '2024-05-05' },
  { name: '芒种', date: '2024-06-05' },
  { name: '小暑', date: '2024-07-06' },
  { name: '立秋', date: '2024-08-07' },
  { name: '白露', date: '2024-09-07' },
  { name: '寒露', date: '2024-10-08' },
  { name: '立冬', date: '2024-11-07' },
  { name: '大雪', date: '2024-12-06' },
  { name: '小寒', date: '2025-01-05' }
] as const;

/**
 * 单个宫位的数据结构
 */
export interface PalaceData {
  position: number;        // 宫位号码（1-9）
  name: string;           // 宫位名称
  direction: string;      // 方位
  earthStem: string;      // 地盘天干
  heavenStem: string;     // 天盘天干
  star: string;           // 九星
  door: string;           // 八门
  deity: string;          // 八神
  isCenter: boolean;      // 是否为中宫
}

/**
 * 奇门遁甲盘数据结构
 */
export interface QiMenChartData {
  id: string;
  timestamp: number;
  dateTime: Date;
  
  // 时间信息
  year: string;           // 年干支
  month: string;          // 月干支
  day: string;            // 日干支
  hour: string;           // 时干支
  
  // 排盘信息
  escapeType: 'yang' | 'yin';  // 阳遁/阴遁
  bureauNumber: number;   // 局数（1-9）
  dutyChief: string;      // 值符
  dutyDoor: string;       // 值使
  
  // 九宫数据
  palaces: PalaceData[];
  
  // 分析要点
  keyPoints: string[];
}

/**
 * 计算干支
 * @param baseDate 基准日期
 * @returns 干支字符串
 */
function calculateGanZhi(baseDate: Date): { year: string; month: string; day: string; hour: string } {
  // 简化的干支计算（实际应该考虑节气等复杂因素）
  const baseYear = 1984; // 甲子年
  const currentYear = baseDate.getFullYear();
  const yearOffset = (currentYear - baseYear) % 60;
  
  const stemIndex = yearOffset % 10;
  const branchIndex = yearOffset % 12;
  
  const year = HEAVENLY_STEMS[stemIndex] + EARTHLY_BRANCHES[branchIndex];
  
  // 月干支计算（简化）
  const monthStemIndex = (stemIndex * 2 + baseDate.getMonth()) % 10;
  const monthBranchIndex = (baseDate.getMonth() + 2) % 12;
  const month = HEAVENLY_STEMS[monthStemIndex] + EARTHLY_BRANCHES[monthBranchIndex];
  
  // 日干支计算（简化）
  const daysSince1900 = Math.floor((baseDate.getTime() - new Date(1900, 0, 1).getTime()) / (1000 * 60 * 60 * 24));
  const dayStemIndex = (daysSince1900 + 1) % 10;
  const dayBranchIndex = (daysSince1900 + 1) % 12;
  const day = HEAVENLY_STEMS[dayStemIndex] + EARTHLY_BRANCHES[dayBranchIndex];
  
  // 时干支计算
  const hourIndex = Math.floor(baseDate.getHours() / 2);
  const hourStemIndex = (dayStemIndex * 2 + hourIndex) % 10;
  const hour = HEAVENLY_STEMS[hourStemIndex] + EARTHLY_BRANCHES[hourIndex % 12];
  
  return { year, month, day, hour };
}

/**
 * 确定阳遁阴遁
 * @param date 日期
 * @returns 遁甲类型
 */
function determineEscapeType(date: Date): 'yang' | 'yin' {
  // 简化规则：冬至到夏至为阳遁，夏至到冬至为阴遁
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 简化判断：3-8月为阳遁，9-2月为阴遁
  if (month >= 3 && month <= 8) {
    return 'yang';
  } else {
    return 'yin';
  }
}

/**
 * 计算局数
 * @param date 日期
 * @param escapeType 遁甲类型
 * @returns 局数
 */
function calculateBureauNumber(date: Date, escapeType: 'yang' | 'yin'): number {
  // 简化计算：根据月份和遁甲类型确定局数
  const month = date.getMonth() + 1;
  
  if (escapeType === 'yang') {
    // 阳遁：立春一七四，惊蛰二八五，清明三九六...
    const patterns = [1, 7, 4, 2, 8, 5, 3, 9, 6, 1, 7, 4];
    return patterns[month - 1];
  } else {
    // 阴遁：立秋九三六，白露八二五，寒露七一四...
    const patterns = [9, 3, 6, 8, 2, 5, 7, 1, 4, 9, 3, 6];
    return patterns[month - 1];
  }
}

/**
 * 获取值符值使
 * @param day 日干支
 * @param hour 时干支
 * @returns 值符值使信息
 */
function getDutyChiefAndDoor(day: string, hour: string): { dutyChief: string; dutyDoor: string } {
  // 简化实现：根据日干确定值符，根据时干确定值使
  const dayStem = day[0] as typeof HEAVENLY_STEMS[number];
  const hourStem = hour[0] as typeof HEAVENLY_STEMS[number];
  
  const stemIndex = HEAVENLY_STEMS.indexOf(dayStem);
  const hourStemIndex = HEAVENLY_STEMS.indexOf(hourStem);
  
  const dutyChief = NINE_STARS[stemIndex % NINE_STARS.length];
  const dutyDoor = EIGHT_DOORS[hourStemIndex % EIGHT_DOORS.length];
  
  return { dutyChief, dutyDoor };
}

/**
 * 生成九宫数据
 * @param bureauNumber 局数
 * @param escapeType 遁甲类型
 * @param dutyChief 值符
 * @param dutyDoor 值使
 * @returns 九宫数据
 */
function generatePalaces(
  bureauNumber: number,
  escapeType: 'yang' | 'yin',
  dutyChief: string,
  dutyDoor: string
): PalaceData[] {
  const palaces: PalaceData[] = [];
  
  // 地盘基础排列（戊、己、庚、辛、壬、癸、丁、丙、乙）
  const baseEarthStems = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
  
  for (let i = 0; i < 9; i++) {
    const palace = NINE_PALACES[i];
    
    // 地盘天干按照基础排列
    const earthStem = baseEarthStems[i];
    
    // 天盘天干根据值符和局数计算（简化）
    const earthStemTyped = earthStem as typeof HEAVENLY_STEMS[number];
    const heavenStemIndex = (HEAVENLY_STEMS.indexOf(earthStemTyped) + bureauNumber - 1) % 10;
    const heavenStem = HEAVENLY_STEMS[heavenStemIndex];
    
    // 九星按照值符开始排列
    const dutyChiefTyped = dutyChief as typeof NINE_STARS[number];
    const chiefIndex = NINE_STARS.indexOf(dutyChiefTyped);
    const starIndex = (chiefIndex + i) % NINE_STARS.length;
    const star = NINE_STARS[starIndex];
    
    // 八门按照值使开始排列（跳过中宫）
    const dutyDoorTyped = dutyDoor as typeof EIGHT_DOORS[number];
    const doorIndex = EIGHT_DOORS.indexOf(dutyDoorTyped);
    const adjustedDoorIndex = palace.position === 5 ? 4 : (doorIndex + i) % EIGHT_DOORS.length; // 中宫用中门
    const door = EIGHT_DOORS[adjustedDoorIndex];
    
    // 八神按照传统八宫排列（中宫不放八神）
    let deity = '';
    if (palace.position === 5) {
      // 中宫不放八神，符合传统奇门遁甲规则
      deity = '';
    } else {
      // 其他八宫按顺序放置八神
      const deityIndex = i < 4 ? i : i - 1; // 跳过中宫位置
      deity = EIGHT_DEITIES[deityIndex % EIGHT_DEITIES.length];
    }
    
    palaces.push({
      position: palace.position,
      name: palace.name,
      direction: palace.direction,
      earthStem,
      heavenStem,
      star,
      door,
      deity,
      isCenter: palace.position === 5
    });
  }
  
  return palaces;
}

/**
 * 生成分析要点
 * @param chartData 盘数据
 * @returns 分析要点
 */
function generateKeyPoints(chartData: QiMenChartData): string[] {
  const points: string[] = [];
  
  points.push(`当前为${chartData.escapeType === 'yang' ? '阳' : '阴'}遁${chartData.bureauNumber}局`);
  points.push(`值符为${chartData.dutyChief}，值使为${chartData.dutyDoor}`);
  
  // 分析用神宫（简化）
  const centerPalace = chartData.palaces.find(p => p.isCenter);
  if (centerPalace) {
    points.push(`中宫${centerPalace.star}${centerPalace.door}，主事宜${centerPalace.door.includes('生') ? '生发' : '谨慎'}`);
  }
  
  // 寻找吉门
  const goodDoors = ['开门', '休门', '生门'];
  const goodPalaces = chartData.palaces.filter(p => goodDoors.includes(p.door));
  if (goodPalaces.length > 0) {
    points.push(`吉门位于：${goodPalaces.map(p => `${p.direction}方${p.door}`).join('、')}`);
  }
  
  return points;
}

/**
 * 生成奇门遁甲盘
 * @param dateTime 指定时间
 * @returns 奇门遁甲盘数据
 */
export function generateQiMenChart(dateTime: Date = new Date()): QiMenChartData {
  // 计算基础信息
  const ganZhi = calculateGanZhi(dateTime);
  const escapeType = determineEscapeType(dateTime);
  const bureauNumber = calculateBureauNumber(dateTime, escapeType);
  const { dutyChief, dutyDoor } = getDutyChiefAndDoor(ganZhi.day, ganZhi.hour);
  
  // 生成九宫数据
  const palaces = generatePalaces(bureauNumber, escapeType, dutyChief, dutyDoor);
  
  // 构建完整数据
  const chartData: QiMenChartData = {
    id: `qimen-${Date.now()}`,
    timestamp: dateTime.getTime(),
    dateTime,
    year: ganZhi.year,
    month: ganZhi.month,
    day: ganZhi.day,
    hour: ganZhi.hour,
    escapeType,
    bureauNumber,
    dutyChief,
    dutyDoor,
    palaces,
    keyPoints: []
  };
  
  // 生成分析要点
  chartData.keyPoints = generateKeyPoints(chartData);
  
  return chartData;
}

/**
 * 格式化时间信息
 * @param chartData 盘数据
 * @returns 格式化的时间字符串
 */
export function formatDateTime(chartData: QiMenChartData): string {
  const date = chartData.dateTime;
  // 确保显示的是北京时间
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * 获取宫位颜色
 * @param position 宫位号
 * @returns CSS颜色类名
 */
export function getPalaceColor(position: number): string {
  const colors = [
    'bg-blue-900/30',     // 1宫 坎水
    'bg-yellow-900/30',   // 2宫 坤土
    'bg-green-900/30',    // 3宫 震木
    'bg-green-800/30',    // 4宫 巽木
    'bg-orange-900/30',   // 5宫 中土
    'bg-gray-800/30',     // 6宫 乾金
    'bg-gray-700/30',     // 7宫 兑金
    'bg-brown-900/30',    // 8宫 艮土
    'bg-red-900/30'       // 9宫 离火
  ];
  
  return colors[position - 1] || 'bg-gray-800/30';
}

/**
 * 检查是否为吉门
 * @param door 门名
 * @returns 是否为吉门
 */
export function isGoodDoor(door: string): boolean {
  const goodDoors = ['开门', '休门', '生门'];
  return goodDoors.includes(door);
}

/**
 * 检查是否为吉星
 * @param star 星名
 * @returns 是否为吉星
 */
export function isGoodStar(star: string): boolean {
  const goodStars = ['天辅', '天心', '天任'];
  return goodStars.includes(star);
} 