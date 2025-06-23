const { contextBridge, ipcRenderer } = require('electron');

// 暴露保护的方法给渲染进程使用
contextBridge.exposeInMainWorld('electronAPI', {
  // 示例：获取应用版本
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // 示例：平台信息
  getPlatform: () => process.platform,
  
  // 示例：是否为 Electron 环境
  isElectron: () => true,
});

// 监听主进程事件
window.addEventListener('DOMContentLoaded', () => {
  console.log('Electron 预加载脚本已加载');
}); 