import { 
  getFourPillarsGanZhi, 
  getWuxing,
  TIANGAN,
  DIZHI,
  GANZHI_CYCLE
} from '../../utils/ganzhiUtils';

export interface KlineData {
  age: number;      // 年龄
  year: number;     // 年份
  yearGanZhi: string; // 流年干支
  daYun: string;    // 当前大运
  open: number;     // 开盘分（年初运势）
  close: number;    // 收盘分（年末运势）
  high: number;     // 最高分
  low: number;      // 最低分
  score: number;    // 综合得分
  summary: string;  // 吉凶评语
  wuxingAnalysis: string; // 五行分析
}

/**
 * 获取干支在六十甲子中的索引
 */
function getGanZhiIndex(ganZhi: string): number {
  return GANZHI_CYCLE.indexOf(ganZhi as typeof GANZHI_CYCLE[number]);
}

/**
 * 根据索引获取干支
 */
function getGanZhiByIndex(index: number): string {
  return GANZHI_CYCLE[index % 60];
}

/**
 * 将AI返回的稀疏数据点（每5年一个）插值生成完整的100年K线数据
 * @param sparseData AI返回的稀疏数据点（通常每5年一个）
 * @param birthYear 出生年份
 * @returns 完整的100年K线数据
 */
export function interpolateKlineData(sparseData: Partial<KlineData>[], birthYear: number): KlineData[] {
  const fullData: KlineData[] = [];
  
  // 创建稀疏数据点的映射，方便查找
  const sparseMap = new Map<number, Partial<KlineData>>();
  sparseData.forEach(item => {
    if (item.age !== undefined) {
      sparseMap.set(item.age, item);
    }
  });
  
  // 获取大运周期（假设每10年一运）
  // 从稀疏数据中找到第一个大运信息
  const firstDaYun = sparseData.find(d => d.daYun && d.daYun !== '童限')?.daYun || '甲子';
  const startYunAge = sparseData.find(d => d.daYun && d.daYun !== '童限')?.age || 2;
  let daYunIndex = GANZHI_CYCLE.indexOf(firstDaYun as typeof GANZHI_CYCLE[number]);
  if (daYunIndex === -1) daYunIndex = 0;
  let currentDaYun = firstDaYun;
  
  for (let age = 1; age <= 100; age++) {
    const currentYear = birthYear + age - 1;
    
    // 计算流年干支
    const offset = currentYear - 1984;
    const yearIndex = offset >= 0 ? offset % 60 : (60 + (offset % 60)) % 60;
    const yearGanZhi = GANZHI_CYCLE[yearIndex];
    
    // 换大运逻辑（每10年）
    if (age >= startYunAge && (age - startYunAge) % 10 === 0 && age > startYunAge) {
      daYunIndex = (daYunIndex + 1) % 60;
      currentDaYun = GANZHI_CYCLE[daYunIndex];
    }
    
    // 如果当前年龄小于起运年龄，使用童限
    if (age < startYunAge) {
      currentDaYun = '童限';
    }
    
    // 查找最近的稀疏数据点进行插值
    const exactMatch = sparseMap.get(age);
    if (exactMatch) {
      // 如果正好有这个年龄的数据点，直接使用
      const score = exactMatch.score || 50;
      const gan = (exactMatch.yearGanZhi || yearGanZhi)[0];
      const zhi = (exactMatch.yearGanZhi || yearGanZhi)[1];
      const ganWuxing = getWuxing(gan);
      const zhiWuxing = getWuxing(zhi);
      
      // open是上一年的close，close是当前年的score
      const prevClose = fullData.length > 0 ? fullData[fullData.length - 1].close : score;
      const open = prevClose;
      const close = score;
      
      fullData.push({
        age,
        year: currentYear,
        yearGanZhi: exactMatch.yearGanZhi || yearGanZhi,
        daYun: exactMatch.daYun || currentDaYun,
        open: Math.round(open),
        close: Math.round(close),
        high: Math.min(100, Math.max(open, close) + 2),
        low: Math.max(0, Math.min(open, close) - 2),
        score: Math.round(score),
        summary: exactMatch.summary || '平',
        wuxingAnalysis: `流年${exactMatch.yearGanZhi || yearGanZhi}，天干${gan}属${ganWuxing}，地支${zhi}属${zhiWuxing}。${exactMatch.summary || '平'}` 
      });
    } else {
      // 需要插值：找到前后两个最近的数据点
      let prevAge = -1;
      let nextAge = 101;
      
      for (const key of sparseMap.keys()) {
        if (key < age && key > prevAge) prevAge = key;
        if (key > age && key < nextAge) nextAge = key;
      }
      
      let score = 50; // 默认分
      let summary = '平';
      
      if (prevAge !== -1 && nextAge !== 101) {
        // 线性插值
        const prevData = sparseMap.get(prevAge)!;
        const nextData = sparseMap.get(nextAge)!;
        const prevScore = prevData.score || 50;
        const nextScore = nextData.score || 50;
        const ratio = (age - prevAge) / (nextAge - prevAge);
        score = Math.round(prevScore + (nextScore - prevScore) * ratio);
        summary = prevData.summary || '平';
      } else if (prevAge !== -1) {
        // 只有前面的点，使用前面的值
        const prevData = sparseMap.get(prevAge)!;
        score = prevData.score || 50;
        summary = prevData.summary || '平';
      } else if (nextAge !== 101) {
        // 只有后面的点，使用后面的值
        const nextData = sparseMap.get(nextAge)!;
        score = nextData.score || 50;
        summary = nextData.summary || '平';
      }
      
      // 添加一些随机波动，使曲线更自然
      const variation = (Math.random() - 0.5) * 3;
      score = Math.max(10, Math.min(95, score + variation));
      
      // 根据分数确定吉凶
      if (score >= 80) summary = '大吉';
      else if (score >= 70) summary = '吉';
      else if (score >= 60) summary = '平';
      else if (score >= 40) summary = '凶';
      else summary = '大凶';
      
      const gan = yearGanZhi[0];
      const zhi = yearGanZhi[1];
      const ganWuxing = getWuxing(gan);
      const zhiWuxing = getWuxing(zhi);
      
      // open是上一年的close，close是当前年的score
      const prevClose = fullData.length > 0 ? fullData[fullData.length - 1].close : score;
      const open = prevClose;
      const close = score;
      
      fullData.push({
        age,
        year: currentYear,
        yearGanZhi,
        daYun: currentDaYun,
        open: Math.round(open),
        close: Math.round(close),
        high: Math.min(100, Math.max(open, close) + 2),
        low: Math.max(0, Math.min(open, close) - 2),
        score: Math.round(score),
        summary,
        wuxingAnalysis: `流年${yearGanZhi}，天干${gan}属${ganWuxing}，地支${zhi}属${zhiWuxing}。${summary}`
      });
    }
  }
  
  return fullData;
}

/**
 * 模拟生成人生100年K线数据
 * 注意：这是为了演示效果的模拟算法，非严谨的八字学术算法
 */
export function generateLifeKlineData(birthYear: number, gender: '男' | '女'): KlineData[] {
  const data: KlineData[] = [];
  const startYear = birthYear;
  
  // 基础分，模拟人的基础运势
  let baseScore = 60 + Math.random() * 20; 
  
  // 模拟大运周期（10年一运）
  // 随机生成起运岁数 2-10岁
  const startYunAge = Math.floor(Math.random() * 9) + 2;
  
  // 模拟大运走势因子
  let daYunTrend = 0;
  let currentDaYun = '甲子'; // 默认初始大运
  
  // 随机选择一个起始大运干支
  let daYunIndex = Math.floor(Math.random() * 60);

  for (let age = 1; age <= 100; age++) {
    const currentYear = startYear + age - 1;
    // 简化的流年干支计算（不精确，仅用于演示）
    // 1984是甲子年
    const offset = currentYear - 1984;
    const yearIndex = offset >= 0 ? offset % 60 : (60 + (offset % 60)) % 60;
    const yearGanZhi = GANZHI_CYCLE[yearIndex];

    // 换大运逻辑
    if (age >= startYunAge && (age - startYunAge) % 10 === 0) {
      // 换运，随机改变趋势
      daYunTrend = (Math.random() - 0.5) * 5; // -2.5 到 +2.5 的趋势变化
      
      // 更新大运干支（顺排或逆排，这里简化为顺排）
      daYunIndex = (daYunIndex + 1) % 60;
      currentDaYun = GANZHI_CYCLE[daYunIndex];
    }
    
    // 计算当年的各种分数
    // 波动因子
    const volatility = Math.random() * 15; 
    
    // 开盘价：受上一年影响 + 随机波动
    const prevClose = data.length > 0 ? data[data.length - 1].close : baseScore;
    const open = Math.max(0, Math.min(100, prevClose + (Math.random() - 0.5) * 5));
    
    // 收盘价：开盘 + 大运趋势 + 流年随机波动
    let close = open + daYunTrend + (Math.random() - 0.5) * 10;
    
    // 限制在 0-100 之间，并给一点“均值回归”的力，防止一直跌到0或涨到100
    if (close > 90) close -= 2;
    if (close < 30) close += 2;
    close = Math.max(10, Math.min(95, close));
    
    // 最高/最低
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;
    
    // 吉凶判定
    const score = close;
    let summary = '';
    if (score >= 80) summary = '大吉';
    else if (score >= 70) summary = '吉';
    else if (score >= 60) summary = '平';
    else if (score >= 40) summary = '凶';
    else summary = '大凶';

    // 五行分析文案
    const gan = yearGanZhi[0];
    const zhi = yearGanZhi[1];
    const ganWuxing = getWuxing(gan);
    const zhiWuxing = getWuxing(zhi);
    const wuxingText = `流年${yearGanZhi}，天干${gan}属${ganWuxing}，地支${zhi}属${zhiWuxing}。${
      score > 60 ? '五行相生，运势顺遂。' : '五行相克，宜静守。'
    }`;

    data.push({
      age,
      year: currentYear,
      yearGanZhi,
      daYun: age < startYunAge ? '童限' : currentDaYun,
      open: Math.round(open),
      close: Math.round(close),
      high: Math.round(Math.min(100, high)),
      low: Math.round(Math.max(0, low)),
      score: Math.round(score),
      summary,
      wuxingAnalysis: wuxingText
    });
  }
  
  return data;
}
