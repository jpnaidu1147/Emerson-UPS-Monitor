import React from 'react';
import { cn } from '@/src/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  alert?: boolean;
  className?: string;
  iconClassName?: string;
  subType?: string;
  subValue?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendUp,
  alert,
  className,
  subType,
  subValue,
}: MetricCardProps) {
  return (
    <div className={cn("bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between", className)}>
      <div className="flex justify-between items-start">
        <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{title}</h3>
        {Icon && <Icon className="w-5 h-5 text-slate-500" />}
      </div>
      
      <div className="mt-4 flex flex-col gap-1 items-start">
        <div className="flex items-baseline gap-1">
          <span className={cn("text-5xl font-black tracking-tighter", alert ? "text-red-400" : "text-white")}>
            {value}
          </span>
          {unit && <span className="text-xl text-slate-500 font-bold ml-1">{unit}</span>}
        </div>
        
        <div className="mt-2 text-[10px] uppercase font-mono">
          {subValue ? (
            <span className="text-slate-500"><span className="text-slate-400 font-bold">{subType}:</span> {subValue}</span>
          ) : (
            <span className="text-slate-600 font-bold">STABLE // RUNNING</span>
          )}
        </div>
      </div>

      {trend && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span className={cn(
            "font-medium",
            trendUp === true && "text-emerald-400",
            trendUp === false && "text-red-400",
            trendUp === undefined && "text-slate-500"
          )}>
            {trend}
          </span>
          <span className="text-slate-600">vs last hour</span>
        </div>
      )}
    </div>
  );
}
