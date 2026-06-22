import { cn } from '@/src/lib/utils';

interface VerticalMeterProps {
  title: string;
  value: number;
  max: number;
  unit: string;
  colorClass: string;
  className?: string;
  alert?: boolean;
}

export function VerticalMeter({ title, value, max, unit, colorClass, className, alert }: VerticalMeterProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn(
      "bg-slate-900 border rounded-3xl p-6 flex flex-col items-center justify-between min-h-[300px] transition-all duration-300", 
      alert ? "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]" : "border-slate-800",
      className
    )}>
      <h3 className={cn(
        "text-[10px] font-bold uppercase tracking-widest text-center h-8 flex items-center justify-center leading-tight transition-colors",
        alert ? "text-red-400" : "text-slate-400"
      )}>
        {title}
      </h3>
      
      <div className="flex-grow w-full flex items-end justify-center py-4 relative">
         {/* Meter background container */}
         <div className={cn(
           "absolute inset-y-4 w-16 bg-slate-950 rounded-lg overflow-hidden border shadow-inner transition-colors",
           alert ? "border-red-500/30" : "border-slate-800"
         )}>
           
           {/* Tick marks/Grid */}
           <div className="absolute inset-0 flex flex-col justify-between py-2 px-1 z-10 pointer-events-none">
             {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full flex items-center justify-center gap-1 opacity-40">
                  <div className="w-2 h-px bg-slate-500 rounded-full"></div>
                  <div className="flex-grow border-t border-slate-700/50 border-dashed"></div>
                  <div className="w-2 h-px bg-slate-500 rounded-full"></div>
                </div>
             ))}
           </div>

           {/* Meter Fill Element */}
           <div
             className={cn(
               "absolute bottom-0 w-full transition-all duration-700 ease-out z-0", 
               alert ? "bg-red-500 animate-pulse" : colorClass
             )}
             style={{ height: `${percentage}%` }}
           >
             {/* Gloss / inner shadow effect for 3D bar feel */}
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
             <div className="absolute top-0 w-full h-1 bg-white/40"></div>
           </div>
         </div>
      </div>

      <div className="text-center mt-2 flex flex-col items-center">
         <div className="text-3xl font-black text-white font-mono tracking-tighter">
            {value % 1 !== 0 ? value.toFixed(1) : Math.round(value)}
         </div>
         <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">{unit}</div>
      </div>
    </div>
  );
}
