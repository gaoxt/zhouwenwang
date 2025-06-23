/**
 * 大师选择器组件
 * 显示可用的AI占卜大师，并允许用户选择
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Master } from '../types';
import { fetchMasters, getDefaultMaster } from './service';

interface MasterSelectorProps {
  /** 当前选中的大师 */
  selectedMaster: Master | null;
  /** 大师选择变化回调 */
  onMasterChange: (master: Master) => void;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 组件样式类名 */
  className?: string;
  /** 是否紧凑模式 */
  compact?: boolean;
}

export const MasterSelector: React.FC<MasterSelectorProps> = ({
  selectedMaster,
  onMasterChange,
  loading = false,
  className = '',
  compact = false
}) => {
  const [masters, setMasters] = useState<Master[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载大师数据
  useEffect(() => {
    const loadMasters = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const mastersData = await fetchMasters();
        setMasters(mastersData);
        
        // 如果没有选中的大师，默认选择周文王或第一个
        if (!selectedMaster && mastersData.length > 0) {
          const zhouwenwang = mastersData.find(m => m.id === 'zhouwenwang') || getDefaultMaster(mastersData);
          if (zhouwenwang) {
            console.log('自动选择默认大师:', zhouwenwang);
            onMasterChange(zhouwenwang);
          }
        }
        
      } catch (err) {
        console.error('加载大师数据失败:', err);
        setError(err instanceof Error ? err.message : '加载大师数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadMasters();
  }, []); // 移除selectedMaster和onMasterChange依赖避免循环

  // 处理大师选择
  const handleMasterSelect = (master: Master) => {
    if (master.id !== selectedMaster?.id && !loading && !isLoading) {
      console.log('用户选择大师:', master);
      onMasterChange(master);
    }
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9900]"></div>
          <span className="ml-3 text-white">加载大师数据中...</span>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="bg-red-500/20 border border-red-500 rounded-xl p-4">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <div>
              <h3 className="text-red-400 font-medium">加载失败</h3>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 无数据状态
  if (masters.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-[#CCCCCC]">
          <p>暂无可用的大师</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <h3 className="text-white font-medium mb-4">选择占卜大师</h3>
      
      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {masters.map((master) => {
          const isSelected = selectedMaster?.id === master.id;
          const isDisabled = loading || isLoading;
          
          return (
            <motion.div
              key={master.id}
              onClick={() => handleMasterSelect(master)}
              className={`
                relative cursor-pointer transition-all duration-300 rounded-xl p-4 border-2
                ${isSelected 
                  ? 'border-[#FF9900] bg-[#FF9900]/10 shadow-lg shadow-[#FF9900]/20' 
                  : 'border-[#333333] hover:border-[#FF9900]/50 bg-[#111111] hover:bg-[#111111]/80'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
              `}
              whileHover={!isDisabled ? { scale: 1.02, y: -2 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* 选中指示器 */}
              {isSelected && (
                <motion.div 
                  className="absolute top-3 right-3"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="w-3 h-3 bg-[#FF9900] rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                  </div>
                </motion.div>
              )}
              
              {/* 大师信息 */}
              <div className="space-y-2">
                <h4 className={`font-medium text-lg ${isSelected ? 'text-white' : 'text-[#EEEEEE]'}`}>
                  {master.name}
                </h4>
                <p className={`text-sm leading-relaxed ${isSelected ? 'text-[#CCCCCC]' : 'text-[#888888]'}`}>
                  {master.description}
                </p>
              </div>
              
              {/* 加载状态覆盖 */}
              {loading && isSelected && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#FF9900]"></div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* 当前选中的大师显示 */}
      {selectedMaster && (
        <motion.div 
          className="mt-6 p-4 bg-[#111111] border border-[#333333] rounded-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[#CCCCCC]">当前选中:</span>
            <span className="text-[#FF9900] font-medium">{selectedMaster.name}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}; 