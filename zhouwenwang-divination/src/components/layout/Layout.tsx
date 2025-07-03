import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import { MarqueeNotification, GitHubLink, MobileDetector } from '../common';
import { useSettings, useMaster, useUI, useStore } from '../../core/store';
import { fetchMasters, getDefaultMaster } from '../../masters/service';
import { getDefaultServerUrl } from '../../utils/url';

const Layout: React.FC = () => {
  const { settings } = useSettings();
  const { updateSettings } = useStore();
  const { selectedMaster, setSelectedMaster, setAvailableMasters, initializeDefaultMaster } = useMaster();
  const { clearError } = useUI();
  const location = useLocation();

  // 路由变化时清除错误状态
  useEffect(() => {
    clearError();
  }, [location.pathname, clearError]);

  // 初始化设置 - 确保默认serverUrl被保存
  useEffect(() => {
    const initializeSettings = async () => {
      // 如果没有设置serverUrl，保存默认值
      if (!settings.serverUrl) {
        try {
          console.log('初始化默认服务器URL设置...');
          await updateSettings({ 
            serverUrl: getDefaultServerUrl()
          });
          console.log('默认服务器URL已设置');
        } catch (error) {
          console.error('初始化默认设置失败:', error);
        }
      }
    };

    initializeSettings();
  }, []); // 只在组件挂载时执行一次

  // 初始化大师列表
  useEffect(() => {
    const initializeMasters = async () => {
      try {
        console.log('正在初始化大师列表...');
        const masters = await fetchMasters();
        setAvailableMasters(masters);
        
        // 如果没有选中的大师，设置默认大师
        if (!selectedMaster) {
          const defaultMaster = getDefaultMaster(masters);
          if (defaultMaster) {
            console.log('设置默认大师:', defaultMaster);
            setSelectedMaster(defaultMaster);
          }
        } else {
          // 如果有选中的大师，但不在可用列表中，重新设置默认大师
          const masterExists = masters.find(m => m.id === selectedMaster.id);
          if (!masterExists) {
            const defaultMaster = getDefaultMaster(masters);
            if (defaultMaster) {
              console.log('重新设置默认大师:', defaultMaster);
              setSelectedMaster(defaultMaster);
            }
          }
        }
        
        // 调用初始化默认大师方法
        initializeDefaultMaster();
        
      } catch (error) {
        console.error('初始化大师列表失败:', error);
      }
    };

    initializeMasters();
  }, []); // 只在组件挂载时执行一次

  return (
    <div className="bg-black min-h-screen">
      {/* 移动端检测组件 - 最高优先级 */}
      <MobileDetector />
      
      {/* 跑马灯通知 - 全局覆盖 */}
      <MarqueeNotification apiBaseUrl={settings.serverUrl} />
      
      {/* GitHub 链接 - 固定在右上角 */}
      <GitHubLink />
      
      <Sidebar />
      <div 
        className="transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: settings.sidebarCollapsed ? '80px' : '256px'
        }}
      >
        <MainContent isCollapsed={settings.sidebarCollapsed} />
      </div>
    </div>
  );
};

export default Layout; 