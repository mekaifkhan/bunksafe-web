import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Plus,
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  Calculator, 
  ChevronRight, 
  RotateCcw,
  BookOpen,
  CalendarDays,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { format, eachDayOfInterval, startOfDay } from 'date-fns';
import { getJamiaHoliday } from '../utils/dateUtils';

interface AttendancePredictorProps {
  stats: {
    totalHeld: number;
    totalAttended: number;
    percentage: number;
  };
  classSchedule?: Record<string, Record<number, string>>;
  targetAttendance?: number;
}

export const AttendancePredictor: React.FC<AttendancePredictorProps> = ({
  stats,
  classSchedule = {},
  targetAttendance = 75,
}) => {
  // Determine default class counts from user's classSchedule if set
  const getClassesForDay = (dayName: string) => {
    const daySched = classSchedule[dayName];
    if (!daySched) return null;
    const count = Object.values(daySched).filter(val => typeof val === 'string' && val.trim() !== '').length;
    return count > 0 ? count : null;
  };

  // Step 1 Inputs: Weekly schedule (Monday to Friday) stored as strings to support smooth typing/clearing
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, string>>({
    Monday: (getClassesForDay('Monday') ?? 5).toString(),
    Tuesday: (getClassesForDay('Tuesday') ?? 4).toString(),
    Wednesday: (getClassesForDay('Wednesday') ?? 6).toString(),
    Thursday: (getClassesForDay('Thursday') ?? 5).toString(),
    Friday: (getClassesForDay('Friday') ?? 4).toString(),
  });

  // Step 5 Input: Expected Missed Classes
  const [expectedMissedInput, setExpectedMissedInput] = useState<string>('0');
  
  // Wizard state: 'schedule' -> 'absences' -> 'results'
  const [currentStep, setCurrentStep] = useState<'schedule' | 'absences' | 'results'>('schedule');

  // Step 2 & 3: Date calculations
  const dateInfo = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysRemainingInMonth = eachDayOfInterval({
      start: startOfDay(today),
      end: startOfDay(lastDayOfMonth),
    });

    let totalWorkingDays = 0;
    let totalRemainingClasses = 0;
    const skippedHolidays: Array<{ dateStr: string; name: string }> = [];

    daysRemainingInMonth.forEach((d) => {
      const dayName = format(d, 'EEEE');
      const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';
      const jamiaH = getJamiaHoliday(d);

      if (isWeekend) return;

      if (jamiaH.isHoliday) {
        skippedHolidays.push({
          dateStr: format(d, 'MMM d'),
          name: jamiaH.name || 'Jamia Holiday',
        });
        return;
      }

      totalWorkingDays++;
      const rawCount = parseInt(weeklySchedule[dayName] || '0', 10);
      const dayClassCount = isNaN(rawCount) || rawCount < 0 ? 0 : rawCount;
      totalRemainingClasses += dayClassCount;
    });

    return {
      today,
      todayFormatted: format(today, 'MMMM d, yyyy'),
      currentMonth: format(today, 'MMMM'),
      currentYear: year,
      lastDayFormatted: format(lastDayOfMonth, 'MMMM d, yyyy'),
      lastDayShort: format(lastDayOfMonth, 'MMM d, yyyy'),
      daysInMonth: lastDayOfMonth.getDate(),
      remainingWorkingDays: totalWorkingDays,
      remainingClasses: totalRemainingClasses,
      upcomingHolidays: skippedHolidays,
    };
  }, [weeklySchedule]);

  const expectedMissed = useMemo(() => {
    const parsed = parseInt(expectedMissedInput, 10);
    if (isNaN(parsed) || parsed < 0) return 0;
    return Math.min(parsed, dateInfo.remainingClasses);
  }, [expectedMissedInput, dateInfo.remainingClasses]);

  // Step 6 & 7: Current attendance & Predictions
  const predictions = useMemo(() => {
    const currentHeld = stats.totalHeld;
    const currentAttended = stats.totalAttended;
    const currentPercentage = currentHeld > 0 ? (currentAttended / currentHeld) * 100 : 0;

    const remainingClasses = dateInfo.remainingClasses;
    const validMissed = Math.min(expectedMissed, remainingClasses);
    const expectedAttendedRemaining = Math.max(0, remainingClasses - validMissed);

    const projectedTotal = currentHeld + remainingClasses;
    const projectedPresent = currentAttended + expectedAttendedRemaining;
    const projectedAbsent = projectedTotal - projectedPresent;

    const predictedPercentage = projectedTotal > 0 ? (projectedPresent / projectedTotal) * 100 : 0;
    const diff = predictedPercentage - currentPercentage;

    return {
      currentHeld,
      currentAttended,
      currentPercentage,
      remainingClasses,
      expectedMissed: validMissed,
      expectedAttendedRemaining,
      projectedTotal,
      projectedPresent,
      projectedAbsent,
      predictedPercentage,
      diff,
    };
  }, [stats, dateInfo.remainingClasses, expectedMissed]);

  // Step 9: Smart Message Generator
  const smartMessage = useMemo(() => {
    const pred = predictions.predictedPercentage;
    if (pred >= 90) {
      return {
        icon: <Sparkles className="text-emerald-400" size={22} />,
        title: "🎉 Great!",
        body: "You're expected to finish the month above 90%. Excellent attendance record!",
        bg: "from-emerald-950/40 to-emerald-900/20 border-emerald-500/30 text-emerald-300",
        badgeBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        color: "emerald"
      };
    } else if (pred >= targetAttendance) {
      return {
        icon: <CheckCircle2 className="text-blue-400" size={22} />,
        title: "✅ Safe.",
        body: `You'll remain above ${targetAttendance}%. Keep up the consistency to stay safe!`,
        bg: "from-blue-950/40 to-blue-900/20 border-blue-500/30 text-blue-300",
        badgeBg: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        color: "blue"
      };
    } else if (pred >= 60) {
      return {
        icon: <AlertTriangle className="text-amber-400" size={22} />,
        title: "⚠ Warning.",
        body: `You'll fall below ${targetAttendance}%. Consider attending more classes to avoid low attendance penalties.`,
        bg: "from-amber-950/40 to-amber-900/20 border-amber-500/30 text-amber-300",
        badgeBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        color: "amber"
      };
    } else {
      return {
        icon: <AlertCircle className="text-rose-400" size={22} />,
        title: "🚨 Critical.",
        body: "You need to attend more classes this month! Predicted attendance is dangerously low.",
        bg: "from-rose-950/40 to-rose-900/20 border-rose-500/30 text-rose-300",
        badgeBg: "bg-rose-500/20 text-rose-400 border-rose-500/30",
        color: "rose"
      };
    }
  }, [predictions.predictedPercentage, targetAttendance]);

  const handleDayCountChange = (day: string, rawVal: string) => {
    if (rawVal === '') {
      setWeeklySchedule(prev => ({ ...prev, [day]: '' }));
      return;
    }
    const num = parseInt(rawVal, 10);
    if (!isNaN(num)) {
      const clamped = Math.max(0, Math.min(20, num));
      setWeeklySchedule(prev => ({ ...prev, [day]: clamped.toString() }));
    }
  };

  const adjustDayCount = (day: string, delta: number) => {
    const current = parseInt(weeklySchedule[day] || '0', 10);
    const nextVal = Math.max(0, Math.min(20, (isNaN(current) ? 0 : current) + delta));
    setWeeklySchedule(prev => ({ ...prev, [day]: nextVal.toString() }));
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/80 via-zinc-900 to-zinc-950 p-6 border border-indigo-500/20 shadow-xl">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <CalendarIcon size={140} className="text-indigo-400" />
        </div>
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Jamia Special Tool</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>📅</span> End of Month Attendance Predictor
          </h2>
          <p className="text-xs text-zinc-400 max-w-lg leading-relaxed">
            Predict your end-of-month attendance based on your weekly class schedule, expected absences, and official Jamia Millia Islamia holidays.
          </p>
          
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-300 font-mono">
            <span className="bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/60 flex items-center gap-1.5">
              <CalendarDays size={14} className="text-primary" />
              <span>{dateInfo.currentMonth} {dateInfo.currentYear}</span>
            </span>
            <span className="bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/60 flex items-center gap-1.5">
              <Clock size={14} className="text-indigo-400" />
              <span>Today: {dateInfo.todayFormatted}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation / Progress Indicator */}
      <div className="flex items-center justify-between bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800">
        <button
          onClick={() => setCurrentStep('schedule')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            currentStep === 'schedule' 
              ? 'bg-primary text-zinc-950 shadow-md shadow-primary/20' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-[10px] font-black">1</span>
          <span>Weekly Schedule</span>
        </button>

        <button
          onClick={() => setCurrentStep('absences')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            currentStep === 'absences' 
              ? 'bg-primary text-zinc-950 shadow-md shadow-primary/20' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-[10px] font-black">2</span>
          <span>Expected Absences</span>
        </button>

        <button
          onClick={() => setCurrentStep('results')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            currentStep === 'results' 
              ? 'bg-primary text-zinc-950 shadow-md shadow-primary/20' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-[10px] font-black">3</span>
          <span>Prediction</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: WEEKLY SCHEDULE INPUT */}
        {currentStep === 'schedule' && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-5"
          >
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen size={16} className="text-primary" />
                    Step 1: Weekly Class Schedule
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    How many classes do you usually have on each working day?
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-5 gap-2 sm:gap-3 pt-1">
                {daysOfWeek.map((day) => {
                  const shortName = day.substring(0, 3).toUpperCase();
                  return (
                    <div 
                      key={day} 
                      className="bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-2.5 sm:p-3 flex flex-row xs:flex-col items-center justify-between gap-2 transition-all shadow-sm group"
                    >
                      <div className="flex items-center gap-1.5 xs:w-full xs:justify-between">
                        <span className="text-xs font-black text-primary tracking-wider uppercase font-mono">{shortName}</span>
                        <span className="hidden xs:inline text-[9px] text-zinc-500 font-medium tracking-tight uppercase">{day}</span>
                      </div>

                      <div className="flex items-center justify-center gap-1 bg-zinc-900/90 border border-zinc-800 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => adjustDayCount(day, -1)}
                          className="w-7 h-7 rounded-lg bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center justify-center transition-colors shrink-0 active:scale-95"
                          title="Decrease class count"
                        >
                          <Minus size={13} />
                        </button>

                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={weeklySchedule[day]}
                          onChange={(e) => handleDayCountChange(day, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-8 sm:w-10 bg-transparent text-sm sm:text-base font-black text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />

                        <button
                          type="button"
                          onClick={() => adjustDayCount(day, 1)}
                          className="w-7 h-7 rounded-lg bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center justify-center transition-colors shrink-0 active:scale-95"
                          title="Increase class count"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <span className="text-[10px] text-zinc-400 font-medium text-center font-mono">classes</span>
                    </div>
                  );
                })}
              </div>

              {/* Summary box of remaining working days & Jamia Holidays */}
              <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-indigo-400" />
                    Jamia Holiday Calendar Sync
                  </span>
                  <span className="font-mono text-zinc-400 text-[11px]">
                    {dateInfo.remainingWorkingDays} working days left in {dateInfo.currentMonth}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Calculated from today (<strong className="text-zinc-200">{dateInfo.todayFormatted}</strong>) until end of month (<strong className="text-zinc-200">{dateInfo.lastDayFormatted}</strong>). Saturdays, Sundays, and official Jamia holidays are automatically excluded.
                </p>

                {dateInfo.upcomingHolidays.length > 0 ? (
                  <div className="pt-2 border-t border-indigo-500/10 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">Upcoming Holidays Excluded:</span>
                    {dateInfo.upcomingHolidays.map((h, idx) => (
                      <span key={idx} className="bg-indigo-900/50 border border-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                        {h.dateStr}: {h.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="pt-1 text-[11px] text-zinc-500 italic">
                    No official Jamia holidays remaining in {dateInfo.currentMonth}.
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="text-xs text-zinc-400">
                  Calculated Remaining Classes: <strong className="text-primary font-mono text-sm">{dateInfo.remainingClasses}</strong>
                </div>

                <button
                  onClick={() => setCurrentStep('absences')}
                  className="px-6 py-3 rounded-xl bg-primary text-zinc-950 font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                  <span>Next: Absences</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 5: EXPECTED ABSENCES */}
        {currentStep === 'absences' && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-5"
          >
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-5 shadow-lg">
              <div className="border-b border-zinc-800/80 pb-3">
                <h3 className="font-extrabold text-sm text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                  <Calculator size={16} className="text-primary" />
                  Step 2: Expected Absences
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Out of the <span className="text-primary font-bold font-mono">{dateInfo.remainingClasses}</span> remaining classes this month, how many do you expect to miss?
                </p>
              </div>

              {/* Attendance quick info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Current Held</span>
                  <p className="text-lg font-black text-white font-mono mt-0.5">{stats.totalHeld}</p>
                </div>

                <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Current Present</span>
                  <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">{stats.totalAttended}</p>
                </div>

                <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Current %</span>
                  <p className="text-lg font-black text-primary font-mono mt-0.5">{stats.percentage.toFixed(1)}%</p>
                </div>

                <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Remaining Classes</span>
                  <p className="text-lg font-black text-indigo-400 font-mono mt-0.5">{dateInfo.remainingClasses}</p>
                </div>
              </div>

              {/* Input for expected missed classes */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <label className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider block">
                  Expected Missed Classes
                </label>
                
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max={dateInfo.remainingClasses}
                    value={expectedMissedInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setExpectedMissedInput('');
                        return;
                      }
                      const num = parseInt(val, 10);
                      if (!isNaN(num)) {
                        setExpectedMissedInput(Math.max(0, Math.min(dateInfo.remainingClasses, num)).toString());
                      }
                    }}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-xl font-black text-white focus:outline-none focus:border-primary transition-colors font-mono"
                    placeholder="0"
                  />

                  <div className="flex gap-2">
                    {[0, 2, 5, 10].map((quickVal) => (
                      quickVal <= dateInfo.remainingClasses && (
                        <button
                          key={quickVal}
                          onClick={() => setExpectedMissedInput(quickVal.toString())}
                          className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                            parseInt(expectedMissedInput, 10) === quickVal
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          {quickVal}
                        </button>
                      )
                    ))}
                  </div>
                </div>

                {parseInt(expectedMissedInput, 10) > dateInfo.remainingClasses && (
                  <p className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                    <AlertCircle size={14} />
                    <span>Cannot exceed total remaining classes ({dateInfo.remainingClasses}).</span>
                  </p>
                )}

                <p className="text-[11px] text-zinc-400">
                  If you miss <strong className="text-white font-mono">{expectedMissed}</strong> classes out of <strong className="text-white font-mono">{dateInfo.remainingClasses}</strong>, you will attend <strong className="text-emerald-400 font-mono">{Math.max(0, dateInfo.remainingClasses - expectedMissed)}</strong> classes.
                </p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setCurrentStep('schedule')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700 transition-all"
                >
                  Back
                </button>

                <button
                  onClick={() => setCurrentStep('results')}
                  className="px-6 py-3 rounded-xl bg-primary text-zinc-950 font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                  <span>See Prediction</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 8 & 9: RESULTS & PREDICTION */}
        {currentStep === 'results' && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* Smart Message Banner */}
            <div className={`p-5 rounded-3xl bg-gradient-to-r ${smartMessage.bg} border shadow-lg flex items-start gap-4`}>
              <div className="p-3 rounded-2xl bg-zinc-950/50 backdrop-blur-sm border border-white/10 shrink-0">
                {smartMessage.icon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-white">{smartMessage.title}</h3>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${smartMessage.badgeBg}`}>
                    Prediction Target: {targetAttendance}%
                  </span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                  {smartMessage.body}
                </p>
              </div>
            </div>

            {/* Attendance Gauge & Comparison Card */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="font-black text-base text-zinc-100 uppercase tracking-tight flex items-center gap-2">
                    <Zap size={18} className="text-primary" />
                    Prediction Dashboard
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Expected Attendance on <strong className="text-zinc-200">{dateInfo.lastDayFormatted}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Prediction Date</span>
                  <span className="text-xs font-mono font-bold text-indigo-400">{dateInfo.lastDayShort}</span>
                </div>
              </div>

              {/* Main Gauge / Comparison Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Gauge Widget */}
                <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/60 rounded-3xl border border-zinc-800/80 relative">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background Track */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="text-zinc-800"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      {/* Progress Stroke */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className={
                          predictions.predictedPercentage >= 90
                            ? 'text-emerald-500'
                            : predictions.predictedPercentage >= targetAttendance
                            ? 'text-primary'
                            : predictions.predictedPercentage >= 60
                            ? 'text-amber-500'
                            : 'text-rose-500'
                        }
                        strokeWidth="8"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * Math.min(100, Math.max(0, predictions.predictedPercentage))) / 100}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-black text-white font-mono tracking-tighter">
                        {predictions.predictedPercentage.toFixed(1)}%
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-0.5">
                        Predicted
                      </span>
                    </div>
                  </div>

                  {/* Attendance Difference Indicator */}
                  <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Diff:</span>
                    <span
                      className={`text-xs font-black font-mono flex items-center gap-0.5 ${
                        predictions.diff > 0
                          ? 'text-emerald-400'
                          : predictions.diff < 0
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {predictions.diff > 0 ? (
                        <>
                          <TrendingUp size={14} />
                          +{predictions.diff.toFixed(1)}%
                        </>
                      ) : predictions.diff < 0 ? (
                        <>
                          <TrendingDown size={14} />
                          {predictions.diff.toFixed(1)}%
                        </>
                      ) : (
                        <>
                          <Minus size={14} />
                          0.0%
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Comparison Columns */}
                <div className="md:col-span-2 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Current Attendance */}
                    <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                        Current Attendance
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white font-mono">
                          {predictions.currentPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        {predictions.currentAttended} / {predictions.currentHeld} classes
                      </p>
                    </div>

                    {/* Predicted Attendance */}
                    <div className="bg-zinc-950/80 p-4 rounded-2xl border border-primary/30 space-y-1 bg-primary/5">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                        Predicted Attendance
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-primary font-mono">
                          {predictions.predictedPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        {predictions.projectedPresent} / {predictions.projectedTotal} classes
                      </p>
                    </div>
                  </div>

                  {/* Comprehensive Stats Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/80">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase block">Expected Remaining</span>
                      <span className="text-sm font-black text-indigo-400 font-mono">{predictions.remainingClasses} classes</span>
                    </div>

                    <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/80">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase block">Expected Missed</span>
                      <span className="text-sm font-black text-rose-400 font-mono">{predictions.expectedMissed} classes</span>
                    </div>

                    <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/80">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase block">Projected Present</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">{predictions.projectedPresent} classes</span>
                    </div>

                    <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/80">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase block">Projected Total</span>
                      <span className="text-sm font-black text-zinc-200 font-mono">{predictions.projectedTotal} classes</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                <button
                  onClick={() => setCurrentStep('absences')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs hover:bg-zinc-700 transition-all flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Adjust Expected Absences</span>
                </button>

                <button
                  onClick={() => setCurrentStep('schedule')}
                  className="px-4 py-2.5 rounded-xl bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-bold text-xs hover:bg-indigo-900/50 transition-all flex items-center gap-1.5"
                >
                  <span>Edit Weekly Schedule</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
