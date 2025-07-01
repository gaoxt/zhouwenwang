export interface QuickQuestionConfig {
  liuyao: string[];
  qimen: string[];
  palmistry: string[];
  zhougong: string[];
}

// 快速开始问题配置
export const quickQuestionsConfig: QuickQuestionConfig = {
  liuyao: [
    '今年运势怎么样？',
    '近期财运如何？',
    '什么时候能遇到真爱？',
    '与朋友的合作会顺利吗？',
    '我的事业会有突破吗？',
    '这次投资能赚钱吗？',
    '我和TA有缘分吗？',
    '家人身体健康吗？',
    '应该换工作吗？',
    '今年适合买房吗？',
    '孩子的学业如何？',
    '出国发展好吗？'
  ],
  qimen: [
    '今年事业发展如何？',
    '近期财运怎么样？',
    '什么时候能遇到合适的人？',
    '当前决策是否正确？',
    '这个项目能成功吗？',
    '应该投资这个机会吗？',
    '搬家的时机合适吗？',
    '与合作伙伴关系如何？',
    '官司能打赢吗？',
    '出行是否顺利？',
    '求学之路如何？',
    '健康方面需要注意什么？'
  ],
  palmistry: [
    '看看我的运势如何？',
    '我的事业线怎么样？',
    '感情线说明什么？',
    '财运好不好？',
    '健康方面有什么提示？',
    '我适合做什么工作？',
    '婚姻运势如何？',
    '有贵人相助吗？',
    '晚年生活怎么样？',
    '子女运势如何？',
    '我的性格特点是什么？',
    '需要注意哪些方面？'
  ],
  zhougong: [
    '梦见蛇是什么意思？',
    '梦见死人说明什么？',
    '梦见水预示着什么？',
    '梦见考试失败怎么办？',
    '梦见飞翔代表什么？',
    '梦见迷路有何含义？',
    '梦见结婚是好事吗？',
    '梦见掉牙齿什么征兆？',
    '梦见老家的房子',
    '梦见已故的亲人',
    '梦见捡到钱财',
    '梦见被人追赶'
  ]
};

/**
 * 从指定类型的问题列表中随机选择指定数量的问题
 * @param type 占卜类型
 * @param count 选择数量，默认3个
 * @returns 随机选择的问题数组
 */
export const getRandomQuestions = (
  type: keyof QuickQuestionConfig, 
  count: number = 3
): string[] => {
  const questions = quickQuestionsConfig[type];
  if (!questions || questions.length === 0) {
    return [];
  }

  // 如果问题总数小于等于需要的数量，直接返回所有问题
  if (questions.length <= count) {
    return [...questions];
  }

  // 随机选择指定数量的问题
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

/**
 * 获取所有类型的问题统计
 */
export const getQuestionStats = () => {
  return {
    liuyao: quickQuestionsConfig.liuyao.length,
    qimen: quickQuestionsConfig.qimen.length,
    palmistry: quickQuestionsConfig.palmistry.length,
    total: Object.values(quickQuestionsConfig).reduce((sum, questions) => sum + questions.length, 0)
  };
}; 