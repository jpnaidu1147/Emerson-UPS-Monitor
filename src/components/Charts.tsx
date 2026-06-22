import { HistoryDataPoint } from '@/src/types';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from '@/src/lib/utils';

interface ChartsProps {
  data: HistoryDataPoint[];
  className?: string;
}

export function SystemCharts({ data, className }: ChartsProps) {
  return (
    <div className={cn("bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col h-full", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">System Performance</h3>
        <div className="flex gap-4 text-[10px] items-center font-bold uppercase tracking-widest">
          <div className="flex items-center gap-1.5 text-blue-400">
            <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
            Load %
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            Battery %
          </div>
        </div>
      </div>
      
      <div className="flex-grow w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a',
                borderRadius: '12px', 
                border: '1px solid #1e293b',
                color: '#f1f5f9',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Area 
              type="monotone" 
              dataKey="outputLoadU" 
              name="Load %"
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorLoad)" 
              isAnimationActive={false}
            />
            <Area 
              type="monotone" 
              dataKey="batteryLevel" 
              name="Battery %"
              stroke="#10b981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorBattery)" 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
