/**
 * URL 工具函数
 */

/**
 * 获取动态服务器URL
 * 基于当前页面的域名/IP构建服务器地址，端口固定为3001
 * @returns 服务器URL，例如 http://10.10.9.123:3001 或 http://115.190.35.66:3001
 */
export function getDynamicServerUrl(): string {
  // 获取当前页面的协议、主机名
  const { protocol, hostname } = window.location;
  
  // 构建服务器URL，使用3001端口
  return `${protocol}//${hostname}:3001`;
}

/**
 * 获取默认服务器URL
 * 如果是浏览器环境，返回动态URL；否则返回硬编码的默认值
 * @returns 服务器URL
 */
export function getDefaultServerUrl(): string {
  // 检查是否在浏览器环境中
  if (typeof window !== 'undefined' && window.location) {
    return getDynamicServerUrl();
  }
  
  // 服务器端渲染或其他环境的后备选项
  return 'http://10.10.9.123:3001';
} 