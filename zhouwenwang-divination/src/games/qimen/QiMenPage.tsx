import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Sparkles, Clock } from 'lucide-react';
import { 
  generateQiMenChart, 
  formatDateTime, 
  getPalaceColor, 
  isGoodDoor, 
  isGoodStar,
  type QiMenChartData 
} from './logic';
import { getAIAnalysisStream } from '../../masters/service';
import { addRecord } from '../../core/history';
import { useMaster, useUI } from '../../core/store';
import { StreamingMarkdown, ErrorToast, useAutoScroll } from '../../components/common';
import { getRandomQuestions } from '../../core/quickQuestions';
import { getVideoPath } from '../../utils/resources';
import type { DivinationRecord } from '../../types';

// 时间处理工具函数
const getBeijingTime = () => {
  // 创建当前时间的 Date 对象，并转换为北京时间
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const beijingTime = new Date(utc + (8 * 3600000)); // UTC+8
  return beijingTime;
};

const formatDateTimeForInput = (date: Date) => {
  // 直接使用传入的时间进行格式化，假设它已经是北京时间
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const QiMenPage = () => {
  const [chartData, setChartData] = useState<QiMenChartData | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date>(getBeijingTime());
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiAnalysis, setAIAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [question, setQuestion] = useState<string>('');
  const [hasPerformedDivination, setHasPerformedDivination] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);

  const { selectedMaster } = useMaster();
  const { error, setError } = useUI();
  const navigate = useNavigate();
  
  // 使用通用的自动滚动Hook
  const { contentRef: analysisRef } = useAutoScroll({
    isAnalyzing: isAnalyzing,
    content: aiAnalysis
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
    setQuickQuestions(getRandomQuestions('qimen', 3));
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

  // 初始化时间，但不自动生成盘
  useEffect(() => {
    // 确保使用北京时间进行初始化
    setSelectedTime(getBeijingTime());
  }, []);

  // 快速开始占卜
  const quickStart = async (selectedQuestion: string) => {
    setQuestion(selectedQuestion);
    
    // 稍微延迟一下让用户看到问题填充，然后开始占卜
    setTimeout(() => {
      performDivinationWithQuestion(selectedQuestion);
    }, 200);
  };

  // 视频播放完成的回调
  const handleVideoEnded = () => {
    generateChart();
    setIsGenerating(false);
    setHasPerformedDivination(true);
  };

  // 执行起盘（带问题参数）
  const performDivinationWithQuestion = async (questionText: string) => {
    if (!questionText.trim()) {
      setError('请输入您要占卜的问题');
      return;
    }

    setIsGenerating(true);
    setChartData(null);
    setAIAnalysis('');
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    setHasPerformedDivination(false);
    
    // 备用超时机制，防止视频加载失败（最长等待8秒）
    setTimeout(() => {
      if (isGenerating) {
        console.log('视频超时，使用备用机制完成起盘');
        handleVideoEnded();
      }
    }, 8000);
  };

  // 执行起盘
  const performDivination = async () => {
    await performDivinationWithQuestion(question);
  };

  const generateChart = () => {
    try {
      const targetTime = useCurrentTime ? getBeijingTime() : selectedTime;
      const chart = generateQiMenChart(targetTime);
      setChartData(chart);
      setAIAnalysis(''); // 清除之前的分析
      

      
      console.log('奇门遁甲起盘成功:', {
        targetTime: targetTime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        beijingTime: targetTime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        useCurrentTime,
        chart
      });
    } catch (error) {
      console.error('生成奇门盘失败:', error);
      setError('起盘失败，请重试');
    }
  };

  // 处理时间变化
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 将 datetime-local 的值转换为北京时间
    const inputDateTime = e.target.value;
    const localDate = new Date(inputDateTime);
    // 假设用户输入的是北京时间，不需要时区转换
    setSelectedTime(localDate);
    setUseCurrentTime(false);
    // 清理当前盘局，需要重新起盘
    setChartData(null);
    setHasPerformedDivination(false);
    setAIAnalysis('');
    setAnalysisComplete(false);
  };

  // 处理使用当前时间的变化
  const handleUseCurrentTimeChange = (useNow: boolean) => {
    setUseCurrentTime(useNow);
    if (useNow) {
      setSelectedTime(getBeijingTime());
    }
    // 清理当前盘局，需要重新起盘
    setChartData(null);
    setHasPerformedDivination(false);
    setAIAnalysis('');
    setAnalysisComplete(false);
  };

  // 获取AI分析（流式处理）
  const getAnalysis = async () => {
    if (!chartData) {
      setError('请先进行起盘');
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

    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setError(null);
    setAIAnalysis(''); // 清空之前的分析结果

    try {
      // 准备分析数据
      const analysisData = {
        type: 'qimen',
        question: question.trim(),
        chart: chartData,
        escapeType: chartData.escapeType,
        bureauNumber: chartData.bureauNumber,
        dutyChief: chartData.dutyChief,
        dutyDoor: chartData.dutyDoor,
        keyPoints: chartData.keyPoints,
        timestamp: chartData.timestamp
      };

      console.log('准备发送给AI的奇门数据:', analysisData);

      // 使用流式分析，实时更新结果
      const analysisResult = await getAIAnalysisStream(
        analysisData, 
        selectedMaster, 
        'qimen',
        undefined,
        (streamText) => {
          // 流式更新回调
          setAIAnalysis(streamText);
        }
      );

      // 分析完成
      setAnalysisComplete(true);

      // 保存到历史记录
      const record: DivinationRecord = {
        id: `qimen-${Date.now()}`,
        type: 'qimen',
        timestamp: Date.now(),
        data: analysisData,
        master: {
          id: selectedMaster.id,
          name: selectedMaster.name,
          description: selectedMaster.description
        },
        analysis: analysisResult
      };
      await addRecord(record);

      console.log('奇门遁甲AI分析完成，结果已保存到历史记录');

    } catch (error) {
      console.error('AI分析失败:', error);
      setError(error instanceof Error ? error.message : '分析过程中发生错误');
      setAnalysisComplete(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 获取五行颜色
  const getWuxingColor = (wuxing: string) => {
    const colorMap: { [key: string]: string } = {
      '木': '#22C55E', // 绿色
      '火': '#EF4444', // 红色  
      '土': '#8B4513', // 棕色
      '金': '#FFD700', // 金色
      '水': '#3B82F6'  // 蓝色
    };
    return colorMap[wuxing] || '#CCCCCC';
  };

  // 获取宫位的五行属性
  const getPalaceWuxing = (position: number) => {
    const wuxingMap: { [key: number]: string } = {
      1: '水', 2: '土', 3: '木', 4: '木',
      5: '土', 6: '金', 7: '金', 8: '土', 9: '火'
    };
    return wuxingMap[position] || '土';
  };

  // 获取宫位名称（去掉方位信息）
  const getPalaceName = (position: number) => {
    const nameMap: { [key: number]: string } = {
      1: '坎', 2: '坤', 3: '震', 4: '巽',
      5: '中', 6: '乾', 7: '兑', 8: '艮', 9: '离'
    };
    return nameMap[position] || '中';
  };

  // 渲染九宫格
  const renderNinePalaces = () => {
    if (!chartData) return null;

    // 按照标准九宫格布局排列
    const layout = [
      [4, 9, 2],
      [3, 5, 7],
      [8, 1, 6]
    ];

    return (
      <div className="grid grid-cols-3 gap-0 max-w-2xl mx-auto border-2 border-white">
          {layout.map((row, rowIndex) =>
            row.map((position, colIndex) => {
            const palace = chartData.palaces.find(p => p.position === position);
            if (!palace) return null;

            const hasGoodDoor = isGoodDoor(palace.door);
            const hasGoodStar = isGoodStar(palace.star);
            const isExcellentPosition = hasGoodDoor && hasGoodStar;
            const isGoodPosition = hasGoodDoor || hasGoodStar;
            
            const palaceName = getPalaceName(position);
            const wuxing = getPalaceWuxing(position);
            const wuxingColor = getWuxingColor(wuxing);

            return (
              <motion.div
                key={position}
                className={`
                  aspect-square p-2 border border-white transition-all duration-300 relative overflow-hidden
                  ${palace.isCenter 
                    ? 'bg-gradient-to-br from-[#FF9900]/10 to-[#FF9900]/3' 
                    : isExcellentPosition
                      ? 'bg-gradient-to-br from-green-800/30 to-green-900/10'
                      : isGoodPosition
                        ? 'bg-gradient-to-br from-green-900/20 to-green-950/10'
                        : 'bg-gradient-to-br from-[#0a0a0a] to-[#151515]'
                  }
                `}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ 
                  position: 'relative',
                  transition: `all 0.3s ease`,
                  transitionDelay: `${(rowIndex * 3 + colIndex) * 0.05}s` 
                }}
              >
                <div 
                  className="flex flex-col justify-between"
                  style={{ height: '90%', padding: '8px' }}
                >
                  
                  {/* 顶部：八神（小字，居中） */}
                  <div className="text-center" style={{ minHeight: '20px' }}>
                    <span 
                      style={{
                        fontSize: '14px',
                        color: '#CCCCCC',
                        fontWeight: '500'
                      }}
                    >
                      {palace.deity}
                    </span>
                  </div>

                  {/* 主体布局：左侧信息 + 右侧宫位名和五行 */}
                  <div 
                    className="flex items-center justify-between"
                    style={{ paddingLeft: '4px', paddingRight: '16px' }}
                  >
                    
                    {/* 左侧：垂直排列信息 */}
                    <div 
                      className="flex flex-col items-start justify-center"
                      style={{ gap: '8px', minWidth: '80px', maxWidth: '80px' }}
                    >
                      {/* 天盘天干（中等大小，突出） */}
                      <div 
                        style={{
                          fontSize: '22px',
                          fontWeight: '700',
                          color: 'white',
                          letterSpacing: '1px',
                          lineHeight: '1'
                        }}
                      >
                        {palace.heavenStem}
                      </div>
                      
                      {/* 九星（中字，颜色区分） */}
                      <div 
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: isGoodStar(palace.star) ? '#FCD34D' : '#CCCCCC',
                          lineHeight: '1.1',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {palace.star}
                      </div>
                      
                      {/* 八门（中字，颜色区分） */}
                      <div 
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: isGoodDoor(palace.door) ? '#F87171' : '#CCCCCC',
                          lineHeight: '1.1',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {palace.door}
                      </div>
                    </div>

                    {/* 右侧：宫位名 + 五行 */}
                    <div 
                      className="flex flex-col justify-center"
                      style={{ marginLeft: '8px', flex: '1', alignItems: 'center', paddingRight: '20px', marginTop: '12px' }}
                    >
                      {/* 宫位名称（特大字，艺术效果） */}
                      <div 
                        style={{ 
                          fontSize: '48px',
                          fontWeight: '900',
                          color: wuxingColor,
                          fontFamily: '"Noto Serif SC", "STKaiti", "STSong", serif',
                          textShadow: `0 0 15px ${wuxingColor}AA, 0 0 25px ${wuxingColor}60`,
                          letterSpacing: '2px',
                          lineHeight: '1',
                          marginBottom: '8px',
                          textAlign: 'center'
                        }}
                      >
                        {palaceName}
                      </div>
                      
                      {/* 五行标识（小而精致） */}
                      <div 
                        style={{ 
                          fontSize: '11px',
                          fontWeight: '700',
                          color: wuxingColor,
                          backgroundColor: `${wuxingColor}30`,
                          border: `2px solid ${wuxingColor}CC`,
                          borderRadius: '6px',
                          padding: '3px 8px',
                          boxShadow: `0 0 8px ${wuxingColor}60`
                        }}
                      >
                        {wuxing}
                      </div>
                    </div>

                  </div>

                  {/* 底部：地盘天干 */}
                  <div className="text-left">
                    <span 
                      style={{
                        fontSize: '14px',
                        color: '#DDDDDD',
                        fontWeight: '500'
                      }}
                    >
                      {palace.earthStem}
                    </span>
                  </div>
                </div>


              </motion.div>
            );
          })
        )}
      </div>
    );
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
            奇门遁甲
          </h1>
          <p className="text-xl text-[#CCCCCC] max-w-3xl mx-auto leading-relaxed">
            古代最高层次的预测学，以时间、空间、人和为三要素，探寻吉凶祸福的运行规律
          </p>
        </motion.div>

        <div className="space-y-8">
          {/* 问题输入区域 */}
          <motion.div 
            className="p-8"
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
                  disabled={isGenerating}
                />
                <motion.button 
                  onClick={performDivination}
                  disabled={isGenerating || !question.trim()}
                  className={`px-8 py-3 h-[46px] rounded-xl font-bold text-lg transition-all duration-300 shadow-lg whitespace-nowrap flex items-center justify-center ${
                    isGenerating || !question.trim()
                      ? 'bg-[#444444] text-[#888888] cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#FF9900] to-[#E68A00] text-black hover:from-[#E68A00] hover:to-[#CC7700] hover:shadow-xl hover:shadow-[#FF9900]/30'
                  }`}
                  whileHover={!isGenerating && question.trim() ? { scale: 1.05, y: -2 } : {}}
                  whileTap={!isGenerating && question.trim() ? { scale: 0.98 } : {}}
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                      正在起盘...
                    </span>
                  ) : (
                    '开始起盘'
                  )}
                </motion.button>
              </div>

              {/* 快速开始水平布局 - 居中 */}
              <div className="flex justify-center items-center gap-3 mb-8">
                <h4 className="text-lg font-medium text-white whitespace-nowrap">快速开始：</h4>
                <div className="flex flex-wrap gap-4">
                  {quickQuestions.map((quickQuestion, index) => (
                    <motion.span
                      key={index}
                      onClick={() => !isGenerating && quickStart(quickQuestion)}
                      className={`px-4 py-2 text-[#CCCCCC] text-sm cursor-pointer hover:text-[#FF9900] transition-all duration-300 ${
                        isGenerating ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      whileHover={!isGenerating ? { scale: 1.05, y: -2 } : {}}
                      whileTap={!isGenerating ? { scale: 0.98 } : {}}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {quickQuestion}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* 时间选择区域 - 简洁版本 */}
              <div className="flex justify-center items-center gap-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-[#FF9900]" />
                  <h4 className="text-lg font-medium text-white whitespace-nowrap">起盘时间：</h4>
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={useCurrentTime}
                      onChange={() => handleUseCurrentTimeChange(true)}
                      className="text-[#FF9900] focus:ring-[#FF9900]"
                      disabled={isGenerating}
                    />
                    <span className="text-[#CCCCCC]">当前时间</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!useCurrentTime}
                      onChange={() => handleUseCurrentTimeChange(false)}
                      className="text-[#FF9900] focus:ring-[#FF9900]"
                      disabled={isGenerating}
                    />
                    <span className="text-[#CCCCCC]">选择时间</span>
                  </label>
                  
                  {!useCurrentTime && (
                    <motion.input
                      type="datetime-local"
                      value={formatDateTimeForInput(selectedTime)}
                      onChange={handleTimeChange}
                      className="bg-black border border-black rounded-lg px-3 py-2 text-white text-base focus:border-[#FF9900] focus:outline-none [&::-webkit-datetime-edit]:text-white [&::-webkit-datetime-edit-text]:text-white [&::-webkit-datetime-edit-month-field]:text-white [&::-webkit-datetime-edit-day-field]:text-white [&::-webkit-datetime-edit-year-field]:text-white [&::-webkit-datetime-edit-hour-field]:text-white [&::-webkit-datetime-edit-minute-field]:text-white [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert"
                      style={{
                        colorScheme: 'dark',
                        color: 'white !important',
                        WebkitTextFillColor: 'white',
                        minHeight: '36px',
                        height: '36px',
                        lineHeight: '1.4',
                        fontSize: '16px',
                        marginLeft: '5px'
                      }}
                      disabled={isGenerating}
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* 起盘动画区域 */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-white mb-6">奇门起盘，时空定局</h3>
                  
                  {/* 起盘动画区域 */}
                  <div className="flex justify-center">
                    <div className="bg-black flex items-center justify-center relative overflow-hidden rounded-xl" style={{ width: '560px', height: '315px' }}>
                      {/* 实际使用MP4视频 */}
                      <video 
                        autoPlay 
                        muted 
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover rounded-xl"
                        style={{ width: '560px', height: '315px' }}
                        onEnded={handleVideoEnded}
                        onError={(e) => {
                          console.log('奇门视频加载失败，显示备用动画');
                          const video = e.target as HTMLVideoElement;
                          video.style.display = 'none';
                        }}
                        onCanPlayThrough={() => {
                          console.log('奇门视频可以播放');
                        }}
                      >
                        <source src={getVideoPath("qimen.mp4")} type="video/mp4" />
                        {/* 如果视频加载失败，显示备用动画 */}
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
                            <span className="text-[#FF9900] text-2xl font-bold">遁</span>
                          </motion.div>
                        </div>
                      </video>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 奇门盘结果显示 */}
          {chartData && !isGenerating && hasPerformedDivination && (
            <motion.div 
              variants={itemVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* 与视频相同尺寸的奇门盘显示容器 */}
              <div className="flex justify-center">
                <div style={{ width: '560px', minHeight: '315px' }}>
                  {/* 基本信息条 */}
                  <motion.div 
                    style={{
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      padding: '20px 24px',
                      borderRadius: '12px 12px 0 0'
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr 1fr',
                      gap: '32px',
                      textAlign: 'center'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ color: '#CCCCCC', fontSize: '14px', fontWeight: '500' }}>时间</div>
                        <div style={{ color: 'white', fontSize: '16px', fontWeight: '600', whiteSpace: 'nowrap' }}>{formatDateTime(chartData)}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ color: '#CCCCCC', fontSize: '14px', fontWeight: '500' }}>遁甲</div>
                        <div style={{ color: '#FF9900', fontSize: '16px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                          {chartData.escapeType === 'yang' ? '阳' : '阴'}遁{chartData.bureauNumber}局
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ color: '#CCCCCC', fontSize: '14px', fontWeight: '500' }}>值符</div>
                        <div style={{ color: '#FBBF24', fontSize: '16px', fontWeight: '600', whiteSpace: 'nowrap' }}>{chartData.dutyChief}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ color: '#CCCCCC', fontSize: '14px', fontWeight: '500' }}>值使</div>
                        <div style={{ color: '#34D399', fontSize: '16px', fontWeight: '600', whiteSpace: 'nowrap' }}>{chartData.dutyDoor}</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* 奇门盘主体 - 深色卡片 */}
                  <motion.div 
                    className="bg-[#1a1a1a] border border-[#333] p-6 flex flex-col"
                    style={{ 
                      minHeight: '400px',
                      borderRadius: '0 0 16px 16px',
                      overflow: 'hidden'
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* 九宫图 */}
                    <div className="flex-1 overflow-hidden mb-4">
                      <h4 className="text-lg font-medium text-white mb-4 text-center">九宫布局</h4>
                      <div className="flex justify-center">
                        {renderNinePalaces()}
                      </div>
                    </div>

                    {/* 大师分析按钮 - 底部固定 */}
                    <div style={{ margin: '15px' }}>
                      <motion.button 
                        onClick={getAnalysis}
                        disabled={isAnalyzing || !selectedMaster || analysisComplete}
                        className={`w-full px-4 py-3 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg flex items-center justify-center ${
                          isAnalyzing || !selectedMaster || analysisComplete
                            ? 'bg-[#444444] cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#FF9900] to-[#E68A00] hover:from-[#E68A00] hover:to-[#CC7700] hover:shadow-xl hover:shadow-[#FF9900]/30'
                        }`}
                        style={{
                          color: isAnalyzing || !selectedMaster || analysisComplete ? '#888888' : '#000000'
                        }}
                        whileHover={!isAnalyzing && selectedMaster && !analysisComplete ? { scale: 1.02 } : {}}
                        whileTap={!isAnalyzing && selectedMaster && !analysisComplete ? { scale: 0.98 } : {}}
                      >
                        {isAnalyzing ? (
                          <span 
                            className="flex items-center justify-center gap-3"
                            style={{ color: '#888888' }}
                          >
                            <div 
                              className="animate-spin rounded-full h-4 w-4 border-b-2"
                              style={{ borderColor: '#888888' }}
                            ></div>
                            <span style={{ color: '#888888' }}>
                              {aiAnalysis ? `${selectedMaster?.name}正在分析...` : `${selectedMaster?.name}解盘中...`}
                            </span>
                          </span>
                        ) : (
                          <span style={{ color: isAnalyzing || !selectedMaster || analysisComplete ? '#888888' : '#000000' }}>
                            {analysisComplete ? `${selectedMaster?.name}解盘完成` : '大师解盘'}
                          </span>
                        )}
                      </motion.button>
                      
                      {!selectedMaster && (
                        <motion.button 
                          onClick={() => navigate('/settings')}
                          className="w-full mt-2 bg-gradient-to-r from-[#FF9900] to-[#E68A00] text-black px-4 py-3 rounded-xl font-bold text-sm hover:from-[#E68A00] hover:to-[#CC7700] transition-all duration-300 shadow-lg hover:shadow-[#FF9900]/30 flex items-center justify-center"
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
          {aiAnalysis && (
            <motion.div 
              ref={analysisRef}
              className="p-4"
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
                  content={aiAnalysis}
                  showCursor={isAnalyzing && !analysisComplete}
                  isStreaming={isAnalyzing}
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

export default QiMenPage;