import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Sparkles } from 'lucide-react';
import { 
  generateBaZiChart, 
  formatBaZiChart, 
  getWuxingColor,
  getGanZhiWuxing,
  getTimeRangeByHour,
  type BaZiChartData,
  type BirthInfo
} from './logic';
import { getAIAnalysisStream } from '../../masters/service';
import { addRecord } from '../../core/history';
import { useMaster, useUI } from '../../core/store';
import { StreamingMarkdown, ErrorToast, useAutoScroll } from '../../components/common';
import { getVideoPath } from '../../utils/resources';
import type { DivinationRecord } from '../../types';

const BaZiPage = () => {
  const [chartData, setChartData] = useState<BaZiChartData | null>(null);
  const [birthInfo, setBirthInfo] = useState<BirthInfo>({
    name: '',
    gender: '男',
    birthDate: new Date(),
    isLunar: false, // 固定为阳历
    birthTime: 12
  });
  const [selectedBirthTime, setSelectedBirthTime] = useState<Date>(() => {
    const defaultDate = new Date();
    defaultDate.setFullYear(1990);
    defaultDate.setMonth(0);
    defaultDate.setDate(1);
    defaultDate.setHours(12);
    defaultDate.setMinutes(0);
    return defaultDate;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiAnalysis, setAIAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [question, setQuestion] = useState<string>(''); // 改为问事，可选
  const [hasPerformedDivination, setHasPerformedDivination] = useState(false);

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

  // 格式化时间为输入控件格式
  const formatDateTimeForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // 处理时间变化
  const handleBirthTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDateTime = e.target.value;
    const selectedDate = new Date(inputDateTime);
    setSelectedBirthTime(selectedDate);
    
    // 更新birthInfo
    setBirthInfo(prev => ({ 
      ...prev, 
      birthDate: selectedDate,
      birthTime: selectedDate.getHours()
    }));
    
    // 清理当前盘局，需要重新起盘
    setChartData(null);
    setHasPerformedDivination(false);
    setAIAnalysis('');
    setAnalysisComplete(false);
  };

  // 视频播放完成的回调
  const handleVideoEnded = () => {
    generateChart();
    setIsGenerating(false);
    setHasPerformedDivination(true);
  };

  // 执行起盘
  const performDivination = async () => {
    if (!birthInfo.name.trim()) {
      setError('请输入您的姓名');
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

  const generateChart = () => {
    try {
      // 使用选择的出生时间
      const finalBirthInfo = {
        ...birthInfo,
        birthDate: selectedBirthTime,
        birthTime: selectedBirthTime.getHours(),
        isLunar: false // 固定为阳历
      };
      
      const chart = generateBaZiChart(finalBirthInfo);
      setChartData(chart);
      setAIAnalysis(''); // 清除之前的分析
      
      console.log('八字推命起盘成功:', {
        finalBirthInfo,
        chart
      });
    } catch (error) {
      console.error('生成八字盘失败:', error);
      setError('起盘失败，请重试');
    }
  };

  // 处理姓名变化
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBirthInfo(prev => ({ ...prev, name: e.target.value }));
  };

  // 处理性别变化
  const handleGenderChange = (gender: '男' | '女') => {
    setBirthInfo(prev => ({ ...prev, gender }));
  };

  // 获取AI分析（流式处理）
  const getAnalysis = async () => {
    if (!chartData) {
      setError('请先起盘');
      return;
    }

    if (!selectedMaster) {
      setError('请先选择大师');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setError(null);
    setAIAnalysis(''); // 清空之前的分析结果

    try {
      // 根据是否有问事内容来调整分析方式
      const hasQuestion = question.trim().length > 0;
      
      // 准备分析数据
      const analysisData = {
        type: 'bazi',
        question: hasQuestion ? question.trim() : '个人命盘综合报告',
        chartData,
        name: chartData.name,
        gender: chartData.gender,
        birthTime: getTimeRangeByHour(chartData.birthTime),
        zodiacAnimal: chartData.zodiacAnimal,
        guardianBuddha: chartData.guardianBuddha,
        constellation: chartData.constellation,
        fourPillars: chartData.fourPillars,
        wuxingAnalysis: chartData.wuxingAnalysis,
        personalityTraits: chartData.personalityTraits,
        timestamp: chartData.timestamp
      };


      const userInfoForAI = { question: hasQuestion ? question.trim() : '' };

      // 使用流式分析，实时更新结果
      const analysisResult = await getAIAnalysisStream(
        analysisData, 
        selectedMaster, 
        'bazi',
        userInfoForAI, // 传递问事信息
        (streamText) => {
          // 流式更新回调
          setAIAnalysis(streamText);
        }
      );

      // 分析完成
      setAnalysisComplete(true);

      // 保存到历史记录
      const record: DivinationRecord = {
        id: chartData.id,
        type: 'bazi',
        timestamp: chartData.timestamp,
        data: analysisData,
        master: selectedMaster ? {
          id: selectedMaster.id,
          name: selectedMaster.name,
          description: selectedMaster.description
        } : null,
        analysis: analysisResult
      };

      addRecord(record);

      console.log('八字推命AI分析完成，结果已保存到历史记录');
      
    } catch (error) {
      console.error('AI分析失败:', error);
      setError(error instanceof Error ? error.message : '分析过程中发生错误');
      setAnalysisComplete(false);
    } finally {
      setIsAnalyzing(false);
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
        <motion.div variants={itemVariants} className="text-center mb-2">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#EEEEEE] via-[#CCCCCC] to-[#FF9900] bg-clip-text text-transparent">八字推命</h1>
          <p className="text-xl text-[#CCCCCC] max-w-3xl mx-auto leading-relaxed">承古圣贤智慧，析命理玄机，知己知命方能改运</p>
        </motion.div>

        <div className="space-y-8">
          {/* 信息输入区域 */}
          <motion.div className="p-8" variants={itemVariants}>
            {/* 姓名输入 - 排在首位，必填 */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-4 w-full max-w-xl">
                <label className="text-lg font-medium text-white whitespace-nowrap w-24 text-right">
                * 姓名
                </label>
                <input
                  type="text"
                  value={birthInfo.name}
                  onChange={handleNameChange}
                  className="w-48 px-6 py-3 bg-[#222222] border-2 border-[#333333] text-white rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-[#888888]"
                  placeholder="请输入您的姓名"
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* 问事输入 - 可选 */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-4 w-full max-w-xl">
                <label className="text-lg font-medium text-white whitespace-nowrap w-24 text-right">
                  问事
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="有具体想问的事情吗？"
                  className="flex-1 px-6 py-3 bg-[#222222] border-2 border-[#333333] text-white rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-[#FF9900] placeholder:text-[#888888]"
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* 性别和出生时间 - 同一行 */}
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* 性别 */}
                  <div className="flex items-center gap-4">
                    <label className="text-lg font-medium text-white whitespace-nowrap w-24 text-right">
                      性别
                    </label>
                    <div className="flex gap-1">
                      {(['男', '女'] as const).map(gender => (
                        <label key={gender} className="flex items-center">
                          <input
                            type="radio"
                            name="gender"
                            value={gender}
                            checked={birthInfo.gender === gender}
                            onChange={() => handleGenderChange(gender)}
                            className="w-4 h-4 text-[#FF9900] border-[#333333] focus:ring-[#FF9900]"
                            disabled={isGenerating}
                          />
                          <span className="ml-2 text-[#CCCCCC] text-lg">{gender}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 出生时间 */}
                  <div className="flex items-center gap-4">
                    <label className="text-lg font-medium text-white whitespace-nowrap w-24 text-right">
                      出生时间
                    </label>
                    <input
                      type="datetime-local"
                      value={formatDateTimeForInput(selectedBirthTime)}
                      onChange={handleBirthTimeChange}
                      className="flex-1 bg-black border border-black rounded-lg px-3 py-2 text-white text-base focus:border-[#FF9900] focus:outline-none [&::-webkit-datetime-edit]:text-white [&::-webkit-datetime-edit-text]:text-white [&::-webkit-datetime-edit-month-field]:text-white [&::-webkit-datetime-edit-day-field]:text-white [&::-webkit-datetime-edit-year-field]:text-white [&::-webkit-datetime-edit-hour-field]:text-white [&::-webkit-datetime-edit-minute-field]:text-white [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert"
                      style={{
                        colorScheme: 'dark',
                        color: 'white !important',
                        WebkitTextFillColor: 'white',
                        minHeight: '36px',
                        height: '36px',
                        lineHeight: '1.4',
                        fontSize: '16px'
                      }}
                      disabled={isGenerating}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 开始起盘按钮 */}
            <div className="flex justify-center">
              <motion.button 
                onClick={performDivination}
                disabled={isGenerating || !birthInfo.name.trim()}
                className={`px-12 py-4 rounded-xl font-bold text-xl transition-all duration-300 shadow-lg flex items-center justify-center ${
                  isGenerating || !birthInfo.name.trim()
                    ? 'bg-[#444444] text-[#888888] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#FF9900] to-[#E68A00] text-black hover:from-[#E68A00] hover:to-[#CC7700] hover:shadow-xl hover:shadow-[#FF9900]/30'
                }`}
                whileHover={!isGenerating && birthInfo.name.trim() ? { scale: 1.05, y: -2 } : {}}
                whileTap={!isGenerating && birthInfo.name.trim() ? { scale: 0.98 } : {}}
              >
                {isGenerating ? (
                  <span className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                    正在起盘...
                  </span>
                ) : (
                  '开始八字推命'
                )}
              </motion.button>
            </div>
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
                  <h3 className="text-2xl font-semibold text-white mb-6">八字推演，命理推测</h3>
                  
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
                          console.log('八字视频加载失败，显示备用动画');
                          const video = e.target as HTMLVideoElement;
                          video.style.display = 'none';
                        }}
                        onCanPlayThrough={() => {
                          console.log('八字视频可以播放');
                        }}
                      >
                        <source src={getVideoPath('bazi.mp4')} type="video/mp4" />
                        {/* 如果视频加载失败，显示备用动画 */}
                        <div className="relative">
                          <motion.div
                            className="w-16 h-16 border-4 border-[#FF9900] border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
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
                            <span className="text-[#FF9900] text-2xl font-bold">命</span>
                          </motion.div>
                        </div>
                      </video>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 八字排盘结果 */}
          {chartData && !isGenerating && hasPerformedDivination && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* 与视频相同尺寸的八字盘显示容器 */}
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
                        <div style={{ color: '#CCCCCC', fontSize: '14px', fontWeight: '500' }}>生肖</div>
                        <div style={{ color: '#FF9900', fontSize: '16px', fontWeight: '700', whiteSpace: 'nowrap' }}>属{chartData.zodiacAnimal}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ color: '#CCCCCC', fontSize: '14px', fontWeight: '500' }}>本命佛</div>
                        <div style={{ color: '#FBBF24', fontSize: '16px', fontWeight: '600', whiteSpace: 'nowrap' }}>{chartData.guardianBuddha}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ color: '#CCCCCC', fontSize: '14px', fontWeight: '500' }}>星座</div>
                        <div style={{ color: '#34D399', fontSize: '16px', fontWeight: '600', whiteSpace: 'nowrap' }}>{chartData.constellation}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ color: '#CCCCCC', fontSize: '14px', fontWeight: '500' }}>时辰</div>
                        <div style={{ color: 'white', fontSize: '16px', fontWeight: '600', whiteSpace: 'nowrap' }}>{getTimeRangeByHour(chartData.birthTime)}</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* 八字盘主体 - 深色卡片 */}
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
                                          {/* 四柱八字 */}
                      <div className="flex-1 overflow-hidden mb-4">
                        <h4 className="text-lg font-medium text-white mb-4 text-center">四柱八字</h4>
                        <div className="grid grid-cols-4 gap-4 mb-6">
                          {[
                            { name: '年柱', pillar: chartData.fourPillars.year },
                            { name: '月柱', pillar: chartData.fourPillars.month },
                            { name: '日柱', pillar: chartData.fourPillars.day },
                            { name: '时柱', pillar: chartData.fourPillars.hour }
                          ].map(({ name, pillar }, index) => {
                            const stemColor = getWuxingColor(getGanZhiWuxing(pillar.stem));
                            const branchColor = getWuxingColor(getGanZhiWuxing(pillar.branch));
                            return (
                              <div key={index} className="text-center">
                                <div className="text-sm text-[#CCCCCC] mb-2">{name}</div>
                                <div className="space-y-2">
                                  <div 
                                    className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all duration-300 hover:scale-105"
                                    style={{ 
                                      backgroundColor: `${stemColor}30`,
                                      border: `2px solid ${stemColor}CC`,
                                      boxShadow: `0 0 8px ${stemColor}60`,
                                      textShadow: `0 0 4px ${stemColor}AA`
                                    }}
                                  >
                                    {pillar.stem}
                                  </div>
                                  <div 
                                    className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all duration-300 hover:scale-105"
                                    style={{ 
                                      backgroundColor: `${branchColor}30`,
                                      border: `2px solid ${branchColor}CC`,
                                      boxShadow: `0 0 8px ${branchColor}60`,
                                      textShadow: `0 0 4px ${branchColor}AA`
                                    }}
                                  >
                                    {pillar.branch}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* 五行分析 */}
                        <h4 className="text-lg font-medium text-white mb-6 text-center">五行分析</h4>
                        <div className="space-y-4">
                          {Object.entries(chartData.wuxingAnalysis).map(([element, count]) => {
                            const color = getWuxingColor(element);
                            const maxCount = Math.max(...Object.values(chartData.wuxingAnalysis));
                            const fillPercentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                            
                            return (
                              <div key={element} className="flex items-center gap-2">
                                {/* 五行艺术字标签 */}
                                <div className="w-8 flex justify-center">
                                  <span 
                                    className="text-2xl font-black tracking-tight"
                                    style={{ 
                                      color: color,
                                      textShadow: `
                                        0 0 8px ${color}80,
                                        0 0 12px ${color}60,
                                        1px 1px 2px rgba(0,0,0,0.8)
                                      `,
                                      filter: `drop-shadow(0 0 4px ${color}60)`
                                    }}
                                  >
                                    {element}
                                  </span>
                                </div>
                                
                                {/* 能量条容器 */}
                                <div className="flex-1 relative">
                                  {/* 背景轨道 */}
                                  <div 
                                    className="h-6 rounded border"
                                    style={{
                                      backgroundColor: '#0f0f0f',
                                      borderColor: '#333333'
                                    }}
                                  />
                                  
                                  {/* 能量填充条 */}
                                  <div 
                                    className="absolute top-0 left-0 h-6 rounded transition-all duration-1200 ease-out overflow-hidden"
                                    style={{
                                      width: `${fillPercentage}%`,
                                      background: `linear-gradient(90deg, ${color}FF, ${color}CC, ${color}AA)`,
                                      boxShadow: `
                                        0 0 8px ${color}80,
                                        inset 0 2px 4px rgba(255,255,255,0.1),
                                        inset 0 -2px 4px rgba(0,0,0,0.2)
                                      `,
                                      border: `1px solid ${color}AA`
                                    }}
                                  >
                                    {/* 能量条内部闪光效果 */}
                                    <div 
                                      className="absolute inset-0 opacity-30"
                                      style={{
                                        background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
                                        animation: count > 0 ? 'shimmer 2s infinite' : 'none'
                                      }}
                                    />
                                  </div>
                                  
                                  {/* 数量和状态标签 */}
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                                    <span className="text-white font-bold text-sm">{count}</span>
                                  </div>
                                </div>
                                
                                {/* 状态指示 */}
                                <div className="w-12 text-right">
                                  <span 
                                    className="text-xs font-medium px-2 py-1 rounded-full"
                                    style={{
                                      backgroundColor: count > 2 ? '#ff6b6b20' : count > 1 ? '#ffd93d20' : count === 1 ? '#4ecdc420' : '#66666620',
                                      color: count > 2 ? '#FF6B6B' : count > 1 ? '#FFD93D' : count === 1 ? '#4ECDC4' : '#666666',
                                      border: `1px solid ${count > 2 ? '#FF6B6B' : count > 1 ? '#FFD93D' : count === 1 ? '#4ECDC4' : '#666666'}40`
                                    }}
                                  >
                                    {count > 2 ? '旺' : count > 1 ? '平' : count === 1 ? '弱' : '缺'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
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
                            {analysisComplete ? `${selectedMaster?.name}解盘完成` : (question.trim() ? '问事解析' : '命盘解读')}
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

export default BaZiPage; 