# 故障排除指南

## React 无限循环错误修复

### 问题描述
项目在启动时遇到了 React 组件无限循环错误：
```
Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate.
```

### 根本原因
这个问题主要由以下几个因素导致：
1. **Zustand store 的状态选择器问题**：使用对象字面量作为选择器返回值会导致每次渲染都创建新对象
2. **Persist 中间件状态同步问题**：persist 中间件在水合过程中可能产生状态不一致
3. **异步状态更新中的状态获取方式不当**：在 `updateSettings` 方法中使用了不正确的状态获取方式

### 修复方案

#### 1. 优化状态选择器
**修改前（有问题的写法）：**
```typescript
export const useSettings = () => useAppStore((state) => ({
  settings: state.settings,
  setApiKey: state.setApiKey,
  // ... 其他字段
}));
```

**修改后（修复后的写法）：**
```typescript
export const useSettings = () => {
  const settings = useAppStore((state) => state.settings);
  const setApiKey = useAppStore((state) => state.setApiKey);
  // ... 分别获取每个字段
  
  return {
    settings,
    setApiKey,
    // ... 返回稳定的对象结构
  };
};
```

#### 2. 修复异步函数中的状态获取
**修改前：**
```typescript
updateSettings: async (newSettings: Partial<Settings>) => {
  const currentState = useAppStore.getState(); // 有问题
  // ...
}
```

**修改后：**
```typescript
updateSettings: async (newSettings: Partial<Settings>) => {
  const currentSettings = get().settings; // 使用正确的获取方式
  // ...
}
```

#### 3. 添加 Persist 中间件配置
```typescript
{
  name: 'zhouwenwang-app-store',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    settings: state.settings,
    selectedMaster: state.selectedMaster,
    gameHistory: state.gameHistory,
  }),
  skipHydration: false,
  onRehydrateStorage: () => (state) => {
    if (state) {
      console.log('Store 重新水合完成');
    }
  },
}
```

#### 4. 移除不必要的初始化代码
删除了可能导致双重初始化的 `initializeStore` 函数调用。

### PowerShell 使用注意事项
在 Windows PowerShell 环境下工作时：
1. **不要使用 `&&` 连接命令**，使用分号 `;` 或换行分隔
2. **进入正确的项目目录**：`cd zhouwenwang-divination`
3. **避免使用复杂的管道命令**，可能导致终端异常

### 解决方案验证
1. 清理浏览器 localStorage（可选）
2. 重启开发服务器：`npm run dev`
3. 检查浏览器控制台是否还有无限循环错误

### 如果问题仍然存在
如果修复后仍有问题，可以尝试：
1. 清理浏览器缓存和 localStorage
2. 使用简化版的 store (`/src/core/store-simple.ts`)
3. 检查是否有其他组件中的 useEffect 循环 