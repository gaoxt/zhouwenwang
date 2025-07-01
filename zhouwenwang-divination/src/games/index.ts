import { Coins, Grid3X3, Hand, Moon } from 'lucide-react';
import type { Game } from '../types';
import { useAppStore } from '../core/store';

// 游戏组件导入
import LiuYaoPage from './liuyao/LiuYaoPage';
import QiMenPage from './qimen/QiMenPage';
import PalmistryPage from './palmistry/PalmistryPage';
import ZhouGongPage from './zhougong/ZhouGongPage';

/**
 * 获取当前选中的大师信息
 * 用于数据生成时包含大师信息
 */
const getCurrentMaster = () => {
  return useAppStore.getState().selectedMaster;
};

/**
 * 游戏注册表
 * 新增游戏时，只需在此数组中添加配置对象即可
 */
const games: Game[] = [
  {
    id: 'liuyao',
    name: '六爻占卜',
    path: '/liuyao',
    component: LiuYaoPage,
    icon: Coins,
    description: '通过摇卦的方式，获得六个爻位，形成卦象，进行占卜分析',
    order: 1,
    generateData: () => {
      const currentMaster = getCurrentMaster();
      return {
        type: 'liuyao',
        timestamp: Date.now(),
        master: currentMaster ? {
          id: currentMaster.id,
          name: currentMaster.name,
          description: currentMaster.description
        } : null,
        data: null
      };
    }
  },
  {
    id: 'qimen',
    name: '奇门遁甲', 
    path: '/qimen',
    component: QiMenPage,
    icon: Grid3X3,
    description: '基于时间起盘，通过九宫八卦的组合，分析事物的发展趋势',
    order: 2,
    generateData: () => {
      const currentMaster = getCurrentMaster();
      return {
        type: 'qimen',
        timestamp: Date.now(),
        master: currentMaster ? {
          id: currentMaster.id,
          name: currentMaster.name,
          description: currentMaster.description
        } : null,
        data: null
      };
    }
  },
  {
    id: 'palmistry',
    name: '手相分析',
    path: '/palmistry', 
    component: PalmistryPage,
    icon: Hand,
    description: '上传手相图片，通过AI分析手掌纹路，解读命运轨迹',
    order: 3,
    generateData: () => {
      const currentMaster = getCurrentMaster();
      return {
        type: 'palmistry',
        timestamp: Date.now(),
        master: currentMaster ? {
          id: currentMaster.id,
          name: currentMaster.name,
          description: currentMaster.description
        } : null,
        data: null
      };
    }
  },
  {
    id: 'zhougong',
    name: '周公解梦',
    path: '/zhougong',
    component: ZhouGongPage,
    icon: Moon,
    description: '承古圣贤智慧，解析梦境奥秘，窥探潜意识深处的神秘信息',
    order: 4,
    generateData: () => {
      const currentMaster = getCurrentMaster();
      return {
        type: 'zhougong',
        timestamp: Date.now(),
        master: currentMaster ? {
          id: currentMaster.id,
          name: currentMaster.name,
          description: currentMaster.description
        } : null,
        data: null
      };
    }
  }
];

/**
 * 根据ID获取游戏配置
 */
export const getGameById = (id: string): Game | undefined => {
  return games.find(game => game.id === id);
};

/**
 * 根据路径获取游戏配置
 */
export const getGameByPath = (path: string): Game | undefined => {
  return games.find(game => game.path === path);
};

/**
 * 获取所有游戏，按order排序
 */
export const getAllGames = (): Game[] => {
  return [...games].sort((a, b) => (a.order || 0) - (b.order || 0));
};

/**
 * 获取游戏总数
 */
export const getGameCount = (): number => {
  return games.length;
};

export default games; 