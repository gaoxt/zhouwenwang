import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Suspense, lazy } from 'react';

// 懒加载页面组件
const HomePage = lazy(() => import('../../pages/HomePage'));
const MasterSelectorDemo = lazy(() => 
  import('../MasterSelectorDemo').then(module => ({ default: module.MasterSelectorDemo }))
);

// 懒加载游戏组件
const LiuYaoPage = lazy(() => import('../../games/liuyao/LiuYaoPage'));
const QiMenPage = lazy(() => import('../../games/qimen/QiMenPage'));
const BaZiPage = lazy(() => import('../../games/bazi/BaZiPage'));
const PalmistryPage = lazy(() => import('../../games/palmistry/PalmistryPage'));
const ZhouGongPage = lazy(() => import('../../games/zhougong/ZhouGongPage'));
const LifeKlinePage = lazy(() => import('../../games/lifekline/LifeKlinePage'));
const QinShiPage = lazy(() => import('../../games/qinshi/QinShiPage'));

// 加载中组件
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-white text-sm">加载中...</p>
    </div>
  </div>
);

interface MainContentProps {
  isCollapsed: boolean;
}

const MainContent: React.FC<MainContentProps> = ({ isCollapsed }) => {
  const location = useLocation();

  // 页面切换动画变体
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
        ease: "easeIn" as const
      }
    }
  };
  
  return (
    <motion.div 
      className="flex-1 bg-black min-h-screen"
      layout
    >
      {/* 内容容器 - 在内容栏中居中，大屏幕时限制最大宽度 */}
      <div className="w-full min-h-screen flex justify-center">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="min-h-screen">
            <Suspense fallback={<LoadingSpinner />}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="w-full"
                >
                  <Routes location={location}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/masters" element={<MasterSelectorDemo />} />
                    <Route path="/liuyao" element={<LiuYaoPage />} />
                    <Route path="/qimen" element={<QiMenPage />} />
                    <Route path="/bazi" element={<BaZiPage />} />
                    <Route path="/palmistry" element={<PalmistryPage />} />
                    <Route path="/zhougong" element={<ZhouGongPage />} />
                    <Route path="/lifekline" element={<LifeKlinePage />} />
                    {/* <Route path="/qinshi" element={<QinShiPage />} /> */}
                  </Routes>
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MainContent; 