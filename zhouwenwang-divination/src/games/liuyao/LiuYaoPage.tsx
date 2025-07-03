import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { generateHexagram, HEXAGRAM_NAMES, type LiuYaoResult } from './logic';
import { getAIAnalysisStream } from '../../masters/service';
import { useMaster, useUI } from '../../core/store';
import { addRecord } from '../../core/history';
import { StreamingMarkdown, ErrorToast, useAutoScroll } from '../../components/common';
import { getRandomQuestions } from '../../core/quickQuestions';
import { getVideoPath } from '../../utils/resources';
import type { DivinationRecord } from '../../types';

const LiuYaoPage = () => {
  const [question, setQuestion] = useState<string>('');
  const [result, setResult] = useState<LiuYaoResult | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isDivining, setIsDivining] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);
  const [videoLoaded, setVideoLoaded] = useState(true); // 视频加载状态
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [useCurrentTime, setUseCurrentTime] = useState(true);

  const { selectedMaster } = useMaster();
  const { error, setError } = useUI();
  const navigate = useNavigate();
  
  // 使用通用的自动滚动Hook
  const { contentRef: analysisRef } = useAutoScroll({
    isAnalyzing: analyzing,
    content: analysis
  });

  // 自动清除错误提示
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 4000); // 4秒后自动清除
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  // 初始化随机问题
  useEffect(() => {
    setQuickQuestions(getRandomQuestions('liuyao', 3));
  }, []);

  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // 生成正确的爻名 - 统一函数
  const getCorrectYaoName = (position: number, type: 'yin' | 'yang'): string => {
    if (position === 6) {
      return '上' + (type === 'yang' ? '九' : '六');
    } else if (position === 1) {
      return '初' + (type === 'yang' ? '九' : '六');
    } else {
      // 中间爻的格式：六二、九二、六三、九三、六四、九四、六五、九五
      const positions = ['', '二', '三', '四', '五', ''];
      return (type === 'yang' ? '九' : '六') + positions[position - 1];
    }
  };

  // 获取八卦结构信息
  const getHexagramStructure = (hexagramData: { yaos: number[] }) => {
    // 八卦名称对应表
    const trigramNames: { [key: string]: { name: string; nature: string } } = {
      '111': { name: '乾', nature: '天' },
      '000': { name: '坤', nature: '地' },
      '100': { name: '震', nature: '雷' },
      '011': { name: '巽', nature: '风' },
      '010': { name: '坎', nature: '水' },
      '101': { name: '离', nature: '火' },
      '001': { name: '艮', nature: '山' },
      '110': { name: '兑', nature: '泽' }
    };

    // 将爻值转换为二进制（阳爻=1，阴爻=0）
    const toBinary = (yaos: number[]) => {
      return yaos.map(yao => (yao === 7 || yao === 9) ? '1' : '0').join('');
    };

    const binaryStr = toBinary(hexagramData.yaos);
    
    // 下卦（前三爻）
    const lowerTrigram = trigramNames[binaryStr.slice(0, 3)] || { name: '未知', nature: '未知' };
    // 上卦（后三爻）
    const upperTrigram = trigramNames[binaryStr.slice(3, 6)] || { name: '未知', nature: '未知' };

    return { upperTrigram, lowerTrigram };
  };

  /**
   * 快速开始占卜
   */
  const quickStart = async (selectedQuestion: string) => {
    setQuestion(selectedQuestion);
    
    // 稍微延迟一下让用户看到问题填充，然后开始占卜
    setTimeout(() => {
      performDivinationWithQuestion(selectedQuestion);
    }, 200);
  };

  /**
   * 执行摇卦（带问题参数）
   */
  const performDivinationWithQuestion = async (questionText: string) => {
    if (!questionText.trim()) {
      setError('请输入您要占卜的问题');
      return;
    }

    setIsDivining(true);
    setVideoLoaded(true); // 重置视频状态
    setResult(null);
    setAnalysis('');
    setAnalyzing(false);
    setAnalysisComplete(false);
    
    // 模拟摇卦动画时间
    setTimeout(() => {
      const targetTime = useCurrentTime ? new Date() : selectedTime;
      const hexagramResult = generateHexagram(targetTime);
      setResult(hexagramResult);
      setIsDivining(false);
    }, 3000); // 3秒动画时间
  };

  /**
   * 执行摇卦
   */
  const performDivination = async () => {
    await performDivinationWithQuestion(question);
  };

  /**
   * 生成测试卦象（确保有阴爻）
   */
  const generateTestHexagram = () => {
    // 使用正常的生成逻辑，但重新调用一次以生成新的卦象
    const testResult = generateHexagram();
    
    // 清除之前的分析状态
    setAnalysis('');
    setAnalyzing(false);
    setAnalysisComplete(false);
    
    setResult(testResult);
  };

  /**
   * 获取AI分析（流式处理）
   */
  const getAnalysis = async () => {
    if (!result) {
      setError('请先进行摇卦');
      return;
    }

    if (!question.trim()) {
      setError('请输入占卜问题');
      return;
    }

    if (!selectedMaster) {
      setError('请先在设置中选择一位大师');
      return;
    }

    setAnalyzing(true);
    setAnalysisComplete(false);
    setError(null);
    setAnalysis(''); // 清空之前的分析结果

    try {
      // 构建占卜数据，包含用户问题和起卦时间
      const divinationData = {
        type: 'liuyao',
        question: question.trim(),
        originalHexagram: result.originalHexagram.name,
        changedHexagram: result.changedHexagram ? result.changedHexagram.name : null,
        yaos: result.originalHexagram.yaos.map((yaoValue, index) => {
          const position = index + 1;
          const yaoType = result.originalHexagram.yaoTypes[index];
          const isMoving = result.movingLines.includes(position);
          const yaoTypeValue = yaoType.includes('阳') ? 'yang' : 'yin';
          
          return {
            position: position,
            name: getCorrectYaoName(position, yaoTypeValue),
            value: yaoValue,
            type: yaoTypeValue,
            changing: isMoving,
            symbol: result.originalHexagram.symbols[index]
          };
        }),
        movingLines: result.movingLines,
        hasChangingLines: result.movingLines.length > 0,
        timestamp: result.timestamp,
        divinationTime: result.divinationTime,
        worldYao: result.worldYao,
        responseYao: result.responseYao
      };

      // 使用流式分析，实时更新结果
      const analysisResult = await getAIAnalysisStream(
        divinationData, 
        selectedMaster, 
        'liuyao',
        undefined,
        (streamText) => {
          // 流式更新回调
          setAnalysis(streamText);
        }
      );

      // 分析完成
      setAnalysisComplete(true);

      // 保存到历史记录
      const record: DivinationRecord = {
        id: `liuyao-${Date.now()}`,
        type: 'liuyao',
        timestamp: Date.now(),
        data: divinationData,
        master: {
          id: selectedMaster.id,
          name: selectedMaster.name,
          description: selectedMaster.description
        },
        analysis: analysisResult
      };
      await addRecord(record);

    } catch (error) {
      console.error('AI分析失败:', error);
      setError(error instanceof Error ? error.message : '分析过程中发生错误');
      setAnalysisComplete(false);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-black text-white"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* 页面标题 */}
        <motion.div 
          className="text-center mb-2"
          variants={itemVariants}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#EEEEEE] via-[#CCCCCC] to-[#FF9900] bg-clip-text text-transparent">
            六爻占卜
          </h1>
          <p className="text-xl text-[#CCCCCC] max-w-3xl mx-auto leading-relaxed">
            传承千年的六爻占卜智慧，通过摇卦的方式获得卦象，解读人生吉凶
          </p>
        </motion.div>

        <div className="space-y-8">
          {/* 问题输入区域 */}
          <motion.div 
            variants={itemVariants}
          >
            <motion.div variants={itemVariants}>
              
              {/* 输入框和按钮水平排列 - 居中 */}
              <div className="flex justify-center items-center gap-4 mb-8">
                <motion.input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="您想算点什么？"
                  className="w-[300px] h-[46px] px-6 py-3 bg-[#222222] border-2 border-[#333333] rounded-xl !text-white !text-lg !font-bold placeholder:!text-[#888888] focus:border-[#FF9900] focus:outline-none transition-all duration-300"
                  style={{ 
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    backgroundColor: '#222222',
                    borderRadius: '12px',
                    height: '46px'
                  }}
                  whileFocus={{ scale: 1.01 }}
                  disabled={isDivining}
                />
                <motion.button 
                  onClick={performDivination}
                  disabled={isDivining || !question.trim()}
                  className={`px-8 py-3 h-[46px] rounded-xl font-bold text-lg transition-all duration-300 shadow-lg whitespace-nowrap flex items-center justify-center ${
                    isDivining || !question.trim()
                      ? 'bg-[#444444] text-[#888888] cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#FF9900] to-[#E68A00] text-black hover:from-[#E68A00] hover:to-[#CC7700] hover:shadow-xl hover:shadow-[#FF9900]/30'
                  }`}
                  whileHover={!isDivining && question.trim() ? { scale: 1.05, y: -2 } : {}}
                  whileTap={!isDivining && question.trim() ? { scale: 0.98 } : {}}
                >
                  {isDivining ? (
                    <span className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                      正在摇卦...
                    </span>
                  ) : (
                    '开始摇卦'
                  )}
                </motion.button>
              </div>

              {/* 时间选择区域 */}
              <div className="flex justify-center items-center gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#FF9900]" />
                  <span className="text-white font-medium">起卦时间：</span>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={useCurrentTime}
                      onChange={() => setUseCurrentTime(true)}
                      className="form-radio text-[#FF9900] focus:ring-[#FF9900] bg-[#222222] border-[#333333]"
                      disabled={isDivining}
                    />
                    <span className="text-[#CCCCCC]">当前时间</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!useCurrentTime}
                      onChange={() => setUseCurrentTime(false)}
                      className="form-radio text-[#FF9900] focus:ring-[#FF9900] bg-[#222222] border-[#333333]"
                      disabled={isDivining}
                    />
                    <span className="text-[#CCCCCC]">自选时间</span>
                  </label>
                </div>
                {!useCurrentTime && (
                  <input
                    type="datetime-local"
                    value={selectedTime.toISOString().slice(0, 16)}
                    onChange={(e) => setSelectedTime(new Date(e.target.value))}
                    className="px-3 py-2 bg-[#222222] border border-[#333333] rounded-lg text-white focus:border-[#FF9900] focus:outline-none transition-all duration-300"
                    disabled={isDivining}
                  />
                )}
              </div>

              {/* 快速开始水平布局 - 居中 */}
              <div className="flex justify-center items-center gap-3">
                <h4 className="text-lg font-medium text-white whitespace-nowrap">快速开始：</h4>
                <div className="flex flex-wrap gap-4">
                  {quickQuestions.map((quickQuestion, index) => (
                    <motion.span
                      key={index}
                      onClick={() => !isDivining && quickStart(quickQuestion)}
                      className={`px-4 py-2 text-[#CCCCCC] text-sm cursor-pointer hover:text-[#FF9900] transition-all duration-300 ${
                        isDivining ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      whileHover={!isDivining ? { scale: 1.05, y: -2 } : {}}
                      whileTap={!isDivining ? { scale: 0.98 } : {}}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {quickQuestion}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* 摇卦动画区域 */}
          <AnimatePresence>
            {isDivining && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-white mb-6">古法摇卦，天机显现</h3>
                  
                  {/* 摇卦动画区域 */}
                  <div className="flex justify-center">
                    <div className="bg-black flex items-center justify-center relative overflow-hidden rounded-xl" style={{ width: '560px', height: '315px' }}>
                      {/* 实际使用MP4视频 */}
                      <video 
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover rounded-xl"
                        style={{ 
                          width: '560px', 
                          height: '315px',
                          display: videoLoaded ? 'block' : 'none'
                        }}
                        onError={(e) => {
                          console.log('视频加载失败，显示备用动画');
                          setVideoLoaded(false);
                        }}
                        onCanPlayThrough={() => {
                          console.log('视频可以播放');
                          setVideoLoaded(true);
                        }}
                        onLoadStart={() => {
                          console.log('视频开始加载');
                        }}
                      >
                        <source src={getVideoPath("liuyao.mp4")} type="video/mp4" />
                      </video>
                      
                      {/* 备用动画 - 只在视频加载失败时显示 */}
                      {!videoLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative">
                            <motion.div
                              className="w-16 h-16 border-4 border-[#FF9900] border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <motion.div
                              className="absolute inset-4 border-2 border-[#CCCCCC] border-b-transparent rounded-full"
                              animate={{ rotate: -360 }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            />
                            <motion.div
                              className="absolute inset-8 w-16 h-16 flex items-center justify-center"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <span className="text-[#FF9900] text-2xl font-bold">卦</span>
                            </motion.div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 卦象结果显示 */}
          {result && !isDivining && (
            <motion.div 
              variants={itemVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* 与视频相同尺寸的卦象显示容器 */}
              <div className="flex justify-center">
                <div style={{ width: '560px', height: '315px' }}>

                  {/* 卦象主体 - 深色卡片，填满剩余空间 */}
                  <motion.div 
                    className="bg-[#1a1a1a] border border-[#333] p-6 flex flex-col"
                    style={{ 
                      minHeight: '280px',
                      borderRadius: '16px',
                      overflow: 'hidden'
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* 卦名和卦象描述 */}
                    <div className="text-center mb-4">
                      <div className="flex items-center justify-center gap-8">
                        {/* 卦名 - 大字艺术效果 */}
                        <h3 
                          style={{ 
                            fontSize: '42px',
                            fontWeight: '900',
                            color: '#3B82F6',
                            fontFamily: '"Noto Serif SC", "STKaiti", "STSong", serif',
                            textShadow: '0 0 15px rgba(59, 130, 246, 0.6), 0 0 25px rgba(59, 130, 246, 0.4)',
                            letterSpacing: '4px',
                            lineHeight: '1',
                            marginRight: '20px'
                          }}
                        >
                          {result.originalHexagram.name}
                        </h3>
                        
                        {/* 卦象结构描述 - 精致标签样式 */}
                        <div className="flex flex-col gap-2">
                          <div 
                            style={{ 
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#FBBF24',
                              backgroundColor: 'rgba(251, 191, 36, 0.15)',
                              border: '1px solid rgba(251, 191, 36, 0.4)',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              boxShadow: '0 0 8px rgba(251, 191, 36, 0.3)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {(() => {
                              const structure = getHexagramStructure(result.originalHexagram);
                              return `${structure.upperTrigram.name}上${structure.lowerTrigram.name}下`;
                            })()}
                          </div>
                          <div 
                            style={{ 
                              fontSize: '13px',
                              fontWeight: '500',
                              color: '#CCCCCC',
                              backgroundColor: 'rgba(204, 204, 204, 0.1)',
                              border: '1px solid rgba(204, 204, 204, 0.3)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              textAlign: 'center'
                            }}
                          >
                            {(() => {
                              const structure = getHexagramStructure(result.originalHexagram);
                              return `${structure.upperTrigram.nature}${structure.lowerTrigram.nature}`;
                            })()}
                          </div>
                        </div>
                      </div>
                      
                      {/* 起卦时间信息 */}
                      <div className="mt-3 text-sm text-[#888888]">
                        <div className="flex items-center justify-center gap-4">
                          {result.divinationTime && (
                            <>
                              <span>起卦时间：{result.divinationTime.year}年 {result.divinationTime.month}月 {result.divinationTime.day}日 {result.divinationTime.hour}时</span>
                              <span>•</span>
                            </>
                          )}
                          <span>世爻：{result.worldYao}爻</span>
                          <span>•</span>
                          <span>应爻：{result.responseYao}爻</span>
                        </div>
                      </div>
                    </div>

                    {/* 六爻显示 - 占用主要空间 */}
                    <div className="flex-1 overflow-hidden" style={{ paddingTop: '8px' }}>
                      {result.originalHexagram.yaos.slice().reverse().map((yaoValue, index) => {
                        const position = 6 - index;
                        const yaoType = result.originalHexagram.yaoTypes[5 - index];
                        const isMoving = result.movingLines.includes(position);
                        const yaoTypeValue = yaoType.includes('阳') ? 'yang' : 'yin';
                        // 根据爻的阴阳性质和位置生成正确的名称
                        const positionName = getCorrectYaoName(position, yaoTypeValue);
                        
                        return (
                          <motion.div 
                            key={index} 
                            className="flex items-center gap-4 transition-all duration-300"
                            style={{ 
                              margin: '6px 16px',
                              minHeight: '24px'
                            }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + 0.3 }}
                            whileHover={{ scale: 1.01 }}
                          >
                            {/* 爻位名称 - 艺术字效果 */}
                            <span 
                              style={{ 
                                fontSize: '20px',
                                fontWeight: '800',
                                color: '#FF9900',
                                fontFamily: '"Noto Serif SC", "STKaiti", "STSong", serif',
                                textShadow: '0 0 10px rgba(255, 153, 0, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3)',
                                letterSpacing: '1px',
                                lineHeight: '1',
                                marginRight: '15px',
                                width: '48px',
                                textAlign: 'right',
                                display: 'inline-block'
                              }}
                            >
                              {positionName}
                            </span>
                            
                            {/* 爻的条形显示 */}
                            <div className="flex-1" style={{ minWidth: '200px' }}>
                              {yaoTypeValue === 'yang' ? (
                                // 阳爻 - 完整的橙色长条
                                <div 
                                  className="h-6 w-full rounded shadow-lg"
                                  style={{ 
                                    minHeight: '24px', 
                                    backgroundColor: isMoving ? '#fbbf24' : '#f59e0b',
                                    boxShadow: isMoving 
                                      ? '0 4px 12px rgba(251, 191, 36, 0.4)' 
                                      : '0 4px 12px rgba(245, 158, 11, 0.4)'
                                  }}
                                ></div>
                              ) : (
                                // 阴爻 - 两个分开的短条，中间有明显空白
                                <div className="w-full flex justify-between">
                                  <div 
                                    className="h-6 rounded shadow-lg"
                                    style={{ 
                                      minHeight: '24px', 
                                      backgroundColor: isMoving ? '#9ca3af' : '#6b7280',
                                      width: '42%',
                                      boxShadow: isMoving 
                                        ? '0 4px 12px rgba(156, 163, 175, 0.3)' 
                                        : '0 4px 12px rgba(107, 114, 128, 0.3)'
                                    }}
                                  ></div>
                                  <div 
                                    className="h-6 rounded shadow-lg"
                                    style={{ 
                                      minHeight: '24px', 
                                      backgroundColor: isMoving ? '#9ca3af' : '#6b7280',
                                      width: '42%',
                                      boxShadow: isMoving 
                                        ? '0 4px 12px rgba(156, 163, 175, 0.3)' 
                                        : '0 4px 12px rgba(107, 114, 128, 0.3)'
                                    }}
                                  ></div>
                                </div>
                              )}
                            </div>
                            
                            {/* 变爻标记列 - 增强视觉效果 */}
                            <div className="w-12 flex justify-center" style={{ marginLeft: '20px' }}>
                              {isMoving ? (
                                <span 
                                  style={{ 
                                    fontSize: '28px',
                                    fontWeight: '900',
                                    color: yaoTypeValue === 'yang' ? '#FCD34D' : '#E5E7EB',
                                    textShadow: yaoTypeValue === 'yang' 
                                      ? '0 0 12px rgba(252, 211, 77, 0.8), 0 0 20px rgba(252, 211, 77, 0.4)' 
                                      : '0 0 12px rgba(229, 231, 235, 0.8), 0 0 20px rgba(229, 231, 235, 0.4)',
                                    filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4))',
                                    animation: 'pulse 2s infinite'
                                  }}
                                >
                                  {yaoTypeValue === 'yang' ? '○' : '×'}
                                </span>
                              ) : (
                                <span className="text-2xl text-transparent">○</span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* 大师分析按钮 - 底部固定 */}
                    <div style={{ margin: '15px' }}>
                      <motion.button 
                        onClick={getAnalysis}
                        disabled={analyzing || !selectedMaster || analysisComplete}
                        className={`w-full px-4 py-3 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${
                          analyzing || !selectedMaster || analysisComplete
                            ? 'bg-[#444444] cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#FF9900] to-[#E68A00] hover:from-[#E68A00] hover:to-[#CC7700] hover:shadow-xl hover:shadow-[#FF9900]/30'
                        }`}
                        style={{
                          color: analyzing || !selectedMaster || analysisComplete ? '#888888' : '#000000'
                        }}
                        whileHover={!analyzing && selectedMaster && !analysisComplete ? { scale: 1.02 } : {}}
                        whileTap={!analyzing && selectedMaster && !analysisComplete ? { scale: 0.98 } : {}}
                      >
                        {analyzing ? (
                          <span 
                            className="flex items-center justify-center gap-3"
                            style={{ color: '#888888' }}
                          >
                            <div 
                              className="animate-spin rounded-full h-4 w-4 border-b-2"
                              style={{ borderColor: '#888888' }}
                            ></div>
                            <span style={{ color: '#888888' }}>
                              {analysis ? `${selectedMaster?.name}正在分析...` : `${selectedMaster?.name}解卦中...`}
                            </span>
                          </span>
                        ) : (
                          <span style={{ color: analyzing || !selectedMaster || analysisComplete ? '#888888' : '#000000' }}>
                            {analysisComplete ? `${selectedMaster?.name}解卦完成` : '大师解卦'}
                          </span>
                        )}
                      </motion.button>
                      
                      {!selectedMaster && (
                        <motion.button 
                          onClick={() => navigate('/settings')}
                          className="w-full mt-2 bg-gradient-to-r from-[#FF9900] to-[#E68A00] text-black px-4 py-3 rounded-xl font-bold text-sm hover:from-[#E68A00] hover:to-[#CC7700] transition-all duration-300 shadow-lg hover:shadow-[#FF9900]/30"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          前往设置选择大师
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 大师分析结果 */}
          {analysis && (
            <motion.div 
              ref={analysisRef}
              className="p-4"
              style={{ marginTop: '14rem' }}
              variants={itemVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >

              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '20rem',
                }}
              >
                <StreamingMarkdown
                  content={analysis}
                  showCursor={analyzing && !analysisComplete}
                  isStreaming={analyzing}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      <ErrorToast
        isVisible={!!error}
        message={error || ''}
        onClose={() => setError(null)}
      />
    </motion.div>
  );
};

export default LiuYaoPage;