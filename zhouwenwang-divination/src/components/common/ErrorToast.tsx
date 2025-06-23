/**
 * 通用错误Toast组件
 * 使用统一的modalStyles样式系统
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { presetStyles } from '../../styles/modalStyles';

interface ErrorToastProps {
  /** 是否显示Toast */
  isVisible: boolean;
  /** 错误消息 */
  message: string;
  /** 标题，默认为"操作失败" */
  title?: string;
  /** Toast类型，默认为error */
  type?: 'success' | 'error' | 'warning' | 'info';
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * 错误Toast组件
 */
export function ErrorToast({
  isVisible,
  message,
  title = '操作失败',
  type = 'error',
  onClose
}: ErrorToastProps) {
  // 获取Toast样式配置
  const toastConfig = presetStyles.toastNotification(type, title, message, onClose);

  return (
    <AnimatePresence>
      {isVisible && (
                          <motion.div
           style={toastConfig.containerStyle}
           initial={{ opacity: 0, y: -50 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -50 }}
           transition={{ duration: 0.3 }}
         >
           <div style={toastConfig.toastStyle}>
             <div style={toastConfig.contentStyle}>
               {/* 图标 */}
               <div style={toastConfig.iconStyle}>
                 {toastConfig.icon}
               </div>
               
               {/* 文本区域 */}
               <div style={toastConfig.textAreaStyle}>
                 <h3 style={toastConfig.titleStyle}>
                   {toastConfig.title}
                 </h3>
                 <p style={toastConfig.descriptionStyle}>
                   {toastConfig.message}
                 </p>
               </div>
               
               {/* 关闭按钮 */}
               <button
                 onClick={onClose}
                 style={toastConfig.closeButtonStyle}
                 title="关闭"
               >
                 <svg style={toastConfig.closeIconStyle} fill="currentColor" viewBox="0 0 20 20">
                   <path 
                     fillRule="evenodd" 
                     d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                     clipRule="evenodd" 
                   />
                 </svg>
               </button>
             </div>
           </div>
         </motion.div>
      )}
    </AnimatePresence>
  );
} 