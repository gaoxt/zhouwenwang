import React, { useEffect, useState } from 'react';
import { getEnvironmentInfo, isElectron } from '../utils/electron';

interface EnvironmentInfo {
  isElectron: boolean;
  platform: string;
  userAgent: string;
  version: string | null;
}

const ElectronInfo: React.FC = () => {
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo | null>(null);

  useEffect(() => {
    const loadEnvInfo = async () => {
      const info = await getEnvironmentInfo();
      setEnvInfo(info);
    };
    
    loadEnvInfo();
  }, []);

  if (!isElectron()) {
    return null; // 只在 Electron 环境中显示
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg shadow-lg text-xs z-50">
      <div className="font-semibold mb-1">🖥️ 桌面应用模式</div>
      {envInfo && (
        <div className="space-y-1">
          <div>平台: {envInfo.platform}</div>
          {envInfo.version && <div>版本: {envInfo.version}</div>}
        </div>
      )}
    </div>
  );
};

export default ElectronInfo; 