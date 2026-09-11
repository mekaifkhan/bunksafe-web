import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  MapPin, 
  FlaskConical, 
  Sparkles
} from 'lucide-react';
import { 
  getSem1TimetableForBranch, 
  normalizeJmiBranch, 
  JMI_10_BRANCHES, 
  TimetableEntry,
  getSem1WeeklyScheduledCounts
} from '../utils/jmiSem1Timetable';
import { Profile } from '../types';

interface JmiSem1TimetableCardProps {
  profile: Profile;
}

export const JmiSem1TimetableCard: React.FC<JmiSem1TimetableCardProps> = ({
  profile
}) => {
  const currentBranch = normalizeJmiBranch(profile.department);
  const [selectedBranch, setSelectedBranch] = useState<string>(currentBranch);

  const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
  ];

  // Determine current day of week (default to Monday if weekend)
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const defaultDay = (days.includes(todayDayName as any) ? todayDayName : 'Monday') as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  
  const [activeDay, setActiveDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>(defaultDay);

  const timetableEntries = getSem1TimetableForBranch(selectedBranch);
  const activeDayEntries = timetableEntries.filter(e => e.day === activeDay);
  const weeklyCounts = getSem1WeeklyScheduledCounts(selectedBranch, undefined);

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-extrabold uppercase tracking-wider mb-1">
            <Sparkles size={12} />
            <span>Official JMI FET Timetable 2026-27</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            B.Tech 1st Semester Timetable
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Department of Applied Sciences & Humanities, Jamia Millia Islamia
          </p>
        </div>

        {/* Branch selector dropdown */}
        <div className="sm:w-64">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Branch</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-zinc-100 focus:outline-none focus:border-primary transition-colors"
          >
            {JMI_10_BRANCHES.map(b => (
              <option key={b.code} value={b.name}>{b.name} ({b.programme})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {days.map((d) => {
          const count = weeklyCounts[d] || 0;
          const isToday = d === todayDayName;
          const isActive = d === activeDay;

          return (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                isActive
                  ? 'bg-primary border-primary text-zinc-950 shadow-lg shadow-primary/20'
                  : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs font-black uppercase font-mono">{d.substring(0, 3)}</span>
                {isToday && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-zinc-950' : 'bg-primary'}`} />
                )}
              </div>
              <span className={`text-[10px] font-bold font-mono ${isActive ? 'text-zinc-950/80' : 'text-zinc-500'}`}>
                {count} classes
              </span>
            </button>
          );
        })}
      </div>

      {/* Class Schedule Cards List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1 font-mono">
          <span>{activeDay} Schedule ({activeDayEntries.length} sessions)</span>
          <span>1 session = 1 attendance unit</span>
        </div>

        {activeDayEntries.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5">
            {activeDayEntries.map((entry) => {
              const isLab = entry.type === 'LAB' || entry.type === 'PRACTICAL' || entry.type === 'WHOLE_CLASS_PRACTICAL';
              const isWholeClass = entry.isWholeClass || entry.type === 'WHOLE_CLASS_PRACTICAL';

              return (
                <div
                  key={entry.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isLab 
                      ? 'bg-indigo-950/20 border-indigo-500/20 hover:border-indigo-500/40' 
                      : 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      isLab ? 'bg-indigo-500/20 text-indigo-300' : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {isLab ? <FlaskConical size={18} /> : <BookOpen size={18} />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-white tracking-wide">
                          {entry.subjectCode}: {entry.subjectName}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-primary" />
                          <span>{entry.startTime} - {entry.endTime}</span>
                        </span>

                        {entry.room && (
                          <span className="flex items-center gap-1 text-zinc-500">
                            <MapPin size={12} />
                            <span>{entry.room}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badge Indicators */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isWholeClass ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                        Whole Class Practical
                      </span>
                    ) : entry.group ? (
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-wider">
                        Group {entry.group} Lab
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                        Theory
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-zinc-950/40 rounded-2xl border border-zinc-800/60 space-y-2">
            <Calendar size={32} className="mx-auto text-zinc-600" />
            <p className="text-xs font-bold text-zinc-400">No classes scheduled on {activeDay}</p>
            <p className="text-[11px] text-zinc-500">Enjoy your day off or check other working days!</p>
          </div>
        )}
      </div>
    </div>
  );
};
