import { useEffect } from 'react';

/**
 * 轻量级动画工具
 * 用CSS动画替代Framer Motion以提升性能
 */

// 基础动画类名
export const animations = {
  // 淡入动画
  fadeIn: 'animate-fade-in',
  // 淡出动画
  fadeOut: 'animate-fade-out',
  // 从上滑入
  slideInFromTop: 'animate-slide-in-from-top',
  // 从下滑入
  slideInFromBottom: 'animate-slide-in-from-bottom',
  // 从左滑入
  slideInFromLeft: 'animate-slide-in-from-left',
  // 从右滑入
  slideInFromRight: 'animate-slide-in-from-right',
  // 缩放动画
  scaleIn: 'animate-scale-in',
  // 弹跳动画
  bounce: 'animate-bounce-in',
  // 旋转动画
  spin: 'animate-spin-slow'
} as const;

// 动画延迟类名生成器
export const getDelayClass = (delay: number): string => {
  const delayMap: Record<number, string> = {
    0: '',
    100: 'animation-delay-100',
    200: 'animation-delay-200',
    300: 'animation-delay-300',
    400: 'animation-delay-400',
    500: 'animation-delay-500'
  };
  return delayMap[delay] || '';
};

// 动画持续时间类名
export const durations = {
  fast: 'duration-200',
  normal: 'duration-300',
  slow: 'duration-500'
} as const;

// 动画缓动函数
export const easings = {
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  linear: 'ease-linear'
} as const;

// 组合动画类名的工具函数
export const combineAnimations = (...classes: string[]): string => {
  return classes.filter(Boolean).join(' ');
};

// 预设的页面切换动画
export const pageTransitions = {
  fadeIn: combineAnimations(animations.fadeIn, durations.normal, easings.easeOut),
  slideUp: combineAnimations(animations.slideInFromBottom, durations.normal, easings.easeOut),
  slideDown: combineAnimations(animations.slideInFromTop, durations.normal, easings.easeOut)
};

// 简单的动画触发器Hook
export const useSimpleAnimation = (
  elementRef: React.RefObject<HTMLElement>,
  animationClass: string,
  trigger: boolean
) => {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (trigger) {
      element.classList.add(animationClass);
    } else {
      element.classList.remove(animationClass);
    }
  }, [trigger, animationClass]);
}; 