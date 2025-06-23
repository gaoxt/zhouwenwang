/**
 * 通用模态框样式系统
 * 提供可复用的样式对象和工具函数
 */

import type { CSSProperties } from 'react';

// ==================== 颜色主题 ====================
export const colors = {
  // 主色调
  primary: '#FF9900',
  primaryLight: '#F59E0B',
  primaryDark: '#E68A00',
  
  // 灰色系
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // 状态颜色
  success: '#10B981',
  successLight: '#34D399',
  error: '#EF4444',
  errorLight: '#F87171',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // 特殊颜色
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ==================== 渐变样式 ====================
export const gradients = {
  primary: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
  primaryReverse: `linear-gradient(90deg, ${colors.primaryLight} 0%, ${colors.primary} 100%)`,
  primaryHover: `linear-gradient(90deg, ${colors.primaryDark} 0%, #D97706 100%)`,
  
  success: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
  successHover: 'linear-gradient(90deg, #047857 0%, #065F46 100%)',
  
  error: 'linear-gradient(90deg, #DC2626 0%, #B91C1C 100%)',
  errorHover: 'linear-gradient(90deg, #B91C1C 0%, #991B1B 100%)',
  
  info: 'linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%)',
  infoHover: 'linear-gradient(90deg, #1D4ED8 0%, #1E40AF 100%)',
  
  disabled: `linear-gradient(90deg, ${colors.gray[500]} 0%, ${colors.gray[600]} 100%)`,
  
  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(17, 17, 17, 0.95) 100%)',
  cardBackground: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
  
  overlaySuccess: 'linear-gradient(90deg, rgba(0, 0, 0, 0.7) 0%, rgba(34, 197, 94, 0.2) 50%, rgba(0, 0, 0, 0.7) 100%)',
  overlayError: 'linear-gradient(90deg, rgba(0, 0, 0, 0.7) 0%, rgba(239, 68, 68, 0.2) 50%, rgba(0, 0, 0, 0.7) 100%)',
  overlayWarning: 'linear-gradient(90deg, rgba(0, 0, 0, 0.7) 0%, rgba(245, 158, 11, 0.2) 50%, rgba(0, 0, 0, 0.7) 100%)',
  overlayInfo: 'linear-gradient(90deg, rgba(0, 0, 0, 0.7) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(0, 0, 0, 0.7) 100%)',
} as const;

// ==================== 基础样式组件 ====================
export const baseStyles = {
  // 模态框背景遮罩
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: gradients.background,
    zIndex: 9999,
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  
  // 模态框容器
  modalContainer: (maxWidth: string = '500px') => ({
    width: '100%',
    maxWidth,
    background: gradients.cardBackground,
    border: `1px solid rgba(255, 153, 0, 0.2)`,
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 153, 0, 0.1)',
    maxHeight: '85vh',
    overflow: 'hidden',
  }),
  
  // 标题栏
  modalHeader: {
    background: 'linear-gradient(90deg, rgba(255, 153, 0, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
    borderBottom: '1px solid rgba(255, 153, 0, 0.2)',
    padding: '16px 24px',
  },
  
  // 内容区域
  modalContent: {
    maxHeight: 'calc(85vh - 80px)',
    overflowY: 'auto' as const,
  },
  
  // 主要内容容器
  contentContainer: (gap: string = '20px') => ({
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap,
  }),
  
  // 卡片容器
  card: (padding: string = '18px') => ({
    background: 'rgba(31, 41, 55, 0.5)',
    border: '1px solid rgba(75, 85, 99, 0.5)',
    borderRadius: '12px',
    padding,
    backdropFilter: 'blur(4px)',
  }),
} as const;

// ==================== 交互样式 ====================
export const interactiveStyles = {
  // 标签页按钮
  tabButton: (isActive: boolean) => ({
    padding: '12px 16px',
    borderRadius: '8px',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: isActive 
      ? 'linear-gradient(90deg, rgba(255, 153, 0, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)'
      : 'transparent',
    color: isActive ? colors.primary : colors.gray[400],
    border: isActive ? '1px solid rgba(255, 153, 0, 0.3)' : 'none',
  }),
  
  // 输入框
  input: {
    flex: 1,
    padding: '10px 14px',
    background: 'rgba(0, 0, 0, 0.5)',
    border: `1px solid ${colors.gray[600]}`,
    borderRadius: '8px',
    color: colors.gray[200],
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
  },
  
  // 输入框聚焦状态
  inputFocus: {
    borderColor: 'rgba(255, 153, 0, 0.5)',
    boxShadow: '0 0 0 2px rgba(255, 153, 0, 0.1)',
  },
  
  // 按钮基础样式
  buttonBase: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  
  // 主要按钮
  primaryButton: {
    background: gradients.primary,
    color: colors.white,
    boxShadow: '0 4px 14px 0 rgba(255, 153, 0, 0.3)',
  },
  
  // 次要按钮
  secondaryButton: {
    background: gradients.info,
    color: colors.white,
  },
  
  // 危险按钮
  dangerButton: {
    background: gradients.error,
    color: colors.white,
  },
  
  // 禁用按钮
  disabledButton: {
    background: gradients.disabled,
    color: colors.white,
    cursor: 'not-allowed',
  },
} as const;

// ==================== 消息样式 ====================
export const messageStyles = {
  base: {
    padding: '12px 16px',
    borderRadius: '12px',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  
  success: {
    background: gradients.overlaySuccess,
    border: '1px solid rgba(34, 197, 94, 0.2)',
    color: '#86EFAC',
  },
  
  error: {
    background: gradients.overlayError,
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#FCA5A5',
  },
  
  info: {
    background: gradients.overlayInfo,
    border: '1px solid rgba(59, 130, 246, 0.2)',
    color: '#93C5FD',
  },
} as const;

// ==================== 文本样式 ====================
export const textStyles = {
  title: {
    fontSize: '20px',
    fontWeight: '600',
    background: gradients.primary,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: colors.gray[300],
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  
  description: {
    fontSize: '12px',
    color: colors.gray[400],
    lineHeight: '1.5',
    marginBottom: '12px',
  },
  
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: colors.gray[300],
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
} as const;

// ==================== 工具函数 ====================
export const styleUtils = {
  // 合并样式对象
  mergeStyles: (...styles: (CSSProperties | undefined)[]): CSSProperties => {
    return Object.assign({}, ...styles.filter(Boolean));
  },
  
  // 创建悬停事件处理器
  createHoverHandlers: (normalStyle: CSSProperties, hoverStyle: CSSProperties) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      Object.assign(e.currentTarget.style, hoverStyle);
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      Object.assign(e.currentTarget.style, normalStyle);
    },
  }),
  
  // 创建焦点事件处理器
  createFocusHandlers: (normalStyle: CSSProperties, focusStyle: CSSProperties) => ({
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      Object.assign(e.currentTarget.style, focusStyle);
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      Object.assign(e.currentTarget.style, normalStyle);
    },
  }),
  
  // 根据条件选择样式
  conditionalStyle: (condition: boolean, trueStyle: CSSProperties, falseStyle: CSSProperties = {}) => {
    return condition ? trueStyle : falseStyle;
  },
  
  // 创建响应式容器
  responsiveContainer: (mobileGap: string = '16px', desktopGap: string = '20px') => ({
    display: 'flex',
    flexDirection: 'column' as const,
    gap: window.innerWidth < 768 ? mobileGap : desktopGap,
  }),
} as const;

// ==================== Toast 通知样式 ====================
export const toastStyles = {
  // Toast 容器（固定定位，全屏覆盖）
  container: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '24px',
    pointerEvents: 'none' as const, // 让背景可以点击
  },
  
  // Toast 主体
  toast: (type: 'success' | 'error' | 'warning' | 'info' = 'error') => {
    const typeStyles = {
      success: {
        background: gradients.overlaySuccess,
        border: '1px solid rgba(34, 197, 94, 0.2)',
        iconColor: '#86EFAC',
        titleColor: '#86EFAC',
        textColor: '#86EFAC',
      },
      error: {
        background: gradients.overlayError,
        border: '1px solid rgba(239, 68, 68, 0.2)',
        iconColor: '#FCA5A5',
        titleColor: '#FCA5A5',
        textColor: '#FCA5A5',
      },
      warning: {
        background: gradients.overlayWarning,
        border: '1px solid rgba(245, 158, 11, 0.2)',
        iconColor: '#FCD34D',
        titleColor: '#FCD34D',
        textColor: '#FCD34D',
      },
      info: {
        background: gradients.overlayInfo,
        border: '1px solid rgba(59, 130, 246, 0.2)',
        iconColor: '#93C5FD',
        titleColor: '#93C5FD',
        textColor: '#93C5FD',
      },
    };
    
    const style = typeStyles[type];
    
    return {
      maxWidth: '500px',
      width: '90%',
      background: style.background,
      border: style.border,
      borderRadius: '12px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 10px 20px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(12px)',
      padding: '16px 20px',
      pointerEvents: 'auto' as const, // Toast本身可以交互
    };
  },
  
  // Toast 内容布局
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  
  // Toast 图标
  icon: (type: 'success' | 'error' | 'warning' | 'info' = 'error') => ({
    fontSize: '20px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  
  // Toast 文本区域
  textArea: {
    flex: 1,
    minWidth: 0, // 防止文本溢出
  },
  
  // Toast 标题
  title: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '4px',
    margin: 0,
  },
  
  // Toast 描述文本
  description: {
    fontSize: '14px',
    lineHeight: '1.4',
    wordBreak: 'break-word' as const,
    margin: 0,
  },
  
  // 关闭按钮
  closeButton: {
    flexShrink: 0,
    padding: '4px',
    borderRadius: '4px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 关闭按钮图标
  closeIcon: {
    width: '16px',
    height: '16px',
  },
} as const;

// ==================== 预设组合样式 ====================
export const presetStyles = {
  // 完整的输入框组合（包含悬停和聚焦效果）
  inputWithEffects: (inputStyle: CSSProperties = {}) => {
    const baseStyle = styleUtils.mergeStyles(interactiveStyles.input, inputStyle);
    return {
      style: baseStyle,
      ...styleUtils.createFocusHandlers(baseStyle, interactiveStyles.inputFocus),
    };
  },
  
  // 完整的按钮组合（包含悬停效果）
  buttonWithHover: (
    type: 'primary' | 'secondary' | 'danger' = 'primary',
    disabled: boolean = false,
    customStyle: CSSProperties = {}
  ) => {
    const buttonTypeStyles = {
      primary: interactiveStyles.primaryButton,
      secondary: interactiveStyles.secondaryButton,
      danger: interactiveStyles.dangerButton,
    };
    
    const baseStyle = styleUtils.mergeStyles(
      interactiveStyles.buttonBase,
      disabled ? interactiveStyles.disabledButton : buttonTypeStyles[type],
      customStyle
    );
    
    if (disabled) {
      return { style: baseStyle };
    }
    
    const hoverStyles = {
      primary: { background: gradients.primaryHover },
      secondary: { background: gradients.infoHover },
      danger: { background: gradients.errorHover },
    };
    
    return {
      style: baseStyle,
      ...styleUtils.createHoverHandlers(baseStyle, { ...baseStyle, ...hoverStyles[type] }),
    };
  },
  
  // 标签页按钮组合
  tabButtonWithHover: (isActive: boolean) => {
    const baseStyle = interactiveStyles.tabButton(isActive);
    
    if (isActive) {
      return { style: baseStyle };
    }
    
    const hoverStyle = {
      color: colors.white,
      backgroundColor: 'rgba(128, 128, 128, 0.5)',
    };
    
    return {
      style: baseStyle,
      ...styleUtils.createHoverHandlers(baseStyle, { ...baseStyle, ...hoverStyle }),
    };
  },
  
  // 消息提示组合
  message: (type: 'success' | 'error' | 'info') => styleUtils.mergeStyles(
    messageStyles.base,
    messageStyles[type]
  ),
  
  // Toast 通知组合样式
  toastNotification: (
    type: 'success' | 'error' | 'warning' | 'info' = 'error',
    title: string = '操作失败',
    message: string,
    onClose?: () => void
  ) => {
    const typeColors = {
      success: {
        iconColor: colors.white,
        titleColor: colors.white,
        textColor: '#D1FAE5',
      },
      error: {
        iconColor: colors.white,
        titleColor: colors.white,
        textColor: '#FEE2E2',
      },
      warning: {
        iconColor: colors.white,
        titleColor: colors.white,
        textColor: '#FEF3C7',
      },
      info: {
        iconColor: colors.white,
        titleColor: colors.white,
        textColor: '#DBEAFE',
      },
    };
    
    const typeIcons = {
      success: '✅',
      error: '⚠️',
      warning: '⚠️',
      info: 'ℹ️',
    };
    
    const currentColors = typeColors[type];
    
    return {
      containerStyle: toastStyles.container,
      toastStyle: toastStyles.toast(type),
      contentStyle: toastStyles.content,
      iconStyle: {
        ...toastStyles.icon(type),
        color: currentColors.iconColor,
      },
      textAreaStyle: toastStyles.textArea,
      titleStyle: {
        ...toastStyles.title,
        color: currentColors.titleColor,
      },
      descriptionStyle: {
        ...toastStyles.description,
        color: currentColors.textColor,
      },
      closeButtonStyle: {
        ...toastStyles.closeButton,
        color: currentColors.textColor,
        ...styleUtils.createHoverHandlers(
          { color: currentColors.textColor },
          { color: currentColors.titleColor }
        ),
      },
      closeIconStyle: toastStyles.closeIcon,
      icon: typeIcons[type],
      title,
      message,
      onClose,
    };
  },
} as const;

// ==================== 主题切换支持 ====================
export type Theme = 'dark' | 'light';

export const createThemeStyles = (theme: Theme) => {
  // 目前只有暗色主题，为将来扩展预留接口
  if (theme === 'light') {
    // 亮色主题的样式定义（可以后续扩展）
    return {
      // TODO: 实现亮色主题
      ...baseStyles,
    };
  }
  
  return baseStyles; // 默认暗色主题
};

// ==================== 动画样式 ====================
export const animations = {
  // 旋转动画
  spin: {
    animation: 'spin 1s linear infinite'
  },
  
  // 淡入动画
  fadeIn: {
    animation: 'fadeIn 0.3s ease-in-out'
  },
  
  // 滑入动画
  slideIn: {
    animation: 'slideIn 0.3s ease-out'
  }
} as const;

// 确保CSS动画keyframes存在
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// 导出所有样式
export default {
  colors,
  gradients,
  baseStyles,
  interactiveStyles,
  messageStyles,
  textStyles,
  styleUtils,
  presetStyles,
  createThemeStyles,
  animations,
  toastStyles,
}; 