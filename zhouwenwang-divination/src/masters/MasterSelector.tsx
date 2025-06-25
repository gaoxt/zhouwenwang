/**
 * 大师选择器组件
 * 显示可用的AI占卜大师，并允许用户选择
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Master } from '../types';
import { fetchMasters, getDefaultMaster } from './service';
import { colors, styleUtils, animations } from '../styles/modalStyles';

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
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid transparent',
            borderTop: `2px solid ${colors.primary}`,
            borderRadius: '50%',
            ...animations.spin
          }}></div>
          <span style={{ marginLeft: '12px', color: colors.white }}>加载大师数据中...</span>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ color: '#F87171', marginRight: '12px' }}>⚠️</div>
            <div>
              <h3 style={{ color: '#F87171', fontWeight: '500', margin: 0 }}>加载失败</h3>
              <p style={{ color: '#FCA5A5', fontSize: '14px', marginTop: '4px', margin: 0 }}>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 无数据状态
  if (masters.length === 0) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ textAlign: 'center', color: colors.gray[300] }}>
          <p>暂无可用的大师</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        display: 'grid', 
        gap: '12px',
        gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))'
      }}>
        {masters.map((master) => {
          const isSelected = selectedMaster?.id === master.id;
          const isDisabled = loading || isLoading;
          
          const cardStyle = {
            position: 'relative' as const,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            borderRadius: '10px',
            padding: '12px',
            minHeight: compact ? '70px' : 'auto',
            border: `2px solid ${isSelected ? colors.primary : '#333333'}`,
            background: isSelected 
              ? 'rgba(255, 153, 0, 0.1)' 
              : '#111111',
            opacity: isDisabled ? 0.5 : 1,
            boxShadow: isSelected 
              ? '0 8px 25px -8px rgba(255, 153, 0, 0.2)' 
              : '0 2px 4px rgba(0, 0, 0, 0.1)'
          };
          
          const hoverStyle = !isDisabled ? {
            ...cardStyle,
            border: `2px solid ${isSelected ? colors.primary : 'rgba(255, 153, 0, 0.5)'}`,
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          } : cardStyle;
          
          return (
            <motion.div
              key={master.id}
              onClick={() => handleMasterSelect(master)}
              style={cardStyle}
              {...(!isDisabled ? styleUtils.createHoverHandlers(cardStyle, hoverStyle) : {})}
              whileHover={!isDisabled ? { scale: 1.02, y: -2 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* 选中指示器 */}
              {isSelected && (
                                  <motion.div 
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px'
                    }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div style={{
                    width: '12px',
                    height: '12px',
                    background: colors.primary,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      background: colors.black,
                      borderRadius: '50%'
                    }}></div>
                  </div>
                </motion.div>
              )}
              
              {/* 大师信息 */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '4px',
                justifyContent: 'flex-start',
                paddingRight: '20px',
                minHeight: compact ? '46px' : 'auto',
                flex: 1
              }}>
                <h4 style={{
                  fontWeight: '500',
                  fontSize: '15px',
                  color: isSelected ? colors.white : colors.gray[200],
                  margin: 0
                }}>
                  {master.name}
                </h4>
                <p style={{
                  fontSize: '11px',
                  lineHeight: '1.4',
                  color: isSelected ? colors.gray[300] : colors.gray[400],
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: compact ? 3 : 1,
                  WebkitBoxOrient: 'vertical',
                  wordBreak: 'break-word',
                  flex: 1
                }}>
                  {master.description}
                </p>
              </div>
              
              {/* 加载状态覆盖 */}
              {loading && isSelected && (
                                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid transparent',
                    borderTop: `2px solid ${colors.primary}`,
                    borderRadius: '50%',
                    ...animations.spin
                  }}></div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      

    </div>
  );
}; 