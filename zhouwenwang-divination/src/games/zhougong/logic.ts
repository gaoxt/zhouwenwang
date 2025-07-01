/**
 * 周公解梦核心逻辑
 * 实现梦境分析、分类和象征意义解读
 */

/**
 * 梦境分类枚举
 */
export const DREAM_CATEGORIES = {
  EMOTIONS: 'emotions',      // 感情类
  CAREER: 'career',          // 事业类
  WEALTH: 'wealth',          // 财运类
  HEALTH: 'health',          // 健康类
  FAMILY: 'family',          // 家庭类
  TRAVEL: 'travel',          // 出行类
  NATURE: 'nature',          // 自然类
  ANIMALS: 'animals',        // 动物类
  OBJECTS: 'objects',        // 物品类
  PEOPLE: 'people',          // 人物类
  SPIRITS: 'spirits',        // 神灵类
  OTHER: 'other'             // 其他类
} as const;

/**
 * 梦境分类信息
 */
export interface DreamCategoryInfo {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  color: string;
}

/**
 * 梦境分类配置
 */
export const dreamCategories: DreamCategoryInfo[] = [
  {
    id: DREAM_CATEGORIES.EMOTIONS,
    name: '感情姻缘',
    description: '恋爱、婚姻、情感相关的梦境',
    keywords: ['结婚', '恋爱', '分手', '吵架', '亲吻', '拥抱', '暗恋', '表白', '婚礼', '离婚'],
    color: '#FF69B4'
  },
  {
    id: DREAM_CATEGORIES.CAREER,
    name: '事业学业',
    description: '工作、学习、考试相关的梦境',
    keywords: ['工作', '考试', '升职', '失业', '面试', '老板', '同事', '学校', '考试', '毕业'],
    color: '#4169E1'
  },
  {
    id: DREAM_CATEGORIES.WEALTH,
    name: '财运金钱',
    description: '金钱、财富、投资相关的梦境',
    keywords: ['钱', '发财', '中奖', '捡钱', '丢钱', '投资', '股票', '银行', '金银', '宝石'],
    color: '#FFD700'
  },
  {
    id: DREAM_CATEGORIES.HEALTH,
    name: '健康生死',
    description: '身体健康、疾病、生死相关的梦境',
    keywords: ['生病', '死亡', '医院', '药', '手术', '受伤', '血', '医生', '康复', '治疗'],
    color: '#32CD32'
  },
  {
    id: DREAM_CATEGORIES.FAMILY,
    name: '家庭亲情',
    description: '家人、亲戚、家庭关系的梦境',
    keywords: ['父母', '孩子', '兄弟', '姐妹', '祖父母', '亲戚', '家庭', '团聚', '争吵', '和睦'],
    color: '#FF6347'
  },
  {
    id: DREAM_CATEGORIES.TRAVEL,
    name: '出行旅游',
    description: '旅行、交通、地点相关的梦境',
    keywords: ['旅行', '飞行', '开车', '坐车', '迷路', '回家', '搬家', '山', '海', '桥'],
    color: '#20B2AA'
  },
  {
    id: DREAM_CATEGORIES.NATURE,
    name: '自然天象',
    description: '天气、自然现象、宇宙相关的梦境',
    keywords: ['下雨', '晴天', '雪', '地震', '洪水', '火', '风', '彩虹', '太阳', '月亮'],
    color: '#9370DB'
  },
  {
    id: DREAM_CATEGORIES.ANIMALS,
    name: '动物昆虫',
    description: '各种动物、昆虫相关的梦境',
    keywords: ['狗', '猫', '蛇', '鸟', '鱼', '老虎', '龙', '马', '虫子', '蝴蝶'],
    color: '#CD853F'
  },
  {
    id: DREAM_CATEGORIES.OBJECTS,
    name: '物品器具',
    description: '日常物品、工具、器具的梦境',
    keywords: ['手机', '车', '衣服', '鞋子', '书', '食物', '房子', '钥匙', '包', '眼镜'],
    color: '#708090'
  },
  {
    id: DREAM_CATEGORIES.PEOPLE,
    name: '人物角色',
    description: '梦见各种人物、角色的梦境',
    keywords: ['明星', '朋友', '陌生人', '老人', '小孩', '美女', '帅哥', '死人', '仇人', '恩人'],
    color: '#DDA0DD'
  },
  {
    id: DREAM_CATEGORIES.SPIRITS,
    name: '神灵鬼怪',
    description: '神仙、鬼怪、灵异现象的梦境',
    keywords: ['鬼', '神仙', '佛', '观音', '土地', '祖先', '灵魂', '法师', '寺庙', '庙会'],
    color: '#B22222'
  },
  {
    id: DREAM_CATEGORIES.OTHER,
    name: '其他类型',
    description: '无法归类的特殊梦境',
    keywords: ['奇异', '超现实', '变形', '时空', '预言', '重复', '噩梦', '美梦', '模糊', '清晰'],
    color: '#696969'
  }
];

/**
 * 梦境分析结果
 */
export interface DreamAnalysisResult {
  /** 梦境描述 */
  dreamDescription: string;
  /** 识别出的关键词 */
  keywords: string[];
  /** 推测的梦境分类 */
  categories: DreamCategoryInfo[];
  /** 主要象征意义 */
  symbolism: string[];
  /** 吉凶预测 */
  fortune: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
  /** 分析时间戳 */
  timestamp: number;
}

/**
 * 分析梦境描述，提取关键词和分类
 * @param dreamText 梦境描述文本
 * @returns DreamAnalysisResult
 */
export function analyzeDream(dreamText: string): DreamAnalysisResult {
  const text = dreamText.toLowerCase();
  const extractedKeywords: string[] = [];
  const matchedCategories: DreamCategoryInfo[] = [];
  
  // 提取关键词并匹配分类
  dreamCategories.forEach(category => {
    let hasMatch = false;
    category.keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        extractedKeywords.push(keyword);
        hasMatch = true;
      }
    });
    
    if (hasMatch && !matchedCategories.some(c => c.id === category.id)) {
      matchedCategories.push(category);
    }
  });
  
  // 如果没有匹配到分类，归为其他类型
  if (matchedCategories.length === 0) {
    const otherCategory = dreamCategories.find(c => c.id === DREAM_CATEGORIES.OTHER);
    if (otherCategory) {
      matchedCategories.push(otherCategory);
    }
  }
  
  // 生成象征意义（基于分类）
  const symbolism = generateSymbolism(matchedCategories, extractedKeywords);
  
  // 预测吉凶（简单规则）
  const fortune = predictFortune(extractedKeywords, text);
  
  return {
    dreamDescription: dreamText,
    keywords: extractedKeywords,
    categories: matchedCategories,
    symbolism,
    fortune,
    timestamp: Date.now()
  };
}

/**
 * 根据分类和关键词生成象征意义
 */
function generateSymbolism(categories: DreamCategoryInfo[], keywords: string[]): string[] {
  const symbolism: string[] = [];
  
  categories.forEach(category => {
    switch (category.id) {
      case DREAM_CATEGORIES.EMOTIONS:
        symbolism.push('感情运势的变化', '内心情感的体现');
        break;
      case DREAM_CATEGORIES.CAREER:
        symbolism.push('事业发展的征兆', '工作状态的反映');
        break;
      case DREAM_CATEGORIES.WEALTH:
        symbolism.push('财运的起伏', '物质欲望的表达');
        break;
      case DREAM_CATEGORIES.HEALTH:
        symbolism.push('身体状况的预警', '生命力的象征');
        break;
      case DREAM_CATEGORIES.FAMILY:
        symbolism.push('家庭关系的映射', '血缘情深的体现');
        break;
      case DREAM_CATEGORIES.TRAVEL:
        symbolism.push('人生道路的指引', '前进方向的暗示');
        break;
      case DREAM_CATEGORIES.NATURE:
        symbolism.push('天意的启示', '自然力量的感召');
        break;
      case DREAM_CATEGORIES.ANIMALS:
        symbolism.push('本能欲望的体现', '动物精神的象征');
        break;
      case DREAM_CATEGORIES.OBJECTS:
        symbolism.push('日常生活的反映', '物质世界的投射');
        break;
      case DREAM_CATEGORIES.PEOPLE:
        symbolism.push('人际关系的暗示', '社交状态的体现');
        break;
      case DREAM_CATEGORIES.SPIRITS:
        symbolism.push('灵性世界的感应', '超自然力量的显现');
        break;
      default:
        symbolism.push('潜意识的神秘表达', '内心深层的映射');
    }
  });
  
  return [...new Set(symbolism)]; // 去重
}

/**
 * 根据关键词和文本内容预测吉凶
 */
function predictFortune(keywords: string[], text: string): 'great' | 'good' | 'neutral' | 'bad' | 'terrible' {
  const goodWords = ['发财', '结婚', '升职', '中奖', '康复', '团聚', '成功', '喜悦', '美好', '光明'];
  const badWords = ['死亡', '疾病', '失业', '分手', '争吵', '灾难', '痛苦', '黑暗', '恐惧', '失败'];
  
  let goodScore = 0;
  let badScore = 0;
  
  // 计算吉凶分数
  goodWords.forEach(word => {
    if (text.includes(word)) goodScore++;
  });
  
  badWords.forEach(word => {
    if (text.includes(word)) badScore++;
  });
  
  // 根据分数差判断吉凶
  const scoreDiff = goodScore - badScore;
  
  if (scoreDiff >= 3) return 'great';
  if (scoreDiff >= 1) return 'good';
  if (scoreDiff <= -3) return 'terrible';
  if (scoreDiff <= -1) return 'bad';
  
  return 'neutral';
}

/**
 * 获取吉凶描述
 */
export function getFortuneDescription(fortune: string): { text: string; color: string; emoji: string } {
  switch (fortune) {
    case 'great':
      return { text: '大吉大利', color: '#FF6B35', emoji: '🎉' };
    case 'good':
      return { text: '吉', color: '#4ECDC4', emoji: '✨' };
    case 'neutral':
      return { text: '平', color: '#95A5A6', emoji: '🤔' };
    case 'bad':
      return { text: '凶', color: '#E74C3C', emoji: '⚠️' };
    case 'terrible':
      return { text: '大凶', color: '#8E44AD', emoji: '💀' };
    default:
      return { text: '未知', color: '#BDC3C7', emoji: '❓' };
  }
}

/**
 * 获取分类的颜色
 */
export function getCategoryColor(categoryId: string): string {
  const category = dreamCategories.find(c => c.id === categoryId);
  return category?.color || '#696969';
}

/**
 * 获取随机梦境建议
 */
export function getRandomDreamAdvice(): string[] {
  const advices = [
    '梦境是潜意识的表达，建议多关注内心感受',
    '保持积极心态，好梦预示着美好未来',
    '如果是噩梦，可能是压力过大的表现，注意休息',
    '重复的梦境往往有特殊意义，值得深入思考',
    '梦见逝去的亲人，可能是思念的体现',
    '清晰的梦境往往暗示着重要信息',
    '梦境与现实相反，不必过于担心',
    '定期记录梦境有助于了解自己的内心世界'
  ];
  
  const shuffled = [...advices].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

/**
 * 验证梦境描述是否有效
 */
export function isValidDreamDescription(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  const trimmed = text.trim();
  
  // 至少5个字符
  if (trimmed.length < 5) return false;
  
  // 不能全是数字或特殊字符
  if (!/[\u4e00-\u9fa5a-zA-Z]/.test(trimmed)) return false;
  
  return true;
}

/**
 * 周公解梦结果类型
 */
export type ZhouGongResult = DreamAnalysisResult; 