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
  Zap,
  Layers,
  GraduationCap,
  CalendarCheck
} from 'lucide-react';
import { format, eachDayOfInterval, startOfDay } from 'date-fns';
import { getJamiaHoliday, isExamDay } from '../utils/dateUtils';
import { Profile, Semester, Exam } from '../types';
import { getSem1WeeklyScheduledCounts } from '../utils/jmiSem1Timetable';

interface AttendancePredictorProps {
  stats: {
    totalHeld: number;
    totalAttended: number;
    percentage: number;
  };
  semester?: Semester;
  exams?: Exam[];
  classSchedule?: Record<string, Record<number, string>>;
  targetAttendance?: number;
  profile?: Profile;
  records?: Record<string, any>;
}

export const AttendancePredictor: React.FC<AttendancePredictorProps> = ({
  stats,
  semester,
  exams = [],
  classSchedule = {},
  targetAttendance = 75,
  profile,
  records = {}
}) => {
  // Determine default class counts from user's classSchedule if set, or JMI Sem 1 timetable
  const getClassesForDay = (dayName: string) => {
    if (profile && profile.semester === 'Semester 1') {
      const counts = getSem1WeeklyScheduledCounts(profile.department, profile.labGroup as any);
      return counts[dayName] ?? null;
    }
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

  // Re-sync weekly schedule when profile branch or labGroup changes
  React.useEffect(() => {
    setWeeklySchedule({
      Monday: (getClassesForDay('Monday') ?? 5).toString(),
      Tuesday: (getClassesForDay('Tuesday') ?? 4).toString(),
      Wednesday: (getClassesForDay('Wednesday') ?? 6).toString(),
      Thursday: (getClassesForDay('Thursday') ?? 5).toString(),
      Friday: (getClassesForDay('Friday') ?? 4).toString(),
    });
  }, [profile?.department, profile?.labGroup, profile?.semester]);

  // Step 2 Input: Expected Missed Classes
  const [expectedMissedInput, setExpectedMissedInput] = useState<string>('0');
  
  // Wizard state: 'schedule' -> 'absences' -> 'results'
  const [currentStep, setCurrentStep] = useState<'schedule' | 'absences' | 'results'>('schedule');

  // Step 3 View toggle: 'both' | 'month' | 'semester'
  const [activeView, setActiveView] = useState<'both' | 'month' | 'semester'>('both');

  // Date calculations
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
      const dStr = format(d, 'yyyy-MM-dd');
      const dayName = format(d, 'EEEE');
      const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';

      if (isWeekend) return;

      const rec = records[dStr];
      const isAlreadyRecorded = rec && (rec.held > 0 || rec.isHoliday);
      if (isAlreadyRecorded) return;

      const jamiaH = getJamiaHoliday(d);

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
      monthPrefix: format(today, 'yyyy-MM'),
      lastDayFormatted: format(lastDayOfMonth, 'MMMM d, yyyy'),
      lastDayShort: format(lastDayOfMonth, 'MMM d, yyyy'),
      daysInMonth: lastDayOfMonth.getDate(),
      remainingWorkingDays: totalWorkingDays,
      remainingClasses: totalRemainingClasses,
      upcomingHolidays: skippedHolidays,
    };
  }, [weeklySchedule, records]);

  // Current month attendance so far (excluding holidays and exams)
  const monthStatsSoFar = useMemo(() => {
    const prefix = dateInfo.monthPrefix;
    const startDateStr = semester?.startDate ? format(new Date(semester.startDate), 'yyyy-MM-dd') : null;

    let held = 0;
    let attended = 0;

    Object.entries(records || {}).forEach(([dateStr, record]: [string, any]) => {
      if (!record) return;
      if (startDateStr && dateStr < startDateStr) return;

      const jmiHoliday = getJamiaHoliday(dateStr);
      const isHoliday = record.isHoliday === true || (jmiHoliday.isHoliday && (record.held || 0) === 0 && record.isHoliday !== false);
      const isExam = isExamDay(dateStr, exams);

      if (dateStr.startsWith(prefix)) {
        if (!isHoliday && !isExam) {
          const h = Math.max(0, record.held || 0);
          const a = Math.max(0, Math.min(h, record.attended || 0));
          held += h;
          attended += a;
        }
      }
    });

    const percentage = held > 0 ? (attended / held) * 100 : null;

    return {
      held,
      attended,
      percentage
    };
  }, [records, dateInfo.monthPrefix, semester?.startDate, exams]);

  const expectedMissed = useMemo(() => {
    const parsed = parseInt(expectedMissedInput, 10);
    if (isNaN(parsed) || parsed < 0) return 0;
    return Math.min(parsed, dateInfo.remainingClasses);
  }, [expectedMissedInput, dateInfo.remainingClasses]);

  // Predictions for BOTH This Month AND Full Semester
  const predictions = useMemo(() => {
    const remainingClasses = dateInfo.remainingClasses;
    const validMissed = Math.min(expectedMissed, remainingClasses);
    const expectedAttendedRemaining = Math.max(0, remainingClasses - validMissed);

    // 1. THIS MONTH PREDICTION
    const monthCurrentHeld = monthStatsSoFar.held;
    const monthCurrentAttended = monthStatsSoFar.attended;
    const monthCurrentPercentage = monthStatsSoFar.percentage;

    const monthProjectedTotal = monthCurrentHeld + remainingClasses;
    const monthProjectedPresent = monthCurrentAttended + expectedAttendedRemaining;
    const monthProjectedAbsent = monthProjectedTotal - monthProjectedPresent;
    const monthPredictedPercentage = monthProjectedTotal > 0 
      ? (monthProjectedPresent / monthProjectedTotal) * 100 
      : 0;
    const monthDiff = monthCurrentPercentage !== null 
      ? monthPredictedPercentage - monthCurrentPercentage 
      : 0;

    // 2. FULL SEMESTER PREDICTION
    const semesterCurrentHeld = stats.totalHeld;
    const semesterCurrentAttended = stats.totalAttended;
    const semesterCurrentPercentage = stats.percentage;

    const semesterProjectedTotal = semesterCurrentHeld + remainingClasses;
    const semesterProjectedPresent = semesterCurrentAttended + expectedAttendedRemaining;
    const semesterProjectedAbsent = semesterProjectedTotal - semesterProjectedPresent;
    const semesterPredictedPercentage = semesterProjectedTotal > 0 
      ? (semesterProjectedPresent / semesterProjectedTotal) * 100 
      : 0;
    const semesterDiff = semesterPredictedPercentage - semesterCurrentPercentage;

    return {
      month: {
        currentHeld: monthCurrentHeld,
        currentAttended: monthCurrentAttended,
        currentPercentage: monthCurrentPercentage,
        projectedTotal: monthProjectedTotal,
        projectedPresent: monthProjectedPresent,
        projectedAbsent: monthProjectedAbsent,
        predictedPercentage: monthPredictedPercentage,
        diff: monthDiff,
      },
      semester: {
        currentHeld: semesterCurrentHeld,
        currentAttended: semesterCurrentAttended,
        currentPercentage: semesterCurrentPercentage,
        projectedTotal: semesterProjectedTotal,
        projectedPresent: semesterProjectedPresent,
        projectedAbsent: semesterProjectedAbsent,
        predictedPercentage: semesterPredictedPercentage,
        diff: semesterDiff,
      },
      remainingClasses,
      expectedMissed: validMissed,
      expectedAttendedRemaining,
    };
  }, [stats, monthStatsSoFar, dateInfo.remainingClasses, expectedMissed]);

  // Smart Message Generator considering both Month and Semester forecasts
  const smartMessage = useMemo(() => {
    const semPred = predictions.semester.predictedPercentage;
    const monthPred = predictions.month.predictedPercentage;

    if (semPred >= 90 && monthPred >= 90) {
      return {
        icon: <Sparkles className="text-emerald-400" size={22} />,
        title: "🎉 Outstanding Attendance!",
        body: `You are projected to finish ${dateInfo.currentMonth} at ${monthPred.toFixed(1)}%, taking your full semester attendance to an impressive ${semPred.toFixed(1)}%!`,
        bg: "from-emerald-950/40 to-emerald-900/20 border-emerald-500/30 text-emerald-300",
        badgeBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        color: "emerald"
      };
    } else if (semPred >= targetAttendance) {
      return {
        icon: <CheckCircle2 className="text-blue-400" size={22} />,
        title: "✅ Safe Semester Status",
        body: `Your end-of-month semester attendance will be ${semPred.toFixed(1)}% (above the ${targetAttendance}% requirement). For ${dateInfo.currentMonth}, you'll achieve ${monthPred.toFixed(1)}%.`,
        bg: "from-blue-950/40 to-blue-900/20 border-blue-500/30 text-blue-300",
        badgeBg: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        color: "blue"
      };
    } else if (semPred >= 60) {
      return {
        icon: <AlertTriangle className="text-amber-400" size={22} />,
        title: "⚠️ Warning: Below Semester Target",
        body: `Your semester attendance will end at ${semPred.toFixed(1)}% (below ${targetAttendance}%). This month's attendance will be ${monthPred.toFixed(1)}%. Try to minimize your ${predictions.expectedMissed} planned absences!`,
        bg: "from-amber-950/40 to-amber-900/20 border-amber-500/30 text-amber-300",
        badgeBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        color: "amber"
      };
    } else {
      return {
        icon: <AlertCircle className="text-rose-400" size={22} />,
        title: "🚨 Critical: Shortage Alert",
        body: `Semester attendance will drop to ${semPred.toFixed(1)}%. Even with ${dateInfo.remainingClasses} classes remaining in ${dateInfo.currentMonth}, you urgently need to attend more classes to avoid detention.`,
        bg: "from-rose-950/40 to-rose-900/20 border-rose-500/30 text-rose-300",
        badgeBg: "bg-rose-500/20 text-rose-400 border-rose-500/30",
        color: "rose"
      };
    }
  }, [predictions, targetAttendance, dateInfo.currentMonth, dateInfo.remainingClasses]);

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

  // Helper to render radial gauge and prediction card
  const renderPredictionCard = (
    title: string,
    subtitle: string,
    badgeText: string,
    predPercent: number,
    diff: number,
    currentPercent: number | null,
    currentHeld: number,
    currentAttended: number,
    projectedTotal: number,
    projectedPresent: number,
    accentColor: 'indigo' | 'emerald' | 'primary'
  ) => {
    const isSafe = predPercent >= targetAttendance;
    const gaugeColor = predPercent >= 90 
      ? 'text-emerald-400' 
      : predPercent >= targetAttendance 
      ? (accentColor === 'indigo' ? 'text-indigo-400' : 'text-primary')
      : predPercent >= 60 
      ? 'text-amber-400' 
      : 'text-rose-500';

    return (
      <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle top glow */}
        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-10 pointer-events-none ${
          predPercent >= targetAttendance ? 'bg-emerald-500' : 'bg-rose-500'
        }`} />

        <div className="space-y-4">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                  accentColor === 'indigo'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-primary/20 text-primary border-primary/30'
                }`}>
                  {badgeText}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  isSafe 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {isSafe ? 'Above Target' : 'Below Target'}
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-white mt-1.5 flex items-center gap-1.5">
                {title}
              </h4>
              <p className="text-xs text-zinc-400">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Gauge & Main Predicted Stat */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="text-zinc-800/80"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className={gaugeColor}
                  strokeWidth="8"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * Math.min(100, Math.max(0, predPercent))) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tighter">
                  {predPercent.toFixed(1)}%
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                  Predicted
                </span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-3">
              {/* Diff badge */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-medium">Change vs Current:</span>
                <span className={`text-xs font-black font-mono flex items-center gap-1 ${
                  diff > 0
                    ? 'text-emerald-400'
                    : diff < 0
                    ? 'text-rose-400'
                    : 'text-zinc-400'
                }`}>
                  {diff > 0 ? (
                    <>
                      <TrendingUp size={14} />
                      +{diff.toFixed(1)}%
                    </>
                  ) : diff < 0 ? (
                    <>
                      <TrendingDown size={14} />
                      {diff.toFixed(1)}%
                    </>
                  ) : (
                    <>
                      <Minus size={14} />
                      0.0%
                    </>
                  )}
                </span>
              </div>

              {/* Progress bar comparison */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Current: <strong className="text-zinc-200">{currentPercent !== null ? `${currentPercent.toFixed(1)}%` : '0.0%'}</strong></span>
                  <span>End of Month: <strong className={isSafe ? 'text-emerald-400' : 'text-rose-400'}>{predPercent.toFixed(1)}%</strong></span>
                </div>
                <div className="h-2 w-full bg-zinc-800/80 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      predPercent >= 90
                        ? 'bg-emerald-500'
                        : predPercent >= targetAttendance
                        ? (accentColor === 'indigo' ? 'bg-indigo-500' : 'bg-primary')
                        : predPercent >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, predPercent))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <div className="bg-zinc-900/70 p-3 rounded-2xl border border-zinc-800/80">
              <span className="text-[10px] font-bold text-zinc-500 uppercase block">Current Record</span>
              <p className="text-sm font-black text-white font-mono mt-0.5">
                {currentAttended} / {currentHeld} <span className="text-[10px] text-zinc-400 font-normal">attended</span>
              </p>
              <span className="text-[10px] text-zinc-400 font-mono">
                ({currentPercent !== null ? `${currentPercent.toFixed(1)}%` : 'No classes held'})
              </span>
            </div>

            <div className="bg-zinc-900/70 p-3 rounded-2xl border border-zinc-800/80">
              <span className="text-[10px] font-bold text-primary uppercase block">Projected Total</span>
              <p className="text-sm font-black text-primary font-mono mt-0.5">
                {projectedPresent} / {projectedTotal} <span className="text-[10px] text-primary/70 font-normal">attended</span>
              </p>
              <span className="text-[10px] text-zinc-400 font-mono">
                ({predPercent.toFixed(1)}% end of month)
              </span>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between">
          <span>Target Requirement: <strong className="text-zinc-200">{targetAttendance}%</strong></span>
          <span className="font-mono text-zinc-500">{dateInfo.lastDayShort}</span>
        </div>
      </div>
    );
  };

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
            Predict your attendance for both <strong className="text-indigo-300">this month ({dateInfo.currentMonth})</strong> and your <strong className="text-primary">full semester</strong> based on your weekly class schedule, expected absences, and Jamia holidays.
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
          <span>Predictions</span>
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

        {/* STEP 2: EXPECTED ABSENCES */}
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

              {/* Current Context: Month vs Semester Stats So Far */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Month So Far */}
                <div className="bg-zinc-950/70 p-3.5 rounded-2xl border border-indigo-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                      <CalendarCheck size={12} />
                      {dateInfo.currentMonth} So Far
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-400">
                      {monthStatsSoFar.percentage !== null ? `${monthStatsSoFar.percentage.toFixed(1)}%` : 'No classes'}
                    </span>
                  </div>
                  <p className="text-base font-black text-white font-mono">
                    {monthStatsSoFar.attended} <span className="text-zinc-500 text-xs font-normal">/ {monthStatsSoFar.held} classes</span>
                  </p>
                </div>

                {/* Semester So Far */}
                <div className="bg-zinc-950/70 p-3.5 rounded-2xl border border-primary/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-primary uppercase tracking-wider flex items-center gap-1">
                      <GraduationCap size={12} />
                      Full Semester So Far
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-400">
                      {stats.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-base font-black text-white font-mono">
                    {stats.totalAttended} <span className="text-zinc-500 text-xs font-normal">/ {stats.totalHeld} classes</span>
                  </p>
                </div>

                {/* Remaining classes this month */}
                <div className="bg-zinc-950/70 p-3.5 rounded-2xl border border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Remaining in {dateInfo.currentMonth}
                    </span>
                  </div>
                  <p className="text-base font-black text-indigo-300 font-mono">
                    {dateInfo.remainingClasses} <span className="text-zinc-500 text-xs font-normal">classes ({dateInfo.remainingWorkingDays} days)</span>
                  </p>
                </div>
              </div>

              {/* Input for expected missed classes */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <label className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider block">
                  Expected Missed Classes In {dateInfo.currentMonth}
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
                  <span>See Predictions</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: RESULTS & DUAL PREDICTIONS */}
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
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-black text-base text-white">{smartMessage.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                      {dateInfo.currentMonth}: {predictions.month.predictedPercentage.toFixed(1)}%
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${smartMessage.badgeBg}`}>
                      Semester: {predictions.semester.predictedPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                  {smartMessage.body}
                </p>
              </div>
            </div>

            {/* View Switcher / Filter Pills */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/90 p-2 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 px-2">
                <Layers size={15} className="text-primary" />
                <span>Prediction Scope:</span>
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setActiveView('both')}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeView === 'both'
                      ? 'bg-primary text-zinc-950 shadow-md shadow-primary/20'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  📊 Compare Both
                </button>

                <button
                  onClick={() => setActiveView('month')}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeView === 'month'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  🗓 This Month ({dateInfo.currentMonth})
                </button>

                <button
                  onClick={() => setActiveView('semester')}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeView === 'semester'
                      ? 'bg-primary text-zinc-950 shadow-md shadow-primary/20'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  🎓 Full Semester
                </button>
              </div>
            </div>

            {/* PREDICTION CARDS DISPLAY */}
            <div className={`grid gap-6 ${
              activeView === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
            }`}>
              {/* CARD 1: THIS MONTH PREDICTION */}
              {(activeView === 'both' || activeView === 'month') && (
                renderPredictionCard(
                  `🗓 ${dateInfo.currentMonth} Prediction`,
                  `Predicted attendance for only ${dateInfo.currentMonth} by ${dateInfo.lastDayShort}`,
                  `THIS MONTH (${dateInfo.currentMonth})`,
                  predictions.month.predictedPercentage,
                  predictions.month.diff,
                  predictions.month.currentPercentage,
                  predictions.month.currentHeld,
                  predictions.month.currentAttended,
                  predictions.month.projectedTotal,
                  predictions.month.projectedPresent,
                  'indigo'
                )
              )}

              {/* CARD 2: FULL SEMESTER PREDICTION */}
              {(activeView === 'both' || activeView === 'semester') && (
                renderPredictionCard(
                  `🎓 Full Semester Prediction`,
                  `Overall cumulative semester attendance calculated at end of ${dateInfo.currentMonth}`,
                  'FULL SEMESTER',
                  predictions.semester.predictedPercentage,
                  predictions.semester.diff,
                  predictions.semester.currentPercentage,
                  predictions.semester.currentHeld,
                  predictions.semester.currentAttended,
                  predictions.semester.projectedTotal,
                  predictions.semester.projectedPresent,
                  'primary'
                )
              )}
            </div>

            {/* COMPARATIVE SUMMARY TABLE */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <h4 className="font-extrabold text-sm text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <Zap size={16} className="text-primary" />
                  Monthly vs Semester Comparison Breakdown
                </h4>
                <span className="text-[11px] font-mono text-zinc-500">
                  Target: {targetAttendance}%
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Scope</th>
                      <th className="py-2.5 px-3 text-center">Current Classes</th>
                      <th className="py-2.5 px-3 text-center">Current %</th>
                      <th className="py-2.5 px-3 text-center">Remaining</th>
                      <th className="py-2.5 px-3 text-center">Missed</th>
                      <th className="py-2.5 px-3 text-center">Projected Classes</th>
                      <th className="py-2.5 px-3 text-right">Predicted %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {/* Month Row */}
                    <tr className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-3 font-sans font-bold text-indigo-300 flex items-center gap-1.5">
                        <CalendarCheck size={14} className="text-indigo-400 shrink-0" />
                        <span>This Month ({dateInfo.currentMonth})</span>
                      </td>
                      <td className="py-3 px-3 text-center text-zinc-300">
                        {predictions.month.currentAttended} / {predictions.month.currentHeld}
                      </td>
                      <td className="py-3 px-3 text-center text-zinc-300">
                        {predictions.month.currentPercentage !== null ? `${predictions.month.currentPercentage.toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-3 px-3 text-center text-indigo-400 font-bold">
                        +{predictions.remainingClasses}
                      </td>
                      <td className="py-3 px-3 text-center text-rose-400 font-bold">
                        {predictions.expectedMissed}
                      </td>
                      <td className="py-3 px-3 text-center text-zinc-200 font-bold">
                        {predictions.month.projectedPresent} / {predictions.month.projectedTotal}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-indigo-400 text-sm">
                        {predictions.month.predictedPercentage.toFixed(1)}%
                      </td>
                    </tr>

                    {/* Semester Row */}
                    <tr className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-3 font-sans font-bold text-primary flex items-center gap-1.5">
                        <GraduationCap size={14} className="text-primary shrink-0" />
                        <span>Full Semester</span>
                      </td>
                      <td className="py-3 px-3 text-center text-zinc-300">
                        {predictions.semester.currentAttended} / {predictions.semester.currentHeld}
                      </td>
                      <td className="py-3 px-3 text-center text-zinc-300">
                        {predictions.semester.currentPercentage.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-center text-indigo-400 font-bold">
                        +{predictions.remainingClasses}
                      </td>
                      <td className="py-3 px-3 text-center text-rose-400 font-bold">
                        {predictions.expectedMissed}
                      </td>
                      <td className="py-3 px-3 text-center text-zinc-200 font-bold">
                        {predictions.semester.projectedPresent} / {predictions.semester.projectedTotal}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-primary text-sm">
                        {predictions.semester.predictedPercentage.toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-800">
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
