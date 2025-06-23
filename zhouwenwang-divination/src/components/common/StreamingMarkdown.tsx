import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';

interface StreamingMarkdownProps {
  content: string;
  showCursor?: boolean;
  isStreaming?: boolean;
  className?: string;
}

/**
 * 预处理流式Markdown内容，确保能够正确渲染
 */
const preprocessStreamingMarkdown = (content: string, isStreaming: boolean): string => {
  if (!content) return '';
  
  let processedContent = content;
  
  // 如果正在流式输入，处理可能不完整的内容
  if (isStreaming) {
    // 确保未闭合的代码块不会影响渲染
    const codeBlockMatches = processedContent.match(/```/g);
    if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
      // 有未闭合的代码块，暂时闭合它
      processedContent += '\n```';
    }
    
    // 处理可能不完整的表格
    const lines = processedContent.split('\n');
    let inTable = false;
    const processedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 检测表格开始
      if (line.includes('|') && !inTable) {
        inTable = true;
      }
      
      // 如果在表格中但这一行不包含|，表格可能结束了
      if (inTable && !line.includes('|') && line.trim() !== '') {
        inTable = false;
      }
      
      processedLines.push(line);
    }
    
    processedContent = processedLines.join('\n');
  }
  
  return processedContent;
};

const StreamingMarkdown: React.FC<StreamingMarkdownProps> = ({
  content,
  showCursor = false,
  isStreaming = false,
  className = ''
}) => {
  const [processedContent, setProcessedContent] = useState('');
  const lastContentRef = useRef('');
  
  useEffect(() => {
    const processed = preprocessStreamingMarkdown(content, isStreaming);
    
    // 只在内容真正变化时更新
    if (processed !== lastContentRef.current) {
      setProcessedContent(processed);
      lastContentRef.current = processed;
    }
  }, [content, isStreaming]);
  
  return (
    <motion.div 
      className={`streaming-markdown ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      key="streaming-container" // 固定key防止重新挂载
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 自定义标题样式
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-[#FF9900] mb-4 mt-6 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-[#E68A00] mb-3 mt-5 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-[#EEEEEE] mb-2 mt-4 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-[#CCCCCC] mb-2 mt-3 first:mt-0">
              {children}
            </h4>
          ),
          
          // 自定义段落样式
          p: ({ children }) => (
            <p className="text-[#CCCCCC] leading-relaxed mb-4 last:mb-0">
              {children}
            </p>
          ),
          
          // 自定义列表样式
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-[#CCCCCC] mb-4 space-y-1 ml-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-[#CCCCCC] mb-4 space-y-1 ml-4">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li 
              className="text-[#CCCCCC] leading-relaxed" 
              style={{ listStyle: 'none', marginLeft: '0', paddingLeft: '0' }}
            >
              {children}
            </li>
          ),
          
          // 自定义强调样式
          strong: ({ children }) => (
            <strong className="font-bold text-[#FF9900]">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[#E68A00]">
              {children}
            </em>
          ),
          
          // 自定义代码样式
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-[#333333] text-[#FF9900] px-1 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            ) : (
              <code className="block bg-[#222222] text-[#CCCCCC] p-3 rounded-lg text-sm font-mono overflow-x-auto border border-[#444444]">
                {children}
              </code>
            );
          },
          
          // 自定义引用样式
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#FF9900] pl-4 my-4 text-[#CCCCCC] italic bg-[#1a1a1a] py-2 rounded-r-lg">
              {children}
            </blockquote>
          ),
          
          // 自定义水平分割线
          hr: () => (
            <hr className="border-0 h-px bg-gradient-to-r from-transparent via-[#FF9900] to-transparent my-6" />
          ),
          
          // 自定义表格样式
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-[#444444] rounded-lg">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-[#444444] bg-[#333333] text-[#FF9900] px-3 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-[#444444] text-[#CCCCCC] px-3 py-2">
              {children}
            </td>
          ),
          
          // 自定义链接样式
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-[#FF9900] hover:text-[#E68A00] underline transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
      
      {/* 流式输入光标 */}
      {showCursor && (
        <motion.span
          className="inline-block ml-1 text-[#FF9900] font-bold"
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
     </motion.div>
   );
 };

export default StreamingMarkdown; 