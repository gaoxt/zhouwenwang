/**
 * 组件预加载工具
 * 用于在用户交互前预加载组件
 */

// 预加载组件映射
const componentPreloaders = {
  liuyao: () => import('../games/liuyao/LiuYaoPage'),
  qimen: () => import('../games/qimen/QiMenPage'),
  bazi: () => import('../games/bazi/BaZiPage'),
  palmistry: () => import('../games/palmistry/PalmistryPage'),
  zhougong: () => import('../games/zhougong/ZhouGongPage'),
  masters: () => import('../components/MasterSelectorDemo').then(module => ({ default: module.MasterSelectorDemo }))
};

/**
 * 预加载指定组件
 * @param componentKey 组件键名
 */
export const preloadComponent = (componentKey: keyof typeof componentPreloaders) => {
  if (componentPreloaders[componentKey]) {
    componentPreloaders[componentKey]();
  }
};

/**
 * 预加载多个组件
 * @param componentKeys 组件键名数组
 */
export const preloadComponents = (componentKeys: (keyof typeof componentPreloaders)[]) => {
  componentKeys.forEach(key => preloadComponent(key));
};

/**
 * 预加载所有游戏组件
 */
export const preloadAllGames = () => {
  preloadComponents(['liuyao', 'qimen', 'bazi', 'palmistry', 'zhougong']);
};

/**
 * 在空闲时间预加载组件
 * @param componentKey 组件键名
 */
export const preloadComponentOnIdle = (componentKey: keyof typeof componentPreloaders) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadComponent(componentKey);
    });
  } else {
    // 降级方案：使用setTimeout
    setTimeout(() => {
      preloadComponent(componentKey);
    }, 1);
  }
};

/**
 * 在鼠标悬停时预加载组件
 * @param element HTML元素
 * @param componentKey 组件键名
 */
export const preloadOnHover = (element: HTMLElement, componentKey: keyof typeof componentPreloaders) => {
  let isPreloaded = false;
  
  const handleMouseEnter = () => {
    if (!isPreloaded) {
      preloadComponent(componentKey);
      isPreloaded = true;
    }
  };
  
  element.addEventListener('mouseenter', handleMouseEnter, { once: true });
  
  // 返回清理函数
  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter);
  };
}; 