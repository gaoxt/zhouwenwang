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

/**
 * 从public目录加载大师配置数据
 * @returns Promise<Master[]> 大师列表
 * @throws 当配置文件加载失败或格式错误时抛出异常
 */
export async function fetchMasters(): Promise<Master[]> {
  try {
    const response = await fetch('/masters/config.json');
    
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
    const gamePrompt = getGameSpecificPrompt(master, gameType);
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
  
  // 添加通用的图片检测逻辑（仅用于需要图片的游戏）
  if (gameType === 'palmistry' && config.invalidImagePrompt) {
    prompt += `\n\n请仔细观察这张图片，重点关注其中的手相部分进行分析：

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
- 回复需控制在800字以内，重点突出，避免冗余

${config.analysisStyle}`;
  } else {
    // 其他游戏类型
    prompt += `\n\n${config.analysisStyle}`;
  }
  
  return prompt;
}

/**
 * 根据游戏类型获取特定的提示词
 * @param master 大师对象
 * @param gameType 游戏类型
 * @returns 游戏特定的提示词，如果没有则返回null
 */
function getGameSpecificPrompt(master: Master, gameType: string): string | null {
  const extendedMaster = master as ExtendedMaster;
  
  // 如果大师配置了游戏专用提示词，使用配置文件
  if (extendedMaster.gamePrompts && extendedMaster.gamePrompts[gameType]) {
    return buildGamePromptFromConfig(extendedMaster.gamePrompts[gameType], gameType);
  }
  
  // 降级到硬编码提示词（为了向后兼容）
  const gamePrompts: Record<string, string> = {
    'liuyao': getLiuYaoPrompt(master),
    'qimen': getQiMenPrompt(master),
    'palmistry': getPalmistryPrompt(master)
  };
  
  return gamePrompts[gameType] || null;
}

/**
 * 获取六爻占卜的特定提示词
 * @param master 大师对象
 * @returns 六爻提示词
 */
function getLiuYaoPrompt(master: Master): string {
  const basePrompt = `请按照以下格式解读用户的六爻卦象（控制在800字以内）：

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
- 回复需控制在800字以内，重点突出，避免冗余`;

  // 根据不同大师添加个性化内容
  switch (master.id) {
    case 'zhouwenwang':
      return `作为易经创始人，精通六爻占卜。${basePrompt.replace('语言要体现你的风格特色', '语言要古朴典雅，体现易学智慧')}`;
    case 'zhugeliang':
      return `通晓易理，善于从卦象中洞察先机。${basePrompt.replace('语言要体现你的风格特色', '语言要儒雅睿智').replace('综合建议', '战略建议')}请重点分析形势变化和战略布局，给出切实可行的策略建议。`;
    case 'guiguzi':
      return `深谙易理和人心变化。${basePrompt.replace('语言要体现你的风格特色', '语言要神秘深邃，富有哲理')}请透过六爻卦象洞察问题本质，重点分析人事关系和机遇变化。`;
    case 'yuanshoucheng':
      return `精通六爻神算。${basePrompt.replace('语言要体现你的风格特色', '语言要有仙风道骨')}请运用你的术数功底详细解读卦象，重点预测事情的发展趋势和结果，给出明确的吉凶判断。`;
    case 'libowen':
      return `对六爻理论有深入研究。${basePrompt.replace('语言要体现你的风格特色', '语言要儒雅严谨')}请运用你的博学和严谨，全面解读卦象的各个层面，引经据典。`;
    case 'chentunan':
      return `精通易理相术。${basePrompt.replace('语言要体现你的风格特色', '语言要平和睿智')}请从相学角度结合六爻卦象，分析问题的人事因素和发展走向。`;
    default:
      return basePrompt.replace('语言要体现你的风格特色', '语言要符合你的性格特点');
  }
}

/**
 * 获取奇门遁甲的特定提示词
 * @param master 大师对象
 * @returns 奇门遁甲提示词
 */
function getQiMenPrompt(master: Master): string {
  const basePrompt = `请详细分析奇门遁甲盘局（控制在800字以内）：

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
- 回复需控制在800字以内，重点突出，避免冗余`;

  switch (master.id) {
    case 'zhouwenwang':
      return `精通奇门遁甲之术。${basePrompt}语言要体现帝王之智和易学功底。`;
    case 'zhugeliang':
      return `奇门遁甲大师。${basePrompt}请运用你的奇门之术详细分析盘局，从战略层面解读天时地利人和，体现你运筹帷幄的智慧。`;
    case 'guiguzi':
      return `精通奇门玄学。${basePrompt}请运用你的纵横智慧分析奇门盘局，从人事布局角度解读形势，给出权谋策略和进退之道。`;
    case 'yuanshoucheng':
      return `通晓奇门秘术。${basePrompt}请深度分析奇门盘象，预测事件发展脉络，给出精准的时间节点和行动指导。`;
    case 'libowen':
      return `通晓奇门易理。${basePrompt}请系统分析奇门盘局的理论依据和实际应用，给出学理并重的解读和指导。`;
    case 'chentunan':
      return `通晓奇门相术。${basePrompt}请结合相学智慧分析奇门盘局中的人事关系，给出人际交往和发展规划的建议。`;
    default:
      return basePrompt;
  }
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
- 回复需控制在800字以内，重点突出，避免冗余`;

  // 简化为降级方案，优先使用配置文件
  return `你是${master.name}。${basePrompt}请结合你的专长进行手相分析。`;
}

/**
 * 获取AI流式分析结果（支持降级到非流式）
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
    
    // 3. 构建提示词
    const prompt = buildPrompt(master, divinationData, gameType, userInfo);
    console.log('构建的提示词:', prompt);
    
    try {
      // 4. 首先尝试流式API
      const streamUrl = buildGeminiApiUrl(GEMINI_CONFIG.MODELS.PRIMARY, apiKey, 'streamGenerateContent');
      
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
        signal: AbortSignal.timeout(5000) // 5秒超时
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
                fullText += newText;
                
                if (onUpdate) {
                  onUpdate(fullText);
                }
              }
              
              if (data.candidates && data.candidates[0]?.finishReason) {
                console.log('流式响应完成');
                break;
              }
            } catch (parseError) {
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      if (fullText && fullText.trim()) {
        console.log('AI流式分析成功完成');
        return fullText.trim();
      }
      
      throw new Error('流式API未返回有效数据');
      
    } catch (streamError) {
      console.warn('流式API失败，降级到标准API:', streamError);
      
      // 5. 降级到标准API，但模拟流式效果
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
    
    // 3. 构建提示词
    const prompt = buildPrompt(master, divinationData, gameType, userInfo);
    console.log('构建的提示词:', prompt);
    
    // 4. 构建API请求
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
    
    // 5. 调用Gemini API
    const response = await axios.post<GeminiResponse>(apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: GEMINI_CONFIG.REQUEST_CONFIG.TIMEOUT
    });
    
    // 6. 解析响应
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
 * 手相分析流式处理 - 模拟流式效果
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
    
    console.log('手相分析完成');
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