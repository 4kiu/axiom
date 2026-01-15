import React, { useState, useMemo, useEffect } from 'react';
import { WorkoutEntry, WorkoutPlan } from '../types.ts';
import { format, isAfter } from 'date-fns';
import { BarChart2, Activity, Zap, Target, Shield, LayoutGrid, Flame, Cpu } from 'lucide-react';

// Fixed local implementations of date-fns utilities
const startOfDay = (date: Date | number) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const subDays = (date: Date | number, amount: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() - amount);
  return d;
};

interface StatisticsProps {
  entries: WorkoutEntry[];
  plans: WorkoutPlan[];
  onEditEntry?: (id: string) => void;
}

type RangeType = 7 | 14 | 30 | 60 | 'all';

/**
 * Refined IntensityGraph component
 * Clean, centered, and grid-less for maximum focus on telemetry.
 */
const IntensityGraph: React.FC<{ entries: WorkoutEntry[], days: RangeType }> = ({ entries, days }) => {
  const PAD_X = 12; 
  const PAD_Y = 20;
  const GRAPH_WIDTH = 100 - (PAD_X * 2);
  const GRAPH_HEIGHT = 100 - (PAD_Y * 2);

  const dataPoints = useMemo(() => {
    const now = new Date();
    const startDate = days === 'all' 
      ? new Date(Math.min(...entries.map(e => e.timestamp), Date.now()))
      : startOfDay(subDays(now, (typeof days === 'number' ? days : 7) - 1));
    
    // Use >= comparison to include the first entry when days === 'all'
    const filtered = entries
      .filter(e => e.timestamp >= startDate.getTime())
      .sort((a, b) => a.timestamp - b.timestamp);

    if (filtered.length === 0) return [];

    const minTs = startDate.getTime();
    const maxTs = now.getTime();
    const rangeTs = Math.max(maxTs - minTs, 1);

    return filtered.map(e => ({
      x: PAD_X + ((e.timestamp - minTs) / rangeTs) * GRAPH_WIDTH,
      y: PAD_Y + (1 - (e.energy - 1) / 4) * GRAPH_HEIGHT,
      energy: e.energy,
      date: e.timestamp
    }));
  }, [entries, days, PAD_X, PAD_Y, GRAPH_WIDTH, GRAPH_HEIGHT]);

  if (dataPoints.length < 2) {
    return (
      <div className="h-72 lg:h-full w-full flex flex-col items-center justify-center border border-neutral-800 rounded-2xl bg-neutral-900/40 opacity-40">
        <Activity size={32} className="mb-3 text-neutral-600" />
        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-500">Insufficient Telemetry Data</p>
      </div>
    );
  }

  const linePath = `M ${dataPoints.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L ')}`;
  const areaPath = `${linePath} L ${dataPoints[dataPoints.length - 1].x.toFixed(2)},${100 - PAD_Y} L ${dataPoints[0].x.toFixed(2)},${100 - PAD_Y} Z`;

  return (
    <div className="relative h-80 lg:h-full w-full bg-black/40 border border-neutral-800 rounded-2xl p-6 sm:p-10 group overflow-hidden shadow-2xl transition-all">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-emerald-500/20 rounded-r-full" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-emerald-500/20 rounded-l-full" />
      
      <div className="absolute left-4 sm:left-6 inset-y-10 flex flex-col justify-between text-[7px] font-mono text-neutral-600 uppercase pointer-events-none select-none">
        <div className="flex items-center gap-1.5 -translate-y-2">
          <span>HIGH</span>
        </div>
        <div className="flex items-center gap-1.5 translate-y-2">
          <span>LOW</span>
        </div>
      </div>

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="traceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="fillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#fillGradient)" className="animate-in fade-in duration-1000" />
        <path d={linePath} fill="none" stroke="url(#traceGradient)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]" />
        
        {dataPoints.map((p, i) => (
          <g key={i} className="group/node">
            <circle cx={p.x} cy={p.y} r="1.2" className="fill-black stroke-emerald-500 stroke-[0.4] transition-all group-hover/node:r-2 cursor-crosshair" />
            <circle cx={p.x} cy={p.y} r="0.4" className="fill-emerald-400 opacity-40 group-hover/node:opacity-100" />
          </g>
        ))}
      </svg>
      
      <div className="absolute bottom-3 right-6 flex items-center gap-2">
        <span className="text-[7px] font-mono text-neutral-600 uppercase tracking-[0.2em]">Intensity Distribution Matrix</span>
        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </div>
  );
};

const Statistics: React.FC<StatisticsProps> = ({ entries, plans }) => {
  const [range, setRange] = useState<RangeType>(() => {
    const saved = localStorage.getItem('axiom_stats_range');
    if (saved === 'all') return 'all';
    const parsed = parseInt(saved || '7');
    return [7, 14, 30, 60].includes(parsed) ? parsed as RangeType : 7;
  });

  useEffect(() => {
    localStorage.setItem('axiom_stats_range', range.toString());
  }, [range]);

  const ranges: RangeType[] = [7, 14, 30, 60, 'all'];

  const stats = useMemo(() => {
    const now = new Date();
    const startDate = range === 'all' 
      ? new Date(Math.min(...entries.map(e => e.timestamp), Date.now()))
      : startOfDay(subDays(now, (typeof range === 'number' ? range : 7) - 1));
    
    // Filtered entries for range-specific stats
    const filtered = entries.filter(e => e.timestamp >= startDate.getTime());
    const totalLogs = filtered.length;
    
    // avg Intensity based on selected range
    const avgIntensity = filtered.length > 0 
      ? (filtered.reduce((acc, curr) => acc + curr.energy, 0) / filtered.length).toFixed(1)
      : '0.0';
    
    // Top Blueprint based on (training intensity, identity) within range
    const planScores: Record<string, { count: number, energyTotal: number, identityTotal: number }> = {};
    filtered.forEach(e => {
      if (!e.planId) return;
      if (!planScores[e.planId]) planScores[e.planId] = { count: 0, energyTotal: 0, identityTotal: 0 };
      planScores[e.planId].count++;
      planScores[e.planId].energyTotal += e.energy;
      // Invert identity so Overdrive(0) has more weight (value 4) has more weight (value 4) than Survival(3) (value 1)
      planScores[e.planId].identityTotal += (4 - e.identity);
    });

    let topPlanName = 'None';
    let bestScore = -1;
    Object.entries(planScores).forEach(([pid, data]) => {
      const avgE = data.energyTotal / data.count;
      const avgI = data.identityTotal / data.count;
      // Scoring heuristic favoring frequency and quality
      const score = (avgE + avgI) * Math.log2(data.count + 1);
      if (score > bestScore) {
        bestScore = score;
        topPlanName = plans.find(p => p.id === pid)?.name || 'Untitled Blueprint';
      }
    });

    // longest streak (global)
    const sortedAll = [...entries].sort((a, b) => a.timestamp - b.timestamp);
    let maxStreak = 0;
    let currentStreakCount = 0;
    if (sortedAll.length > 0) {
      const datesSet = new Set(sortedAll.map(e => startOfDay(e.timestamp).getTime()));
      const minTs = Math.min(...Array.from(datesSet));
      const maxTs = Math.max(...Array.from(datesSet));
      
      let cursor = new Date(minTs);
      const end = new Date(maxTs);
      while (cursor <= end) {
        const ts = cursor.getTime();
        const entry = entries.find(e => startOfDay(e.timestamp).getTime() === ts);
        if (entry) {
          if (entry.identity === 3) { // Survival breaks streak
            currentStreakCount = 0;
          } else if (entry.identity !== 4) { // OD/Normal/Maintenance increment
            currentStreakCount++;
          }
          // Rest (4) bridges: no increment, but no break
        } else {
          currentStreakCount = 0; // Empty day breaks streak
        }
        maxStreak = Math.max(maxStreak, currentStreakCount);
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return { totalLogs, avgIntensity, topPlanName, maxStreak };
  }, [entries, range, plans]);

  return (
    <div className="space-y-10 pb-16 w-full px-4 sm:px-0 lg:max-w-4xl lg:mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-neutral-800 pb-6">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-lg">
             <BarChart2 className="text-white-500" size={28} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-white leading-none tracking-tight uppercase">Statistics</h2>
            <div className="flex items-center gap-2 mt-2">
              <Zap size={10} className="text-emerald-500" />
              <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">Cognitive Performance Analysis</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-neutral-800 w-full sm:w-auto overflow-x-auto no-scrollbar shadow-inner">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex-1 sm:flex-none whitespace-nowrap ${
                range === r 
                  ? 'bg-neutral-100 text-black shadow-lg' 
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'
              }`}
            >
              {r === 'all' ? 'full' : `${r}d`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-stretch">
        {/* Main Visualization Container */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-6 order-2 lg:order-1">
          <div className="hidden sm:flex items-center gap-3 px-1">
            <h3 className="text-xs font-mono text-neutral-300 font-bold uppercase tracking-widest">Intensity Distribution Matrix</h3>
          </div>
          
          <IntensityGraph entries={entries} days={range} />
        </div>

        {/* Summary Metrics Section - 2x2 Grid */}
        <div className="w-full lg:w-[400px] shrink-0 order-1 lg:order-2 flex flex-col gap-6">
          <div className="hidden sm:flex items-center gap-3 px-1">
            <h3 className="text-xs font-mono text-neutral-300 font-bold uppercase tracking-widest">Performance Telemetry</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-rows-2 gap-4 flex-1">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col justify-between group hover:border-neutral-700 transition-colors relative h-32 lg:h-full">
              <div>
                <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1 lg:mb-10">Session Volume</p>
                <div className="absolute bottom-[11px] left-4">
                  <p className="text-2xl sm:text-3xl font-black text-white">{stats.totalLogs}</p>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 text-rose-500 opacity-40 group-hover:opacity-100 transition-opacity">
                <BarChart2 size={20} />
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col justify-between group hover:border-neutral-700 transition-colors relative h-32 lg:h-full">
              <div>
                <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1 lg:mb-10">Avg Intensity</p>
                <div className="absolute bottom-1 left-4">
                  <p className="text-2xl sm:text-3xl font-black text-white">{stats.avgIntensity}<span className="text-[10px] font-mono text-neutral-500 ml-1">/5</span></p>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 text-violet-500 opacity-40 group-hover:opacity-100 transition-opacity">
                <Zap size={20} />
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col justify-between group hover:border-neutral-700 transition-colors relative h-32 lg:h-full overflow-hidden">
              <div>
                <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1 lg:mb-10">Top Blueprint</p>
                <div className="absolute bottom-[11px] left-4">
                  <p className="text-lg sm:text-xl font-black text-white truncate max-w-full leading-tight pr-2">{stats.topPlanName}</p>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 text-emerald-500 opacity-40 group-hover:opacity-100 transition-opacity">
                <Activity size={20} />
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col justify-between group hover:border-neutral-700 transition-colors relative h-32 lg:h-full">
              <div>
                <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1 lg:mb-10">Longest Streak</p>
                <div className="absolute bottom-1 left-4">
                  <p className="text-2xl sm:text-3xl font-black text-white">{stats.maxStreak}<span className="text-[10px] font-mono text-neutral-500 ml-1">DYS</span></p>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 text-amber-400 opacity-40 group-hover:opacity-100 transition-opacity">
                <Flame size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Footer Decoration */}
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 opacity-40">
        <div className="flex gap-1.5">
          {[...Array(3)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-neutral-700 rounded-full" />)}
        </div>
        <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-[0.4em]">Protocol Synchronized. All traces nominal.</p>
      </div>
    </div>
  );
};

export default Statistics;