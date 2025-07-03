import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 为 Electron 设置相对路径
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5173,      // 指定端口
    strictPort: true, // 端口被占用时不会自动切换
    hmr: {
      overlay: false  // 禁用错误覆盖层，提升性能
    },
    // 优化开发服务器性能
    fs: {
      strict: false
    }
  },
  // 优化开发环境构建
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'axios', 
      'zustand',
      'framer-motion',
      'react-router-dom',
      'react-markdown',
      'remark-gfm',
      'lucide-react'
    ],
    // 强制预构建这些依赖
    force: false
  },
  build: {
    outDir: 'dist',
    // 启用代码分割
    rollupOptions: {
      output: {
        // 手动代码分割
        manualChunks: {
          // 将React相关库打包到一个chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 将UI库打包到一个chunk
          'ui-vendor': ['framer-motion', 'lucide-react'],
          // 将工具库打包到一个chunk
          'utils-vendor': ['axios', 'zustand', 'react-markdown', 'remark-gfm'],
        },
        // 优化chunk文件名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      },
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        // 只在生产环境移除console.log
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production'
      }
    },
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 设置chunk大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用源码映射（可选，用于调试）
    sourcemap: false
  },
  // 开发环境性能优化
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // 只在生产环境移除所有console和debugger
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
})
