import { UPSEvent } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface EventLogProps {
  events: UPSEvent[];
  className?: string;
}

export function EventLog({ events, className }: EventLogProps) {
  return (
    <div className={cn("bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col h-full", className)}>
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Event Log</h3>
      
      <div className="space-y-6 overflow-hidden flex-grow overflow-y-auto pr-2">
        {events.map((event) => {
          let colorClass = "border-blue-500/30";
          let dotColor = "bg-blue-500";
          let textColor = "text-slate-200";
          
          if (event.type === 'WARNING') {
            colorClass = "border-amber-500/30";
            dotColor = "bg-amber-500";
            textColor = "text-amber-200";
          } else if (event.type === 'CRITICAL') {
            colorClass = "border-red-500/30";
            dotColor = "bg-red-500";
            textColor = "text-red-300";
          } else if (event.message.includes('Restored') || event.message.includes('charged')) {
            colorClass = "border-emerald-500/30";
            dotColor = "bg-emerald-500";
          }

          const timeString = new Intl.DateTimeFormat('en-US', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          }).format(event.timestamp);

          return (
            <div key={event.id} className={cn("relative pl-6 border-l animate-in slide-in-from-left-2 fade-in duration-300", colorClass)}>
              <div className={cn("absolute -left-[5px] top-1 w-2 h-2 rounded-full", dotColor)}></div>
              <p className="text-[10px] font-mono text-slate-500">{timeString}</p>
              <p className={cn("text-sm font-medium", textColor)}>{event.message}</p>
            </div>
          );
        })}
        {events.length === 0 && (
          <div className="text-slate-500 text-xs font-mono py-8">
            SYSTEM IDLE // NO RECENT EVENTS
          </div>
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-800/50">
        <button className="w-full py-3 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors text-slate-300">View Archive</button>
      </div>
    </div>
  );
}
