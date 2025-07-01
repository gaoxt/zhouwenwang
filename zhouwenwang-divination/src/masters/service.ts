/**
 * 大师数据服务
 * 负责加载和管理AI占卜大师的配置数据
 */

import type { Master } from '../types';
import type { MasterConfig, ExtendedMaster, GamePromptConfig } from './types';
import axios from 'axios';
import { useAppStore } from '../core/store';
import { 
  GEMINI_CONFIG, 
  buildGeminiApiUrl, 
  buildModelsListUrl, 
  isValidApiKeyFormat,
  isSupportedImageType,
  isValidFileSize,
  getActiveApiKey,
  hasValidApiKey
} from './config';

// 🚀 流式响应控制开关 - 在这里修改即可控制全局行为
const ENABLE_STREAMING = false; // true: 使用SSE流式API, false: 使用标准API+前端模拟流式效果

// 📝 字数控制参数 - 在这里修改即可控制全局字数限制
const DEFAULT_WORD_LIMIT = 1200; // 默认字数限制

/**
 * 从public目录加载大师配置数据
 * @returns Promise<Master[]> 大师列表
 * @throws 当配置文件加载失败或格式错误时抛出异常
 */
export async function fetchMasters(): Promise<Master[]> {
  try {
    // 优化环境检测逻辑，减少性能开销
    const isElectronEnv = typeof window !== 'undefined' && window.electronAPI;
    
    const configUrl = isElectronEnv ? './masters/config.json' : '/masters/config.json';
    const response = await fetch(configUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }
    
    const config: MasterConfig = await response.json();
    
    // 验证配置文件格式
    if (!config || !Array.isArray(config.masters)) {
      throw new Error('配置文件格式错误：缺少masters数组');
    }
    
    // 验证每个大师的必需字段
    for (const master of config.masters) {
      if (!master.id || !master.name || !master.description || !master.prompt) {
        throw new Error(`大师配置不完整：${master.id || '未知ID'}`);
      }
    }
    
    console.log(`成功加载 ${config.masters.length} 个大师配置`);
    return config.masters;
    
  } catch (error) {
    console.error('加载大师配置失败:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('网络错误：无法加载大师配置文件');
    }
    
    throw error;
  }
}

/**
 * 根据ID查找特定大师
 * @param masters 大师列表
 * @param id 大师ID
 * @returns Master | undefined
 */
export function findMasterById(masters: Master[], id: string): Master | undefined {
  return masters.find(master => master.id === id);
}

/**
 * 获取默认大师（优先选择周文王，否则第一个大师）
 * @param masters 大师列表
 * @returns Master | null
 */
export function getDefaultMaster(masters: Master[]): Master | null {
  if (masters.length === 0) return null;
  
  // 优先选择周文王
  const zhouwenwang = masters.find(master => master.id === 'zhouwenwang');
  if (zhouwenwang) return zhouwenwang;
  
  // 否则返回第一个大师
  return masters[0];
}

/**
 * 验证大师对象是否有效
 * @param master 大师对象
 * @returns boolean
 */
export function isValidMaster(master: any): master is Master {
  return (
    master &&
    typeof master === 'object' &&
    typeof master.id === 'string' &&
    typeof master.name === 'string' &&
    typeof master.description === 'string' &&
    typeof master.prompt === 'string' &&
    master.id.length > 0 &&
    master.name.length > 0 &&
    master.description.length > 0 &&
    master.prompt.length > 0
  );
}

/**
 * Gemini API响应接口
 */
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * Gemini API错误响应接口
 */
interface GeminiErrorResponse {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * 构建AI分析提示词
 * @param master 选中的大师
 * @param divinationData 占卜数据
 * @param gameType 游戏类型（如：liuyao, qimen, palmistry）
 * @param userInfo 用户信息（可选）
 * @returns 完整的提示词
 */
function buildPrompt(master: Master, divinationData: any, gameType?: string, userInfo?: any): string {
  let prompt = master.prompt;
  
  // 根据游戏类型添加特定的提示词
  if (gameType) {
    const gamePrompt = getGameSpecificPrompt(master, gameType, userInfo);
    if (gamePrompt) {
      prompt += '\n\n' + gamePrompt;
    }
  }
  
  // 添加占卜数据
  prompt += '\n\n占卜数据：\n';
  if (typeof divinationData === 'object') {
    prompt += JSON.stringify(divinationData, null, 2);
  } else {
    prompt += String(divinationData);
  }
  
  // 添加用户信息（如果有）
  if (userInfo) {
    prompt += '\n\n用户信息：\n';
    if (typeof userInfo === 'object') {
      prompt += JSON.stringify(userInfo, null, 2);
    } else {
      prompt += String(userInfo);
    }
  }
  
  prompt += '\n\n请根据以上信息进行详细的占卜分析：';
  
  // 加强明确的中文要求 - 适用于所有游戏类型
  prompt += '\n\n**严格语言要求**：\n- 回复内容必须100%使用简体中文\n- 严禁使用英文、俄文、日文或任何其他语言\n- 所有术语、解释、建议、标点符号都必须是中文\n- 如遇到专业术语，必须使用中文表达或中文音译';
  
  // 添加通用Markdown格式要求（仅在没有特定游戏类型时添加）
  if (!gameType) {
    prompt += '\n\n**格式要求**：\n- 必须使用Markdown格式输出\n- 使用合适的标题层级（##、###、####）\n- 仅在关键结论和核心要点处谨慎使用**粗体**标记，避免过度使用\n- 使用项目符号和编号列表组织内容\n- 语言要体现你的风格特色，分析要深入透彻，建议要实用可行';
  }
  
  return prompt;
}

/**
 * 根据配置构建游戏专用提示词
 * @param config 游戏提示词配置
 * @param gameType 游戏类型
 * @returns 构建好的提示词
 */
function buildGamePromptFromConfig(config: GamePromptConfig, gameType: string): string {
  let prompt = config.baseRole;
  prompt += `\n\n${config.analysisStyle}`;
  return prompt;
}

/**
 * 根据游戏类型获取特定的提示词
 * @param master 大师对象
 * @param gameType 游戏类型
 * @param userInfo 用户信息，用于判断是否有问事
 * @returns 游戏特定的提示词，如果没有则返回null
 */
function getGameSpecificPrompt(master: Master, gameType: string, userInfo?: any): string | null {
  const extendedMaster = master as ExtendedMaster;
  
  // 获取固定的业务格式模板
  const gamePrompts: Record<string, () => string> = {
    'liuyao': () => getLiuYaoPrompt(master),
    'qimen': () => getQiMenPrompt(master),
    'bazi': () => {
      // 检查是否有问事内容
      const hasQuestion = userInfo && typeof userInfo === 'object' && 
        userInfo.question && typeof userInfo.question === 'string' && 
        userInfo.question.trim().length > 0;
      return getBaZiPrompt(master, hasQuestion);
    },
    'palmistry': () => getPalmistryPrompt(master),
    'zhougong': () => getZhouGongPrompt(master)
  };
  
  const promptGenerator = gamePrompts[gameType];
  if (!promptGenerator) {
    return null;
  }
  
  // 获取基础的业务提示词
  let basePrompt = promptGenerator();
  
  // 如果大师配置了游戏专用的个性化提示词，则与业务模板结合
  if (extendedMaster.gamePrompts && extendedMaster.gamePrompts[gameType]) {
    const personalizedPrompt = buildGamePromptFromConfig(extendedMaster.gamePrompts[gameType], gameType);
    // 将个性化信息插入到基础提示词之前
    basePrompt = basePrompt.replace(
      `你是${master.name}。`,
      personalizedPrompt + '\n\n'
    );
  }
  
  return basePrompt;
}

/**
 * 获取六爻占卜的特定提示词
 * @param master 大师对象
 * @returns 六爻提示词
 */
function getLiuYaoPrompt(master: Master): string {
  const basePrompt = `请按照以下格式解读用户的六爻卦象（控制在${DEFAULT_WORD_LIMIT}字以内）：

## 🔮 六爻卦象解读

### 1. 卦象整体解读
- **本卦象征**：分析本卦的含义和象征
- **整体指导**：解释卦象对当前问题的整体指导
- **现状分析**：描述当前状况和面临的挑战或机遇

### 2. 变爻解读（如有变爻）
- **爻辞分析**：逐一分析每个变爻的爻辞和象辞
- **变爻含义**：解释变爻的具体含义和预示
- **变卦意义**：分析变卦的意义和转化方向

### 3. 综合建议
- **行动指南**：基于卦象给出具体的行动建议
- **时机选择**：提供时机选择的指导
- **注意事项**：给出注意事项和应对策略

### 4. 总结
- **核心要点**：简明扼要地总结核心要点
- **指导方向**：给出最终的指导方向

**注意事项**：
- 必须使用Markdown格式输出
- 使用合适的标题层级（##、###、####）
- 仅在关键结论和核心要点处谨慎使用**粗体**标记，避免过度使用
- 使用项目符号和编号列表组织内容
- 语言要体现你的风格特色，分析要深入透彻，建议要实用可行
- 回复需控制在${DEFAULT_WORD_LIMIT}字以内，重点突出，避免冗余`;

  // 使用统一的配置系统，优先从gamePrompts获取，降级到硬编码
  return `你是${master.name}。${basePrompt}请结合你的专长进行六爻分析。`;
}

/**
 * 获取奇门遁甲的特定提示词
 * @param master 大师对象
 * @returns 奇门遁甲提示词
 */
function getQiMenPrompt(master: Master): string {
  const basePrompt = `请详细分析奇门遁甲盘局（控制在${DEFAULT_WORD_LIMIT}字以内）：

## ⚡ 奇门遁甲盘局分析

### 1. 盘局分析
- **整体格局**：分析当前奇门盘的整体格局
- **天时地利**：解读天时地利人和的配合情况
- **吉凶能量**：判断吉凶格局和能量分布

### 2. 用神分析
- **宫位状态**：确定用神宫位和状态
- **环境关系**：分析用神与周围环境的关系
- **旺衰趋势**：判断用神的旺衰和发展趋势

### 3. 时机选择
- **最佳时机**：分析最佳行动时机
- **策略建议**：提供策略建议和注意事项
- **进退之道**：给出进退之道

### 4. 综合指导
- **问题建议**：结合具体问题给出建议
- **行动方案**：提供实际的行动方案

**注意事项**：
- 必须使用Markdown格式输出
- 使用合适的标题层级（##、###、####）
- 仅在关键结论和核心要点处谨慎使用**粗体**标记，避免过度使用
- 使用项目符号和编号列表组织内容
- 回复需控制在${DEFAULT_WORD_LIMIT}字以内，重点突出，避免冗余`;

  return `你是${master.name}。${basePrompt}请结合你的专长进行奇门遁甲分析。`;
}

/**
 * 获取八字推命的特定提示词
 * @param master 大师对象
 * @param hasQuestion 是否有具体问事
 * @returns 八字推命提示词
 */
function getBaZiPrompt(master: Master, hasQuestion: boolean = false): string {
  const wordLimit = hasQuestion ? DEFAULT_WORD_LIMIT + 200 : DEFAULT_WORD_LIMIT;
  const sections = hasQuestion ? 5 : 4;
  
  let basePrompt = `请按照以下格式解读用户的八字命盘（控制在${wordLimit}字以内）：

## 🔯 八字推命解析

### 1. 命格总论
- **四柱格局**：分析年月日时四柱的整体格局特征
- **五行平衡**：解读五行配置及其对人生的影响
- **命理特征**：概述主要的命理特征和人生格局

### 2. 性格天赋
- **性格特质**：基于日干和四柱组合分析性格特点
- **行为模式**：解读个人的行为模式和心理特征
- **天赋优势**：分析个人天赋和发展优势

### 3. 人生运势
- **事业财运**：分析适合的职业方向和财运特征
- **感情婚姻**：解读感情观念和婚姻运势
- **健康状况**：基于五行分析体质和健康注意事项

### 4. 开运指导
- **五行调理**：提供五行平衡的调理建议
- **风水方位**：给出有利的方位和颜色建议
- **生活指导**：提供具体的生活和发展指导`;

  // 只有在有问事时才添加针对性分析
  if (hasQuestion) {
    basePrompt += `

### 5. 问事分析
- **具体问事**：针对用户的具体问题进行深入分析
- **时机把握**：分析问事相关的最佳时机和行动建议
- **注意事项**：提醒需要注意的问题和规避建议
- **解决方案**：提供实际可行的解决方案和策略

### 6. 总结
- **核心要点**：简明扼要地总结八字命理的核心要点
- **人生指导**：给出最终的人生发展指导方向`;
  } else {
    basePrompt += `

### 5. 总结
- **核心要点**：简明扼要地总结八字命理的核心要点
- **人生指导**：给出最终的人生发展指导方向`;
  }

  basePrompt += `

**注意事项**：
- 必须使用Markdown格式输出
- 使用合适的标题层级（##、###、####）
- 仅在关键结论和核心要点处谨慎使用**粗体**标记，避免过度使用
- 使用项目符号和编号列表组织内容
- 语言要体现你的风格特色，分析要深入透彻，建议要实用可行
- 回复需控制在${wordLimit}字以内，重点突出，避免冗余`;

  return `你是${master.name}。${basePrompt}请结合你的专长进行八字推命分析。`;
}

/**
 * 获取周公解梦的特定提示词
 * @param master 大师对象
 * @returns 周公解梦提示词
 */
function getZhouGongPrompt(master: Master): string {
  const basePrompt = `请按照以下格式解读用户的梦境（控制在${DEFAULT_WORD_LIMIT}字以内）：

## 🌙 周公解梦分析

### 1. 梦境整体解读
- **梦境主题**：识别梦境的核心主题和象征意义
- **情感基调**：分析梦境中的情感氛围和心理状态
- **关键要素**：解读梦境中的重要元素和符号

### 2. 象征意义分析
- **传统寓意**：根据周公解梦传统解释象征含义
- **心理层面**：从现代心理学角度分析潜意识表达
- **现实映射**：分析梦境与现实生活的对应关系

### 3. 吉凶判断
- **运势预示**：分析梦境对未来运势的预示
- **警示信息**：提取梦境中的警示或提醒信息
- **机遇暗示**：解读梦境中隐含的机遇信息

### 4. 现实指导
- **行动建议**：基于梦境分析给出实际行动建议
- **心理调节**：提供心理调节和情绪管理建议
- **注意事项**：给出生活中需要注意的事项

### 5. 总结
- **核心要点**：简明扼要地总结梦境的核心信息
- **指导方向**：给出具体的人生指导方向

**注意事项**：
- 必须使用Markdown格式输出
- 使用合适的标题层级（##、###、####）
- 仅在关键结论和核心要点处谨慎使用**粗体**标记，避免过度使用
- 使用项目符号和编号列表组织内容
- 语言要体现你的风格特色，分析要深入透彻，建议要实用可行
- 回复需控制在${DEFAULT_WORD_LIMIT}字以内，重点突出，避免冗余
- 结合传统周公解梦理论和现代心理学观点进行分析
- 梦境分析要从象征意义、心理暗示、现实指导三个层面展开`;

  // 使用统一的配置系统，优先从gamePrompts获取，降级到硬编码
  return `你是${master.name}。${basePrompt}请结合你的专长进行梦境解读。`;
}

/**
 * 获取手相分析的特定提示词
 * @param master 大师对象
 * @returns 手相分析提示词
 */
function getPalmistryPrompt(master: Master): string {
  const basePrompt = `请仔细观察这张图片，重点关注其中的手相部分进行分析：

**分析原则**：
- 如果图片中包含可识别的手相部分（即使同时包含其他内容），请重点分析手相部分
- 如果图片中完全没有手相内容（如：纯风景、纯人脸照片、纯物品等），请提醒用户上传包含手相的图片
- 如果手相部分过于模糊或不完整影响分析，可以建议用户提供更清晰的手相图片，但仍需尝试分析可见部分
- 优先进行分析，只有在完全无法识别手相特征时才建议重新拍摄

## 🤲 手相特征分析

### 1. 主要纹路分析
- **生命线**：健康状况和生命力分析
- **智慧线**：思维能力和性格特征解读
- **感情线**：情感状态和人际关系分析  
- **事业线**：职业发展和成就潜力预测

### 2. 手掌形状和特征
- **手掌形状**：手掌形状对性格的影响
- **手指特征**：手指长短和灵活度的意义
- **掌纹特色**：手掌厚薄和纹理的含义

### 3. 综合分析
- **性格天赋**：性格特质和天赋分析
- **发展趋势**：人生发展趋势预测
- **改善建议**：改善建议和注意事项

**格式要求**：
- 必须使用Markdown格式输出
- 使用合适的标题层级（##、###、####）
- 仅在关键结论和核心要点处谨慎使用**粗体**标记，避免过度使用
- 使用项目符号和编号列表组织内容
- 回复需控制在${DEFAULT_WORD_LIMIT}字以内，重点突出，避免冗余`;

  // 简化为降级方案，优先使用配置文件
  return `你是${master.name}。${basePrompt}请结合你的专长进行手相分析。`;
}

/**
 * 检查后端服务器健康状态
 * @param serverUrl 服务器URL
 * @returns Promise<boolean> 服务器是否可用
 */
async function checkServerHealth(serverUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000) // 5秒超时
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.warn('服务器健康检查失败:', error);
    return false;
  }
}

/**
 * 通过后端服务器进行标准分析（非流式）
 * @param serverUrl 服务器URL
 * @param prompt 分析提示词
 * @returns Promise<string> 完整的分析结果
 */
async function getServerStandardAnalysis(
  serverUrl: string,
  prompt: string
): Promise<string> {
  const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/gemini/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{ 
        role: 'user', 
        parts: [{ text: prompt }] 
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`服务器标准API调用失败: HTTP ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('服务器未返回有效数据');
  }
  
  const candidate = data.candidates[0];
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    throw new Error('服务器返回数据格式错误');
  }
  
  const analysisText = candidate.content.parts[0].text;
  
  if (!analysisText || analysisText.trim() === '') {
    throw new Error('服务器返回的分析结果为空');
  }
  
  return analysisText.trim();
}

/**
 * 统一的服务器分析函数，根据设置选择流式或非流式
 * @param serverUrl 服务器URL
 * @param prompt 分析提示词
 * @param enableStreaming 是否启用流式响应
 * @param onUpdate 流式更新回调函数（仅流式模式使用）
 * @returns Promise<string> 完整的分析结果
 */
async function getServerAnalysis(
  serverUrl: string,
  prompt: string,
  enableStreaming: boolean,
  onUpdate?: (text: string) => void
): Promise<string> {
  if (enableStreaming) {
    // 使用流式API
    return await getServerStreamAnalysis(serverUrl, prompt, onUpdate);
  } else {
    // 使用标准API
    const result = await getServerStandardAnalysis(serverUrl, prompt);
    
    // 如果有更新回调，模拟流式显示效果
    if (onUpdate && result) {
      const words = result.split('');
      const chunkSize = 3; // 每次显示3个字符
      const delay = 30; // 30ms延迟，模拟打字效果
      
      let currentText = '';
      
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join('');
        currentText += chunk;
        onUpdate(currentText);
        
        // 添加延迟以模拟流式效果
        if (i + chunkSize < words.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // 确保最终显示完整文本
      onUpdate(result);
    }
    
    return result;
  }
}

/**
 * 通过后端服务器进行流式分析
 * @param serverUrl 服务器URL
 * @param prompt 分析提示词
 * @param onUpdate 流式更新回调函数
 * @returns Promise<string> 完整的分析结果
 */
async function getServerStreamAnalysis(
  serverUrl: string,
  prompt: string,
  onUpdate?: (text: string) => void
): Promise<string> {
  const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/gemini/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: prompt,
      maxTokens: 4096
    })
  });

  if (!response.ok) {
    throw new Error(`服务器流式API调用失败: HTTP ${response.status}`);
  }

  // 设置响应编码为UTF-8，避免乱码
  if (!response.body) {
    throw new Error('无法获取响应流');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulatedText = '';
  let lastSentLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // 解析SSE格式的数据
        if (trimmedLine.startsWith('data: ')) {
          const jsonStr = trimmedLine.slice(6); // 移除 'data: ' 前缀
          
          if (jsonStr === '[DONE]') {
            break;
          }
          
          try {
            const data = JSON.parse(jsonStr);
            
            // 检查是否是完成信号
            if (data.done === true) {
              console.log('后端流式响应完成');
              break;
            }
            
            // 检查是否有错误
            if (data.error) {
              throw new Error(`后端服务器错误: ${data.error}`);
            }
            
            // 处理增量内容
            if (data.content && typeof data.content === 'string') {
              accumulatedText += data.content; // 累积增量内容
              
              if (onUpdate) {
                onUpdate(accumulatedText);
              }
              
              // 移除冗余日志：后端流式数据接收
            }
            
          } catch (parseError) {
            // 忽略JSON解析错误，继续处理下一行
            console.warn('JSON解析失败:', parseError);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  
  if (!accumulatedText || accumulatedText.trim() === '') {
    throw new Error('后端服务器未返回有效数据');
  }
  
  return accumulatedText.trim();
}

/**
 * 获取AI流式分析结果（支持后端服务器和降级处理）
 * @param divinationData 占卜数据
 * @param master 选中的大师
 * @param gameType 游戏类型（如：liuyao, qimen, palmistry）
 * @param userInfo 用户信息（可选）
 * @param onUpdate 流式更新回调函数
 * @returns Promise<string> 完整的AI分析结果
 * @throws 当API调用失败或配置错误时抛出异常
 */
export async function getAIAnalysisStream(
  divinationData: any,
  master: Master,
  gameType?: string,
  userInfo?: any,
  onUpdate?: (text: string) => void
): Promise<string> {
  try {
    // 1. 获取设置
    const state = useAppStore.getState();
    const { apiKey, serverUrl } = state.settings;
    const enableStreaming = ENABLE_STREAMING; // 使用代码中的开关
    
    // 2. 验证大师对象
    if (!isValidMaster(master)) {
      throw new Error('大师配置无效');
    }
    
    // 3. 构建提示词
    const prompt = buildPrompt(master, divinationData, gameType, userInfo);
    console.log('构建的提示词:', prompt);
    
    // 4. 如果配置了服务器URL，优先使用后端服务器
    if (serverUrl && serverUrl.trim()) {
      
      try {
        // 检查服务器健康状态
        const isServerHealthy = await checkServerHealth(serverUrl);
        
        if (isServerHealthy) {
          console.log(`使用${enableStreaming ? '流式' : '标准'}后端服务器API...`);
          return await getServerAnalysis(serverUrl, prompt, enableStreaming, onUpdate);
        } else {
          console.warn('后端服务器健康检查失败，降级到直接API调用');
        }
      } catch (serverError) {
        console.warn('后端服务器调用失败，降级到直接API调用:', serverError);
      }
    }
    
    // 5. 降级到直接调用Gemini API
    console.log('使用直接Gemini API调用...');
    
    // 验证API密钥（只有在没有可用服务器时才强制要求）
    const effectiveApiKey = getActiveApiKey(apiKey);
    if (!hasValidApiKey(apiKey)) {
      if (serverUrl && serverUrl.trim()) {
        throw new Error('后端服务器不可用，且未配置有效的Gemini API密钥。请检查服务器状态或配置API密钥。');
      } else {
        throw new Error('请先在设置中配置有效的Gemini API密钥');
      }
    }
    
    try {
      // 尝试直接流式API
      const streamUrl = buildGeminiApiUrl(GEMINI_CONFIG.MODELS.PRIMARY, effectiveApiKey, 'streamGenerateContent');
      
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: GEMINI_CONFIG.GENERATION_CONFIG
      };
      
      console.log('正在尝试Gemini流式API...');
      
      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000) // 30秒超时
      });
      
      if (!response.ok) {
        throw new Error(`流式API调用失败: HTTP ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }
      
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (!trimmedLine) continue;
            
            try {
              const data = JSON.parse(trimmedLine);
              
              if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                const newText = data.candidates[0].content.parts[0].text;
                fullText = newText;
                
                if (onUpdate) {
                  onUpdate(fullText);
                }
                
                // 移除冗余日志：流式数据接收
              }
              
              if (data.candidates && data.candidates[0]?.finishReason) {
                break;
              }
            } catch (parseError) {
              // 忽略JSON解析错误
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      if (fullText && fullText.trim()) {
        return fullText.trim();
      }
      
      throw new Error('流式API未返回有效数据');
      
    } catch (streamError) {
      console.warn('流式API失败，降级到标准API:', streamError);
      
      // 6. 最终降级到标准API，但模拟流式效果
      const result = await getAIAnalysis(divinationData, master, gameType, userInfo);
      
      // 模拟打字机效果
      if (onUpdate && result) {
        const words = result.split('');
        let currentText = '';
        
        for (let i = 0; i < words.length; i++) {
          currentText += words[i];
          onUpdate(currentText);
          
          // 控制速度，每几个字符暂停一下
          if (i % 3 === 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      }
      
      return result;
    }
    
  } catch (error) {
    console.error('AI分析失败:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('未知错误发生');
    }
  }
}

/**
 * 获取AI分析结果（非流式，保持向后兼容）
 * @param divinationData 占卜数据
 * @param master 选中的大师
 * @param gameType 游戏类型（如：liuyao, qimen, palmistry）
 * @param userInfo 用户信息（可选）
 * @returns Promise<string> AI分析结果
 * @throws 当API调用失败或配置错误时抛出异常
 */
export async function getAIAnalysis(
  divinationData: any,
  master: Master,
  gameType?: string,
  userInfo?: any
): Promise<string> {
  try {
    // 1. 获取设置
    const state = useAppStore.getState();
    const { apiKey, serverUrl } = state.settings;
    // 对于非流式分析，始终使用标准API
    const enableStreaming = false;
    
    // 2. 如果配置了服务器URL，优先使用后端服务器
    if (serverUrl && serverUrl.trim()) {
      
      try {
        // 检查服务器健康状态
        const isServerHealthy = await checkServerHealth(serverUrl);
        
        if (isServerHealthy) {
          console.log('后端服务器健康检查通过，使用服务器API...');
          // 构建提示词
          const prompt = buildPrompt(master, divinationData, gameType, userInfo);
          // 对于非流式分析，强制使用标准API
          return await getServerAnalysis(serverUrl, prompt, false);
        } else {
          console.warn('后端服务器健康检查失败，降级到直接API调用');
        }
      } catch (serverError) {
        console.warn('后端服务器调用失败，降级到直接API调用:', serverError);
      }
    }
    
    // 3. 验证API密钥（只有在没有可用服务器时才强制要求）
    const effectiveApiKey = getActiveApiKey(apiKey);
    if (!hasValidApiKey(apiKey)) {
      if (serverUrl && serverUrl.trim()) {
        throw new Error('后端服务器不可用，且未配置有效的Gemini API密钥。请检查服务器状态或配置API密钥。');
      } else {
        throw new Error('请先在设置中配置有效的Gemini API密钥');
      }
    }
    
    // 4. 验证大师对象
    if (!isValidMaster(master)) {
      throw new Error('大师配置无效');
    }
    
    // 5. 构建提示词
    const prompt = buildPrompt(master, divinationData, gameType, userInfo);
    console.log('构建的提示词:', prompt);
    
    // 6. 构建API请求
    const apiUrl = buildGeminiApiUrl(GEMINI_CONFIG.MODELS.PRIMARY, apiKey);
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: GEMINI_CONFIG.GENERATION_CONFIG
    };
    
    console.log('正在调用Gemini API...');
    
    // 7. 调用Gemini API
    const response = await axios.post<GeminiResponse>(apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: GEMINI_CONFIG.REQUEST_CONFIG.TIMEOUT
    });
    
    // 8. 解析响应
    const data = response.data;
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('API返回数据格式错误：没有候选结果');
    }
    
    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('API返回数据格式错误：没有内容部分');
    }
    
    const analysisText = candidate.content.parts[0].text;
    
    if (!analysisText || analysisText.trim() === '') {
      throw new Error('API返回的分析结果为空');
    }
    
    console.log('AI分析成功完成');
    return analysisText.trim();
    
  } catch (error) {
    console.error('AI分析失败:', error);
    
    // 处理不同类型的错误
    if (axios.isAxiosError(error)) {
      // 处理HTTP错误
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data as GeminiErrorResponse;
        
        switch (status) {
          case 400:
            throw new Error(`API请求错误: ${errorData.error?.message || '请求参数有误'}`);
          case 401:
            throw new Error('API密钥无效，请检查设置中的Gemini API密钥');
          case 403:
            throw new Error('API访问被拒绝，请检查API密钥权限');
          case 429:
            throw new Error('API调用频率超限，请稍后再试');
          case 500:
            throw new Error('Gemini服务器内部错误，请稍后再试');
          default:
            throw new Error(`API调用失败 (HTTP ${status}): ${errorData.error?.message || '未知错误'}`);
        }
      } else if (error.request) {
        throw new Error('网络连接失败，请检查网络连接后重试');
      }
    }
    
    // 处理超时错误
    if (error instanceof Error && 'code' in error && error.code === 'ECONNABORTED') {
      throw new Error('API调用超时，请检查网络连接后重试');
    }
    
    // 重新抛出其他错误
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('未知错误发生');
    }
  }
}

/**
 * Gemini Vision API响应接口
 */
interface GeminiVisionResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * 获取手相分析结果（使用Gemini Vision API）
 * @param imageBase64 图像的base64编码数据（不含data:image/...前缀）
 * @param mimeType 图像MIME类型（如 'image/jpeg'）
 * @param master 选中的大师
 * @param userInfo 用户信息（可选）
 * @returns Promise<string> AI分析结果
 * @throws 当API调用失败或配置错误时抛出异常
 */
export async function getPalmistryAnalysis(
  imageBase64: string,
  mimeType: string,
  master: Master,
  userInfo?: any
): Promise<string> {
  try {
    // 1. 获取API密钥（优先使用配置中的密钥）
    const state = useAppStore.getState();
    const apiKey = getActiveApiKey(state.settings.apiKey);
    
    if (!hasValidApiKey(state.settings.apiKey)) {
      throw new Error('请先在配置文件或设置中配置有效的Gemini API密钥');
    }
    
    // 2. 验证大师对象
    if (!isValidMaster(master)) {
      throw new Error('大师配置无效');
    }
    
    // 3. 验证图像数据
    if (!imageBase64 || imageBase64.trim() === '') {
      throw new Error('图像数据不能为空');
    }
    
    if (!mimeType || !isSupportedImageType(mimeType)) {
      throw new Error(`无效的图像格式，请使用 ${GEMINI_CONFIG.FILE_CONFIG.SUPPORTED_IMAGE_TYPES.join(', ')} 格式`);
    }
    
    // 4. 构建提示词 - 使用统一的提示词构建系统
    const prompt = buildPrompt(master, {
      message: "请分析这张手相图片", 
      imageType: "palmistry"
    }, 'palmistry', userInfo);
    console.log('构建的手相分析提示词:', prompt);
    
    // 5. 构建API请求（使用Gemini 2.0 Flash）
    const apiUrl = buildGeminiApiUrl(GEMINI_CONFIG.MODELS.VISION, apiKey);
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64
              }
            }
          ]
        }
      ],
      generationConfig: GEMINI_CONFIG.GENERATION_CONFIG
    };
    
    console.log('正在调用Gemini Vision API进行手相分析...');
    
    // 6. 调用Gemini Vision API
    const response = await axios.post<GeminiVisionResponse>(apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: GEMINI_CONFIG.REQUEST_CONFIG.VISION_TIMEOUT
    });
    
    // 7. 解析响应
    const data = response.data;
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('API返回数据格式错误：没有候选结果');
    }
    
    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('API返回数据格式错误：没有内容部分');
    }
    
    const analysisText = candidate.content.parts[0].text;
    
    if (!analysisText || analysisText.trim() === '') {
      throw new Error('API返回的分析结果为空');
    }
    
    console.log('手相分析成功完成');
    return analysisText.trim();
    
  } catch (error) {
    console.error('手相分析失败:', error);
    
    // 处理不同类型的错误
    if (axios.isAxiosError(error)) {
      // 处理HTTP错误
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data as GeminiErrorResponse;
        
        switch (status) {
          case 400:
            throw new Error(`API请求错误: ${errorData.error?.message || '请求参数有误，请检查图片格式和大小'}`);
          case 401:
            throw new Error('API密钥无效，请检查设置中的Gemini API密钥');
          case 403:
            throw new Error('API访问被拒绝，请检查API密钥权限或是否启用了Vision API');
          case 413:
            throw new Error('图片文件过大，请选择较小的图片文件');
          case 429:
            throw new Error('API调用频率超限，请稍后再试');
          case 500:
            throw new Error('Gemini服务器内部错误，请稍后再试');
          default:
            throw new Error(`API调用失败 (HTTP ${status}): ${errorData.error?.message || '未知错误'}`);
        }
      } else if (error.request) {
        throw new Error('网络连接失败，请检查网络连接后重试');
      }
    }
    
    // 处理超时错误
    if (error instanceof Error && 'code' in error && error.code === 'ECONNABORTED') {
      throw new Error('图像分析超时，请稍后重试或选择较小的图片');
    }
    
    // 重新抛出其他错误
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('未知错误发生');
    }
  }
}

/**
 * 通过后端服务器进行流式手相分析
 * @param serverUrl 服务器URL
 * @param imageBase64 Base64编码的图像数据
 * @param mimeType 图像MIME类型
 * @param prompt 分析提示词
 * @param onUpdate 流式更新回调函数
 * @returns Promise<string> 完整的分析结果
 */
async function getServerVisionStreamAnalysis(
  serverUrl: string,
  imageBase64: string,
  mimeType: string,
  prompt: string,
  onUpdate?: (text: string) => void
): Promise<string> {
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64
            }
          }
        ]
      }
    ]
  };

  const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/gemini/vision-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`服务器视觉流式API调用失败: HTTP ${response.status}`);
  }

  if (!response.body) {
    throw new Error('无法获取响应流');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulatedText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // 解析SSE格式的数据
        if (trimmedLine.startsWith('data: ')) {
          const jsonStr = trimmedLine.slice(6); // 移除 'data: ' 前缀
          
          if (jsonStr === '[DONE]') {
            break;
          }
          
          try {
            const data = JSON.parse(jsonStr);
            
            // 检查是否是完成信号
            if (data.finishReason || data.status === 'completed') {
              break;
            }
            
            // 检查是否有错误
            if (data.error) {
              throw new Error(`后端服务器错误: ${data.error}`);
            }
            
            // 处理增量文本内容
            if (data.text && typeof data.text === 'string') {
              accumulatedText += data.text;
              
              if (onUpdate) {
                onUpdate(accumulatedText);
              }
              
              // 移除冗余日志：后端视觉流式数据接收
            }
            
            // 处理最终文本内容
            if (data.finalText && typeof data.finalText === 'string') {
              if (data.finalText && !accumulatedText.includes(data.finalText)) {
                accumulatedText += data.finalText;
              }
              
              if (onUpdate) {
                onUpdate(accumulatedText);
              }
              
              // 移除冗余日志：后端视觉分析最终增量
            }
            
          } catch (parseError) {
            // 忽略JSON解析错误，继续处理下一行
            console.warn('JSON解析失败:', parseError);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  
  if (!accumulatedText || accumulatedText.trim() === '') {
    throw new Error('后端服务器未返回有效的手相分析数据');
  }
  
  return accumulatedText.trim();
}

/**
 * 通过后端服务器进行标准视觉分析（非流式）
 * @param serverUrl 服务器URL
 * @param imageBase64 Base64编码的图像数据
 * @param mimeType 图像MIME类型
 * @param prompt 分析提示词
 * @returns Promise<string> 完整的分析结果
 */
async function getServerVisionStandardAnalysis(
  serverUrl: string,
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 32,
      topP: 1,
      maxOutputTokens: 4096,
    }
  };

  const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/gemini/vision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`服务器视觉标准API调用失败: HTTP ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('服务器未返回有效的视觉分析数据');
  }
  
  const candidate = data.candidates[0];
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    throw new Error('服务器返回数据格式错误');
  }
  
  const analysisText = candidate.content.parts[0].text;
  
  if (!analysisText || analysisText.trim() === '') {
    throw new Error('服务器返回的视觉分析结果为空');
  }
  
  return analysisText.trim();
}

/**
 * 统一的服务器视觉分析函数，根据设置选择流式或非流式
 * @param serverUrl 服务器URL
 * @param imageBase64 Base64编码的图像数据
 * @param mimeType 图像MIME类型
 * @param prompt 分析提示词
 * @param enableStreaming 是否启用流式响应
 * @param onUpdate 流式更新回调函数（仅流式模式使用）
 * @returns Promise<string> 完整的分析结果
 */
async function getServerVisionAnalysis(
  serverUrl: string,
  imageBase64: string,
  mimeType: string,
  prompt: string,
  enableStreaming: boolean,
  onUpdate?: (text: string) => void
): Promise<string> {
  if (enableStreaming) {
    // 使用流式API
    return await getServerVisionStreamAnalysis(serverUrl, imageBase64, mimeType, prompt, onUpdate);
  } else {
    // 使用标准API
    const result = await getServerVisionStandardAnalysis(serverUrl, imageBase64, mimeType, prompt);
    
    // 如果有更新回调，模拟流式显示效果
    if (onUpdate && result) {
      const words = result.split('');
      const chunkSize = 3; // 每次显示3个字符
      const delay = 30; // 30ms延迟，模拟打字效果
      
      let currentText = '';
      
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join('');
        currentText += chunk;
        onUpdate(currentText);
        
        // 添加延迟以模拟流式效果
        if (i + chunkSize < words.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // 确保最终显示完整文本
      onUpdate(result);
    }
    
    return result;
  }
}

/**
 * 手相分析流式处理 - 支持后端服务器和降级处理
 * @param imageBase64 Base64编码的图像数据
 * @param mimeType 图像MIME类型
 * @param master 选择的大师
 * @param onUpdate 流式更新回调函数
 * @param userInfo 用户信息（可选）
 * @returns Promise<string> 完整的分析结果
 */
export async function getPalmistryAnalysisStream(
  imageBase64: string,
  mimeType: string,
  master: Master,
  onUpdate?: (text: string) => void,
  userInfo?: any
): Promise<string> {
  try {
    console.log('开始手相分析...');
    
    // 1. 获取设置
    const state = useAppStore.getState();
    const { apiKey, serverUrl } = state.settings;
    const enableStreaming = ENABLE_STREAMING; // 使用代码中的开关
    
    // 2. 构建提示词
    const prompt = buildPrompt(master, {
      message: "请分析这张手相图片", 
      imageType: "palmistry"
    }, 'palmistry', userInfo);
    
    // 3. 如果配置了服务器URL，优先使用后端服务器
    if (serverUrl && serverUrl.trim()) {
      
      try {
        // 检查服务器健康状态
        const isServerHealthy = await checkServerHealth(serverUrl);
        
        if (isServerHealthy) {
          console.log(`后端服务器健康检查通过，使用服务器视觉${enableStreaming ? '流式' : '标准'}API...`);
          return await getServerVisionAnalysis(serverUrl, imageBase64, mimeType, prompt, enableStreaming, onUpdate);
        } else {
          console.warn('后端服务器健康检查失败，降级到直接API调用');
        }
      } catch (serverError) {
        console.warn('后端服务器手相分析调用失败，降级到直接API调用:', serverError);
      }
    }
    
    // 4. 降级到直接API调用
    console.log('使用直接手相分析API...');
    
    // 检查API密钥（只有在没有可用服务器时才强制要求）
    if (!hasValidApiKey(apiKey)) {
      if (serverUrl && serverUrl.trim()) {
        throw new Error('后端服务器不可用，且未配置有效的Gemini API密钥。请检查服务器状态或配置API密钥。');
      } else {
        throw new Error('请先在设置中配置有效的Gemini API密钥以进行手相分析');
      }
    }
    
    // 使用普通的手相分析API
    const fullAnalysis = await getPalmistryAnalysis(imageBase64, mimeType, master, userInfo);
    
    // 如果有更新回调，模拟流式显示效果
    if (onUpdate && fullAnalysis) {
      const words = fullAnalysis.split('');
      const chunkSize = 3; // 每次显示3个字符
      const delay = 30; // 30ms延迟，模拟打字效果
      
      let currentText = '';
      
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join('');
        currentText += chunk;
        onUpdate(currentText);
        
        // 添加延迟以模拟流式效果
        if (i + chunkSize < words.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // 确保最终显示完整文本
      onUpdate(fullAnalysis);
    }
    
    return fullAnalysis;
    
  } catch (error) {
    console.error('手相分析失败:', error);
    
    // 重新抛出错误，让调用者处理
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('手相分析失败，请重试');
    }
  }
}

/**
 * 验证Gemini API Key的有效性
 * @param apiKey 要验证的API Key
 * @returns Promise<boolean> 验证结果
 * @throws 当验证失败时抛出具体错误信息
 */
export async function validateGeminiApiKey(apiKey: string): Promise<boolean> {
  try {
    // 验证API Key格式 - Gemini API Key通常以AIza开头
    const trimmedKey = apiKey.trim();
    if (!isValidApiKeyFormat(trimmedKey)) {
      throw new Error('API Key格式不正确，Gemini API Key应该以AIza开头');
    }

    // 真实验证API Key - 调用Gemini API测试
    const response = await axios.get(
      buildModelsListUrl(trimmedKey),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: GEMINI_CONFIG.REQUEST_CONFIG.VALIDATION_TIMEOUT,
      }
    );

    if (response.status === 200 && response.data) {
      console.log('API Key验证成功:', response.data);
      return true;
    } else {
      throw new Error('API响应异常');
    }

  } catch (error) {
    console.error('API Key验证失败:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        switch (status) {
          case 400:
            throw new Error('API Key无效或已被禁用');
          case 403:
            throw new Error('API Key权限不足');
          case 429:
            throw new Error('API请求频率限制，请稍后再试');
          default:
            throw new Error(`验证失败: HTTP ${status}`);
        }
      } else if (error.request) {
        throw new Error('网络连接失败，请检查网络连接');
      }
    }
    
    // 处理超时错误
    if (error instanceof Error && 'code' in error && error.code === 'ECONNABORTED') {
      throw new Error('验证请求超时，请检查网络连接后重试');
    }
    
    // 重新抛出其他错误
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('验证失败，请检查网络连接');
    }
  }
}

/**
 * 将File对象转换为base64字符串
 * @param file 图像文件
 * @returns Promise<{base64: string, mimeType: string}> base64数据和MIME类型
 */
export function convertImageToBase64(file: File): Promise<{base64: string, mimeType: string}> {
  return new Promise((resolve, reject) => {
    // 验证文件类型
    if (!isSupportedImageType(file.type)) {
      reject(new Error(`不支持的图片格式，请上传 ${GEMINI_CONFIG.FILE_CONFIG.SUPPORTED_IMAGE_TYPES.join(', ')} 格式的图片`));
      return;
    }
    
    // 验证文件大小
    if (!isValidFileSize(file.size)) {
      reject(new Error(`图片文件大小不能超过 ${(GEMINI_CONFIG.FILE_CONFIG.MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const result = reader.result as string;
        // 移除data:image/...;base64,前缀，只保留base64数据
        const base64Data = result.split(',')[1];
        
        if (!base64Data) {
          reject(new Error('图片格式转换失败'));
          return;
        }
        
        resolve({
          base64: base64Data,
          mimeType: file.type
        });
      } catch (error) {
        reject(new Error('图片读取失败'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('图片读取失败'));
    };
    
    // 读取文件为data URL
    reader.readAsDataURL(file);
  });
} 