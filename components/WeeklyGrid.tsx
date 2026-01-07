
import React from 'react';
import { 
  addDays, 
  format, 
  isSameDay, 
  isToday
} from 'date-fns';
import { IdentityState, WorkoutEntry, IDENTITY_METADATA, WorkoutPlan } from '../types.ts';
import { Plus, Sparkles } from 'lucide-react';
import { MuscleIcon } from './PlanBuilder.tsx';

const startOfDay = (date: Date | number) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = (date: Date | number, options?: { weekStartsOn?: number }) => {
  const d = new Date(date);
  const day = d.getDay();
  const weekStartsOn = options?.weekStartsOn ?? 0;
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

interface WeeklyGridProps {
  entries: WorkoutEntry[];
  plans: WorkoutPlan[];
  onEntryClick?: (id: string) => void;
  onCellClick?: (date: Date, identity: IdentityState) => void;
  weekStart?: Date;
}

const WeeklyGrid: React.FC<WeeklyGridProps> = ({ 
  entries, 
  plans, 
  onEntryClick, 
  onCellClick, 
  weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }) 
}) => {
  const days: Date[] = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const identities = [
    IdentityState.OVERDRIVE,
    IdentityState.NORMAL,
    IdentityState.MAINTENANCE,
    IdentityState.SURVIVAL,
    IdentityState.REST
  ];

  const getEntriesForCell = (day: Date, identity: IdentityState): WorkoutEntry[] => {
    return entries.filter(e => 
      isSameDay(startOfDay(new Date(e.timestamp)), startOfDay(day)) && 
      e.identity === identity
    );
  };

  const getDayHasEntry = (day: Date) => {
    return entries.some(e => isSameDay(startOfDay(new Date(e.timestamp)), startOfDay(day)));
  };

  const getPlanMuscleTypes = (planId?: string): string[] => {
    if (!planId) return [];
    const plan = plans.find(p => p.id === planId);
    if (!plan) return [];
    return Array.from<string>(new Set(plan.exercises.map(ex => ex.muscleType)));
  };

  return (
    <div className="bg-[#080808] border border-neutral-800 rounded-2xl overflow-hidden relative h-full flex flex-col">
      
      {/* OS Grid Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.15]" 
           style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
      />

      <style>{`
        @keyframes pulse-overdrive {
          0%, 100% { opacity: 1; filter: brightness(1); }
          50% { opacity: 0.8; filter: brightness(1.2); }
        }
        .matrix-cell {
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
        .matrix-cell:hover {
          background-color: rgba(255, 255, 255, 0.02);
        }
      `}</style>

      {/* Grid Headers */}
      <div className="grid grid-cols-7 border-b border-neutral-800 shrink-0 bg-black relative z-10">
        {days.map((day, i) => (
          <div 
            key={day.toISOString()} 
            className={`p-3 sm:p-4 text-center border-r border-neutral-800 last:border-r-0 transition-colors ${isToday(day) ? 'bg-emerald-500/5' : ''}`}
          >
            <div className={`text-[8px] font-mono uppercase mb-1 tracking-widest ${isToday(day) ? 'text-emerald-500 font-bold' : 'text-neutral-600'}`}>
              DAY_0{i+1}
            </div>
            <div className={`text-base sm:text-xl font-bold tracking-tight ${isToday(day) ? 'text-white' : 'text-neutral-400'}`}>
              {format(day, 'dd')}
            </div>
            <div className={`text-[9px] font-mono uppercase mt-0.5 ${isToday(day) ? 'text-emerald-500/70' : 'text-neutral-700'}`}>
              {format(day, 'eee')}
            </div>
          </div>
        ))}
      </div>

      {/* Identity Matrix Body */}
      <div className="divide-y divide-neutral-800 flex-1 flex flex-col relative z-10">
        {identities.map((idType) => {
          const meta = IDENTITY_METADATA[idType];
          return (
            <div key={idType} className="grid grid-cols-7 flex-1 min-h-[100px] relative">
              {days.map((day) => {
                const cellEntries = getEntriesForCell(day, idType);
                const hasAnyEntryInCol = getDayHasEntry(day);
                const canLog = !hasAnyEntryInCol;

                return (
                  <div 
                    key={`${day.toISOString()}-${idType}`}
                    onClick={() => canLog ? onCellClick?.(day, idType) : cellEntries.length > 0 ? onEntryClick?.(cellEntries[0].id) : null}
                    className={`p-1.5 border-r border-neutral-800 last:border-r-0 flex flex-col transition-all relative group/cell cursor-pointer matrix-cell
                      ${!canLog && cellEntries.length === 0 ? 'opacity-[0.03] pointer-events-none' : ''}
                    `}
                  >
                    {/* Ghost Icon for Log Intent */}
                    {cellEntries.length === 0 && canLog && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
                        <Plus size={16} className="text-neutral-700" />
                      </div>
                    )}
                    
                    {cellEntries.map(entry => {
                      const isOverdrive = entry.identity === IdentityState.OVERDRIVE;
                      const animationClass = isOverdrive ? 'animate-[pulse-overdrive_2s_infinite_ease-in-out]' : '';
                      const muscleTypes = getPlanMuscleTypes(entry.planId);
                      
                      return (
                        <div 
                          key={entry.id}
                          onClick={(e) => { e.stopPropagation(); onEntryClick?.(entry.id); }} 
                          className={`group/entry relative p-2 rounded-xl border text-left transition-all h-full flex flex-col justify-between
                            ${meta.color} ${meta.borderColor} ${meta.textColor}
                            ${animationClass}
                            hover:brightness-110 active:scale-[0.98]
                          `}
                        >
                          <div className="relative z-10">
                            <div className="flex justify-between items-center opacity-70 mb-1">
                                <span className="text-[8px] font-mono font-bold tracking-tight">{format(new Date(entry.timestamp), 'HH:mm')}</span>
                                {isOverdrive && <Sparkles size={10} className="text-white" />}
                            </div>
                            <div className="text-[10px] font-black uppercase leading-none tracking-tight">
                                {meta.label}
                            </div>
                          </div>

                          <div className="relative z-10 flex justify-between items-end mt-auto">
                            <div className="flex gap-1">
                              {muscleTypes.slice(0, 2).map((m, i) => (
                                <div key={i} className="bg-black/20 p-1 rounded-md">
                                  <MuscleIcon type={m} className="w-2.5 h-2.5 opacity-80" />
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-0.5 mb-0.5">
                              {[...Array(5)].map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`w-1 h-1 rounded-full ${i < entry.energy ? 'bg-white' : 'bg-white/20'}`} 
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyGrid;
