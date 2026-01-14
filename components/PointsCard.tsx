
import React, { useMemo } from 'react';
import { WorkoutEntry, IdentityState } from '../types';
import { Trophy, Star, Zap } from 'lucide-react';
import { addDays } from 'date-fns';

interface PointsCardProps {
  entries: WorkoutEntry[];
  weekStart: Date;
}

const PointsCard: React.FC<PointsCardProps> = ({ entries, weekStart }) => {
  const calculation = useMemo(() => {
    const calcXpForWeek = (wStart: Date) => {
      const end = addDays(wStart, 7);
      const weekEntries = entries.filter(e => {
        const d = new Date(e.timestamp);
        return d >= wStart && d < end;
      }).sort((a, b) => a.timestamp - b.timestamp);

      let basePoints = 0;
      let odCount = 0;
      let energyBonus = 0;
      let maxNormalStreak = 0;
      let currentStreak = 0;

      // Base XP and Energy Bonus Calculation
      weekEntries.forEach(e => {
        // Identity Base Points
        if (e.identity === IdentityState.OVERDRIVE) {
          odCount++;
        } else if (e.identity === IdentityState.NORMAL) {
          basePoints += 10;
        } else if (e.identity === IdentityState.MAINTENANCE) {
          basePoints += 6;
        } else if (e.identity === IdentityState.SURVIVAL) {
          basePoints += 3;
        }

        // Energy Bonus (+1 for level 4 or 5)
        if (e.energy >= 4) {
          energyBonus += 1;
        }
      });

      // Overdrive Tiers
      let odPoints = 0;
      if (odCount === 2) odPoints = odCount * 20;
      else if (odCount >= 3) odPoints = odCount * 25;
      else odPoints = odCount * 15;

      const dayMap = new Map();
      weekEntries.forEach(e => {
          const d = new Date(e.timestamp).toDateString();
          dayMap.set(d, e.identity);
      });

      for (let i = 0; i < 7; i++) {
          const d = addDays(wStart, i).toDateString();
          const identity = dayMap.get(d);
          
          if (identity === IdentityState.NORMAL) {
              currentStreak++;
              maxNormalStreak = Math.max(maxNormalStreak, currentStreak);
          } else if (identity === IdentityState.OVERDRIVE) {
              // Overdrive is a bridge
          } else {
              currentStreak = 0;
          }
      }

      let streakBonus = 0;
      if (maxNormalStreak === 3) streakBonus = 2;
      else if (maxNormalStreak === 4) streakBonus = 3;
      else if (maxNormalStreak === 5) streakBonus = 4;
      else if (maxNormalStreak >= 6) streakBonus = 5;

      return {
        total: basePoints + odPoints + streakBonus + energyBonus,
        odPoints,
        odCount,
        streakBonus,
        energyBonus,
        maxNormalStreak,
        basePoints
      };
    };

    const currentWeek = calcXpForWeek(weekStart);
    const lastWeekStart = addDays(weekStart, -7);
    const lastWeek = calcXpForWeek(lastWeekStart);
    
    const beatenBonus = (lastWeek.total > 0 && currentWeek.total > lastWeek.total) ? 5 : 0;
    const finalTotal = currentWeek.total + beatenBonus;

    return {
      ...currentWeek,
      total: finalTotal,
      lastWeekTotal: lastWeek.total,
      beatenBonus
    };
  }, [entries, weekStart]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
      <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        <Trophy size={120} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
            <Star size={14} className="text-amber-500" />
            Performance Allocation
          </h3>
        </div>

        <div className="flex items-baseline gap-2">
          <div className="text-5xl font-black text-white tracking-tighter">
            {calculation.total}
          </div>
          <div className="text-xs font-mono text-emerald-500 font-bold">XP</div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase p-2 rounded-lg border border-white/10">
            <span className="text-neutral-500">Identity Baseline</span>
            <span className="text-neutral-300">+{calculation.basePoints} XP</span>
          </div>
          
          <div className="flex justify-between items-center text-[10px] font-mono uppercase p-2 rounded-lg border border-white/10">
            <span className="text-neutral-500">
                Overdrive {calculation.odCount >= 2 ? `(T${calculation.odCount >= 3 ? '3' : '2'})` : 'Link'}
            </span>
            <span className={calculation.odCount >= 2 ? "text-violet-400 font-bold" : "text-neutral-300"}>
                +{calculation.odPoints} XP
            </span>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono uppercase p-2 rounded-lg border border-white/10">
            <span className="text-neutral-500">Pre-Training Energy</span>
            <span className={calculation.energyBonus > 0 ? "text-emerald-400 font-bold" : "text-neutral-300"}>
                +{calculation.energyBonus} XP
            </span>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono uppercase p-2 rounded-lg border border-white/10">
            <span className="text-neutral-500">Normal Streak ({calculation.maxNormalStreak}/6)</span>
            <span className={calculation.streakBonus > 0 ? "text-emerald-400 font-bold" : "text-neutral-300"}>
              +{calculation.streakBonus} XP
            </span>
          </div>

          <div className={`flex justify-between items-center text-[10px] font-mono uppercase p-2 rounded-lg border ${calculation.beatenBonus > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/20 border-neutral-800'}`}>
            <span className={calculation.beatenBonus > 0 ? 'text-emerald-400 font-bold' : 'text-neutral-500'}>
              Target: Beat Last Week
            </span>
            <span className={calculation.beatenBonus > 0 ? "text-emerald-400 font-black" : "text-neutral-500"}>
              +{calculation.beatenBonus} XP
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-between items-center gap-3">
        <div className="p-2 bg-neutral-950 rounded-lg border border-neutral-800">
           <Zap size={14} className={calculation.beatenBonus > 0 ? "text-emerald-400" : "text-neutral-700"} />
        </div>
        <div className="text-[9px] font-mono text-neutral-500 leading-tight">
            {calculation.lastWeekTotal === 0 
                ? "TARGET: NO BASELINE DETECTED FOR LAST WEEK" 
                : calculation.beatenBonus > 0 
                ? `TARGET REACHED: BEAT PREVIOUS CYCLE BY ${calculation.total - calculation.beatenBonus - calculation.lastWeekTotal} XP` 
                : `TARGET: BEAT LAST WEEK'S SCORE (${calculation.lastWeekTotal} XP)`}
        </div>
      </div>
    </div>
  );
};

export default PointsCard;
