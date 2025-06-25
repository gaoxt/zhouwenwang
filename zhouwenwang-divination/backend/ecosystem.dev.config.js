// ecosystem.dev.config.js - 开发环境配置
module.exports = {
  apps: [
    {
      name: 'zhouwenwang-dev',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: true,
      watch_delay: 1000,
      ignore_watch: ['node_modules', 'logs', '.git'],
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      error_file: './logs/dev-err.log',
      out_file: './logs/dev-out.log',
      log_file: './logs/dev-combined.log',
      time: true,
      max_memory_restart: '200M'
    }
  ]
}; 