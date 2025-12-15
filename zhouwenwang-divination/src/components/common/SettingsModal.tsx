/**
 * 设置模态框组件
 * 提供API密钥配置、数据清除、大师选择等设置功能
 */

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Settings, X, Key, Trash2, Save, Download, Upload, AlertTriangle, User, Check } from 'lucide-react';
import { useStore, useMaster } from '../../core/store';
import { clearAllData, exportSettings, importSettings, exportDivinationRecords } from '../../core/settings';
import { getStorageInfo } from '../../core/storage';
import { MasterSelector } from '../../masters/MasterSelector';
import { API_CONFIG, hasValidApiKey, isValidApiKeyFormat } from '../../masters/config';
import { validateGeminiApiKey } from '../../masters/service';
import { getDefaultServerUrl } from '../../utils/url';
import { 
  baseStyles, 
  presetStyles, 
  textStyles, 
  colors,
  styleUtils
} from '../../styles/modalStyles';

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
  const [serverUrl, setServerUrl] = useState(settings.serverUrl || getDefaultServerUrl());
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [storageInfo, setStorageInfo] = useState(getStorageInfo());
  const [activeTab, setActiveTab] = useState<'api' | 'master' | 'data'>('api');

  // 当设置变化时更新本地状态
  useEffect(() => {
    setApiKey(settings.apiKey);
    setServerUrl(settings.serverUrl || getDefaultServerUrl());
    setStorageInfo(getStorageInfo());
  }, [settings.apiKey, settings.serverUrl]);



  // 清除消息
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  /**
   * 内部保存API配置函数
   */
  const saveApiConfigInternal = async (successMessage?: string): Promise<boolean> => {
    try {
      const trimmedKey = apiKey.trim();
      const trimmedServerUrl = serverUrl.trim();

      // 验证API密钥格式
      if (trimmedKey && !isValidApiKeyFormat(trimmedKey)) {
        setError('API密钥格式无效，请检查输入');
        return false;
      }

      // 验证服务器URL格式
      if (trimmedServerUrl) {
        try {
          new URL(trimmedServerUrl);
        } catch {
          setError('服务器URL格式无效，请输入完整的HTTP/HTTPS地址');
          return false;
        }
      }

      // 更新设置
      const result = await updateSettings({ 
        apiKey: trimmedKey,
        serverUrl: trimmedServerUrl || undefined
      });
      
      if (!result.success) {
        setError(result.error || '保存配置失败');
        return false;
      }

      setSuccess(successMessage || 'API配置已保存');
      
      // 2秒后清除成功消息
      setTimeout(() => {
        setSuccess(null);
      }, 2000);

      return true;
    } catch (error) {
      console.error('保存API配置失败:', error);
      setError('保存API配置时发生未知错误');
      return false;
    }
  };

  /**
   * 测试API密钥
   */
  const handleTestApiKey = async () => {
    try {
      setIsTestingApiKey(true);
      clearMessages();

      const trimmedKey = apiKey.trim();
      
      if (!trimmedKey) {
        setError('请输入API密钥');
        return;
      }

      // 使用service中的统一验证函数
      await validateGeminiApiKey(trimmedKey);
      
      setSuccess('API密钥验证成功！正在保存...');
      console.log('API密钥验证通过');
      
      // 验证成功后自动保存API配置
      const saved = await saveApiConfigInternal('API密钥验证成功 已配置');
      if (!saved) {
        // 如果保存失败，覆盖错误信息为更友好的提示
        setError('API密钥验证成功，但自动保存失败');
      }
    } catch (error) {
      console.error('API密钥验证失败:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('API密钥验证失败');
      }
    } finally {
      setIsTestingApiKey(false);
    }
  };

  /**
   * 测试服务器连接
   */
  const handleTestServer = async () => {
    try {
      setIsTestingServer(true);
      clearMessages();

      const trimmedServerUrl = serverUrl.trim();
      
      if (!trimmedServerUrl) {
        setError('请输入服务器URL');
        return;
      }

      // 测试服务器健康状态
      const response = await fetch(`${trimmedServerUrl.replace(/\/$/, '')}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10秒超时
      });
      
      if (!response.ok) {
        throw new Error(`服务器响应错误: HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'ok') {
        setSuccess('服务器连接测试成功！正在保存...');
        
        // 连接成功后自动保存API配置
        const saved = await saveApiConfigInternal('服务器连接测试成功 已配置');
        if (!saved) {
          // 如果保存失败，覆盖错误信息为更友好的提示
          setError('服务器连接成功，但自动保存失败');
        }
      } else {
        setError('服务器状态异常');
      }
    } catch (error) {
      console.error('服务器连接测试失败:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setError('连接超时，请检查服务器URL或网络连接');
        } else {
          setError(`连接失败: ${error.message}`);
        }
      } else {
        setError('服务器连接测试失败');
      }
    } finally {
      setIsTestingServer(false);
    }
  };

  /**
   * 保存API配置（包括API密钥和服务器URL）
   */
  const handleSaveApiConfig = async () => {
    try {
      setIsLoading(true);
      clearMessages();

      await saveApiConfigInternal();
    } catch (error) {
      console.error('保存API配置失败:', error);
      setError('保存API配置时发生未知错误');
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
      // 不再显示成功提示消息
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
   * 导出所有占卜记录
   */
  const handleExportRecords = async () => {
    try {
      setIsLoading(true);
      clearMessages();
      
      const result = await exportDivinationRecords();
      
      if (!result.success || !result.data) {
        setError(result.error || '导出占卜记录失败');
        return;
      }

      // 创建下载链接
      const blob = new Blob([result.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zhouwenwang-records-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('占卜记录已导出');
      setTimeout(() => setSuccess(null), 2000);
    } catch (error) {
      console.error('导出占卜记录失败:', error);
      setError('导出占卜记录时发生未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 如果不打开则不渲染
  if (!isOpen) return null;

  return (
    <div style={baseStyles.modalOverlay} onClick={onClose}>
      <div 
        style={baseStyles.modalContainer('500px')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div style={baseStyles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px',
                background: 'rgba(255, 153, 0, 0.2)',
                borderRadius: '8px'
              }}>
                <Settings className="h-5 w-5" style={{ color: colors.primary }} />
              </div>
              <span style={textStyles.title}>应用设置</span>
            </div>
            <button
              onClick={onClose}
              style={{
                color: colors.gray[400],
                background: 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              {...styleUtils.createHoverHandlers(
                { color: colors.gray[400], backgroundColor: 'transparent' },
                { color: colors.white, backgroundColor: 'rgba(128, 128, 128, 0.5)' }
              )}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div style={baseStyles.modalContent}>
          {/* 标签页导航 */}
          <div style={{ padding: '16px 24px 0', borderBottom: '1px solid #333333' }}>
            <nav style={{ display: 'flex', gap: '4px' }}>
              {[
                { key: 'api', label: 'API配置', icon: Key },
                { key: 'master', label: '大师选择', icon: User },
                { key: 'data', label: '数据管理', icon: Trash2 },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveTab(key as any);
                    clearMessages(); // 切换标签页时清除消息
                  }}
                  {...presetStyles.tabButtonWithHover(activeTab === key)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div style={baseStyles.contentContainer()}>
            {/* 错误和成功消息 */}
            {error && (
              <div style={presetStyles.message('error')}>
                <AlertTriangle className="h-4 w-4" style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div style={presetStyles.message('success')}>
                <Check className="h-4 w-4" style={{ flexShrink: 0 }} />
                <span>{success}</span>
              </div>
            )}

            {/* API配置标签页 */}
            {activeTab === 'api' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* API密钥配置状态 */}
                {API_CONFIG.GEMINI_API_KEY && API_CONFIG.GEMINI_API_KEY.trim().length > 0 && (
                  <div style={{
                    ...presetStyles.message('success'),
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ADE80', marginBottom: '8px' }}>
                      <Check className="h-4 w-4" />
                      <span style={{ fontWeight: '500' }}>配置文件中已预配置API密钥</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#A7F3D0', lineHeight: '1.5' }}>
                      系统正在使用配置文件中的API密钥，无需在此处手动配置。
                      <br />
                      如需修改，请编辑 <code style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>src/masters/config.ts</code> 文件中的 <code style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>API_CONFIG.GEMINI_API_KEY</code>。
                    </p>
                  </div>
                )}

                {/* 服务器URL设置 */}
                <div style={baseStyles.card()}>
                  <label htmlFor="serverUrl" style={textStyles.label}>
                    <Settings className="h-4 w-4" style={{ color: colors.primary }} />
                    <span>Gemini响应服务器URL（优先）</span>
                  </label>
                  <p style={textStyles.description}>
                    配置后端服务器URL以代理Gemini API请求，避免Key泄露。
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      id="serverUrl"
                      type="url"
                      value={serverUrl}
                      onChange={(e) => setServerUrl(e.target.value)}
                      placeholder={getDefaultServerUrl()}
                      {...presetStyles.inputWithEffects()}
                    />
                    <button
                      onClick={handleTestServer}
                      disabled={isTestingServer || !serverUrl.trim()}
                      {...presetStyles.buttonWithHover('secondary', isTestingServer || !serverUrl.trim(), { whiteSpace: 'nowrap' })}
                    >
                      {isTestingServer ? '测试中...' : '测试连接'}
                    </button>
                  </div>
                </div>

                {/* API密钥设置 */}
                <div style={baseStyles.card()}>
                  <label htmlFor="apiKey" style={textStyles.label}>
                    <Key className="h-4 w-4" style={{ color: colors.primary }} />
                    <span>
                      {API_CONFIG.GEMINI_API_KEY && API_CONFIG.GEMINI_API_KEY.trim().length > 0 
                        ? 'Gemini API密钥（备用配置）' 
                        : 'Gemini API密钥'
                      }
                    </span>
                  </label>
                  {!API_CONFIG.GEMINI_API_KEY || API_CONFIG.GEMINI_API_KEY.trim().length === 0 ? (
                    <p style={textStyles.description}>
                    暂时只支持Gemini
                      {serverUrl.trim() && '如果配置了服务器URL且无需API密钥，此处可留空。'}
                    </p>
                  ) : (
                    <p style={textStyles.description}>
                      当前正在使用配置文件中的API密钥，此处配置仅作为备用。
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <input
                      id="apiKey"
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="请输入您的Gemini API密钥"
                      {...presetStyles.inputWithEffects()}
                    />
                    <button
                      onClick={handleTestApiKey}
                      disabled={isTestingApiKey || !apiKey.trim()}
                      {...presetStyles.buttonWithHover('secondary', isTestingApiKey || !apiKey.trim(), { 
                        whiteSpace: 'nowrap',
                        background: isTestingApiKey || !apiKey.trim() 
                          ? 'linear-gradient(90deg, #6B7280 0%, #4B5563 100%)'
                          : 'linear-gradient(90deg, #059669 0%, #047857 100%)'
                      })}
                    >
                      {isTestingApiKey ? '验证中...' : '验证密钥'}
                    </button>
                  </div>
                  <button
                    onClick={handleSaveApiConfig}
                    disabled={isLoading}
                    {...presetStyles.buttonWithHover('primary', isLoading, { width: '100%' })}
                  >
                    <Save className="h-4 w-4" />
                    <span>{isLoading ? '保存中...' : '保存API配置'}</span>
                  </button>
                </div>


              </div>
            )}

            {/* 大师选择标签页 */}
            {activeTab === 'master' && (
              <div style={baseStyles.card()}>
                <MasterSelector
                  selectedMaster={selectedMaster}
                  onMasterChange={handleMasterChange}
                  loading={isLoading}
                  compact={true}
                />
              </div>
            )}

            {/* 数据管理标签页 */}
            {activeTab === 'data' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 存储空间信息 */}
                <div style={baseStyles.card()}>
                  <h4 style={textStyles.sectionTitle}>
                    <Settings className="h-4 w-4" style={{ color: colors.primary }} />
                    <span>存储空间使用</span>
                  </h4>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ color: colors.gray[300], fontSize: '14px' }}>
                        已使用空间
                      </span>
                      <span style={{ 
                        color: storageInfo.percentage > 80 ? colors.error : colors.gray[300], 
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {Math.round(storageInfo.used / 1024)} KB / {Math.round(storageInfo.total / 1024)} KB ({storageInfo.percentage}%)
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: colors.gray[700],
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(storageInfo.percentage, 100)}%`,
                        height: '100%',
                        backgroundColor: storageInfo.percentage > 80 ? colors.error : 
                                       storageInfo.percentage > 60 ? '#F59E0B' : colors.primary,
                        transition: 'all 0.3s ease'
                      }} />
                    </div>
                    {storageInfo.percentage > 80 && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        color: '#FCA5A5',
                        fontSize: '13px'
                      }}>
                        ⚠️ 存储空间即将用完，建议清理历史记录
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setStorageInfo(getStorageInfo())}
                    {...presetStyles.buttonWithHover('secondary', false, { width: '100%' })}
                  >
                    <Settings className="h-4 w-4" />
                    <span>刷新存储信息</span>
                  </button>
                </div>

                {/* 导出占卜记录 */}
                <div style={baseStyles.card()}>
                  <h4 style={textStyles.sectionTitle}>
                    <Download className="h-4 w-4" style={{ color: colors.primary }} />
                    <span>数据备份</span>
                  </h4>
                  <p style={textStyles.description}>
                    导出您的所有占卜记录以备份
                  </p>
                  <button
                    onClick={handleExportRecords}
                    disabled={isLoading}
                    {...presetStyles.buttonWithHover('secondary', isLoading, { width: '100%' })}
                  >
                    <Download className="h-4 w-4" />
                    <span>{isLoading ? '导出中...' : '导出占卜记录'}</span>
                  </button>
                </div>

                {/* 清除数据 */}
                <div style={baseStyles.card()}>
                  <h4 style={textStyles.sectionTitle}>
                    <Trash2 className="h-4 w-4" style={{ color: colors.error }} />
                    <span>危险操作</span>
                  </h4>
                  <p style={textStyles.description}>
                    清除所有应用数据，包括设置、历史记录和缓存
                  </p>
                  <button
                    onClick={handleClearData}
                    disabled={isLoading}
                    {...presetStyles.buttonWithHover('danger', isLoading, { width: '100%' })}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{isLoading ? '清除中...' : '清除所有数据'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 