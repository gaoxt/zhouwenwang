import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  showCursor?: boolean;
  isStreaming?: boolean;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 50,
  className = '',
  showCursor = true,
  isStreaming = false
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isStreaming) {
      // 流式模式：直接显示传入的文本
      setDisplayText(text);
      setCurrentIndex(text.length);
    } else {
      // 打字机模式：逐字显示
      if (currentIndex < text.length) {
        const timer = setTimeout(() => {
          setDisplayText(prev => prev + text[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }, speed);

        return () => clearTimeout(timer);
      }
    }
  }, [text, currentIndex, speed, isStreaming]);

  // 重置效果当文本改变时
  useEffect(() => {
    if (!isStreaming) {
      setDisplayText('');
      setCurrentIndex(0);
    }
  }, [text, isStreaming]);

  return (
    <div className={className}>
      <span className="whitespace-pre-wrap leading-relaxed">
        {displayText}
      </span>
      {showCursor && (
        <motion.span
          className="ml-1 text-[#FF9900] font-bold"
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          |
        </motion.span>
      )}
    </div>
  );
};

export default TypewriterText; 