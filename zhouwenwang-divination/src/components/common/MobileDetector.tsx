import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, X, Copy, Check } from 'lucide-react';

const MobileDetector: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // 更精确的移动设备检测
      const userAgent = navigator.userAgent;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      const isMobileDevice = (isMobileUA || isSmallScreen) && isTouchDevice;
      setIsMobile(isMobileDevice);
      
      // 检查用户偏好设置（使用localStorage持久化）
      const userPreference = localStorage.getItem('mobile-preference');
      
      if (isMobileDevice && userPreference !== 'continue') {
        setShowModal(true);
      }
    };

    // 延迟检测，避免在页面加载时立即弹出
    const timer = setTimeout(checkMobile, 500);
    
    window.addEventListener('resize', checkMobile);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleContinue = () => {
    setShowModal(false);
    // 保存用户选择到localStorage，下次访问不再提示
    localStorage.setItem('mobile-preference', 'continue');
  };

  const handleClose = () => {
    setShowModal(false);
    // 仅关闭当前会话，下次访问还会提示
    sessionStorage.setItem('mobile-dismissed', 'true');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // 备用方案：选择文本
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.log('无法复制到剪贴板');
      }
      document.body.removeChild(textArea);
    }
  };

  // 重置用户偏好的函数（用于调试或重新显示提示）
  const resetPreference = () => {
    localStorage.removeItem('mobile-preference');
    sessionStorage.removeItem('mobile-dismissed');
  };

  if (!isMobile) return null;

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          style={{ touchAction: 'none' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-[#111111] border border-[#333333] rounded-2xl p-6 max-w-md w-full text-center relative shadow-2xl"
          >
            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-[#CCCCCC] hover:text-white transition-colors p-1 rounded-full hover:bg-[#333333]"
              aria-label="关闭"
            >
              <X size={18} />
            </button>

            {/* 图标 */}
            <div className="flex justify-center mb-4">
              <motion.div 
                className="bg-[#FF9900]/10 p-4 rounded-full"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Monitor className="w-12 h-12 text-[#FF9900]" />
              </motion.div>
            </div>

            {/* 标题 */}
            <motion.h2 
              className="text-xl font-bold text-white mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              获得最佳体验
            </motion.h2>

            {/* 描述 */}
            <motion.p 
              className="text-[#CCCCCC] mb-6 leading-relaxed text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              为了获得最佳的占卜体验，建议您在电脑或平板浏览器中访问。
              <br />
              <span className="text-[#888888]">手机端部分功能可能受限</span>
            </motion.p>

            {/* 按钮组 */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={handleContinue}
                className="w-full bg-[#FF9900] hover:bg-[#E68A00] text-black font-medium py-3 px-4 rounded-xl transition-all duration-200 text-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                继续使用手机版
              </button>
              
              <div className="flex items-center justify-center gap-2 text-xs text-[#888888]">
                <Smartphone size={14} />
                <span>移动设备已检测</span>
              </div>
            </motion.div>

            {/* URL复制区域 */}
            <motion.div 
              className="mt-4 p-3 bg-[#222222] border border-[#333333] rounded-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-xs text-[#CCCCCC] mb-2">分享到电脑：</p>
              <div className="flex items-center gap-2">
                <code className="text-[#FF9900] text-xs break-all flex-1 text-left">
                  {window.location.href}
                </code>
                <button
                  onClick={copyToClipboard}
                  className={`p-2 rounded transition-all duration-200 ${
                    copied 
                      ? 'text-green-400 bg-green-400/10 scale-110' 
                      : 'text-[#CCCCCC] hover:text-white hover:bg-[#333333] hover:scale-105'
                  }`}
                  title={copied ? '已复制' : '复制链接'}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </motion.div>

            {/* 温馨提示 */}
            <motion.div 
              className="mt-3 text-xs text-[#666666]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              💡 将链接发送到电脑微信、QQ或邮箱
            </motion.div>

            {/* 隐藏的重置按钮（仅用于开发调试） */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={resetPreference}
                className="mt-2 text-xs text-[#666666] hover:text-[#888888] underline"
                title="重置偏好设置（开发模式）"
              >
                重置偏好
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileDetector; 