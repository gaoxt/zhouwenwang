/**
 * 跑马灯通知组件
 * 参考ErrorToast的定位方式，每分钟请求一次接口获取消息
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface MarqueeData {
  enabled: boolean;
  message: string;
  updateTime: number;
}

interface MarqueeNotificationProps {
  /** API基础URL */
  apiBaseUrl?: string;
}

/**
 * 跑马灯通知组件
 */
export const MarqueeNotification: React.FC<MarqueeNotificationProps> = ({ 
  apiBaseUrl = 'http://localhost:3001' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  // 获取跑马灯数据
  const fetchMarqueeData = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/marquee`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: MarqueeData = await response.json();
      
      // 如果启用且有消息内容，则显示跑马灯
      if (data.enabled && data.message && data.message.trim()) {
        setMessage(data.message);
        setIsVisible(true);
        setIsAnimating(true);
        
        // 20秒后自动隐藏（作为备用机制）
        setTimeout(() => {
          setIsVisible(false);
          setIsAnimating(false);
          setTimeout(() => setMessage(''), 300); // 等待退出动画完成再清空消息
        }, 20000);
      }
    } catch (error) {
      console.warn('获取跑马灯数据失败:', error);
      // 静默失败，不显示错误
    }
  }, [apiBaseUrl]);

  // 设置定时器：每分钟请求一次（首次加载不请求）
  useEffect(() => {
    
    // 设置每分钟执行一次的定时器
    const interval = setInterval(fetchMarqueeData, 60000); // 60秒 = 1分钟
    
    return () => clearInterval(interval);
  }, [fetchMarqueeData]);

  return (
    <AnimatePresence>
      {isVisible && message && (
        <motion.div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9998, // 比Toast低一点，避免遮挡错误提示
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '80px', // 比Toast更低一点，避免重叠
            pointerEvents: 'none', // 让背景可以点击
          }}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
        >
          <div
            style={{
              maxWidth: '800px',
              width: '90%',
              background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.8) 0%, rgba(255, 153, 0, 0.2) 50%, rgba(0, 0, 0, 0.8) 100%)',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)',
              padding: '12px 0',
              pointerEvents: 'auto',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* 滚动文本容器 */}
            <div
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <motion.div
                style={{
                  display: 'inline-block',
                  color: '#FBBF24',
                  fontSize: '16px',
                  fontWeight: '500',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                  willChange: 'transform',
                }}
                initial={{ x: '100%' }} // 从右侧开始
                animate={{
                  x: isAnimating ? '-100%' : '100%', // 从右到左移动，完全移出视野
                }}
                transition={{
                  duration: 15, // 15秒滚动完成
                  ease: 'linear',
                  repeat: 0, // 不重复
                }}
                onAnimationComplete={() => {
                  // 动画完成后立即隐藏
                  if (isAnimating) {
                    setIsVisible(false);
                    setIsAnimating(false);
                    setTimeout(() => setMessage(''), 300); // 等待退出动画完成再清空消息
                  }
                }}
              >
                🌟 {message} 🌟
              </motion.div>
            </div>
            
            {/* 渐变边缘效果 */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '50px',
                background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.8) 0%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                height: '100%',
                width: '50px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 