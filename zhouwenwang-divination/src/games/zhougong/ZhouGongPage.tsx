import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getAIAnalysisStream } from '../../masters/service';
import { useMaster, useUI } from '../../core/store';
import { addRecord } from '../../core/history';
import { StreamingMarkdown, ErrorToast, useAutoScroll } from '../../components/common';
import { getRandomQuestions } from '../../core/quickQuestions';
import { getVideoPath } from '../../utils/resources';
import type { DivinationRecord } from '../../types';

const ZhouGongPage = () => {
  const [dreamDescription, setDreamDescription] = useState<string>('');
  const [analysis, setAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
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
      performDreamAnalysis(selectedDream);
    }, 200);
  };

  /**
   * 执行梦境分析 - 直接调用大模型
   */
  const performDreamAnalysis = async (dreamText?: string) => {
    const dreamToAnalyze = dreamText || dreamDescription;
    
    if (!dreamToAnalyze.trim()) {
      setError('请输入您的梦境内容');
      return;
    }

    if (!selectedMaster) {
      setError('请先在设置中选择一位大师');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      setAnalysis('');
      setAnalysisComplete(false);
      setShowLoadingAnimation(true);
      setVideoLoaded(true);

      // 构建解梦数据
      const divinationData = {
        type: 'zhougong',
        dreamDescription: dreamToAnalyze.trim(),
        timestamp: Date.now()
      };

      // 使用流式分析，实时更新结果
      const analysisResult = await getAIAnalysisStream(
        divinationData, 
        selectedMaster, 
        'zhougong',
        undefined,
        (streamText) => {
          // 流式更新回调 - 当开始有内容返回时，隐藏动画显示结果
          if (streamText && streamText.trim()) {
            setShowLoadingAnimation(false);
            setAnalysis(streamText);
          }
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
      setShowLoadingAnimation(false);
    }
  };

  const canStartAnalysis = dreamDescription.trim() && selectedMaster && !analyzing && !analysisComplete;

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
                disabled={analyzing}
              />
              <motion.button 
                onClick={() => performDreamAnalysis()}
                disabled={!canStartAnalysis}
                className={`px-8 py-3 h-[46px] rounded-xl font-bold text-lg transition-all duration-300 shadow-lg whitespace-nowrap flex items-center justify-center ${
                  !canStartAnalysis
                    ? 'bg-[#444444] text-[#888888] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#FF9900] to-[#E68A00] text-black hover:from-[#E68A00] hover:to-[#CC7700] hover:shadow-xl hover:shadow-[#FF9900]/30'
                }`}
                whileHover={canStartAnalysis ? { scale: 1.05, y: -2 } : {}}
                whileTap={canStartAnalysis ? { scale: 0.98 } : {}}
              >
                {analyzing ? (
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
                    onClick={() => !analyzing && quickStart(quickDream)}
                    className={`px-4 py-2 text-[#CCCCCC] text-sm cursor-pointer hover:text-[#FF9900] transition-all duration-300 ${
                      analyzing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    whileHover={!analyzing ? { scale: 1.05, y: -2 } : {}}
                    whileTap={!analyzing ? { scale: 0.98 } : {}}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {quickDream}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* 没有选择大师时的提示 */}
            {!selectedMaster && (
              <div className="flex justify-center mt-4">
                <motion.button 
                  onClick={() => navigate('/settings')}
                  className="bg-gradient-to-r from-[#FF9900] to-[#E68A00] text-black px-6 py-3 rounded-xl font-bold text-sm hover:from-[#E68A00] hover:to-[#CC7700] transition-all duration-300 shadow-lg hover:shadow-[#FF9900]/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  前往设置选择大师
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* 解梦动画区域 */}
          <AnimatePresence>
            {showLoadingAnimation && (
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

          {/* 大师分析结果 */}
          {analysis && !showLoadingAnimation && (
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