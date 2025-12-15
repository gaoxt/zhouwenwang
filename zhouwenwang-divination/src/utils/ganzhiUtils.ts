/**
 * 干支计算工具类
 * 提供天干地支相关的通用计算功能
 */

// 天干数组
export const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;

// 地支数组
export const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

// 生肖动物（与地支对应）
export const ZODIAC_ANIMALS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'] as const;

// 五行对应关系
export const WUXING_MAPPING = {
  // 天干五行
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火', 
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
  // 地支五行
  '子': '水', '亥': '水',
  '寅': '木', '卯': '木',
  '巳': '火', '午': '火',
  '申': '金', '酉': '金',
  '辰': '土', '戌': '土', '丑': '土', '未': '土'
} as const;

/**
 * 时辰信息接口
 */
export interface TimeSlot {
  name: string;      // 时辰名称（子时、丑时等）
  range: string;     // 时间范围（如：23:00-01:00）
  hours: number[];   // 对应的小时数组
  zhiIndex: number;  // 地支索引
}

/**
 * 十二时辰定义
 * 传统时辰划分：子丑寅卯辰巳午未申酉戌亥
 */
export const TIME_SLOTS: TimeSlot[] = [
  { name: '子时', range: '23:00-01:00', hours: [23, 0], zhiIndex: 0 },
  { name: '丑时', range: '01:00-03:00', hours: [1, 2], zhiIndex: 1 },
  { name: '寅时', range: '03:00-05:00', hours: [3, 4], zhiIndex: 2 },
  { name: '卯时', range: '05:00-07:00', hours: [5, 6], zhiIndex: 3 },
  { name: '辰时', range: '07:00-09:00', hours: [7, 8], zhiIndex: 4 },
  { name: '巳时', range: '09:00-11:00', hours: [9, 10], zhiIndex: 5 },
  { name: '午时', range: '11:00-13:00', hours: [11, 12], zhiIndex: 6 },
  { name: '未时', range: '13:00-15:00', hours: [13, 14], zhiIndex: 7 },
  { name: '申时', range: '15:00-17:00', hours: [15, 16], zhiIndex: 8 },
  { name: '酉时', range: '17:00-19:00', hours: [17, 18], zhiIndex: 9 },
  { name: '戌时', range: '19:00-21:00', hours: [19, 20], zhiIndex: 10 },
  { name: '亥时', range: '21:00-23:00', hours: [21, 22], zhiIndex: 11 }
];

/**
 * 根据小时数获取时辰信息
 * @param hour 小时数（0-23）
 * @returns TimeSlot 时辰信息
 */
export function getTimeSlotByHour(hour: number): TimeSlot {
  for (const timeSlot of TIME_SLOTS) {
    if (timeSlot.hours.includes(hour)) {
      return timeSlot;
    }
  }
  
  // 默认返回子时（不应该走到这里）
  return TIME_SLOTS[0];
}

/**
 * 根据小时数获取地支索引
 * @param hour 小时数（0-23）
 * @returns number 地支索引（0-11）
 */
export function getZhiIndexByHour(hour: number): number {
  return getTimeSlotByHour(hour).zhiIndex;
}

/**
 * 获取时辰对应的时间范围描述
 * @param hour 小时数（0-23）
 * @returns string 时间范围描述，如：'23:00-01:00 (子时)'
 */
export function getTimeRangeByHour(hour: number): string {
  const timeSlot = getTimeSlotByHour(hour);
  return `${timeSlot.range} (${timeSlot.name})`;
}

/**
 * 计算年干支（考虑立春节气）
 * @param date 时间对象
 * @returns string 年干支
 */
export function getYearGanZhi(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 判断是否在立春之前，立春一般在2月3-5日
  // 简化处理：如果在2月4日之前，使用前一年的干支
  let actualYear = year;
  if (month < 2 || (month === 2 && day < 4)) {
    actualYear = year - 1;
  }
  
  // 以1984年甲子年为基准（更准确的基准年）
  const baseYear = 1984; // 甲子年
  const baseGanIndex = 0; // 甲的索引
  const baseZhiIndex = 0; // 子的索引
  
  const yearDiff = actualYear - baseYear;
  const ganIndex = (baseGanIndex + yearDiff) % 10;
  const zhiIndex = (baseZhiIndex + yearDiff) % 12;
  
  // 处理负数情况
  const finalGanIndex = ganIndex >= 0 ? ganIndex : (ganIndex + 10);
  const finalZhiIndex = zhiIndex >= 0 ? zhiIndex : (zhiIndex + 12);
  
  return TIANGAN[finalGanIndex] + DIZHI[finalZhiIndex];
}

/**
 * 计算月干支（考虑节气月份）
 * @param date 时间对象
 * @returns string 月干支
 */
export function getMonthGanZhi(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 根据节气确定真实的月支（简化处理）
  // 正月寅，二月卯，三月辰，四月巳，五月午，六月未
  // 七月申，八月酉，九月戌，十月亥，十一月子，十二月丑
  let monthZhi: number;
  
  if (month === 1) {
    // 1月份：小寒（1/5-6）、大寒（1/20-21）
    // 大寒后仍是丑月，直到立春
    monthZhi = 1; // 丑月（十二月）
  } else if (month === 2) {
    if (day < 4) {
      monthZhi = 1; // 丑月（立春前）
    } else {
      monthZhi = 2; // 寅月（立春后）
    }
  } else if (month === 3) {
    if (day < 6) {
      monthZhi = 2; // 寅月（惊蛰前）
    } else {
      monthZhi = 3; // 卯月（惊蛰后）
    }
  } else if (month === 4) {
    if (day < 5) {
      monthZhi = 3; // 卯月（清明前）
    } else {
      monthZhi = 4; // 辰月（清明后）
    }
  } else if (month === 5) {
    if (day < 6) {
      monthZhi = 4; // 辰月（立夏前）
    } else {
      monthZhi = 5; // 巳月（立夏后）
    }
  } else if (month === 6) {
    if (day < 6) {
      monthZhi = 5; // 巳月（芒种前）
    } else {
      monthZhi = 6; // 午月（芒种后）
    }
  } else if (month === 7) {
    if (day < 7) {
      monthZhi = 6; // 午月（小暑前）
    } else {
      monthZhi = 7; // 未月（小暑后）
    }
  } else if (month === 8) {
    if (day < 8) {
      monthZhi = 7; // 未月（立秋前）
    } else {
      monthZhi = 8; // 申月（立秋后）
    }
  } else if (month === 9) {
    if (day < 8) {
      monthZhi = 8; // 申月（白露前）
    } else {
      monthZhi = 9; // 酉月（白露后）
    }
  } else if (month === 10) {
    if (day < 8) {
      monthZhi = 9; // 酉月（寒露前）
    } else {
      monthZhi = 10; // 戌月（寒露后）
    }
  } else if (month === 11) {
    if (day < 7) {
      monthZhi = 10; // 戌月（立冬前）
    } else {
      monthZhi = 11; // 亥月（立冬后）
    }
  } else { // month === 12
    if (day < 7) {
      monthZhi = 11; // 亥月（大雪前）
    } else {
      monthZhi = 0; // 子月（大雪后）
    }
  }
  
  // 月干推算：根据年干确定月干
  const yearGan = getYearGanZhi(date).charAt(0);
  const yearGanIndex = TIANGAN.indexOf(yearGan as typeof TIANGAN[number]);
  
  // 月干计算公式：甲己年起丙寅，乙庚年起戊寅，丙辛年起庚寅，丁壬年起壬寅，戊癸年起甲寅
  const monthGanBase = [2, 4, 6, 8, 0]; // 对应甲己、乙庚、丙辛、丁壬、戊癸年的寅月起始天干
  const baseGanIndex = monthGanBase[yearGanIndex % 5];
  
  // 计算实际月干：从寅月开始计算
  const monthGanIndex = (baseGanIndex + (monthZhi + 10) % 12) % 10; // +10是因为寅=2，要调整到从寅开始
  
  return TIANGAN[monthGanIndex] + DIZHI[monthZhi];
}

/**
 * 计算日干支
 * @param date 时间对象
 * @returns string 日干支
 */
export function getDayGanZhi(date: Date): string {
  // 使用更准确的基准日期：2000年1月1日是戊午日
  const baseDate = new Date(2000, 0, 1); // 2000年1月1日
  const baseGanIndex = 4; // 戊
  const baseZhiIndex = 6; // 午
  
  const timeDiff = date.getTime() - baseDate.getTime();
  const dayDiff = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
  
  const ganIndex = (baseGanIndex + dayDiff) % 10;
  const zhiIndex = (baseZhiIndex + dayDiff) % 12;
  
  // 处理负数情况
  const finalGanIndex = ganIndex >= 0 ? ganIndex : (ganIndex + 10);
  const finalZhiIndex = zhiIndex >= 0 ? zhiIndex : (zhiIndex + 12);
  
  return TIANGAN[finalGanIndex] + DIZHI[finalZhiIndex];
}

/**
 * 计算时干支
 * @param date 时间对象
 * @returns string 时干支
 */
export function getHourGanZhi(date: Date): string {
  const hour = date.getHours();
  
  // 使用工具函数获取地支索引
  const zhiIndex = getZhiIndexByHour(hour);
  
  // 时干计算：根据日干推算
  const dayGan = getDayGanZhi(date).charAt(0);
  const dayGanIndex = TIANGAN.indexOf(dayGan as typeof TIANGAN[number]);
  
  // 时干计算公式：甲己日起甲子，乙庚日起丙子，丙辛日起戊子，丁壬日起庚子，戊癸日起壬子
  const hourGanBase = [0, 2, 4, 6, 8]; // 对应甲己、乙庚、丙辛、丁壬、戊癸日的子时起始天干
  const baseGanIndex = hourGanBase[dayGanIndex % 5];
  
  // 计算实际时干
  const hourGanIndex = (baseGanIndex + zhiIndex) % 10;
  
  return TIANGAN[hourGanIndex] + DIZHI[zhiIndex];
}

/**
 * 计算完整的四柱干支
 * @param date 时间对象
 * @returns object 包含年月日时四柱干支
 */
export interface FourPillarsGanZhi {
  year: string;
  month: string;
  day: string;
  hour: string;
}

export function getFourPillarsGanZhi(date: Date): FourPillarsGanZhi {
  return {
    year: getYearGanZhi(date),
    month: getMonthGanZhi(date),
    day: getDayGanZhi(date),
    hour: getHourGanZhi(date)
  };
}

/**
 * 获取干支对应的五行
 * @param ganZhi 干支字符（如：甲、子等）
 * @returns string 对应的五行
 */
export function getWuxing(ganZhi: string): string {
  return WUXING_MAPPING[ganZhi as keyof typeof WUXING_MAPPING] || '土';
}

/**
 * 计算生肖动物
 * @param year 年份
 * @returns string 生肖动物
 */
export function getZodiacAnimal(year: number): string {
  // 以1900年（鼠年）为基准
  const baseYear = 1900;
  const offset = (year - baseYear) % 12;
  const index = offset >= 0 ? offset : (offset + 12);
  return ZODIAC_ANIMALS[index];
}

// 六十甲子循环表
export const GANZHI_CYCLE = [
  '甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉',
  '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未',
  '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳',
  '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯',
  '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑',
  '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥'
] as const;

/**
 * 验证时间对象是否有效
 * @param date 时间对象
 * @returns boolean 是否有效
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
} 