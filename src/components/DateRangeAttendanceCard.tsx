import React, { useState, useMemo } from 'react';
import { 
  CalendarRange, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  CalendarDays,
  Flame,
  Clock,
  Filter
} from 'lucide-react';
import { 
  format, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  eachDayOfInterval, 
  isAfter, 
  isBefore, 
  startOfDay 
} from 'date-fns';
import { AttendanceRecord, Semester, Exam } from '../types';
import { getTodayStr, getJamiaHoliday, isExamDay, safeParse } from '../utils/dateUtils';

interface DateRangeAttendanceCardProps {
  records: Record<string, AttendanceRecord>;
  semester: Semester;
  exams?: Exam[];
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DateRangeAttendanceCard: React.FC<DateRangeAttendanceCardProps> = ({
  records,
  semester,
  exams = [],
  showToast
}) => {
  const todayStr = getTodayStr();
  const todayDate = safeParse(todayStr) || new Date();

  // Default start date: 30 days ago or semester start date, whichever is more recent
  const defaultStartDate = useMemo(() => {
    const thirtyDaysAgo = format(subDays(todayDate, 30), 'yyyy-MM-dd');
    if (semester.startDate && semester.startDate <= todayStr) {
      return semester.startDate > thirtyDaysAgo ? semester.startDate : thirtyDaysAgo;
    }
    return thirtyDaysAgo;
  }, [semester.startDate, todayStr, todayDate]);

  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [showDayLogs, setShowDayLogs] = useState<boolean>(false);
  const [logFilter, setLogFilter] = useState<'all' | 'classes' | 'bunked'>('all');
  const [includeBaselineCredits, setIncludeBaselineCredits] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Check if dates are valid
  const isInvalidRange = useMemo(() => {
    if (!startDate || !endDate) return true;
    return startDate > endDate;
  }, [startDate, endDate]);

  // Quick preset ranges
  const applyPreset = (preset: '7days' | '14days' | 'thisMonth' | 'lastMonth' | '30days' | 'semesterSoFar' | 'fullSemester') => {
    const now = safeParse(todayStr) || new Date();
    
    switch (preset) {
      case '7days':
        setStartDate(format(subDays(now, 6), 'yyyy-MM-dd'));
        setEndDate(todayStr);
        break;
      case '14days':
        setStartDate(format(subDays(now, 13), 'yyyy-MM-dd'));
        setEndDate(todayStr);
        break;
      case '30days':
        setStartDate(format(subDays(now, 29), 'yyyy-MM-dd'));
        setEndDate(todayStr);
        break;
      case 'thisMonth':
        setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
        setEndDate(todayStr);
        break;
      case 'lastMonth': {
        const prevMonth = subMonths(now, 1);
        setStartDate(format(startOfMonth(prevMonth), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(prevMonth), 'yyyy-MM-dd'));
        break;
      }
      case 'semesterSoFar':
        setStartDate(semester.startDate || format(subDays(now, 30), 'yyyy-MM-dd'));
        setEndDate(todayStr);
        break;
      case 'fullSemester':
        setStartDate(semester.startDate || format(subDays(now, 60), 'yyyy-MM-dd'));
        setEndDate(semester.endDate || todayStr);
        break;
    }
  };

  const handleSwapDates = () => {
    const temp = startDate;
    setStartDate(endDate);
    setEndDate(temp);
  };

  // Main Range Attendance Calculation
  const rangeStats = useMemo(() => {
    if (isInvalidRange) return null;

    const start = safeParse(startDate);
    const end = safeParse(endDate);
    if (!start || !end) return null;

    const dayInterval = eachDayOfInterval({
      start: startOfDay(start),
      end: startOfDay(end),
    });

    let heldSum = 0;
    let attendedSum = 0;
    let daysWithClasses = 0;
    let fullAttendanceDays = 0;
    let partialAttendanceDays = 0;
    let missedAllDays = 0;
    let holidayDays = 0;

    interface DayDetail {
      dateStr: string;
      formattedDate: string;
      dayName: string;
      held: number;
      attended: number;
      percentage: number;
      isHoliday: boolean;
      holidayName?: string;
      isExam: boolean;
      status: 'full' | 'partial' | 'bunked' | 'holiday' | 'none';
    }

    const dayDetails: DayDetail[] = [];

    dayInterval.forEach((dateObj) => {
      const dStr = format(dateObj, 'yyyy-MM-dd');
      const dayName = format(dateObj, 'EEEE');
      const rec = records[dStr];
      const jamiaH = getJamiaHoliday(dateObj);
      const isExam = isExamDay(dStr, exams);

      const isHoliday = rec?.isHoliday === true || (jamiaH.isHoliday && (!rec || (rec.held || 0) === 0) && rec?.isHoliday !== false);
      const held = rec ? Math.max(0, rec.held || 0) : 0;
      const attended = rec ? Math.max(0, Math.min(held, rec.attended || 0)) : 0;

      let status: DayDetail['status'] = 'none';

      if (isHoliday) {
        holidayDays++;
        status = 'holiday';
      } else if (held > 0) {
        daysWithClasses++;
        heldSum += held;
        attendedSum += attended;

        if (attended === held) {
          fullAttendanceDays++;
          status = 'full';
        } else if (attended === 0) {
          missedAllDays++;
          status = 'bunked';
        } else {
          partialAttendanceDays++;
          status = 'partial';
        }
      }

      dayDetails.push({
        dateStr: dStr,
        formattedDate: format(dateObj, 'dd MMM yyyy'),
        dayName,
        held,
        attended,
        percentage: held > 0 ? (attended / held) * 100 : 0,
        isHoliday,
        holidayName: isHoliday ? (jamiaH.name || 'Holiday') : undefined,
        isExam,
        status
      });
    });

    // Check if initial baseline credits should be applied
    const eligibleForBaseline = !!(
      semester.initialHeld && 
      semester.initialHeld > 0 && 
      startDate <= (semester.startDate || '')
    );

    let finalHeld = heldSum;
    let finalAttended = attendedSum;

    if (eligibleForBaseline && includeBaselineCredits) {
      finalHeld += (semester.initialHeld || 0);
      finalAttended += (semester.initialAttended || 0);
    }

    const percentage = finalHeld > 0 ? (finalAttended / finalHeld) * 100 : 0;
    const bunked = finalHeld - finalAttended;
    const target = semester.targetAttendance || 75;
    const isSafe = percentage >= target;

    // Buffer bunks or needed classes
    let canBunkCount = 0;
    let mustAttendCount = 0;

    if (finalHeld > 0) {
      if (isSafe) {
        canBunkCount = Math.floor((finalAttended * 100) / target - finalHeld);
      } else {
        mustAttendCount = Math.ceil((target * finalHeld - 100 * finalAttended) / (100 - target));
      }
    }

    return {
      totalDays: dayInterval.length,
      daysWithClasses,
      fullAttendanceDays,
      partialAttendanceDays,
      missedAllDays,
      holidayDays,
      totalHeld: finalHeld,
      totalAttended: finalAttended,
      totalBunked: bunked,
      percentage,
      target,
      isSafe,
      canBunkCount: Math.max(0, canBunkCount),
      mustAttendCount: Math.max(0, mustAttendCount),
      eligibleForBaseline,
      dayDetails: dayDetails.reverse() // show latest first
    };
  }, [startDate, endDate, records, exams, semester, isInvalidRange, includeBaselineCredits]);

  const handleCopySummary = () => {
    if (!rangeStats) return;

    const formattedStart = format(safeParse(startDate) || new Date(), 'dd MMM yyyy');
    const formattedEnd = format(safeParse(endDate) || new Date(), 'dd MMM yyyy');
    
    const summaryText = `📊 BunkSafe Attendance Summary\n📅 Period: ${formattedStart} to ${formattedEnd}\n📈 Attendance: ${rangeStats.percentage.toFixed(1)}% (${rangeStats.totalAttended}/${rangeStats.totalHeld} classes)\n🎯 Target: ${rangeStats.target}%\n⚡ Status: ${rangeStats.isSafe ? `Safe (+${rangeStats.canBunkCount} bunks cushion)` : `Below Target (Need +${rangeStats.mustAttendCount} classes)`}\nBunked / Missed: ${rangeStats.totalBunked} classes\nCalculated via BunkSafe (Jamia Millia Islamia)`;

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      if (showToast) showToast('Attendance summary copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      if (showToast) showToast('Could not copy to clipboard.', 'error');
    });
  };

  const filteredDayDetails = useMemo(() => {
    if (!rangeStats) return [];
    if (logFilter === 'classes') {
      return rangeStats.dayDetails.filter(d => d.held > 0);
    }
    if (logFilter === 'bunked') {
      return rangeStats.dayDetails.filter(d => d.held > 0 && d.attended < d.held);
    }
    return rangeStats.dayDetails;
  }, [rangeStats, logFilter]);

  return (
    <div id="date-range-attendance-section" className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary shrink-0">
            <CalendarRange size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Date Range Attendance
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
                Special
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Check your total attendance between any two specific dates.
            </p>
          </div>
        </div>

        {rangeStats && rangeStats.totalHeld > 0 && (
          <button
            type="button"
            id="copy-date-range-summary-btn"
            onClick={handleCopySummary}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-all shadow-sm active:scale-95"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Summary</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Date Pickers & Range Form */}
      <div className="bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800/80 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          {/* Start Date */}
          <div className="space-y-1.5">
            <label 
              htmlFor="start-date-input" 
              className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Calendar size={13} className="text-primary" />
              Starting From Date
            </label>
            <input
              id="start-date-input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label 
              htmlFor="end-date-input" 
              className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"
            >
              <CalendarDays size={13} className="text-primary" />
              To This Date
            </label>
            <input
              id="end-date-input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-primary rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Invalid Range Alert */}
        {isInvalidRange && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>Starting date cannot be later than ending date.</span>
            </div>
            <button
              type="button"
              onClick={handleSwapDates}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-lg text-xs border border-rose-500/40 transition-all shrink-0"
            >
              Swap Dates
            </button>
          </div>
        )}

        {/* Quick Presets */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
            Quick Range Presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset('7days')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => applyPreset('14days')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all"
            >
              Last 14 Days
            </button>
            <button
              type="button"
              onClick={() => applyPreset('30days')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all"
            >
              Past 30 Days
            </button>
            <button
              type="button"
              onClick={() => applyPreset('thisMonth')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => applyPreset('lastMonth')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all"
            >
              Previous Month
            </button>
            {semester.startDate && (
              <button
                type="button"
                onClick={() => applyPreset('semesterSoFar')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-primary hover:border-primary/50 transition-all"
              >
                Semester So Far
              </button>
            )}
            {semester.startDate && semester.endDate && (
              <button
                type="button"
                onClick={() => applyPreset('fullSemester')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all"
              >
                Full Semester
              </button>
            )}
          </div>
        </div>

        {/* Baseline Credits Toggle if Applicable */}
        {rangeStats?.eligibleForBaseline && (
          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-3 text-xs">
            <span className="text-zinc-400 text-[11px]">
              Include semester baseline setup credits ({semester.initialAttended || 0}/{semester.initialHeld || 0})
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeBaselineCredits}
                onChange={(e) => setIncludeBaselineCredits(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        )}
      </div>

      {/* Results Display */}
      {rangeStats && !isInvalidRange && (
        <div className="space-y-4">
          {rangeStats.totalHeld > 0 ? (
            <>
              {/* Primary Metric Banner */}
              <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-inner flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 block mb-1">
                    Attendance Percentage ({format(safeParse(startDate) || new Date(), 'dd MMM')} – {format(safeParse(endDate) || new Date(), 'dd MMM')})
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className={`text-4xl sm:text-5xl font-black tracking-tight ${
                      rangeStats.isSafe ? 'text-primary' : 'text-rose-500'
                    }`}>
                      {rangeStats.percentage.toFixed(1)}%
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-zinc-400">
                      ({rangeStats.totalAttended} / {rangeStats.totalHeld} classes)
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-1.5">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    rangeStats.isSafe 
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' 
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                  }`}>
                    {rangeStats.isSafe ? (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Above Target ({rangeStats.target}%)</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={15} />
                        <span>Below Target ({rangeStats.target}%)</span>
                      </>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 max-w-[260px] sm:text-right leading-snug">
                    {rangeStats.isSafe ? (
                      rangeStats.canBunkCount > 0 
                        ? `You have a cushion of ${rangeStats.canBunkCount} bunkable classes within this date window.`
                        : `Right on target! Keep attending regularly to protect your standing.`
                    ) : (
                      `You are short by ${rangeStats.mustAttendCount} classes to hit your ${rangeStats.target}% requirement in this window.`
                    )}
                  </p>
                </div>
              </div>

              {/* 4-Stat Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Classes Held
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-white">
                    {rangeStats.totalHeld}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Over {rangeStats.daysWithClasses} working days
                  </p>
                </div>

                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Attended
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-emerald-400">
                    {rangeStats.totalAttended}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Present in lectures
                  </p>
                </div>

                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Bunked / Missed
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-rose-400">
                    {rangeStats.totalBunked}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Absent from classes
                  </p>
                </div>

                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Holidays & Off
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-zinc-300">
                    {rangeStats.holidayDays}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Out of {rangeStats.totalDays} calendar days
                  </p>
                </div>
              </div>

              {/* Day-by-Day Logs Expander */}
              <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/40">
                <button
                  type="button"
                  id="toggle-day-logs-btn"
                  onClick={() => setShowDayLogs(prev => !prev)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-primary" />
                    <span className="text-xs font-bold text-zinc-200">
                      Day-by-Day Breakdown ({rangeStats.dayDetails.filter(d => d.held > 0).length} active days)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold">
                    <span>{showDayLogs ? 'Hide Logs' : 'View Day Details'}</span>
                    {showDayLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {showDayLogs && (
                  <div className="p-3.5 border-t border-zinc-800/80 space-y-3">
                    {/* Log Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      <button
                        type="button"
                        onClick={() => setLogFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                          logFilter === 'all'
                            ? 'bg-zinc-800 border-zinc-700 text-white'
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        All Days ({rangeStats.dayDetails.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogFilter('classes')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                          logFilter === 'classes'
                            ? 'bg-primary/20 border-primary/40 text-primary'
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Classes Only ({rangeStats.dayDetails.filter(d => d.held > 0).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogFilter('bunked')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                          logFilter === 'bunked'
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Days with Bunks ({rangeStats.dayDetails.filter(d => d.held > 0 && d.attended < d.held).length})
                      </button>
                    </div>

                    {/* Day List */}
                    <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {filteredDayDetails.length > 0 ? (
                        filteredDayDetails.map((day) => (
                          <div
                            key={day.dateStr}
                            className="bg-zinc-900/80 border border-zinc-800/70 hover:border-zinc-700/80 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${
                                day.status === 'full' 
                                  ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' 
                                  : day.status === 'partial' 
                                    ? 'bg-amber-400' 
                                    : day.status === 'bunked' 
                                      ? 'bg-rose-500 shadow-sm shadow-rose-500/50' 
                                      : 'bg-zinc-600'
                              }`} />
                              <div className="truncate">
                                <span className="font-bold text-white block truncate">
                                  {day.formattedDate}
                                </span>
                                <span className="text-[10px] text-zinc-500">
                                  {day.dayName}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              {day.isHoliday ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                                  {day.holidayName || 'Holiday'}
                                </span>
                              ) : day.held > 0 ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-semibold text-zinc-300">
                                    {day.attended} / {day.held} attended
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                    day.percentage >= 75 
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                                      : day.percentage > 0 
                                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' 
                                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  }`}>
                                    {day.percentage.toFixed(0)}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-zinc-500 italic">
                                  No classes held
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs text-zinc-500">
                          No days matching the selected filter in this date range.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-6 text-center space-y-2">
              <Calendar className="mx-auto text-zinc-600" size={28} />
              <h4 className="text-sm font-bold text-zinc-300">
                No Classes Recorded Between These Dates
              </h4>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                No attendance logs or classes were found between {format(safeParse(startDate) || new Date(), 'dd MMM yyyy')} and {format(safeParse(endDate) || new Date(), 'dd MMM yyyy')}. Try expanding your date range or selecting a preset like "Semester So Far".
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
