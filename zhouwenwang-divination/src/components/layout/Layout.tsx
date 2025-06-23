import { useEffect } from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import { useSettings, useMaster } from '../../core/store';
import { fetchMasters, getDefaultMaster } from '../../masters/service';

const Layout: React.FC = () => {
  const { settings } = useSettings();
  const { selectedMaster, setSelectedMaster, setAvailableMasters, initializeDefaultMaster } = useMaster();

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