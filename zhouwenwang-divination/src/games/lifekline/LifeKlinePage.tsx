import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, User, Calendar, RefreshCcw, Sparkles } from 'lucide-react';
import { KlineChart } from './components/KlineChart';
import { generateLifeKlineData, interpolateKlineData } from './logic';
import type { KlineData } from './logic';
import { getAIAnalysis } from '../../masters/service';
import { addRecord } from '../../core/history';
import { useMaster, useUI } from '../../core/store';
import { ErrorToast } from '../../components/common';
import LifeKlineMarkdown from './components/LifeKlineMarkdown';
import type { DivinationRecord } from '../../types';

const LifeKlinePage: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [gender, setGender] = useState<'男' | '女'>('男');
  const [birthYear, setBirthYear] = useState<number>(new Date().getFullYear() - 25);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAIAnalysis] = useState<string>('');
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [klineData, setKlineData] = useState<KlineData[]>([]);
  const [stats, setStats] = useState({
    bestYear: 0,
    worstYear: 0,
    averageScore: 0,
    volatility: 0
  });
  const [hasPerformedAnalysis, setHasPerformedAnalysis] = useState(false);

  const { selectedMaster } = useMaster();
  const { error, setError } = useUI();

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

  // 过滤掉不需要显示的内容（JSON数据块和说明文字），保留Markdown格式
  const filterDisplayText = (text: string): string => {
    let filtered = text;
    
    // 1. 移除所有JSON代码块（```json ... ```）
    filtered = filtered.replace(/```json[\s\S]*?```/g, '');
    
    // 2. 移除说明文字
    filtered = filtered.replace(/以下乃汝[^：]*百年运势[^：]*关键节点[^：]*：[\s\S]*?算法参详[：：]?/g, '');
    
    // 3. 移除JSON对象（{...}）
    filtered = filtered.replace(/\{[^{}]*"years"[\s\S]*?\}/g, '');
    
    // 4. 清理多余的空行（保留最多两个连续换行）
    filtered = filtered.replace(/\n{3,}/g, '\n\n');
    
    return filtered.trim();
  };

  // 解析AI返回的JSON数据
  const parseAIResponse = (text: string): { years: any[], summary: any } | null => {
    try {
      // 尝试提取JSON部分
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        return parsed;
      }
      return null;
    } catch (e) {
      console.error('解析AI返回数据失败:', e);
      return null;
    }
  };

  // 执行分析
  const performAnalysis = async () => {
    if (!name.trim()) {
      setError('请输入您的姓名');
      return;
    }

    if (!selectedMaster) {
      setError('请先选择一位大师');
      return;
    }

    setIsAnalyzing(true);
    setAIAnalysis('');
    setAnalysisComplete(false);
    setKlineData([]);
    setHasPerformedAnalysis(false);
    setError(null);

    try {
      // 准备分析数据
      const analysisData = {
        type: 'lifekline',
        name: name.trim(),
        gender,
        birthYear,
        timestamp: Date.now()
      };

      // 使用非流式分析，一次性返回结果（更快）
      const analysisResult = await getAIAnalysis(
        analysisData,
        selectedMaster,
        'lifekline',
        null
      );
      
      // 接口返回后，过滤并一次性设置显示内容
      // 确保保留Markdown格式，只移除不需要的JSON和说明文字
      const filteredAnalysis = filterDisplayText(analysisResult);
      // 确保有内容才设置
      if (filteredAnalysis && filteredAnalysis.trim()) {
        setAIAnalysis(filteredAnalysis);
      } else {
        // 如果过滤后没有内容，使用原始内容（可能AI只返回了JSON）
        setAIAnalysis(analysisResult.replace(/```json[\s\S]*?```/g, '').trim());
      }

      // 分析完成，尝试解析JSON数据
      const parsedData = parseAIResponse(analysisResult);
      
      if (parsedData && parsedData.years && Array.isArray(parsedData.years)) {
        // AI返回的是稀疏数据点（每5年一个），需要插值生成完整的100年数据
        const sparseData = parsedData.years
          .map((item: any) => ({
            age: item.age || 0,
            year: item.year || 0,
            yearGanZhi: item.yearGanZhi || '',
            daYun: item.daYun || '',
            score: item.score || 50,
            summary: item.summary || '平'
          }))
          .sort((a, b) => a.age - b.age); // 按年龄排序，确保插值正确
        
        // 通过插值生成完整的100年K线数据
        const aiKlineData = interpolateKlineData(sparseData, birthYear);

        setKlineData(aiKlineData);

        // 计算统计数据
        const scores = aiKlineData.map(d => d.score);
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        const sum = scores.reduce((a, b) => a + b, 0);
        const avg = sum / scores.length;
        const variance = scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / scores.length;

        setStats({
          bestYear: aiKlineData.find(d => d.score === maxScore)?.year || 0,
          worstYear: aiKlineData.find(d => d.score === minScore)?.year || 0,
          averageScore: Math.round(avg),
          volatility: Math.round(Math.sqrt(variance))
        });
      } else {
        // 如果AI没有返回有效JSON，使用模拟数据
        console.warn('AI未返回有效JSON数据，使用模拟数据');
        const simulatedData = generateLifeKlineData(birthYear, gender);
        setKlineData(simulatedData);
        
        const scores = simulatedData.map(d => d.score);
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        const sum = scores.reduce((a, b) => a + b, 0);
        const avg = sum / scores.length;
        const variance = scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / scores.length;

        setStats({
          bestYear: simulatedData.find(d => d.score === maxScore)?.year || 0,
          worstYear: simulatedData.find(d => d.score === minScore)?.year || 0,
          averageScore: Math.round(avg),
          volatility: Math.round(Math.sqrt(variance))
        });
      }

      setAnalysisComplete(true);
      setHasPerformedAnalysis(true);

      // 保存到历史记录
      const record: DivinationRecord = {
        id: `lifekline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'lifekline',
        timestamp: Date.now(),
        data: analysisData,
        master: selectedMaster ? {
          id: selectedMaster.id,
          name: selectedMaster.name,
          description: selectedMaster.description
        } : null,
        analysis: analysisResult
      };

      addRecord(record);

      console.log('人生K线AI分析完成，结果已保存到历史记录');
      
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#EEEEEE] via-[#CCCCCC] to-[#22C55E] bg-clip-text text-transparent">
            人生K线
          </h1>
          <p className="text-xl text-[#CCCCCC] max-w-3xl mx-auto leading-relaxed">
            基于AI大模型驱动，量化人生百岁运势起伏，预判人生高低谷
          </p>
        </motion.div>

        <div className="space-y-8">
          {/* 信息输入区域 */}
          <motion.div className="p-8" variants={itemVariants}>
            {/* 姓名输入 */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-4 w-full max-w-xl">
                <label className="text-lg font-medium text-white whitespace-nowrap w-24 text-right">
                  * 姓名
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-48 px-6 py-3 bg-[#222222] border-2 border-[#333333] text-white rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E] placeholder:text-[#888888]"
                  placeholder="请输入您的姓名"
                  disabled={isAnalyzing}
                />
              </div>
            </div>

            {/* 性别和出生年份 - 同一行 */}
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* 性别 */}
                  <div className="flex items-center gap-4">
                    <label className="text-lg font-medium text-white whitespace-nowrap w-24 text-right">
                      性别
                    </label>
                    <div className="flex gap-1">
                      {(['男', '女'] as const).map(g => (
                        <label key={g} className="flex items-center">
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={gender === g}
                            onChange={() => setGender(g)}
                            className="w-4 h-4 text-[#22C55E] border-[#333333] focus:ring-[#22C55E]"
                            disabled={isAnalyzing}
                          />
                          <span className="ml-2 text-[#CCCCCC] text-lg">{g}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 出生年份 */}
                  <div className="flex items-center gap-4">
                    <label className="text-lg font-medium text-white whitespace-nowrap w-24 text-right">
                      出生年份
                    </label>
                    <select
                      value={birthYear}
                      onChange={(e) => setBirthYear(Number(e.target.value))}
                      className="flex-1 px-6 py-3 bg-[#222222] border-2 border-[#333333] text-white rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E]"
                      disabled={isAnalyzing}
                    >
                      {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}年</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 开始分析按钮 */}
            <div className="flex justify-center">
              <motion.button
                onClick={performAnalysis}
                disabled={isAnalyzing || !name.trim()}
                className={`px-12 py-4 rounded-xl font-bold text-xl transition-all duration-300 shadow-lg flex items-center justify-center ${
                  isAnalyzing || !name.trim()
                    ? 'bg-[#444444] text-[#888888] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white hover:from-[#16A34A] hover:to-[#15803D] hover:shadow-xl hover:shadow-[#22C55E]/30'
                }`}
                whileHover={!isAnalyzing && name.trim() ? { scale: 1.05, y: -2 } : {}}
                whileTap={!isAnalyzing && name.trim() ? { scale: 0.98 } : {}}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                    正在分析...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    开始分析
                  </span>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* AI分析结果 - 只在分析完成后显示 */}
          {aiAnalysis && analysisComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1a1a1a] border border-[#333333] rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-5 h-5 text-[#22C55E]" />
                <h3 className="text-xl font-bold text-white">AI命理分析</h3>
              </div>
              <div className="text-[#CCCCCC] leading-relaxed markdown-wrapper">
                <LifeKlineMarkdown content={aiAnalysis || ''} />
              </div>
            </motion.div>
          )}

          {/* K线图表 */}
          {klineData.length > 0 && hasPerformedAnalysis && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <KlineChart data={klineData} height={500} />
              
              {/* 统计摘要 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-[#1a1a1a] border border-[#333333] p-4 rounded-xl flex items-center space-x-4">
                  <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-[#888888] mb-1">平均运势分</p>
                    <p className="text-xl font-bold text-white">{stats.averageScore}</p>
                  </div>
                </div>
                
                <div className="bg-[#1a1a1a] border border-[#333333] p-4 rounded-xl flex items-center space-x-4">
                  <div className="p-3 bg-green-500/20 text-green-400 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-[#888888] mb-1">人生巅峰</p>
                    <p className="text-xl font-bold text-white">{stats.bestYear}年</p>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] border border-[#333333] p-4 rounded-xl flex items-center space-x-4">
                  <div className="p-3 bg-red-500/20 text-red-400 rounded-lg">
                    <TrendingUp className="w-5 h-5 transform rotate-180" />
                  </div>
                  <div>
                    <p className="text-xs text-[#888888] mb-1">人生低谷</p>
                    <p className="text-xl font-bold text-white">{stats.worstYear}年</p>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] border border-[#333333] p-4 rounded-xl flex items-center space-x-4">
                  <div className="p-3 bg-purple-500/20 text-purple-400 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-[#888888] mb-1">波折程度</p>
                    <p className="text-xl font-bold text-white">
                      {stats.volatility > 10 ? '大起大落' : stats.volatility > 5 ? '平稳上升' : '四平八稳'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 错误提示 */}
          <ErrorToast 
            isVisible={!!error}
            message={error || ''}
            onClose={() => setError(null)}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default LifeKlinePage;
