const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors({
  origin: function (origin, callback) {
    // 允许本地开发和配置的域名
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:5173', 'http://127.0.0.1:5173'];
    
    // 开发环境允许所有域名
    if (!origin || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // 检查是否在允许列表中
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        // 处理通配符，如 http://192.168.1.*
        const pattern = allowedOrigin.replace(/\*/g, '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowedOrigin === origin;
    });
    
    callback(null, isAllowed);
  },
  credentials: true
}));

app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));

// 时间格式化工具函数
const getChinaTime = () => {
  const now = new Date();
  const chinaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // UTC+8
  return chinaTime.toISOString().replace('T', ' ').substring(0, 19) + ' CST';
};

// 文件上传配置（用于手相分析）
const upload = multer({
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  }
});

// 解析User-Agent的函数
const parseUserAgent = (userAgent) => {
  if (!userAgent) return 'Unknown';
  
  // 检测操作系统
  let os = 'Unknown OS';
  if (userAgent.includes('Windows NT')) {
    const match = userAgent.match(/Windows NT (\d+\.\d+)/);
    if (match) {
      const version = match[1];
      const winVersions = {
        '10.0': 'Win10',
        '6.3': 'Win8.1',
        '6.2': 'Win8',
        '6.1': 'Win7'
      };
      os = winVersions[version] || `Win${version}`;
    } else {
      os = 'Windows';
    }
  } else if (userAgent.includes('Mac OS X')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    if (userAgent.includes('Android')) {
      os = 'Android';
    } else {
      os = 'Linux';
    }
  } else if (userAgent.includes('iPhone OS') || userAgent.includes('iOS')) {
    os = 'iOS';
  }
  
  // 检测浏览器
  let browser = 'Unknown Browser';
  if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    const version = match ? match[1] : '';
    browser = `Chrome${version ? `/${version}` : ''}`;
  } else if (userAgent.includes('Edg/')) {
    const match = userAgent.match(/Edg\/(\d+)/);
    const version = match ? match[1] : '';
    browser = `Edge${version ? `/${version}` : ''}`;
  } else if (userAgent.includes('Firefox/')) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    const version = match ? match[1] : '';
    browser = `Firefox${version ? `/${version}` : ''}`;
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
    browser = 'Safari';
  }
  
  return `${os} ${browser}`;
};

// 日志中间件
const logger = (req, res, next) => {
  const timestamp = getChinaTime();
  const userAgent = req.get('User-Agent') || 'Unknown';
  const parsedUA = parseUserAgent(userAgent);
  
  // 固定各字段的宽度以确保对齐
  const method = req.method.padEnd(4, ' ');        // GET, POST 等方法，固定4位
  const path = req.path.padEnd(25, ' ');           // 路径，固定25位
  const ip = req.ip.padEnd(15, ' ');               // IP地址，固定15位
  
  console.log(`[${timestamp}] ${method} ${path} - ${ip} - ${parsedUA}`);
  next();
};

app.use(logger);

// Gemini API 配置
const GEMINI_CONFIG = {
  BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
  MODELS: {
    PRIMARY: 'gemini-2.5-flash-lite-preview-06-17',
    VISION: 'gemini-2.5-flash-lite-preview-06-17',
    FALLBACK: 'gemini-2.0-flash-lite-001'
  },
  GENERATION_CONFIG: {
    temperature: 0.7,
    topK: 32,
    topP: 1,
    maxOutputTokens: 4096,
    // 停止序列 - 确保输出为中文
    stopSequences: [],
    // 候选响应数量  
    candidateCount: 1,
  }
};

// 验证API Key
function validateApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 环境变量未设置');
  }
  if (!apiKey.startsWith('AIza')) {
    throw new Error('GEMINI_API_KEY 格式不正确，应该以 AIza 开头');
  }
  return apiKey;
}

// 构建Gemini API URL
function buildGeminiApiUrl(model, endpoint = 'generateContent') {
  const apiKey = validateApiKey();
  return `${GEMINI_CONFIG.BASE_URL}/${model}:${endpoint}?key=${apiKey}`;
}

// 错误处理中间件
const errorHandler = (error, req, res, next) => {
  console.error('API错误:', error);
  
  if (error.response?.data?.error) {
    const geminiError = error.response.data.error;
    return res.status(error.response.status || 500).json({
      error: geminiError.message || '调用Gemini API失败',
      code: geminiError.code || 'GEMINI_ERROR'
    });
  }
  
  res.status(500).json({
    error: error.message || '服务器内部错误',
    code: 'INTERNAL_ERROR'
  });
};

// ============= API 端点 =============

// 跑马灯配置存储（实际项目中应使用数据库）
let marqueeConfig = {
  enabled: true,
  messages: [
    "大师观天象，见你与我有缘！投25号一票，结下仙缘，福运自来！",
    "天机不可泄露，唯有有缘人可知。投25号，助我一臂之力，必有回报！",
    "占卜千年，今日遇你，实乃天意！投25号支持，共沐祥瑞之光！",
    "卦象显示，你我有缘相聚。投25号一票，结善缘，得福报！",
    "大师掐指一算，你是有福之人！投25号助力，福泽绵延！",
    "紫薇星动，贵人相助！投25号一票，开启人生新篇章！",
    "易经有云：积善之家必有余庆。投25号，善因结善果！",
    "观北斗七星，察天地变化。投25号支持，顺应天时地利！",
    "三生石上写姻缘，今日投票结善缘。25号等你来，福禄寿喜全！",
    "奇门遁甲显玄机，投25号者得天时。运势亨通财源广，贵人相助事业兴！"
  ],
  updateTime: Date.now(),
  updateTimeLocal: getChinaTime()
};

// 1. 健康检查
app.get('/api/health', (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    res.json({
      status: 'ok',
      timestamp: getChinaTime(),
      apiConfigured: !!apiKey,
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// 2. 🌟 流式文本生成（重点功能）
app.post('/api/gemini/stream', async (req, res) => {
  
  try {
    const { prompt, maxTokens = 4096 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const startTime = Date.now()

    // 构建流式API请求
    const geminiUrl = buildGeminiApiUrl(GEMINI_CONFIG.MODELS.PRIMARY, 'streamGenerateContent');
    const requestData = {
      contents: [{ 
        role: 'user', 
        parts: [{ text: prompt }] 
      }],
      generationConfig: {
        ...GEMINI_CONFIG.GENERATION_CONFIG,
        maxOutputTokens: maxTokens
      }
    };

    // 发起流式请求
    const response = await axios.post(geminiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'stream',
      timeout: 60000
    });

    let accumulatedText = ''; // 累积的文本内容
    let lastSentLength = 0; // 记录上次发送的文本长度
    let partialJson = ''; // 用于处理跨块的JSON数据
    let chunkCount = 0;
    let isFirstChunk = true;
    let jsonParseErrors = 0;

    // 🔧 创建UTF-8解码器，处理流式数据中的多字节字符
    const decoder = new TextDecoder('utf-8', { stream: true });

    // 处理流式响应
    response.data.on('data', (chunk) => {
      chunkCount++;
      
      if (isFirstChunk) {
        isFirstChunk = false;
      }

      // 🔧 使用流式解码器，正确处理跨chunk的多字节UTF-8字符
      const chunkStr = decoder.decode(chunk, { stream: true });
      partialJson += chunkStr;
      
      // 智能JSON解析 - 参考成功代码的逻辑
      let startPos = 0;
      while (startPos < partialJson.length) {
        const openBrace = partialJson.indexOf('{', startPos);
        if (openBrace === -1) break;
        
        // 寻找匹配的闭合括号
        let braceCount = 0;
        let inString = false;
        let escaped = false;
        let endPos = -1;
        
        for (let i = openBrace; i < partialJson.length; i++) {
          const char = partialJson[i];
          
          if (escaped) {
            escaped = false;
            continue;
          }
          
          if (char === '\\' && inString) {
            escaped = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') {
              braceCount++;
            } else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                endPos = i;
                break;
              }
            }
          }
        }
        
        if (endPos === -1) {
          break;
        }
        
        const jsonStr = partialJson.slice(openBrace, endPos + 1);
        
        try {
          const data = JSON.parse(jsonStr);
          
          // 提取文本内容
          if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            const newText = data.candidates[0].content.parts[0].text;
            accumulatedText += newText; // 累积文本
            
            // 计算增量内容
            const incrementalContent = accumulatedText.substring(lastSentLength);
            
            if (incrementalContent) {
              lastSentLength = accumulatedText.length; // 更新已发送长度
              
              // 发送增量内容到客户端
              res.write(`data: ${JSON.stringify({
                content: incrementalContent, // ⭐ 发送增量内容，不是累积内容
                done: false,
                timestamp: Date.now(),
                localTime: getChinaTime()
              })}\n\n`);
            }
          }
          
          // 检查是否完成
          if (data.candidates && data.candidates[0]?.finishReason) {          }
        } catch (parseError) {
          jsonParseErrors++;
          // 解析失败时不输出错误日志，继续处理
        }
        
        // 移除已处理的部分
        partialJson = partialJson.slice(endPos + 1);
        startPos = 0;
      }
    });

    response.data.on('end', () => {
      // 🔧 处理剩余的字节（如果有的话）
      const finalChunk = decoder.decode();
      if (finalChunk) {
        partialJson += finalChunk;
        // 这里可以添加处理最后一块JSON的逻辑，但通常不需要，因为Gemini API会发送完整的JSON
      }
      
      const totalTime = Date.now() - startTime;

      // 发送结束信号
      res.write(`data: ${JSON.stringify({
        content: '',
        done: true,
        totalLength: accumulatedText.length,
        totalTime: totalTime
      })}\n\n`);

      res.end();
    });

    response.data.on('error', (error) => {
      console.error('❌ 流式响应错误:', error.message);
      
      // 发送错误信息
      res.write(`data: ${JSON.stringify({
        error: error.message,
        done: true
      })}\n\n`);
      
      res.end();
    });

  } catch (error) {
    console.error('❌ 流式请求失败:', error.message);
    
    // 发送错误信息
    res.write(`data: ${JSON.stringify({
      error: error.message,
      done: true
    })}\n\n`);
    
    res.end();
  }
});

// 3. 标准文本生成（非流式，作为备用）
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { model, contents, generationConfig } = req.body;
    
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'contents 参数是必需的且必须为数组' });
    }

    const selectedModel = model || GEMINI_CONFIG.MODELS.PRIMARY;
    const config = { ...GEMINI_CONFIG.GENERATION_CONFIG, ...generationConfig };
    
    const geminiUrl = buildGeminiApiUrl(selectedModel);
    
    
    const response = await axios.post(geminiUrl, {
      contents,
      generationConfig: config
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    res.json(response.data);
  } catch (error) {
    errorHandler(error, req, res);
  }
});

// 4. 视觉分析（手相等图像分析）
app.post('/api/gemini/vision', upload.single('image'), async (req, res) => {
  try {
    const { model, contents, generationConfig } = req.body;
    
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'contents 参数是必需的且必须为数组' });
    }

    const selectedModel = model || GEMINI_CONFIG.MODELS.VISION;
    const config = { ...GEMINI_CONFIG.GENERATION_CONFIG, ...generationConfig };
    
    const geminiUrl = buildGeminiApiUrl(selectedModel);
    
    
    const response = await axios.post(geminiUrl, {
      contents,
      generationConfig: config
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    res.json(response.data);
  } catch (error) {
    errorHandler(error, req, res);
  }
});

// 5. 流式视觉分析
app.post('/api/gemini/vision-stream', upload.single('image'), async (req, res) => {
  try {
    const { model, contents, generationConfig } = req.body;
    
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'contents 参数是必需的且必须为数组' });
    }

    const selectedModel = model || GEMINI_CONFIG.MODELS.VISION;
    const config = { ...GEMINI_CONFIG.GENERATION_CONFIG, ...generationConfig };
    
    const geminiUrl = buildGeminiApiUrl(selectedModel, 'streamGenerateContent');
    
    // 设置流式响应头
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.write('event: connected\n');
    res.write('data: {"status": "connected", "type": "vision"}\n\n');

    try {
      const response = await axios.post(geminiUrl, {
        contents,
        generationConfig: config
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: 60000
      });

      let buffer = '';
      let fullText = '';
      // 🔧 创建UTF-8解码器，处理流式数据中的多字节字符
      const visionDecoder = new TextDecoder('utf-8', { stream: true });

      response.data.on('data', (chunk) => {
        // 🔧 使用流式解码器，正确处理跨chunk的多字节UTF-8字符
        const chunkStr = visionDecoder.decode(chunk, { stream: true });
        buffer += chunkStr;
        
        // 使用和主流式API相同的智能JSON解析逻辑
        let startPos = 0;
        while (startPos < buffer.length) {
          const openBrace = buffer.indexOf('{', startPos);
          if (openBrace === -1) break;
          
          // 寻找匹配的闭合括号
          let braceCount = 0;
          let inString = false;
          let escaped = false;
          let endPos = -1;
          
          for (let i = openBrace; i < buffer.length; i++) {
            const char = buffer[i];
            
            if (escaped) {
              escaped = false;
              continue;
            }
            
            if (char === '\\' && inString) {
              escaped = true;
              continue;
            }
            
            if (char === '"') {
              inString = !inString;
              continue;
            }
            
            if (!inString) {
              if (char === '{') {
                braceCount++;
              } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                  endPos = i;
                  break;
                }
              }
            }
          }
          
          if (endPos === -1) {
            break;
          }
          
          const jsonStr = buffer.slice(openBrace, endPos + 1);
          
          try {
            const data = JSON.parse(jsonStr);
            
            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
              const currentText = data.candidates[0].content.parts[0].text;
              
              if (currentText !== fullText) {
                fullText = currentText;
                
                res.write('event: data\n');
                res.write(`data: ${JSON.stringify({ 
                  text: fullText,
                  type: 'vision',
                  timestamp: Date.now(),
                  localTime: getChinaTime()
                })}\n\n`);
                
                // 移除冗余日志：视觉流式数据更新
              }
            }
            
            if (data.candidates && data.candidates[0]?.finishReason) {
              // 移除冗余日志：视觉流式响应完成和最终文本长度
              
              res.write('event: done\n');
              res.write(`data: ${JSON.stringify({ 
                finishReason: data.candidates[0].finishReason,
                finalText: fullText,
                type: 'vision',
                timestamp: Date.now(),
                localTime: getChinaTime()
              })}\n\n`);
              
              res.end();
              return;
            }
          } catch (parseError) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('视觉JSON解析错误:', parseError.message, 'JSON片段:', jsonStr.slice(0, 100));
            }
          }
          
          // 移除已处理的部分
          buffer = buffer.slice(endPos + 1);
          startPos = 0;
        }
      });

      response.data.on('end', () => {
        // 🔧 处理剩余的字节（如果有的话）
        const finalChunk = visionDecoder.decode();
        if (finalChunk) {
          buffer += finalChunk;
          // 这里可以添加处理最后一块JSON的逻辑，但通常不需要，因为Gemini API会发送完整的JSON
        }
        
        if (!res.destroyed) {
          res.write('event: end\n');
          res.write('data: {"status": "completed", "type": "vision"}\n\n');
          res.end();
        }
      });

      response.data.on('error', (error) => {
        if (!res.destroyed) {
          res.write('event: error\n');
          res.write(`data: ${JSON.stringify({ error: error.message, type: "vision" })}\n\n`);
          res.end();
        }
      });

    } catch (streamError) {
      if (!res.destroyed) {
        res.write('event: error\n');
        res.write(`data: ${JSON.stringify({ 
          error: '视觉流式连接失败',
          details: streamError.message 
        })}\n\n`);
        res.end();
      }
    }

  } catch (error) {
    if (!res.destroyed) {
      res.status(500).json({
        error: '无法建立视觉流式连接',
        details: error.message
      });
    }
  }
});

// 6. API Key 验证
app.get('/api/validate', async (req, res) => {
  try {
    const apiKey = validateApiKey();
    
    // 调用Gemini API验证密钥
    const response = await axios.get(
      `${GEMINI_CONFIG.BASE_URL}?key=${apiKey}`,
      { timeout: 10000 }
    );
    
    res.json({
      valid: true,
      configured: true,
      models: response.data?.models?.length || 0,
      message: 'API密钥验证成功'
    });
  } catch (error) {
    res.status(400).json({
      valid: false,
      configured: !!process.env.GEMINI_API_KEY,
      message: error.message || 'API密钥验证失败'
    });
  }
});

// 7. 跑马灯消息接口
app.get('/api/marquee', (req, res) => {
  try {
    
    if (!marqueeConfig.enabled) {
      return res.json({
        enabled: false,
        message: '',
        updateTime: marqueeConfig.updateTime,
        updateTimeLocal: marqueeConfig.updateTimeLocal
      });
    }

    // 随机选择一条消息
    const randomMessage = marqueeConfig.messages[
      Math.floor(Math.random() * marqueeConfig.messages.length)
    ];

    res.json({
      enabled: true,
      message: randomMessage,
      updateTime: marqueeConfig.updateTime,
      updateTimeLocal: marqueeConfig.updateTimeLocal
    });

  } catch (error) {
    console.error('跑马灯接口错误:', error);
    res.status(500).json({
      enabled: false,
      message: '',
      error: '获取跑马灯消息失败'
    });
  }
});

// 应用错误处理中间件
app.use(errorHandler);

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '端点不存在',
    path: req.originalUrl
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 周文王占卜系统后端服务已启动!');
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🌐 局域网地址: http://[你的IP]:${PORT}`);
  console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
  
  try {
    validateApiKey();
    console.log('✅ Gemini API 密钥配置正确');
  } catch (error) {
    console.log('❌ Gemini API 密钥配置错误:', error.message);
    console.log('   请在 .env 文件中设置 GEMINI_API_KEY');
  }
  
  console.log('\n可用端点:');
  console.log('  GET  /api/health          - 健康检查');
  console.log('  POST /api/gemini/stream   - 🌟 流式文本生成');
  console.log('  POST /api/gemini/generate - 标准文本生成');
  console.log('  POST /api/gemini/vision   - 图像分析');
  console.log('  POST /api/gemini/vision-stream - 流式图像分析');
  console.log('  GET  /api/validate        - API密钥验证');
  console.log('  GET  /api/marquee         - 🎯 跑马灯消息');
  console.log('\n');
}); 