import { useEffect, useRef } from 'react';

interface UseAutoScrollOptions {
  /** 是否正在分析/流式输出 */
  isAnalyzing: boolean;
  /** 分析内容 */
  content: string;
  /** 内容达到多少字符后开始滚动跟踪 (默认: 200) */
  contentThreshold?: number;
  /** 内容增加多少字符后触发一次滚动 (默认: 50) */
  incrementThreshold?: number;
  /** 滚动前的延迟时间，给用户阅读时间 (默认: 200ms) */
  scrollDelay?: number;
}

/**
 * 通用的自动滚动Hook
 * 用于在AI流式输出内容时智能跟踪滚动
 */
export default function useAutoScroll(options: UseAutoScrollOptions) {
  const {
    isAnalyzing,
    content,
    contentThreshold = 200,
    incrementThreshold = 50,
    scrollDelay = 200
  } = options;

  // 用于引用分析结果的DOM元素
  const contentRef = useRef<HTMLDivElement>(null);
  // 记录上次内容的长度，用于判断是否有新内容
  const lastContentLengthRef = useRef(0);

  // 当内容更新时智能滚动跟踪
  useEffect(() => {
    if (content && content.trim().length > 0) {
      const currentLength = content.length;
      const lastLength = lastContentLengthRef.current;
      
      // 只有当内容确实增加了才滚动
      if (currentLength > lastLength) {
        const scrollToBottomSlowly = () => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth' // 使用smooth实现慢速滚动
          });
        };

        // 第一次出现内容时，先滚动到分析区域
        if (lastLength === 0) {
          setTimeout(() => {
            if (contentRef.current) {
              contentRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }
          }, 300);
        } else if (isAnalyzing && currentLength > contentThreshold) {
          // 当内容长度超过阈值时才开始滚动跟踪
          // 并且增量大于阈值时才滚动，避免频繁滚动
          if (currentLength - lastLength > incrementThreshold) {
            setTimeout(scrollToBottomSlowly, scrollDelay);
          }
        }
        
        // 更新记录的长度
        lastContentLengthRef.current = currentLength;
      }
    }
    
    // 分析开始时重置长度记录
    if (isAnalyzing && content === '') {
      lastContentLengthRef.current = 0;
    }
  }, [content, isAnalyzing, contentThreshold, incrementThreshold, scrollDelay]);

  return {
    contentRef,
    /**
     * 手动滚动到内容区域
     */
    scrollToContent: () => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    },
    /**
     * 手动滚动到页面底部
     */
    scrollToBottom: () => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  };
} 