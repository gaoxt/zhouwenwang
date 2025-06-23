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
    include: ['react', 'react-dom', 'axios', 'zustand'],
    // 强制预构建这些依赖
    force: false
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  // 开发环境性能优化
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
