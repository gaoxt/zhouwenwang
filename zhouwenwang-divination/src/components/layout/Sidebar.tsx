import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Star,
  X,
  Check,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { getAllGames } from '../../games';
import { useSettings, useAppStore } from '../../core/store';
import { fetchMasters, validateGeminiApiKey } from '../../masters/service';
import type { Master } from '../../types';

interface SidebarProps {
  className?: string;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isCollapsed, isActive }) => {
  return (
    <Link
      to={to}
      className={`
        flex items-center px-5 py-4 rounded-xl transition-all duration-300 ease-in-out
        font-medium text-sm min-h-[52px] mb-2 text-white
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

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();
  const games = getAllGames();
  const { settings, toggleSidebar } = useSettings();
  const { selectedMaster, setSelectedMaster, updateSettings } = useAppStore();
  const isCollapsed = settings.sidebarCollapsed;

  // 设置弹窗状态
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [masters, setMasters] = useState<Master[]>([]);
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [validationError, setValidationError] = useState<string>('');

  // 加载大师列表
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const mastersData = await fetchMasters();
        setMasters(mastersData);
      } catch (error) {
        console.error('加载大师数据失败:', error);
      }
    };
    loadMasters();
  }, []);

  // 构建导航项：首页 + 动态游戏列表
  const navItems = [
    { to: '/', icon: <Home size={20} />, label: '首页' },
    ...games.map(game => ({
      to: game.path,
      icon: game.icon ? <game.icon size={20} /> : <Home size={20} />,
      label: game.name
    }))
  ];

  // 验证API Key
  const handleValidateApiKey = async () => {
    if (!apiKey.trim()) {
      setValidationError('请输入API Key');
      setValidationStatus('error');
      setTimeout(() => {
        setValidationStatus('idle');
        setValidationError('');
      }, 3000);
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');
    setValidationError('');

    try {
      // 使用service中的验证函数
      await validateGeminiApiKey(apiKey);

      // 保存API Key到store
      updateSettings({ apiKey: apiKey.trim() });
      setValidationStatus('success');
      
      // 3秒后重置状态
      setTimeout(() => {
        setValidationStatus('idle');
      }, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '验证失败，请检查网络连接';
      console.error('API Key验证失败:', error);
      setValidationError(errorMessage);
      setValidationStatus('error');
      setTimeout(() => {
        setValidationStatus('idle');
        setValidationError('');
      }, 5000);
    } finally {
      setIsValidating(false);
    }
  };

  // 大师选择变更
  const handleMasterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const masterId = event.target.value;
    const master = masters.find(m => m.id === masterId);
    if (master) {
      setSelectedMaster(master);
    }
  };

  // 清空历史记录
  const handleClearHistory = () => {
    if (confirm('确定要删除所有历史记录吗？此操作无法撤销。')) {
      localStorage.removeItem('divination_history');
      alert('历史记录已清空');
    }
  };

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
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className={`
                  flex items-center transition-all duration-300 ease-in-out
                  font-medium text-sm min-h-[52px] mb-2 text-white
                  ${isCollapsed ? 'justify-center px-2 py-3' : 'justify-start px-5 py-4'}
                `}
                style={{ 
                  margin: isCollapsed ? '0.5rem' : '1rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  backgroundColor: isSettingsModalOpen ? '#2a2a2a' : 'transparent',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  if (!isSettingsModalOpen) {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSettingsModalOpen) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                title={isCollapsed ? '设置' : undefined}
              >
                <motion.span
                  className="flex-shrink-0 flex items-center justify-center w-5 h-5"
                  style={{ margin: '1rem' }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings size={20} />
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
                      设置
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* 简化设置弹窗 */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <motion.div
            className="fixed top-0 left-0 w-full h-full z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSettingsModalOpen(false)}
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <motion.div
              className="bg-[#111111] border border-[#333333] w-[480px] relative"
              style={{ 
                padding: '1rem',
                borderRadius: '16px'
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 标题栏 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Settings className="h-6 w-6 text-[#FF9900]" />
                  <h2 className="text-xl font-semibold text-white">应用设置</h2>
                </div>
                <motion.button
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="p-2 hover:bg-[#333333] rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5 text-[#CCCCCC]" />
                </motion.button>
              </div>

              <div className="space-y-6">
                {/* 1. API Key 配置 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-6">
                    <h3 className="text-white font-medium" style={{ marginRight: '10px' }}>API Key</h3>
                    <div className="flex-1 flex gap-3">
                      <input
                        type="text"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="请输入您的Gemini API Key (以AIza开头)"
                        className="flex-1 bg-[#222222] border border-[#444444] px-4 py-2 text-white focus:border-[#FF9900] focus:outline-none white-placeholder"
                        style={{ 
                          borderRadius: '12px',
                          color: 'white'
                        }}
                      />
                      <motion.button
                        onClick={handleValidateApiKey}
                        disabled={isValidating}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center min-w-[80px] ${
                          validationStatus === 'success' 
                            ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg' 
                            : validationStatus === 'error'
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                            : isValidating
                            ? 'bg-[#FF9900] text-black cursor-not-allowed'
                            : 'bg-[#FF9900] hover:bg-[#E68A00] text-black shadow-md hover:shadow-lg'
                        }`}
                        whileHover={isValidating ? {} : { scale: 1.02 }}
                        whileTap={isValidating ? {} : { scale: 0.98 }}
                        animate={
                          validationStatus === 'success' 
                            ? { scale: [1, 1.05, 1] }
                            : validationStatus === 'error'
                            ? { x: [-2, 2, -2, 2, 0] }
                            : {}
                        }
                        transition={{ duration: 0.3 }}
                      >
                        {isValidating ? (
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : validationStatus === 'success' ? (
                          <Check className="h-4 w-4" />
                        ) : validationStatus === 'error' ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <span>验证</span>
                        )}
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* 验证状态消息 */}
                  <AnimatePresence>
                    {(validationStatus === 'success' || validationStatus === 'error') && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={`text-sm px-3 py-2 rounded-lg ${
                          validationStatus === 'success'
                            ? 'text-green-400 bg-green-500/10'
                            : 'text-red-400 bg-red-500/10'
                        }`}
                      >
                        {validationStatus === 'success' 
                          ? '✅ API Key验证成功，已保存到设置中'
                          : `❌ ${validationError || '验证失败'}`
                        }
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 分割线 */}
                <div className="border-t border-[#333333]" />

                {/* 2. 大师选择 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-6">
                    <h3 className="text-white font-medium">选择占卜大师</h3>
                    <div className="flex justify-end">
                      <select
                        value={selectedMaster?.id || ''}
                        onChange={handleMasterChange}
                        className="bg-[#333333] border border-[#444444] px-4 py-3 text-white focus:border-[#FF9900] focus:outline-none w-32 font-medium text-base"
                        style={{ 
                          minHeight: '44px', 
                          color: 'white', 
                          fontSize: '16px',
                          borderRadius: '12px'
                        }}
                      >
                        {masters.map((master) => (
                          <option key={master.id} value={master.id} className="bg-[#333333] text-white font-medium" style={{ color: 'white', backgroundColor: '#333333' }}>
                            {master.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[#888888] text-xs" style={{ margin: '10px 0' }}>{selectedMaster ? selectedMaster.description : '选择您喜欢的占卜大师风格'}</p>
                </div>

                {/* 分割线 */}
                <div className="border-t border-[#333333]" />

                {/* 3. 清空历史 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-6">
                    <h3 className="text-white font-medium">删除所有聊天</h3>
                    <div className="flex-1 flex justify-end">
                      <motion.button
                        onClick={handleClearHistory}
                        className="flex items-center space-x-2 px-4 py-2 bg-transparent border border-red-400 hover:bg-red-400/10 rounded-lg transition-colors font-medium"
                        style={{ color: '#fca5a5' }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Trash2 className="h-4 w-4" style={{ color: '#fca5a5' }} />
                        <span>全部删除</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar; 