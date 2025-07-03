import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Star
} from 'lucide-react';
import { getAllGames } from '../../games';
import { useSettings, useUI } from '../../core/store';
import { SettingsModal } from '../common/SettingsModal';
import { preloadComponent, preloadAllGames } from '../../utils/preload';

interface SidebarProps {
  className?: string;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  isActive: boolean;
  preloadKey?: string;
}

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isCollapsed, isActive, preloadKey }) => {
  const { clearError } = useUI();
  const linkRef = useRef<HTMLAnchorElement>(null);
  
  // 在鼠标悬停时预加载组件
  useEffect(() => {
    if (preloadKey && linkRef.current) {
      const handleMouseEnter = () => {
        preloadComponent(preloadKey as any);
      };
      
      const element = linkRef.current;
      element.addEventListener('mouseenter', handleMouseEnter, { once: true });
      
      return () => {
        element.removeEventListener('mouseenter', handleMouseEnter);
      };
    }
  }, [preloadKey]);
  
  return (
    <Link
      ref={linkRef}
      to={to}
      onClick={() => clearError()} // 点击导航项时清除错误
      className={`
        flex items-center px-5 py-4 rounded-xl transition-all duration-300 ease-in-out
        font-medium text-base min-h-[52px] mb-2 text-white
        ${isActive 
          ? 'bg-[#2a2a2a] text-white shadow-md' 
          : 'hover:bg-[#1a1a1a] hover:text-white hover:shadow-sm'
        }
        ${isCollapsed ? 'justify-center px-3' : 'justify-start'}
      `}
      style={{ margin: isCollapsed ? '0.5rem' : '1rem' }}
      title={isCollapsed ? label : undefined}
    >
      <motion.span 
        className="flex-shrink-0 flex items-center justify-center w-5 h-5"
        style={{ margin: '1rem' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {icon}
      </motion.span>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span 
            className="font-medium whitespace-nowrap ml-3 flex items-center"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
};

// 设置项组件，使用与 NavItem 相同的样式和结构
const SettingsItem: React.FC<SettingsItemProps> = ({ icon, label, isCollapsed, isActive, onClick }) => {
  const { clearError } = useUI();
  
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        clearError(); // 点击设置时清除错误
        onClick();
      }}
      className={`
        flex items-center px-5 py-4 rounded-xl transition-all duration-300 ease-in-out
        font-medium text-base min-h-[52px] mb-2 text-white
        ${isActive 
          ? 'bg-[#2a2a2a] text-white shadow-md' 
          : 'hover:bg-[#1a1a1a] hover:text-white hover:shadow-sm'
        }
        ${isCollapsed ? 'justify-center px-3' : 'justify-start'}
      `}
      style={{ margin: isCollapsed ? '0.5rem' : '1rem' }}
      title={isCollapsed ? label : undefined}
    >
      <motion.span 
        className="flex-shrink-0 flex items-center justify-center w-5 h-5"
        style={{ margin: '1rem' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {icon}
      </motion.span>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span 
            className="font-medium whitespace-nowrap ml-3 flex items-center"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </a>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();
  const games = getAllGames();
  const { settings, toggleSidebar } = useSettings();
  const { clearError } = useUI();
  const isCollapsed = settings.sidebarCollapsed;

  // 设置弹窗状态
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // 路径到预加载键的映射
  const getPreloadKey = (path: string) => {
    const pathMap: Record<string, string> = {
      '/liuyao': 'liuyao',
      '/qimen': 'qimen',
      '/bazi': 'bazi',
      '/palmistry': 'palmistry',
      '/zhougong': 'zhougong',
      '/masters': 'masters'
    };
    return pathMap[path];
  };

  // 构建导航项：首页 + 动态游戏列表
  const navItems = [
    { to: '/', icon: <Home size={20} />, label: '首页', preloadKey: undefined },
    ...games.map(game => ({
      to: game.path,
      icon: game.icon ? <game.icon size={20} /> : <Home size={20} />,
      label: game.name,
      preloadKey: getPreloadKey(game.path)
    }))
  ];

  // 在组件挂载后预加载关键组件
  useEffect(() => {
    // 延迟2秒后在空闲时间预加载所有游戏组件
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          preloadAllGames();
        });
      } else {
        setTimeout(() => {
          preloadAllGames();
        }, 100);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <motion.div 
        className={`
          bg-black border-r border-[#333333] fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 ease-in-out z-40
          ${className || ''}
        `}
        style={{
          width: isCollapsed ? '80px' : '256px'
        }}
        layout
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className={`p-4 border-b border-[#333333] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                style={{ marginTop: '1rem', marginBottom: '1rem', marginLeft: '1.5rem', marginRight: '1rem' }}
              >
                <Star className="w-5 h-5 text-[#FF9900]" style={{ marginRight: '1rem' }} />
                <h1 className="text-white font-medium" style={{ fontSize: '22px' }}>
                  AI占卜
                </h1>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-[#CCCCCC] hover:bg-[#333333] hover:text-white transition-colors"
            style={{ margin: isCollapsed ? '0.5rem' : '1rem' }}
            aria-label={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </motion.div>
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          {navItems.map((item, index) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <NavItem
                to={item.to}
                icon={item.icon}
                label={item.label}
                isCollapsed={isCollapsed}
                isActive={location.pathname === item.to}
                preloadKey={item.preloadKey}
              />
            </motion.div>
          ))}
        </nav>

        {/* 设置按钮 - 固定在底部 */}
        <div className="mt-auto">
          <motion.div 
            className="p-4 border-t border-[#333333] bg-black"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SettingsItem
                icon={<Settings size={20} />}
                label="设置"
                isCollapsed={isCollapsed}
                isActive={isSettingsModalOpen}
                onClick={() => setIsSettingsModalOpen(true)}
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* 设置模态框 */}
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />
    </>
  );
};

export default Sidebar; 