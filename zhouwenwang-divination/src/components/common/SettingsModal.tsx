/**
 * 设置模态框组件
 * 提供API密钥配置、数据清除、大师选择等设置功能
 */

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Settings, X, Key, Trash2, Save, Download, Upload, AlertTriangle, User } from 'lucide-react';
import { useStore, useMaster } from '../../core/store';
import { validateApiKey, clearAllData, exportSettings, importSettings } from '../../core/settings';
import { getStorageInfo } from '../../core/storage';
import { MasterSelector } from '../../masters/MasterSelector';
import { API_CONFIG, hasValidApiKey } from '../../masters/config';

interface SettingsModalProps {
  /** 是否显示模态框 */
  isOpen: boolean;
  /** 关闭模态框回调 */
  onClose: () => void;
}

/**
 * 设置模态框组件
 */
export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  // Zustand store
  const { settings, updateSettings } = useStore();
  const { selectedMaster, setSelectedMaster } = useMaster();
  
  // 本地状态
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [storageInfo, setStorageInfo] = useState(getStorageInfo());
  const [activeTab, setActiveTab] = useState<'api' | 'master' | 'data'>('api');

  // 当设置变化时更新本地状态
  useEffect(() => {
    setApiKey(settings.apiKey);
    setStorageInfo(getStorageInfo());
  }, [settings.apiKey]);

  // 清除消息
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  /**
   * 保存API密钥
   */
  const handleSaveApiKey = async () => {
    try {
      setIsLoading(true);
      clearMessages();

      const trimmedKey = apiKey.trim();

      // 验证API密钥格式
      if (trimmedKey && !validateApiKey(trimmedKey)) {
        setError('API密钥格式无效，请检查输入');
        return;
      }

      // 更新设置
      const result = await updateSettings({ apiKey: trimmedKey });
      
      if (!result.success) {
        setError(result.error || '保存API密钥失败');
        return;
      }

      setSuccess('API密钥已保存');
      
      // 2秒后清除成功消息
      setTimeout(() => {
        setSuccess(null);
      }, 2000);
    } catch (error) {
      console.error('保存API密钥失败:', error);
      setError('保存API密钥时发生未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理大师选择变化
   */
  const handleMasterChange = (master: any) => {
    try {
      clearMessages();
      setSelectedMaster(master);
      setSuccess(`已选择大师：${master.name}`);
      
      // 2秒后清除成功消息
      setTimeout(() => {
        setSuccess(null);
      }, 2000);
    } catch (error) {
      console.error('选择大师失败:', error);
      setError('选择大师时发生错误');
    }
  };

  /**
   * 清除所有数据
   */
  const handleClearData = async () => {
    try {
      setIsLoading(true);
      clearMessages();

      console.log('开始清除所有应用数据...');

      // 清除本地存储数据
      const result = await clearAllData();
      
      if (!result.success) {
        console.error('清除本地存储失败:', result.error);
        setError(result.error || '清除数据失败');
        return;
      }

      console.log('本地存储数据已清除');

      // 重置store状态到默认值
      try {
        await updateSettings({ apiKey: '', sidebarCollapsed: false });
        console.log('store状态已重置');
      } catch (storeError) {
        console.warn('重置store状态失败:', storeError);
        // 继续执行，不中断清除流程
      }

      // 刷新存储信息
      setStorageInfo(getStorageInfo());
      
      setSuccess('所有数据已清除成功！');
      setShowClearConfirm(false);
      
      console.log('数据清除操作完成');
      
      // 2秒后关闭模态框
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('清除数据失败:', error);
      setError('清除数据时发生未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 导出设置
   */
  const handleExportSettings = async () => {
    try {
      clearMessages();
      
      const result = exportSettings();
      
      if (!result.success || !result.data) {
        setError(result.error || '导出设置失败');
        return;
      }

      // 创建下载链接
      const blob = new Blob([result.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zhouwenwang-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('设置已导出');
      setTimeout(() => setSuccess(null), 2000);
    } catch (error) {
      console.error('导出设置失败:', error);
      setError('导出设置时发生未知错误');
    }
  };

  /**
   * 导入设置
   */
  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      clearMessages();
      
      const file = event.target.files?.[0];
      if (!file) return;

      const text = await file.text();
      const result = importSettings(text);
      
      if (!result.success || !result.data) {
        setError(result.error || '导入设置失败');
        return;
      }

      // 更新store状态
      await updateSettings(result.data);
      
      setSuccess('设置已导入');
      setTimeout(() => setSuccess(null), 2000);
    } catch (error) {
      console.error('导入设置失败:', error);
      setError('导入设置时发生未知错误');
    }
    
    // 重置文件输入
    event.target.value = '';
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-black border border-[#333333] p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-white flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>应用设置</span>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-[#CCCCCC] hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Title>

                {/* 标签页导航 */}
                <div className="mt-4 border-b border-[#333333]">
                  <nav className="flex space-x-8">
                    <button
                      onClick={() => setActiveTab('api')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'api'
                          ? 'border-[#FF9900] text-[#FF9900]'
                          : 'border-transparent text-[#CCCCCC] hover:text-white hover:border-[#666666]'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Key className="h-4 w-4" />
                        <span>API配置</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('master')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'master'
                          ? 'border-[#FF9900] text-[#FF9900]'
                          : 'border-transparent text-[#CCCCCC] hover:text-white hover:border-[#666666]'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>大师选择</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('data')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'data'
                          ? 'border-[#FF9900] text-[#FF9900]'
                          : 'border-transparent text-[#CCCCCC] hover:text-white hover:border-[#666666]'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Trash2 className="h-4 w-4" />
                        <span>数据管理</span>
                      </div>
                    </button>
                  </nav>
                </div>

                <div className="mt-6 space-y-6">
                  {/* 错误和成功消息 */}
                  {error && (
                    <div className="bg-red-900/20 border border-red-500 text-red-300 px-3 py-2 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  
                  {success && (
                    <div className="bg-green-900/20 border border-green-500 text-green-300 px-3 py-2 rounded-lg text-sm">
                      {success}
                    </div>
                  )}

                  {/* API配置标签页 */}
                  {activeTab === 'api' && (
                    <div className="space-y-6">
                      {/* API密钥配置状态 */}
                      {API_CONFIG.GEMINI_API_KEY && API_CONFIG.GEMINI_API_KEY.trim().length > 0 && (
                        <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
                          <div className="flex items-center space-x-2 text-green-300 mb-2">
                            <Key className="h-4 w-4" />
                            <span className="font-medium">配置文件中已预配置API密钥</span>
                          </div>
                          <p className="text-sm text-green-200">
                            系统正在使用配置文件中的API密钥，无需在此处手动配置。
                            <br />
                            如需修改，请编辑 <code className="bg-black/30 px-1 rounded">src/masters/config.ts</code> 文件中的 <code className="bg-black/30 px-1 rounded">API_CONFIG.GEMINI_API_KEY</code>。
                          </p>
                        </div>
                      )}

                      {/* API密钥设置 */}
                      <div className="space-y-3">
                        <label htmlFor="apiKey" className="block text-sm font-medium text-[#CCCCCC]">
                          <div className="flex items-center space-x-2">
                            <Key className="h-4 w-4" />
                            <span>
                              {API_CONFIG.GEMINI_API_KEY && API_CONFIG.GEMINI_API_KEY.trim().length > 0 
                                ? 'Gemini API密钥（备用配置）' 
                                : 'Gemini API密钥'
                              }
                            </span>
                          </div>
                        </label>
                        {!API_CONFIG.GEMINI_API_KEY || API_CONFIG.GEMINI_API_KEY.trim().length === 0 ? (
                          <p className="text-xs text-[#888888]">
                            请在此处配置您的Gemini API密钥，或在配置文件中预配置以避免每次输入。
                          </p>
                        ) : (
                          <p className="text-xs text-[#888888]">
                            当前正在使用配置文件中的API密钥，此处配置仅作为备用。
                          </p>
                        )}
                        <input
                          id="apiKey"
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="请输入您的Gemini API密钥"
                          className="w-full px-3 py-2 bg-black border border-[#333333] rounded-lg text-white placeholder-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all"
                        />
                        <button
                          onClick={handleSaveApiKey}
                          disabled={isLoading}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[#FF9900] hover:bg-[#E68A00] disabled:bg-[#666666] text-black rounded-lg transition-colors font-medium"
                        >
                          <Save className="h-4 w-4" />
                          <span>{isLoading ? '保存中...' : '保存API密钥'}</span>
                        </button>
                      </div>

                      {/* 存储信息 */}
                      {storageInfo.isAvailable && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-[#CCCCCC]">存储使用情况</h4>
                          <div className="bg-[#111111] border border-[#333333] rounded-lg p-3 space-y-2">
                            <div className="flex justify-between text-xs text-[#888888]">
                              <span>已使用: {(storageInfo.used / 1024).toFixed(1)} KB</span>
                              <span>使用率: {storageInfo.percentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-[#333333] rounded-full h-2">
                              <div 
                                className="bg-[#FF9900] h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 大师选择标签页 */}
                  {activeTab === 'master' && (
                    <div className="space-y-4">
                      <div className="text-sm text-[#CCCCCC] mb-4">
                        选择您的默认占卜大师，这将应用到所有占卜游戏中
                      </div>
                      <MasterSelector
                        selectedMaster={selectedMaster}
                        onMasterChange={handleMasterChange}
                        loading={isLoading}
                        className="p-4 bg-[#111111] border border-[#333333] rounded-xl"
                        compact={true}
                      />
                    </div>
                  )}

                  {/* 数据管理标签页 */}
                  {activeTab === 'data' && (
                    <div className="space-y-6">
                      {/* 导入导出 */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-[#CCCCCC]">备份与恢复</h4>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleExportSettings}
                            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-[#333333] hover:bg-[#444444] text-white rounded-lg transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            <span>导出设置</span>
                          </button>
                          
                          <label className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-[#333333] hover:bg-[#444444] text-white rounded-lg transition-colors cursor-pointer">
                            <Upload className="h-4 w-4" />
                            <span>导入设置</span>
                            <input
                              type="file"
                              accept=".json"
                              onChange={handleImportSettings}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* 清除数据 */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-[#CCCCCC]">危险操作</h4>
                        {!showClearConfirm ? (
                          <button
                            onClick={() => setShowClearConfirm(true)}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>清除所有数据</span>
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-start space-x-2 p-3 bg-red-900/20 border border-red-500 rounded-lg">
                              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-red-300">
                                <p className="font-medium">确认清除所有数据？</p>
                                <p className="mt-1">此操作将删除所有设置、历史记录和缓存数据，且无法撤销。</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 px-3 py-2 bg-[#666666] hover:bg-[#777777] text-white rounded-lg transition-colors"
                              >
                                取消
                              </button>
                              <button
                                onClick={handleClearData}
                                disabled={isLoading}
                                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-[#666666] text-white rounded-lg transition-colors"
                              >
                                {isLoading ? '清除中...' : '确认清除'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 