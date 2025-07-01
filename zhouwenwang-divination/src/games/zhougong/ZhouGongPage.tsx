import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  analyzeDream, 
  getFortuneDescription, 
  dreamCategories,
  type DreamAnalysisResult 
} from './logic';
import { getAIAnalysisStream } from '../../masters/service';
import { useMaster, useUI } from '../../core/store';
import { addRecord } from '../../core/history';
import { StreamingMarkdown, ErrorToast, useAutoScroll } from '../../components/common';
import { getRandomQuestions } from '../../core/quickQuestions';
import { getVideoPath } from '../../utils/resources';
import type { DivinationRecord } from '../../types';

const ZhouGongPage = () => {
  const [dreamDescription, setDreamDescription] = useState<string>('');
  const [result, setResult] = useState<DreamAnalysisResult | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isAnalyzingDream, setIsAnalyzingDream] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);
  const [videoLoaded, setVideoLoaded] = useState(true);

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
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  // 初始化随机问题
  useEffect(() => {
    setQuickQuestions(getRandomQuestions('zhougong', 3));
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

  /**
   * 快速开始解梦
   */
  const quickStart = async (selectedDream: string) => {
    setDreamDescription(selectedDream);
    
    setTimeout(() => {
      performDreamAnalysisWithText(selectedDream);
    }, 200);
  };

  /**
   * 执行梦境分析（带描述参数）
   */
  const performDreamAnalysisWithText = async (dreamText: string) => {
    if (!dreamText.trim()) {
      setError('请输入您的梦境内容');
      return;
    }

    setIsAnalyzingDream(true);
    setVideoLoaded(true);
    setResult(null);
    setAnalysis('');
    setAnalyzing(false);
    setAnalysisComplete(false);
    
    // 模拟解梦分析动画时间
    setTimeout(() => {
      const dreamResult = analyzeDream(dreamText);
      setResult(dreamResult);
      setIsAnalyzingDream(false);
    }, 3000);
  };

  /**
   * 执行梦境分析
   */
  const performDreamAnalysis = async () => {
    await performDreamAnalysisWithText(dreamDescription);
  };

  /**
   * 获取AI分析（流式处理）
   */
  const getAnalysis = async () => {
    if (!result) {
      setError('请先进行梦境分析');
      return;
    }

    if (!dreamDescription.trim()) {
      setError('请输入梦境描述');
      return;
    }

    if (!selectedMaster) {
      setError('请先在设置中选择一位大师');
      return;
    }

    setAnalyzing(true);
    setAnalysisComplete(false);
    setError(null);
    setAnalysis('');

    try {
      // 构建解梦数据，包含用户梦境描述
      const divinationData = {
        type: 'zhougong',
        dreamDescription: dreamDescription.trim(),
        keywords: result.keywords,
        categories: result.categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description
        })),
        symbolism: result.symbolism,
        fortune: result.fortune,
        fortuneDescription: getFortuneDescription(result.fortune).text,
        timestamp: result.timestamp
      };

      // 使用流式分析，实时更新结果
      const analysisResult = await getAIAnalysisStream(
        divinationData, 
        selectedMaster, 
        'zhougong',
        undefined,
        (streamText) => {
          setAnalysis(streamText);
        }
      );

      setAnalysisComplete(true);

      // 保存到历史记录
      const record: DivinationRecord = {
        id: `zhougong-${Date.now()}`,
        type: 'zhougong',
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
            周公解梦
          </h1>
          <p className="text-xl text-[#CCCCCC] max-w-3xl mx-auto leading-relaxed">
            承古圣贤智慧，解析梦境奥秘，窥探潜意识深处的神秘信息
          </p>
        </motion.div>

        <div className="space-y-8">
          {/* 梦境描述输入区域 */}
          <motion.div variants={itemVariants}>
            {/* 输入框和按钮水平排列 - 居中 */}
            <div className="flex justify-center items-center gap-4 mb-8">
              <motion.textarea
                value={dreamDescription}
                onChange={(e) => setDreamDescription(e.target.value)}
                placeholder="请详细描述您的梦境..."
                className="w-[400px] h-[100px] px-6 py-3 bg-[#222222] border-2 border-[#333333] rounded-xl !text-white !text-lg !font-bold placeholder:!text-[#888888] focus:border-[#FF9900] focus:outline-none transition-all duration-300 resize-none"
                style={{ 
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: '#222222',
                  borderRadius: '12px'
                }}
                disabled={isAnalyzingDream}
              />
              <motion.button 
                onClick={performDreamAnalysis}
                disabled={isAnalyzingDream || !dreamDescription.trim()}
                className={`px-8 py-3 h-[46px] rounded-xl font-bold text-lg transition-all duration-300 shadow-lg whitespace-nowrap flex items-center justify-center ${
                  isAnalyzingDream || !dreamDescription.trim()
                    ? 'bg-[#444444] text-[#888888] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#FF9900] to-[#E68A00] text-black hover:from-[#E68A00] hover:to-[#CC7700] hover:shadow-xl hover:shadow-[#FF9900]/30'
                }`}
                whileHover={!isAnalyzingDream && dreamDescription.trim() ? { scale: 1.05, y: -2 } : {}}
                whileTap={!isAnalyzingDream && dreamDescription.trim() ? { scale: 0.98 } : {}}
              >
                {isAnalyzingDream ? (
                  <span className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                    正在解梦...
                  </span>
                ) : (
                  '开始解梦'
                )}
              </motion.button>
            </div>

            {/* 快速开始水平布局 - 居中 */}
            <div className="flex justify-center items-center gap-3">
              <h4 className="text-lg font-medium text-white whitespace-nowrap">快速开始：</h4>
              <div className="flex flex-wrap gap-4">
                {quickQuestions.map((quickDream, index) => (
                  <motion.span
                    key={index}
                    onClick={() => !isAnalyzingDream && quickStart(quickDream)}
                    className={`px-4 py-2 text-[#CCCCCC] text-sm cursor-pointer hover:text-[#FF9900] transition-all duration-300 ${
                      isAnalyzingDream ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    whileHover={!isAnalyzingDream ? { scale: 1.05, y: -2 } : {}}
                    whileTap={!isAnalyzingDream ? { scale: 0.98 } : {}}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {quickDream}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 解梦动画区域 */}
          <AnimatePresence>
            {isAnalyzingDream && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-white mb-6">梦境解析，天机显现</h3>
                  
                  {/* 解梦动画区域 */}
                  <div className="flex justify-center">
                    <div className="bg-black flex items-center justify-center relative overflow-hidden rounded-xl" style={{ width: '560px', height: '315px' }}>
                      {/* 使用解梦视频 */}
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
                          setVideoLoaded(true);
                        }}
                      >
                        <source src={getVideoPath("zhougong.mp4")} type="video/mp4" />
                      </video>
                      
                      {/* 备用动画 */}
                      {!videoLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative">
                            <motion.div
                              className="w-20 h-20 border-4 border-[#FF9900] rounded-full flex items-center justify-center"
                              animate={{ 
                                rotate: 360,
                                scale: [1, 1.1, 1]
                              }}
                              transition={{ 
                                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                                scale: { duration: 2, repeat: Infinity }
                              }}
                            >
                              <motion.div
                                className="text-[#FF9900] text-3xl font-bold"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                梦
                              </motion.div>
                            </motion.div>
                            
                            {/* 环绕的小星星 */}
                            {[...Array(8)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-[#CCCCCC] rounded-full"
                                style={{
                                  top: '50%',
                                  left: '50%',
                                  transformOrigin: `${40 * Math.cos(i * Math.PI / 4)}px ${40 * Math.sin(i * Math.PI / 4)}px`
                                }}
                                animate={{ 
                                  rotate: 360,
                                  scale: [0.5, 1, 0.5]
                                }}
                                transition={{ 
                                  rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                                  scale: { duration: 2, repeat: Infinity, delay: i * 0.2 }
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 梦境分析结果显示 */}
          {result && !isAnalyzingDream && (
            <motion.div 
              variants={itemVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex justify-center">
                <div style={{ width: '560px', minHeight: '315px' }}>
                  <motion.div 
                    className="bg-[#1a1a1a] border border-[#333] p-6 flex flex-col"
                    style={{ 
                      borderRadius: '16px',
                      overflow: 'hidden'
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* 梦境标题和吉凶 */}
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center gap-8">
                        <h3 
                          style={{ 
                            fontSize: '32px',
                            fontWeight: '900',
                            color: '#3B82F6',
                            fontFamily: '"Noto Serif SC", "STKaiti", "STSong", serif',
                            textShadow: '0 0 15px rgba(59, 130, 246, 0.6)',
                            letterSpacing: '4px',
                            lineHeight: '1'
                          }}
                        >
                          梦境解析
                        </h3>
                        
                        {/* 吉凶显示 */}
                        <div className="flex flex-col items-center gap-2">
                          {(() => {
                            const fortuneInfo = getFortuneDescription(result.fortune);
                            return (
                              <>
                                <div 
                                  style={{ 
                                    fontSize: '24px',
                                    fontWeight: '800',
                                    color: fortuneInfo.color,
                                    textShadow: `0 0 10px ${fortuneInfo.color}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}
                                >
                                  <span>{fortuneInfo.emoji}</span>
                                  <span>{fortuneInfo.text}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* 分类标签 */}
                    <div className="mb-4">
                      <h4 className="text-[#CCCCCC] text-sm font-medium mb-2">梦境分类：</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.categories.map((category, index) => (
                          <motion.span
                            key={category.id}
                            className="px-3 py-1 rounded-full text-sm font-medium"
                            style={{
                              backgroundColor: `${category.color}20`,
                              color: category.color,
                              border: `1px solid ${category.color}40`
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            {category.name}
                          </motion.span>
                        ))}
                      </div>
                    </div>

                    {/* 关键词显示 */}
                    {result.keywords.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-[#CCCCCC] text-sm font-medium mb-2">关键词：</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.keywords.map((keyword, index) => (
                            <motion.span
                              key={index}
                              className="px-2 py-1 bg-[#333] text-[#FF9900] rounded text-sm"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              {keyword}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 象征意义 */}
                    <div className="mb-6">
                      <h4 className="text-[#CCCCCC] text-sm font-medium mb-2">象征意义：</h4>
                      <div className="space-y-1">
                        {result.symbolism.map((symbol, index) => (
                          <motion.div
                            key={index}
                            className="text-[#EEEEEE] text-sm flex items-center gap-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <span className="text-[#FF9900]">•</span>
                            <span>{symbol}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* 大师分析按钮 */}
                    <div>
                      <motion.button 
                        onClick={getAnalysis}
                        disabled={analyzing || !selectedMaster || analysisComplete}
                        className={`w-full px-4 py-3 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${
                          analyzing || !selectedMaster || analysisComplete
                            ? 'bg-[#444444] cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30'
                        }`}
                        style={{ color: '#ffffff' }}
                        whileHover={!analyzing && selectedMaster && !analysisComplete ? { scale: 1.02 } : {}}
                        whileTap={!analyzing && selectedMaster && !analysisComplete ? { scale: 0.98 } : {}}
                      >
                        {analyzing ? (
                          <span className="flex items-center justify-center gap-3" style={{ color: '#ffffff' }}>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#ffffff' }}></div>
                            <span style={{ color: '#ffffff' }}>
                              {analysis ? `${selectedMaster?.name}正在分析...` : `${selectedMaster?.name}解梦中...`}
                            </span>
                          </span>
                        ) : (
                          <span style={{ color: '#ffffff' }}>
                            {analysisComplete ? `${selectedMaster?.name}解梦完成` : '大师解梦'}
                          </span>
                        )}
                      </motion.button>
                      
                      {!selectedMaster && (
                        <motion.button 
                          onClick={() => navigate('/settings')}
                          className="w-full mt-2 bg-green-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-all duration-300 shadow-lg"
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
              style={{ marginTop: '2rem' }}
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

export default ZhouGongPage; 