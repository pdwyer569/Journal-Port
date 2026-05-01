import React, { useMemo } from 'react';
import { JournalEntry } from '../types';

export default function ActivityHeatmap({ entries }: { entries: JournalEntry[] }) {
  const { weeks, monthLabels } = useMemo(() => {
    // Generate dates for the last 364 days + today = 365 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Start 364 days ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    
    // Adjust to nearest previous Sunday to align column starts
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // Count entries per day
    const counts = new Map<string, number>();
    entries.forEach(entry => {
      const date = new Date(entry.createdAt);
      date.setHours(0, 0, 0, 0);
      // Ensure we use local time formatted string for key
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const weeks = [];
    const monthLabels = [];
    let currentWeek = [];
    let currentDate = new Date(startDate);
    
    let currentMonth = -1;

    // Build the grid (approx 53 weeks)
    for (let i = 0; i < 375; i++) {
      if (currentDate > today && currentWeek.length === 0) break;

      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const count = counts.get(dateStr) || 0;
      
      if (currentDate.getDate() === 1 || i === 0) {
          if (currentDate.getMonth() !== currentMonth) {
              monthLabels.push({
                  weekIndex: weeks.length,
                  label: currentDate.toLocaleString('default', { month: 'short' })
              });
              currentMonth = currentDate.getMonth();
          }
      }

      currentWeek.push({
        date: dateStr,
        count,
        isFuture: currentDate > today
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      while(currentWeek.length < 7) {
          currentWeek.push({ date: '', count: 0, isFuture: true });
      }
      weeks.push(currentWeek);
    }

    return { weeks, monthLabels };
  }, [entries]);

  const getColorClass = (count: number, isFuture: boolean) => {
    if (isFuture) return 'bg-transparent';
    if (count === 0) return 'bg-[#2C313A]';
    if (count === 1) return 'bg-blue-500/40 text-transparent'; // opacity styling per spec
    if (count === 2) return 'bg-blue-500/70 text-transparent';
    return 'bg-blue-500 text-transparent';
  };

  return (
    <div className="w-full bg-[#15181C] border border-[#2C313A] rounded-2xl p-6 mb-8 overflow-hidden">
      <h3 className="text-xl font-medium mb-1">Consistency</h3>
      <p className="text-slate-400 text-sm mb-6">Your journaling habits over the last year.</p>
      
      <div className="overflow-x-auto pb-4" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
        <div className="min-w-max flex flex-col gap-1">
          {/* Month labels */}
          <div className="flex text-xs text-slate-500 mb-1 relative h-4 w-full">
             {monthLabels.map((m, i) => (
                <div key={i} className="absolute" style={{ left: `${m.weekIndex * (12 + 4)}px` }}>
                    {m.label}
                </div>
             ))}
          </div>
          
          {/* Grid */}
          <div className="flex gap-1" style={{ width: `${weeks.length * 16}px` }}> {/* 3px width + 4px gap per column approx */}
              {weeks.map((week, i) => (
                  <div key={i} className="flex flex-col gap-1">
                      {week.map((day, j) => (
                          <div 
                              key={`${i}-${j}`} 
                              title={day.isFuture ? '' : `${day.date}: ${day.count} entries`}
                              className={`w-3 h-3 rounded-sm ${getColorClass(day.count, day.isFuture)} transition-colors duration-200`}
                          />
                      ))}
                  </div>
              ))}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-2 text-xs text-slate-400 mt-2">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-[#2C313A]"></div>
        <div className="w-3 h-3 rounded-sm bg-blue-500/40"></div>
        <div className="w-3 h-3 rounded-sm bg-blue-500/70"></div>
        <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
        <span>More</span>
      </div>
    </div>
  );
}
