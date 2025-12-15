import { Coins, Grid3X3, Hand, Moon, Calendar, Palette, TrendingUp } from 'lucide-react';
import type { Game } from '../types';
import { useAppStore } from '../core/store';

// 游戏组件导入
import LiuYaoPage from './liuyao/LiuYaoPage';
import QiMenPage from './qimen/QiMenPage';
import PalmistryPage from './palmistry/PalmistryPage';
import ZhouGongPage from './zhougong/ZhouGongPage';
import BaZiPage from './bazi/BaZiPage';
import QinShiPage from './qinshi/QinShiPage';
import LifeKlinePage from './lifekline/LifeKlinePage';

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
  },
  {
    id: 'bazi',
    name: '八字推命',
    path: '/bazi',
    component: BaZiPage,
    icon: Calendar,
    description: '通过生辰八字，推算个人命理运势，解读人生轨迹与性格特征',
    order: 5,
    generateData: () => {
      const currentMaster = getCurrentMaster();
      return {
        type: 'bazi',
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
    id: 'lifekline',
    name: '人生K线',
    path: '/lifekline',
    component: LifeKlinePage,
    icon: TrendingUp,
    description: '通过八字量化算法，生成百岁流年走势K线图，预判人生起伏',
    order: 6,
    generateData: () => {
      const currentMaster = getCurrentMaster();
      return {
        type: 'lifekline',
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
    id: 'qinshi',
    name: '古风头像',
    path: '/qinshi',
    component: QinShiPage,
    icon: Palette,
    description: '上传人像照片，AI生成传统中国古风头像，体验古典魅力',
    order: 6,
    hidden: true, // 隐藏古风头像功能
    generateData: () => {
      return {
        type: 'qinshi',
        timestamp: Date.now(),
        master: null, // 古风头像不使用大师系统
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
 * 获取所有游戏，按order排序，过滤掉隐藏的游戏
 */
export const getAllGames = (): Game[] => {
  return [...games]
    .filter(game => !game.hidden) // 过滤掉hidden为true的游戏
    .sort((a, b) => (a.order || 0) - (b.order || 0));
};

/**
 * 获取游戏总数
 */
export const getGameCount = (): number => {
  return games.filter(game => !game.hidden).length;
};

export default games; 