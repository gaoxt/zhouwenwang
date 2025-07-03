/**
 * 主页组件
 * 展示欢迎信息、占卜游戏卡片和AI大师介绍
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI, useMaster } from '../core/store';
import { motion } from 'framer-motion';
import { Star, Sparkles, Brain, Eye, Crown, Lightbulb, Compass, BookOpen, Hand, Music, MessageCircle, Smile, Shield } from 'lucide-react';
import { getAllGames } from '../games';
import { fetchMasters, getDefaultMaster } from '../masters/service';
import type { Master } from '../types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { clearError } = useUI();
  const { selectedMaster, setSelectedMaster, availableMasters, setAvailableMasters } = useMaster();
  const games = getAllGames();
  const [loading, setLoading] = useState(true);

  // 图标映射函数
  const getIconComponent = (iconName?: string) => {
    const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
      Crown,
      Lightbulb,
      Eye,
      Compass,
      BookOpen,
      Hand,
      Music,
      MessageCircle,
      Smile,
    };
    
    return iconName ? iconMap[iconName] : null;
  };

  useEffect(() => {
    const loadMasters = async () => {
      try {
        // 如果全局状态中已经有大师数据，则直接使用
        if (availableMasters.length > 0) {
          setLoading(false);
          return;
        }

        const mastersData = await fetchMasters();
        setAvailableMasters(mastersData);
        
        // 如果没有选中的大师，设置默认大师
        if (!selectedMaster && mastersData.length > 0) {
          const defaultMaster = getDefaultMaster(mastersData);
          if (defaultMaster) {
            console.log('首页设置默认大师:', defaultMaster);
            setSelectedMaster(defaultMaster);
          }
        }
      } catch (error) {
        console.error('加载大师数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMasters();
  }, [availableMasters, selectedMaster, setAvailableMasters, setSelectedMaster]);

  const handleGameClick = (path: string) => {
    clearError(); // 导航到游戏页面时清除错误
    navigate(path);
  };

  const handleMasterSelect = (master: Master) => {
    console.log('首页选择大师:', master);
    setSelectedMaster(master);
  };

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

  const cardHoverVariants = {
    hover: {
      scale: 1.02,
      y: -5,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-black text-white flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex-1 py-12">
        {/* 欢迎区域 */}
        <motion.div 
          className="text-center"
          variants={itemVariants}
        >
          <motion.div
            className="inline-flex items-center gap-3 mb-6"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-[#EEEEEE] via-[#CCCCCC] to-[#FF9900] bg-clip-text text-transparent">
              周文王在线算命
            </h1>
          </motion.div>
          
          <motion.p 
            className="text-xl md:text-2xl text-[#CCCCCC] mb-8 max-w-5xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            传承千年的古典智慧，融合现代AI技术，为您提供准确的占卜分析与人生指导
          </motion.p>


        </motion.div>

        {/* 快速算卦按钮 */}
        <motion.div 
          className="text-center mb-10"
          variants={itemVariants}
        >
          <motion.button
            onClick={() => handleGameClick('/liuyao')}
            className="bg-gradient-to-r from-[#FF9900] to-[#E68A00] text-black px-8 py-4 rounded-xl font-bold text-lg hover:from-[#E68A00] hover:to-[#CC7700] transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#FF9900]/30"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              算一卦
              <Sparkles className="w-6 h-6" />
            </span>
          </motion.button>
        </motion.div>

        {/* 主要内容区域 - 弹性布局 */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-16 items-stretch">
            
            {/* 左侧：占卜类型 */}
            <motion.section 
              className="flex-1 space-y-4"
              variants={itemVariants}
            >
              <motion.div 
                className="text-center mb-4"
                variants={itemVariants}
              >
                <h2 className="text-2xl font-bold mb-2">
                  古老智慧
                </h2>
                <p className="text-[#CCCCCC] text-base">
                  选择您感兴趣的占卜方式，开启智慧之旅
                </p>
              </motion.div>

              {/* 占卜游戏垂直排列 */}
              <div className="space-y-3">
                {games.map((game, index) => {
                  const IconComponent = game.icon;
                  return (
                    <motion.div
                      key={game.id}
                      className="relative group cursor-pointer"
                      variants={itemVariants}
                      whileHover="hover"
                      onClick={() => handleGameClick(game.path)}
                    >
                      <motion.div
                        className="bg-[#111111] border border-[#333333] rounded-xl p-4 transition-all duration-300 hover:border-[#FF9900] hover:shadow-lg hover:shadow-[#FF9900]/20"
                        variants={cardHoverVariants}
                      >
                        <div className="flex items-center gap-3">
                          {IconComponent && (
                            <motion.div 
                              className="text-[#FF9900] p-2 bg-[#FF9900]/10 rounded-lg flex-shrink-0 icon-rotate-on-hover"
                            >
                              <IconComponent size={24} />
                            </motion.div>
                          )}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">{game.name}</h3>
                            <p className="text-[#CCCCCC] text-sm leading-relaxed">
                              {game.description}
                            </p>
                          </div>
                        </div>

                        {/* 悬浮效果装饰 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FF9900]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>

            {/* 右侧：大师团队区域 - 匹配左侧高度 */}
            <motion.section 
              className="flex-1 flex flex-col h-full"
              variants={itemVariants}
            >
              {/* 顶部标题区域 */}
              <motion.div 
                className="text-center mb-4"
                variants={itemVariants}
              >
                <h2 className="text-2xl font-bold mb-2">
                  大师团队
                </h2>
                <p className="text-[#CCCCCC] text-base">
                  历代易学宗师的智慧结晶，为您提供专业的占卜分析
                </p>
              </motion.div>

              {/* AI大师角色卡片区域 - 填充剩余空间并居中对齐 */}
              <motion.div 
                className="flex-1 flex flex-col justify-center"
                variants={itemVariants}
              >
                
                {loading ? (
                  <motion.div 
                    className="text-center py-12"
                    variants={itemVariants}
                  >
                    <div className="inline-flex items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9900]"></div>
                      <span className="text-[#CCCCCC]">正在加载大师信息...</span>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {availableMasters.map((master, index) => {
                        const IconComponent = getIconComponent(master.icon);
                        return (
                          <motion.div
                            key={master.id}
                            className={`bg-[#111111] border rounded-xl p-4 transition-all duration-300 hover:shadow-lg cursor-pointer h-24 ${
                              selectedMaster?.id === master.id 
                                ? 'border-[#FF9900] shadow-lg shadow-[#FF9900]/20' 
                                : 'border-[#333333] hover:border-[#FF9900] hover:shadow-[#FF9900]/10'
                            }`}
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, y: -3 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => handleMasterSelect(master)}
                          >
                            <div className="flex flex-col justify-center items-center h-full text-center gap-1">
                              {IconComponent && (
                                <IconComponent 
                                  size={20} 
                                  className="text-[#FF9900] flex-shrink-0" 
                                />
                              )}
                              <div className="flex flex-col items-center gap-0.5">
                                <h4 className="text-sm font-bold text-white">{master.name}</h4>
                                {master.dynasty && (
                                  <span className="text-xs text-[#888888]">{master.dynasty}</span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* 选中大师的详细介绍 */}
                    {selectedMaster && (
                      <motion.div 
                        className="bg-[#111111] border border-[#333333] rounded-xl p-4 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h4 className="text-base font-bold text-white mb-2">{selectedMaster.name}</h4>
                        <p className="text-[#CCCCCC] leading-relaxed text-sm">
                          {selectedMaster.description}
                        </p>
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            </motion.section>

          </div>
        </div>

      </div>
      
      {/* 底部特性介绍 - 固定在底部 */}
      <motion.div 
        className="text-center py-12 bg-black"
        variants={itemVariants}
      >
          <motion.div 
            className="flex flex-wrap justify-center gap-8 text-[#CCCCCC] text-lg"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#FF9900]" />
              <span>本地隐私保护</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#FF9900]" />
              <span>AI智能分析</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-[#FF9900]" />
              <span>传统易学智慧</span>
            </div>
          </motion.div>
        </motion.div>
    </motion.div>
  );
};

export default HomePage; 