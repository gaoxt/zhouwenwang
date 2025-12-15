/**
 * 古风头像生成提示词管理模块
 * 
 * 支持的风格类型：
 * - chibi: Q版可爱风格
 * - qinshi: 秦时明月风格  
 * - anime: 二次元动漫风格
 */

/**
 * 基础约束模板
 */
export const BASE_PROMPTS = {
  // 基础约束
  CORE_CONSTRAINTS: `输出图像512x512像素，适合用作头像。严格保持原人物性别不变（男性保持男性，女性保持女性）。保持面部特征、构图和发型。单张完整图像，无文字标签。`,

  // 质量检查
  QUALITY_CHECK: `检查：尺寸512x512，性别完全一致，面部相似度高，构图保持，发型一致，无文字，单张图像。`
};

/**
 * 渲染风格专用提示词
 */
export const RENDER_STYLE_PROMPTS = {
  // Q版萌系古风可爱风格
  chibi: {
    template: `日系萌系Q版古风动漫美学，超治愈可爱风格。
保持原图人物身份特征，Q版萌化后依然清晰可辨。
严格保持原人物性别特征、面部结构和个人魅力特色。
保持原人物独特面部特征：眼型神韵、眉形特色、鼻型轮廓、唇形魅力、脸型特征，完美萌系Q版化呈现。
经典萌系Q版比例：头身比2:1，超大水灵灵眼睛保持原眼型特色，圆润软萌的可爱脸庞。
Q版身体比例圆润软萌，短小可爱的四肢，线条柔和流畅，配色温柔治愈。
萌系古风Q版服饰：简化版汉服增加可爱元素、软萌发饰配件、迷你古风装饰，展现治愈系古风魅力。
背景保持原构图，加入萌系古风元素：可爱亭台、软萌山水、治愈系云朵、温柔光效。
表情超级可爱，大眼睛水汪汪充满灵动感，微笑甜美治愈，偶尔眨眼卖萌。
男性角色展现温柔帅气的萌系魅力，女性角色绽放甜美可爱的治愈系气质。
2D动漫插画质感，色彩柔和温暖，萌系渲染效果，如日系治愈动漫中的超萌Q版角色造型。`,
    quality: `相似度90%以上，相同人物身份，性别完全一致，日系萌系Q版古风风格，高清晰度`
  },

  // 水墨国画风格
  shuimo: {
    template: `中国传统水墨画美学风格，淡雅写意，如仙如画。
保持原图人物身份特征，水墨画意境下可清晰识别。
严格保持原人物性别特征、面部结构和气质神韵。
保持原人物独特面部特征：眼型、眉形、鼻型、唇形、脸型轮廓，完美融入水墨美学。
墨色浓淡层次丰富，线条飘逸流畅，留白艺术运用巧妙。
淡彩点缀，色调清雅素净，意境深远悠长。
古典服饰以墨线勾勒，衣袂飘飘，仙气飘逸。
保持原背景构图，融入山水意境，云雾缭绕，如诗如画。
男性角色展现儒雅风度和飘然仙姿，女性角色绽放清雅美韵和仙女般气质。
传统国画技法，笔墨精妙，神韵生动，宛如古代名家手笔。`,
    quality: `相似度92%以上，相同人物身份，性别完全一致，传统水墨国画风格，高清晰度`
  },

  // 赛博朋克古风融合风格
  cyberpunk: {
    template: `赛博朋克与中国古风完美融合的未来美学风格。
保持原图人物身份特征，在科技古风融合下仍可识别。
严格保持原人物性别特征、面部结构和个人气质。
保持原人物独特面部特征：眼型、眉形、鼻型、唇形、脸型轮廓，融入未来古风美学。
霓虹色彩与古典色调和谐统一，科技蓝紫与古典金红相得益彰。
古典服饰加入科技元素：发光纹饰、全息图案、光纤丝线。
传统发饰结合光效装置，古典玉佩融入全息投影。
背景融合古代建筑与未来科技：古塔配霓虹灯、亭台楼阁配光束效果。
保持原背景构图，添加科技古风元素，营造穿越时空的神秘感。
男性角色展现古代侠客与未来战士的气质，女性角色绽放古典美人与科技精灵的魅力。
高科技渲染质感，光影效果绚烂，色彩层次丰富，营造梦幻科技古韵。`,
    quality: `相似度94%以上，相同人物身份，性别完全一致，赛博古风融合风格，超高清晰度`
  }
};

/**
 * 构建完整的生成提示词
 */
export function buildCompletePrompt(
  renderStyleId: string,
  additionalContext?: string
): string {
  const renderPrompt = RENDER_STYLE_PROMPTS[renderStyleId as keyof typeof RENDER_STYLE_PROMPTS];

  if (!renderPrompt) {
    throw new Error(`未找到指定的渲染风格配置: ${renderStyleId}`);
  }

  let prompt = `${BASE_PROMPTS.CORE_CONSTRAINTS}

${renderPrompt.template}

质量要求：${renderPrompt.quality}`;

  if (additionalContext) {
    prompt += `\n\n用户要求：${additionalContext}`;
  }

  prompt += `\n\n${BASE_PROMPTS.QUALITY_CHECK}`;

  return prompt;
}

/**
 * 导出可用的风格ID常量
 */
export const AVAILABLE_RENDER_STYLES = ['chibi', 'shuimo', 'cyberpunk'] as const;

export type RenderStyleId = typeof AVAILABLE_RENDER_STYLES[number]; 