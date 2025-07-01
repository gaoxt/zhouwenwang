// ecosystem.config.js - 前端PM2配置
module.exports = {
  apps: [
    {
      name: 'frontend-dev',
      script: 'node_modules/vite/bin/vite.js',
      args: '--host 0.0.0.0',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'development',
        HOST: '0.0.0.0',
        PORT: 5173
      },
      error_file: './logs/frontend-dev-err.log',
      out_file: './logs/frontend-dev-out.log',
      log_file: './logs/frontend-dev-combined.log',
      time: true,
      max_memory_restart: '300M',
      restart_delay: 1000,
      autorestart: true
    }
  ]
}; 