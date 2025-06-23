import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllGames } from '../../games';
import HomePage from '../../pages/HomePage';
import { MasterSelectorDemo } from '../MasterSelectorDemo';

interface MainContentProps {
  isCollapsed: boolean;
}

const MainContent: React.FC<MainContentProps> = ({ isCollapsed }) => {
  const games = getAllGames();
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
                  {games.map((game) => (
                    <Route 
                      key={game.id} 
                      path={game.path} 
                      element={<game.component />} 
                    />
                  ))}
                </Routes>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MainContent; 