// ecosystem.prod.config.js - 生产环境配置
module.exports = {
  apps: [
    {
      name: 'zhouwenwang-prod',
      script: 'server.js',
      instances: 4, // 减少实例数，避免资源过度使用
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001  // 生产环境也用3001，因为不会同时运行
      },
      error_file: './logs/prod-err.log',
      out_file: './logs/prod-out.log',
      log_file: './logs/prod-combined.log',
      time: true,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ]
}; 