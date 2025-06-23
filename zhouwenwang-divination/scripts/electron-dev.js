const { spawn } = require('child_process');
const { join } = require('path');

// 设置环境变量
process.env.NODE_ENV = 'development';
process.env.ELECTRON_ENV = 'development';

// 启动 Electron
const electronPath = require('electron');
const mainPath = join(__dirname, '..', 'electron', 'main.js');

console.log('🚀 启动 Electron 开发模式...');
console.log('环境变量:', {
  NODE_ENV: process.env.NODE_ENV,
  ELECTRON_ENV: process.env.ELECTRON_ENV
});

const electron = spawn(electronPath, [mainPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    ELECTRON_ENV: 'development'
  }
});

electron.on('close', (code) => {
  console.log(`Electron 进程退出，代码: ${code}`);
});

electron.on('error', (error) => {
  console.error('Electron 启动错误:', error);
}); 