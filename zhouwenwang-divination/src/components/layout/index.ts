// 导出布局组件
export { default as Layout } from './Layout';
export { default as Sidebar } from './Sidebar';
export { default as MainContent } from './MainContent';

// 同时提供默认导出，以防有地方需要
import Layout from './Layout';
export default Layout; 