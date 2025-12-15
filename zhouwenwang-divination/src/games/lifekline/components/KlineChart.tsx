import React from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import type { KlineData } from '../logic';

interface KlineChartProps {
  data: KlineData[];
  height?: number;
}

// 自定义 Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as KlineData;
    const isRising = data.close > data.open;
    
    return (
      <div className="bg-[#1a1a1a] backdrop-blur-sm p-4 rounded-lg shadow-xl border border-[#333333] text-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-lg text-white">{data.year} {data.yearGanZhi}年 ({data.age}岁)</span>
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
            isRising ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {data.summary} {isRising ? '▲' : '▼'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-3 text-[#CCCCCC]">
          <div>大运: <span className="font-medium text-white">{data.daYun}</span></div>
          <div>开盘: <span className="font-medium text-white">{data.open}</span></div>
          <div>收盘: <span className={`font-medium ${isRising ? 'text-green-400' : 'text-red-400'}`}>{data.close}</span></div>
          <div>最高: <span className="font-medium text-white">{data.high}</span></div>
          <div>最低: <span className="font-medium text-white">{data.low}</span></div>
        </div>
        <div className="text-xs text-[#888888] border-t border-[#333333] pt-2 mt-1 max-w-[240px]">
          {data.wuxingAnalysis}
        </div>
      </div>
    );
  }
  return null;
};

// 自定义蜡烛图形
const CandleStickShape = (props: any) => {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;
  
  const isRising = close >= open;
  const color = isRising ? '#22c55e' : '#ef4444'; // green-500 : red-500
  
  // 计算坐标 (Recharts 的 Y 轴是从下往上的，但 SVG 是从上往下的，需要转换)
  // props.y 是 Bar 顶部的坐标，props.height 是 Bar 的高度
  // 但对于自定义 shape，我们最好直接通过 scale 函数计算
  // 这里 Recharts 的 Bar 已经帮我们算好了 实体的 y 和 height
  
  // 修正：我们需要 YAxis 的 scale 函数来计算 high 和 low 的位置
  // 在 Bar 的 props 里通常不直接包含 scale，这有点麻烦。
  // 简单的 Hack：利用 width/height 比例反推，或者更简单的：
  // 直接画一个矩形代表实体。
  // 至于影线，我们可以单独计算，或者更简单的——用 ErrorBar。
  // 为了美观，我们这里手动计算相对位置。
  // 由于获取不到 scale，我们只能依赖传入的 y 和 height (对应实体的上下沿)。
  
  // 实际上，如果用 Recharts 的 <Bar dataKey="close" /> 并不是我们要的。
  // 我们应该把 data 处理成 [min, max] 给 Bar，然后 Bar 会渲染这个范围。
  // 在这个 Shape 里，y 就是 max 的位置，height 就是 |max - min| 的高度。
  
  // 那么问题来了：High 和 Low 怎么画？
  // 这里的 payload 包含了完整数据。我们需要知道像素比例。
  // 假设 y 是对应 max(open, close) 的位置，y + height 是对应 min(open, close) 的位置。
  // 我们可以算出 unitPixels = height / Math.abs(open - close)。
  // 然后算出 highPos = y - (high - max(open, close)) * unitPixels
  // lowPos = (y + height) + (min(open, close) - low) * unitPixels
  
  const entityMax = Math.max(open, close);
  const entityMin = Math.min(open, close);
  const entityRange = entityMax - entityMin;
  
  // 避免除以0
  const unitPixels = entityRange === 0 ? 0 : height / entityRange;
  
  // 计算影线的像素位置
  // 注意 SVG 坐标系 y 越大越下面
  // top (high)
  const highDist = high - entityMax;
  const yHigh = y - (highDist * unitPixels);
  
  // bottom (low)
  const lowDist = entityMin - low;
  const yLow = (y + height) + (lowDist * unitPixels);
  
  // 蜡烛实体中心 X
  const cx = x + width / 2;

  return (
    <g>
      {/* 影线 (细线) */}
      <line 
        x1={cx} 
        y1={entityRange === 0 ? y - (high - open) * (height || 1) : yHigh} 
        x2={cx} 
        y2={entityRange === 0 ? y + (open - low) * (height || 1) : yLow} 
        stroke={color} 
        strokeWidth={1.5} 
      />
      
      {/* 实体 (矩形) */}
      <rect 
        x={x} 
        y={y} 
        width={width} 
        height={Math.max(2, height)} // 最小高度2，避免看起来消失
        // 涨：空心或白色填充？通常国内涨红跌绿。用户要求：绿色=涨(吉)，红色=跌(凶)
        // 截图显示：绿色实心=涨，红色实心=跌。
        // 等等，通常K线是：阳线(收>开)用红色/空心，阴线(收<开)用绿色/实心 (中国)。
        // 国际上：阳线绿色，阴线红色。
        // 用户截图文案：绿色K线代表运势上涨(吉)，红色K线代表运势下跌(凶)。这符合国际惯例。
        // 并且通常阳线是实心的。
        fill={color}
        rx={1}
      />
    </g>
  );
};

export const KlineChart: React.FC<KlineChartProps> = ({ data, height = 500 }) => {
  // 预处理数据，为 Bar 提供 range 数据 [min, max]
  const processedData = data.map(item => ({
    ...item,
    range: [Math.min(item.open, item.close), Math.max(item.open, item.close)]
  }));

  return (
    <div className="w-full bg-[#1a1a1a] border border-[#333333] rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">人生流年大运K线图</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-sm mr-2"></span>
            <span className="text-[#CCCCCC]">吉运 (涨)</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-sm mr-2"></span>
            <span className="text-[#CCCCCC]">凶运 (跌)</span>
          </div>
        </div>
      </div>
      
      <div style={{ width: '100%', height: height }}>
        <ResponsiveContainer>
          <ComposedChart
            data={processedData}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333333" />
            <XAxis 
              dataKey="age" 
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#CCCCCC' }}
              interval={9} // 每10年显示一个刻度
              tickFormatter={(val) => `${val}`}
              label={{ value: '年龄', position: 'insideBottomRight', offset: -10, fill: '#CCCCCC' }}
            />
            <YAxis 
              domain={[0, 100]} 
              hide={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#CCCCCC' }}
              label={{ value: '运势分', angle: -90, position: 'insideLeft', fill: '#CCCCCC' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            
            {/* 辅助线：60分及格线 */}
            <ReferenceLine y={60} stroke="#444444" strokeDasharray="3 3" />
            
            {/* 大运分割线 (每10年) */}
            {processedData.filter(d => d.age % 10 === 0).map((d, i) => (
               <ReferenceLine key={i} x={d.age} stroke="#2a2a2a" />
            ))}

            {/* 绘制 K 线 */}
            <Bar 
              dataKey="range" 
              shape={<CandleStickShape />} 
              isAnimationActive={true}
              animationDuration={1500}
            >
              {
                processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.close > entry.open ? '#22c55e' : '#ef4444'} />
                ))
              }
            </Bar>
            
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex justify-between text-xs text-[#888888] px-4">
        {/* 在底部显示对应的大运，每10年显示一次 */}
        {processedData.filter((d, i) => i === 0 || d.age % 10 === 0).map((d, i) => (
           <div key={i} style={{ width: '10%' }} className="text-center">
              {d.daYun}运
           </div>
        ))}
      </div>
    </div>
  );
};

