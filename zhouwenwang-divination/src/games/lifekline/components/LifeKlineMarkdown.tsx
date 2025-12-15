import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LifeKlineMarkdownProps {
  content: string;
}

/**
 * 人生K线专用的Markdown渲染组件
 * 使用绿色主题，适配深色背景
 */
const LifeKlineMarkdown: React.FC<LifeKlineMarkdownProps> = ({ content }) => {
  // 如果没有内容，返回空
  if (!content || !content.trim()) {
    return null;
  }

  return (
    <div className="life-kline-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 标题样式 - 使用绿色主题
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-[#22C55E] mb-4 mt-6 first:mt-0 border-b border-[#333333] pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-[#22C55E] mb-3 mt-5 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-[#34D399] mb-2 mt-4 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-[#6EE7B7] mb-2 mt-3 first:mt-0">
              {children}
            </h4>
          ),
          
          // 段落样式
          p: ({ children }) => (
            <p className="text-[#CCCCCC] leading-relaxed mb-4 last:mb-0">
              {children}
            </p>
          ),
          
          // 列表样式
          ul: ({ children }) => (
            <ul className="list-none text-[#CCCCCC] mb-4 space-y-3 ml-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-[#CCCCCC] mb-4 space-y-3 ml-4">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[#CCCCCC] leading-relaxed flex items-start">
              <span className="text-[#22C55E] mr-2 mt-1">•</span>
              <span className="flex-1">{children}</span>
            </li>
          ),
          
          // 强调样式
          strong: ({ children }) => (
            <strong className="font-bold text-[#22C55E]">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[#34D399]">
              {children}
            </em>
          ),
          
          // 代码样式
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-[#2a2a2a] text-[#22C55E] px-1.5 py-0.5 rounded text-sm font-mono border border-[#444444]">
                {children}
              </code>
            ) : (
              <code className="block bg-[#222222] text-[#CCCCCC] p-4 rounded-lg text-sm font-mono overflow-x-auto border border-[#444444] my-4">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-[#222222] text-[#CCCCCC] p-4 rounded-lg text-sm font-mono overflow-x-auto border border-[#444444] my-4">
              {children}
            </pre>
          ),
          
          // 引用样式
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#22C55E] pl-4 my-4 text-[#CCCCCC] italic bg-[#1a1a1a] py-2 rounded-r-lg">
              {children}
            </blockquote>
          ),
          
          // 水平分割线
          hr: () => (
            <hr className="border-0 h-px bg-gradient-to-r from-transparent via-[#22C55E] to-transparent my-6" />
          ),
          
          // 表格样式
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-[#444444] rounded-lg">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-[#444444] bg-[#2a2a2a] text-[#22C55E] px-4 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-[#444444] text-[#CCCCCC] px-4 py-2">
              {children}
            </td>
          ),
          
          // 链接样式
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-[#22C55E] hover:text-[#34D399] underline transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default LifeKlineMarkdown;

