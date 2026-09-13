import React, { useState, useMemo, useEffect } from 'react';
import { 
  AlertCircle, 
  CalendarClock, 
  History, 
  Percent, 
  CalendarDays, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Plus, 
  Minus, 
  X, 
  Info, 
  Check,
  Calendar,
  Sparkles,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO, eachDayOfInterval, addDays, subDays, isBefore, isAfter, startOfDay } from 'date-fns';
import { Semester, AttendanceRecord } from '../types';
import { 
  formatDate, 
  getTodayStr, 
  getKolkataTodayStr, 
  getJamiaHoliday, 
  safeParse 
} from '../utils/dateUtils';

interface LateSemesterOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  semester: Semester;
  onUpdateSemester: (updated: Semester) => void;
  records: Record<string, AttendanceRecord>;
  onUpdateRecords: (updatedRecords: Record<string, AttendanceRecord>) => void;
  classSchedule?: Record<string, Record<number, string>>;
  onComplete?: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type ModalStep = 
  | 'INITIAL_CHOICE'
  | 'FILL_METHOD_CHOICE'
  | 'PERCENTAGE_RANGE'
  | 'PERCENTAGE_SCHEDULE'
  | 'PERCENTAGE_HOLIDAYS'
  | 'PERCENTAGE_CALCULATED'
  | 'PERCENTAGE_REMAINING_MANUAL'
  | 'FULL_MANUAL_DAY_BY_DAY';

export const LateSemesterOnboardingModal: React.FC<LateSemesterOnboardingModalProps> = ({
  isOpen,
  onClose,
  semester,
  onUpdateSemester,
  records,
  onUpdateRecords,
  classSchedule,
  onComplete,
  showToast
}) => {
  const todayStr = getKolkataTodayStr();
  const yesterdayStr = formatDate(subDays(new Date(), 1));

  const [step, setStep] = useState<ModalStep>('INITIAL_CHOICE');

  // --- Percentage Wizard State ---
  const [knownPercentage, setKnownPercentage] = useState<number>(75);
  const [pctFromDate, setPctFromDate] = useState<string>(() => semester.startDate || '2026-07-17');
  const [pctToDate, setPctToDate] = useState<string>(() => {
    // Default to yesterday if today is strictly after fromDate, else today
    return yesterdayStr >= (semester.startDate || '') ? yesterdayStr : todayStr;
  });

  // Weekday class counts (Monday to Saturday)
  const [weekdayCounts, setWeekdayCounts] = useState<Record<string, number>>(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const counts: Record<string, number> = {
      Monday: 4,
      Tuesday: 4,
      Wednesday: 4,
      Thursday: 4,
      Friday: 4,
      Saturday: 0
    };
    if (classSchedule) {
      days.forEach(day => {
        const slots = Object.keys(classSchedule[day] || {}).length;
        if (slots > 0) {
          counts[day] = slots;
        }
      });
    }
    return counts;
  });

  // Holidays set for percentage range (stored as Record of dateStr -> boolean)
  const [rangeHolidays, setRangeHolidays] = useState<Record<string, { isHoliday: boolean; name?: string }>>({});

  // Remaining days list for manual entry after percentage period
  const [remainingDays, setRemainingDays] = useState<string[]>([]);
  const [remainingDayIndex, setRemainingDayIndex] = useState<number>(0);
  const [remainingDayHeld, setRemainingDayHeld] = useState<number>(4);
  const [remainingDayAttended, setRemainingDayAttended] = useState<number>(4);
  const [remainingDayIsHoliday, setRemainingDayIsHoliday] = useState<boolean>(false);
  const [accumulatedRemainingRecords, setAccumulatedRemainingRecords] = useState<Record<string, AttendanceRecord>>({});

  // --- Full Manual Day-by-Day State ---
  const [fullManualDays, setFullManualDays] = useState<string[]>([]);
  const [fullManualIndex, setFullManualIndex] = useState<number>(0);
  const [fullManualHeld, setFullManualHeld] = useState<number>(4);
  const [fullManualAttended, setFullManualAttended] = useState<number>(4);
  const [fullManualIsHoliday, setFullManualIsHoliday] = useState<boolean>(false);
  const [accumulatedFullManualRecords, setAccumulatedFullManualRecords] = useState<Record<string, AttendanceRecord>>({});

  // Initialize dates when semester changes
  useEffect(() => {
    if (semester.startDate) {
      setPctFromDate(semester.startDate);
      if (yesterdayStr >= semester.startDate) {
        setPctToDate(yesterdayStr);
      } else {
        setPctToDate(todayStr);
      }
    }
  }, [semester.startDate, yesterdayStr, todayStr]);

  // When step changes to PERCENTAGE_HOLIDAYS, initialize the holiday list for [pctFromDate, pctToDate]
  useEffect(() => {
    if (step === 'PERCENTAGE_HOLIDAYS') {
      const from = safeParse(pctFromDate);
      const to = safeParse(pctToDate);
      if (from && to && !isAfter(from, to)) {
        try {
          const days = eachDayOfInterval({ start: from, end: to });
          const holidays: Record<string, { isHoliday: boolean; name?: string }> = {};
          days.forEach(d => {
            const dStr = formatDate(d);
            const holidayCheck = getJamiaHoliday(d);
            const dayName = format(d, 'EEEE');
            if (dayName === 'Sunday') {
              holidays[dStr] = { isHoliday: true, name: 'Sunday' };
            } else if (dayName === 'Saturday' && (weekdayCounts['Saturday'] || 0) === 0) {
              holidays[dStr] = { isHoliday: true, name: 'Saturday (Off)' };
            } else if (holidayCheck.isHoliday) {
              holidays[dStr] = { isHoliday: true, name: holidayCheck.name || 'Holiday' };
            } else {
              holidays[dStr] = { isHoliday: false };
            }
          });
          setRangeHolidays(holidays);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [step, pctFromDate, pctToDate, weekdayCounts]);

  // Sync current remaining day values when index changes
  useEffect(() => {
    if (step === 'PERCENTAGE_REMAINING_MANUAL' && remainingDays.length > 0 && remainingDayIndex < remainingDays.length) {
      const currentDateStr = remainingDays[remainingDayIndex];
      const parsed = safeParse(currentDateStr);
      const dayName = parsed ? format(parsed, 'EEEE') : 'Monday';
      const defaultHeld = weekdayCounts[dayName] || 4;
      const isSun = dayName === 'Sunday';
      const isSatOff = dayName === 'Saturday' && (weekdayCounts['Saturday'] || 0) === 0;
      const jamia = parsed ? getJamiaHoliday(parsed) : { isHoliday: false };
      const isHoli = isSun || isSatOff || jamia.isHoliday;

      setRemainingDayIsHoliday(isHoli);
      setRemainingDayHeld(isHoli ? 0 : defaultHeld);
      setRemainingDayAttended(isHoli ? 0 : defaultHeld);
    }
  }, [step, remainingDayIndex, remainingDays, weekdayCounts]);

  // Sync full manual day values when index changes
  useEffect(() => {
    if (step === 'FULL_MANUAL_DAY_BY_DAY' && fullManualDays.length > 0 && fullManualIndex < fullManualDays.length) {
      const currentDateStr = fullManualDays[fullManualIndex];
      const parsed = safeParse(currentDateStr);
      const dayName = parsed ? format(parsed, 'EEEE') : 'Monday';
      const defaultHeld = weekdayCounts[dayName] || 4;
      const isSun = dayName === 'Sunday';
      const isSatOff = dayName === 'Saturday' && (weekdayCounts['Saturday'] || 0) === 0;
      const jamia = parsed ? getJamiaHoliday(parsed) : { isHoliday: false };
      const isHoli = isSun || isSatOff || jamia.isHoliday;

      setFullManualIsHoliday(isHoli);
      setFullManualHeld(isHoli ? 0 : defaultHeld);
      setFullManualAttended(isHoli ? 0 : defaultHeld);
    }
  }, [step, fullManualIndex, fullManualDays, weekdayCounts]);

  if (!isOpen) return null;

  // --- Calculations for Percentage Range ---
  const calculationSummary = useMemo(() => {
    const from = safeParse(pctFromDate);
    const to = safeParse(pctToDate);
    if (!from || !to || isAfter(from, to)) {
      return { totalDays: 0, workingDays: 0, holidayCount: 0, totalHeld: 0, totalAttended: 0, dayBreakdown: [] };
    }

    try {
      const days = eachDayOfInterval({ start: from, end: to });
      let totalHeld = 0;
      let workingDays = 0;
      let holidayCount = 0;
      const dayBreakdown: { dateStr: string; dayName: string; isHoliday: boolean; holidayName?: string; held: number }[] = [];

      days.forEach(d => {
        const dStr = formatDate(d);
        const dayName = format(d, 'EEEE');
        const holi = rangeHolidays[dStr];
        const isHoliday = holi ? holi.isHoliday : (dayName === 'Sunday' || (dayName === 'Saturday' && (weekdayCounts['Saturday'] || 0) === 0));
        
        if (isHoliday) {
          holidayCount++;
          dayBreakdown.push({
            dateStr: dStr,
            dayName,
            isHoliday: true,
            holidayName: holi?.name,
            held: 0
          });
        } else {
          const held = weekdayCounts[dayName] || 0;
          totalHeld += held;
          workingDays++;
          dayBreakdown.push({
            dateStr: dStr,
            dayName,
            isHoliday: false,
            held
          });
        }
      });

      const totalAttended = Math.min(totalHeld, Math.max(0, Math.round(totalHeld * (knownPercentage / 100))));

      return {
        totalDays: days.length,
        workingDays,
        holidayCount,
        totalHeld,
        totalAttended,
        dayBreakdown
      };
    } catch (e) {
      return { totalDays: 0, workingDays: 0, holidayCount: 0, totalHeld: 0, totalAttended: 0, dayBreakdown: [] };
    }
  }, [pctFromDate, pctToDate, rangeHolidays, weekdayCounts, knownPercentage]);

  // Check if remaining days exist after pctToDate
  const pendingRemainingDaysCount = useMemo(() => {
    const to = safeParse(pctToDate);
    const today = safeParse(todayStr);
    if (!to || !today || !isBefore(to, today)) return 0;
    try {
      const nextDay = addDays(to, 1);
      const days = eachDayOfInterval({ start: nextDay, end: today });
      return days.length;
    } catch (e) {
      return 0;
    }
  }, [pctToDate, todayStr]);

  // --- Handlers ---

  // Option 1: Start From Today (You will not have past semester attendance data)
  const handleStartFromToday = () => {
    const updatedSemester: Semester = {
      ...semester,
      startDate: todayStr, // Start semester tracking from today
      originalStartDate: semester.startDate || todayStr,
      lockedUntil: yesterdayStr, // Exclude past days
      isInitialized: true,
      initialHeld: 0,
      initialAttended: 0,
      lateJoinerHandled: true,
      lateJoinerChoice: 'from_today'
    };

    localStorage.setItem('bs_semester', JSON.stringify(updatedSemester));
    localStorage.setItem('bs_late_joiner_handled', 'true');
    localStorage.setItem('bs_late_joiner_choice', 'from_today');

    onUpdateSemester(updatedSemester);
    if (showToast) {
      showToast('Tracking started from today. Whole semester past data excluded.', 'info');
    }
    if (onComplete) onComplete();
    onClose();
  };

  // Option 2A: Generate records from percentage calculations
  const generateRecordsFromPercentage = (): Record<string, AttendanceRecord> => {
    const newRecords: Record<string, AttendanceRecord> = { ...records };
    const { dayBreakdown, totalHeld, totalAttended } = calculationSummary;

    if (totalHeld === 0) {
      dayBreakdown.forEach(item => {
        newRecords[item.dateStr] = {
          date: item.dateStr,
          held: 0,
          attended: 0,
          isHoliday: item.isHoliday
        };
      });
      return newRecords;
    }

    // Distribute attended classes proportionally across working days
    let remainingToDistribute = totalAttended;
    const workingItems = dayBreakdown.filter(i => !i.isHoliday && i.held > 0);

    workingItems.forEach((item, idx) => {
      if (idx === workingItems.length - 1) {
        // Last working item gets whatever is remaining to be exact
        const att = Math.min(item.held, Math.max(0, remainingToDistribute));
        newRecords[item.dateStr] = {
          date: item.dateStr,
          held: item.held,
          attended: att,
          isHoliday: false
        };
        remainingToDistribute -= att;
      } else {
        const ratio = item.held / totalHeld;
        const targetAttended = Math.min(item.held, Math.round(ratio * totalAttended));
        const att = Math.min(remainingToDistribute, targetAttended);
        newRecords[item.dateStr] = {
          date: item.dateStr,
          held: item.held,
          attended: att,
          isHoliday: false
        };
        remainingToDistribute -= att;
      }
    });

    // Holidays
    dayBreakdown.filter(i => i.isHoliday).forEach(item => {
      newRecords[item.dateStr] = {
        date: item.dateStr,
        held: 0,
        attended: 0,
        isHoliday: true
      };
    });

    return newRecords;
  };

  // Apply Percentage and check if remaining manual days are needed
  const handleApplyPercentage = () => {
    const generated = generateRecordsFromPercentage();

    const to = safeParse(pctToDate);
    const today = safeParse(todayStr);

    if (to && today && isBefore(to, today)) {
      // Need manual entry for dates from (pctToDate + 1) to today
      try {
        const nextDay = addDays(to, 1);
        const days = eachDayOfInterval({ start: nextDay, end: today }).map(d => formatDate(d));
        setRemainingDays(days);
        setRemainingDayIndex(0);
        setAccumulatedRemainingRecords(generated);
        setStep('PERCENTAGE_REMAINING_MANUAL');
        return;
      } catch (e) {
        console.error(e);
      }
    }

    // No remaining days, save directly
    saveAllRecordsAndFinish(generated, 'percentage');
  };

  // Save current remaining day and move to next
  const handleSaveRemainingDay = () => {
    if (remainingDayIndex >= remainingDays.length) return;
    const currentDateStr = remainingDays[remainingDayIndex];
    const nextAccumulated = {
      ...accumulatedRemainingRecords,
      [currentDateStr]: {
        date: currentDateStr,
        held: remainingDayIsHoliday ? 0 : remainingDayHeld,
        attended: remainingDayIsHoliday ? 0 : remainingDayAttended,
        isHoliday: remainingDayIsHoliday
      }
    };
    setAccumulatedRemainingRecords(nextAccumulated);

    if (remainingDayIndex + 1 < remainingDays.length) {
      setRemainingDayIndex(prev => prev + 1);
    } else {
      // Finished all remaining days!
      saveAllRecordsAndFinish(nextAccumulated, 'percentage');
    }
  };

  // Start Full Manual Day-by-Day Flow
  const handleStartFullManual = () => {
    const from = safeParse(semester.startDate || '2026-07-17');
    const today = safeParse(todayStr);
    if (!from || !today || isAfter(from, today)) {
      if (showToast) showToast('Invalid semester start date range.', 'error');
      return;
    }

    try {
      const days = eachDayOfInterval({ start: from, end: today }).map(d => formatDate(d));
      setFullManualDays(days);
      setFullManualIndex(0);
      setAccumulatedFullManualRecords({ ...records });
      setStep('FULL_MANUAL_DAY_BY_DAY');
    } catch (e) {
      if (showToast) showToast('Failed to generate dates.', 'error');
    }
  };

  // Save current full manual day and move to next
  const handleSaveFullManualDay = () => {
    if (fullManualIndex >= fullManualDays.length) return;
    const currentDateStr = fullManualDays[fullManualIndex];
    const nextAccumulated = {
      ...accumulatedFullManualRecords,
      [currentDateStr]: {
        date: currentDateStr,
        held: fullManualIsHoliday ? 0 : fullManualHeld,
        attended: fullManualIsHoliday ? 0 : fullManualAttended,
        isHoliday: fullManualIsHoliday
      }
    };
    setAccumulatedFullManualRecords(nextAccumulated);

    if (fullManualIndex + 1 < fullManualDays.length) {
      setFullManualIndex(prev => prev + 1);
    } else {
      // Finished all days!
      saveAllRecordsAndFinish(nextAccumulated, 'manual');
    }
  };

  // Common finalize function
  const saveAllRecordsAndFinish = (finalRecords: Record<string, AttendanceRecord>, choice: 'percentage' | 'manual') => {
    localStorage.setItem('bs_records', JSON.stringify(finalRecords));
    localStorage.setItem('bs_late_joiner_handled', 'true');
    localStorage.setItem('bs_late_joiner_choice', choice);

    const updatedSemester: Semester = {
      ...semester,
      isInitialized: true,
      lateJoinerHandled: true,
      lateJoinerChoice: choice
    };
    localStorage.setItem('bs_semester', JSON.stringify(updatedSemester));

    onUpdateRecords(finalRecords);
    onUpdateSemester(updatedSemester);

    if (showToast) {
      showToast(
        choice === 'percentage' 
          ? 'Past attendance calculated and synchronized successfully!' 
          : 'All past attendance entries saved successfully!',
        'success'
      );
    }
    if (onComplete) onComplete();
    onClose();
  };

  // Toggle holiday in percentage date list
  const toggleHoliday = (dateStr: string) => {
    setRangeHolidays(prev => {
      const current = prev[dateStr];
      const isCurrentlyHoliday = !!current?.isHoliday;
      return {
        ...prev,
        [dateStr]: {
          isHoliday: !isCurrentlyHoliday,
          name: !isCurrentlyHoliday ? 'Custom Off Day' : undefined
        }
      };
    });
  };

  // Quick holiday toggles
  const handleMarkAllSaturdaysHoliday = (mark: boolean) => {
    setRangeHolidays(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(dStr => {
        const d = safeParse(dStr);
        if (d && format(d, 'EEEE') === 'Saturday') {
          next[dStr] = { isHoliday: mark, name: mark ? 'Saturday (Off)' : undefined };
        }
      });
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800/90 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            {step !== 'INITIAL_CHOICE' && (
              <button
                type="button"
                onClick={() => {
                  if (step === 'FILL_METHOD_CHOICE') setStep('INITIAL_CHOICE');
                  else if (step === 'PERCENTAGE_RANGE') setStep('FILL_METHOD_CHOICE');
                  else if (step === 'PERCENTAGE_SCHEDULE') setStep('PERCENTAGE_RANGE');
                  else if (step === 'PERCENTAGE_HOLIDAYS') setStep('PERCENTAGE_SCHEDULE');
                  else if (step === 'PERCENTAGE_CALCULATED') setStep('PERCENTAGE_HOLIDAYS');
                  else if (step === 'PERCENTAGE_REMAINING_MANUAL') setStep('PERCENTAGE_CALCULATED');
                  else if (step === 'FULL_MANUAL_DAY_BY_DAY') setStep('FILL_METHOD_CHOICE');
                }}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="Go back"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm">
              <CalendarClock size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-zinc-100 leading-tight">
                {step === 'INITIAL_CHOICE' && 'Semester Already In Progress'}
                {step === 'FILL_METHOD_CHOICE' && 'Previous Attendance Options'}
                {step === 'PERCENTAGE_RANGE' && 'Step 1: Attendance Percentage & Range'}
                {step === 'PERCENTAGE_SCHEDULE' && 'Step 2: Weekly Class Timetable'}
                {step === 'PERCENTAGE_HOLIDAYS' && 'Step 3: Off-Days & Holidays'}
                {step === 'PERCENTAGE_CALCULATED' && 'Step 4: Calculated Summary'}
                {step === 'PERCENTAGE_REMAINING_MANUAL' && 'Step 5: Fill Remaining Days'}
                {step === 'FULL_MANUAL_DAY_BY_DAY' && 'Manual Day-by-Day Entry'}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">
                Semester started {semester.startDate ? format(parseISO(semester.startDate), 'dd MMM yyyy') : 'earlier'} &bull; Today: {todayStr}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem('bs_late_joiner_handled', 'true');
              } catch (e) {
                // ignore
              }
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            title="Close for now"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-zinc-200">
          
          {/* STEP 1: INITIAL CHOICE */}
          {step === 'INITIAL_CHOICE' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-xs text-amber-200/90 leading-relaxed">
                <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-300">Late Semester Start Detected</p>
                  <p className="mt-0.5 text-zinc-300">
                    Your semester started before today. Choose whether you want to start tracking fresh from today or account for classes that were already held.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 pt-1">
                {/* Option 1: Start From Today */}
                <div 
                  onClick={handleStartFromToday}
                  className="group relative p-4 rounded-2xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 text-zinc-300">
                          <Calendar size={18} />
                        </span>
                        <h3 className="text-sm font-black text-white">Start From Today</h3>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        Fresh Start
                      </span>
                    </div>

                    <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-2.5">
                      <p className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle size={13} className="shrink-0" />
                        You will not have data of attendance for the whole semester.
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        Past classes prior to today ({todayStr}) will not be counted or factored into your attendance percentage.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs font-bold text-zinc-400 group-hover:text-zinc-200">
                    <span>Use Start from Today</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Option 2: Fill Previous Attendance */}
                <div 
                  onClick={() => setStep('FILL_METHOD_CHOICE')}
                  className="group relative p-4 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-primary/20 text-primary">
                          <History size={18} />
                        </span>
                        <h3 className="text-sm font-black text-white">Fill Previous Attendance</h3>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary-light">
                        Recommended
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Account for classes held between semester start and today. Keep your bunk calculation and 75% goal 100% accurate.
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-primary/20 flex items-center justify-between text-xs font-bold text-primary group-hover:text-primary-light">
                    <span>Choose Entry Method</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: FILL METHOD CHOICE */}
          {step === 'FILL_METHOD_CHOICE' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-white">How would you like to fill previous attendance?</h3>
                <p className="text-xs text-zinc-400">Choose the method that works best for your schedule:</p>
              </div>

              <div className="grid grid-cols-1 gap-3.5 pt-2">
                {/* Sub-Option A: Known Percentage */}
                <div 
                  onClick={() => setStep('PERCENTAGE_RANGE')}
                  className="group p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-primary/50 transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
                        <Percent size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">I Know My Attendance Percentage</h4>
                        <span className="text-[10px] font-semibold text-primary">Quick &amp; Smart Calculation</span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-zinc-500 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Provide your percentage from a specific date range. We'll ask how many classes you have on Monday–Friday and what holidays occurred, calculate total held/attended classes, and then prompt manual entry for any remaining days.
                  </p>
                </div>

                {/* Sub-Option B: Day-by-Day Manual */}
                <div 
                  onClick={handleStartFullManual}
                  className="group p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300">
                        <CalendarDays size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">Fill Manually Day by Day</h4>
                        <span className="text-[10px] font-semibold text-zinc-400">Exact Day-by-Day Control</span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Step through each academic day from semester start date ({semester.startDate}) till today ({todayStr}) and record classes held, attended, or marked as holidays.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PERCENTAGE WIZARD STEP 1: PERCENTAGE & DATE RANGE */}
          {step === 'PERCENTAGE_RANGE' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Known Percentage Period</span>
                <h3 className="text-sm sm:text-base font-bold text-white">Enter your attendance % and the date range it covers</h3>
              </div>

              {/* Percentage Input */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300">Your Attendance Percentage (%)</label>
                  <span className="text-lg font-black text-primary">{knownPercentage}%</span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={knownPercentage}
                    onChange={(e) => setKnownPercentage(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={knownPercentage}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                      setKnownPercentage(val);
                    }}
                    className="w-16 bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1.5 text-center text-sm font-black text-white focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[60, 65, 70, 75, 80, 85, 90, 95].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setKnownPercentage(pct)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                        knownPercentage === pct
                          ? 'bg-primary border-primary text-black'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Selection */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <label className="text-xs font-bold text-zinc-300 block">Attendance Date Window</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium text-zinc-400">From (Semester / Join Date)</span>
                    <input
                      type="date"
                      value={pctFromDate}
                      onChange={(e) => setPctFromDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium text-zinc-400">To (Date Known Till)</span>
                    <input
                      type="date"
                      value={pctToDate}
                      max={todayStr}
                      onChange={(e) => setPctToDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {pendingRemainingDaysCount > 0 ? (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 text-[11px] text-blue-300 flex items-center gap-2">
                    <Info size={14} className="shrink-0" />
                    <span>
                      You chose up to {pctToDate}. The remaining <strong>{pendingRemainingDaysCount} day{pendingRemainingDaysCount > 1 ? 's' : ''}</strong> up to today will be filled manually afterwards.
                    </span>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-[11px] text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>Your percentage covers up to today. No further manual days needed.</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep('PERCENTAGE_SCHEDULE')}
                disabled={!pctFromDate || !pctToDate || pctFromDate > pctToDate}
                className="w-full py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-black font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <span>Continue: Weekly Class Timetable</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* PERCENTAGE WIZARD STEP 2: WEEKDAY CLASSES SCHEDULE */}
          {step === 'PERCENTAGE_SCHEDULE' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Class Schedule</span>
                <h3 className="text-sm sm:text-base font-bold text-white">How many classes take place on each day?</h3>
                <p className="text-xs text-zinc-400">
                  Enter the regular number of classes scheduled on Monday, Tuesday, Wednesday, Thursday, and Friday.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                  <div 
                    key={day}
                    className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">{day}</h4>
                      <p className="text-[10px] text-zinc-500">
                        {weekdayCounts[day] === 0 ? 'No classes / Off' : `${weekdayCounts[day]} class${weekdayCounts[day] > 1 ? 'es' : ''}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setWeekdayCounts(prev => ({ ...prev, [day]: Math.max(0, (prev[day] || 0) - 1) }))}
                        className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-6 text-center text-xs font-black text-white">
                        {weekdayCounts[day] || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => setWeekdayCounts(prev => ({ ...prev, [day]: Math.min(10, (prev[day] || 0) + 1) }))}
                        className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStep('PERCENTAGE_HOLIDAYS')}
                className="w-full py-3.5 bg-primary hover:bg-primary-dark text-black font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <span>Continue: Off-Days &amp; Holidays</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* PERCENTAGE WIZARD STEP 3: HOLIDAYS SELECTION */}
          {step === 'PERCENTAGE_HOLIDAYS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Holiday Detection</span>
                  <h3 className="text-sm sm:text-base font-bold text-white">Which days were holidays or had no class?</h3>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700">
                  {calculationSummary.holidayCount} Off-Days
                </span>
              </div>

              <p className="text-xs text-zinc-400">
                Official Jamia / national holidays and Sundays have been pre-detected. Tap any date to toggle whether classes occurred or not.
              </p>

              {/* Fast action pills */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAllSaturdaysHoliday(true)}
                  className="text-[11px] font-semibold px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-300"
                >
                  All Saturdays Off
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAllSaturdaysHoliday(false)}
                  className="text-[11px] font-semibold px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-300"
                >
                  Working Saturdays
                </button>
              </div>

              {/* Scrollable list of dates in the range */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 border border-zinc-800/80 rounded-2xl p-2 bg-zinc-950/60">
                {calculationSummary.dayBreakdown.map((item) => {
                  const isHoli = item.isHoliday;
                  return (
                    <div
                      key={item.dateStr}
                      onClick={() => toggleHoliday(item.dateStr)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                        isHoli
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isHoli ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                        <span className="font-bold">{item.dateStr}</span>
                        <span className="text-[10px] text-zinc-400">({item.dayName})</span>
                        {item.holidayName && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-medium">
                            {item.holidayName}
                          </span>
                        )}
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isHoli ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {isHoli ? 'Holiday (0 Held)' : `${item.held} Classes Held`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setStep('PERCENTAGE_CALCULATED')}
                className="w-full py-3.5 bg-primary hover:bg-primary-dark text-black font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <span>Calculate Total Classes &rarr;</span>
              </button>
            </div>
          )}

          {/* PERCENTAGE WIZARD STEP 4: CALCULATED RESULTS */}
          {step === 'PERCENTAGE_CALCULATED' && (
            <div className="space-y-4">
              <div className="space-y-1 text-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Calculation Complete</span>
                <h3 className="text-base font-bold text-white">Calculated Attendance in Selected Period</h3>
                <p className="text-xs text-zinc-400">{pctFromDate} &rarr; {pctToDate}</p>
              </div>

              {/* Highlights cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 text-center space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Classes Held</span>
                  <p className="text-xl font-black text-white">{calculationSummary.totalHeld}</p>
                  <span className="text-[9px] text-zinc-500">{calculationSummary.workingDays} working days</span>
                </div>

                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 text-center space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Attended</span>
                  <p className="text-xl font-black text-emerald-400">{calculationSummary.totalAttended}</p>
                  <span className="text-[9px] text-zinc-500">{knownPercentage}% applied</span>
                </div>

                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 text-center space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Off-Days</span>
                  <p className="text-xl font-black text-amber-400">{calculationSummary.holidayCount}</p>
                  <span className="text-[9px] text-zinc-500">Holidays / off</span>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>Targeted Attendance:</span>
                  <span className="font-bold text-white">{knownPercentage}%</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Actual Effective Percentage:</span>
                  <span className="font-bold text-primary">
                    {calculationSummary.totalHeld > 0 
                      ? `${((calculationSummary.totalAttended / calculationSummary.totalHeld) * 100).toFixed(1)}%` 
                      : '0%'}
                  </span>
                </div>
                <div className="border-t border-zinc-800 pt-2 text-[11px] text-zinc-400 leading-relaxed">
                  Daily attendance records will be generated proportionally across working days so all calendar, monthly, and subject views function seamlessly.
                </div>
              </div>

              {pendingRemainingDaysCount > 0 ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
                    <p className="font-bold">Next Step: Fill Remaining {pendingRemainingDaysCount} Day{pendingRemainingDaysCount > 1 ? 's' : ''}</p>
                    <p className="text-[11px] text-zinc-300 mt-0.5">
                      Since your percentage covered till {pctToDate}, you will now enter attendance manually day by day for {pendingRemainingDaysCount} remaining day(s) up to today ({todayStr}).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyPercentage}
                    className="w-full py-3.5 bg-primary hover:bg-primary-dark text-black font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <span>Apply &amp; Fill Remaining Days ({pendingRemainingDaysCount}) &rarr;</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyPercentage}
                  className="w-full py-3.5 bg-primary hover:bg-primary-dark text-black font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <Check size={18} />
                  <span>Save &amp; Complete Setup</span>
                </button>
              )}
            </div>
          )}

          {/* PERCENTAGE WIZARD STEP 5: REMAINING DAYS MANUAL ENTRY */}
          {step === 'PERCENTAGE_REMAINING_MANUAL' && remainingDays.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Remaining Day {remainingDayIndex + 1} of {remainingDays.length}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {safeParse(remainingDays[remainingDayIndex]) 
                      ? format(safeParse(remainingDays[remainingDayIndex])!, 'EEEE, dd MMMM yyyy') 
                      : remainingDays[remainingDayIndex]}
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
                  {Math.round(((remainingDayIndex + 1) / remainingDays.length) * 100)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((remainingDayIndex + 1) / remainingDays.length) * 100}%` }}
                />
              </div>

              {/* Holiday Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRemainingDayIsHoliday(false);
                    if (remainingDayHeld === 0) setRemainingDayHeld(4);
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    !remainingDayIsHoliday
                      ? 'bg-primary/20 border-primary text-primary-light'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  Regular Class Day
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRemainingDayIsHoliday(true);
                    setRemainingDayHeld(0);
                    setRemainingDayAttended(0);
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    remainingDayIsHoliday
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <AlertCircle size={14} />
                  Holiday / No Class
                </button>
              </div>

              {!remainingDayIsHoliday ? (
                <div className="space-y-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
                  {/* Classes Held */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Classes Held</h4>
                      <p className="text-[10px] text-zinc-500">Scheduled on this day</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.max(1, remainingDayHeld - 1);
                          setRemainingDayHeld(val);
                          if (remainingDayAttended > val) setRemainingDayAttended(val);
                        }}
                        className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-black text-white">{remainingDayHeld}</span>
                      <button
                        type="button"
                        onClick={() => setRemainingDayHeld(prev => prev + 1)}
                        className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Classes Attended */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Classes Attended</h4>
                      <p className="text-[10px] text-zinc-500">Lectures you attended</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setRemainingDayAttended(prev => Math.max(0, prev - 1))}
                        className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-black text-primary">{remainingDayAttended}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const val = remainingDayAttended + 1;
                          setRemainingDayAttended(val);
                          if (val > remainingDayHeld) setRemainingDayHeld(val);
                        }}
                        className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Quick helpers */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setRemainingDayAttended(remainingDayHeld)}
                      className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-300"
                    >
                      Attended All ({remainingDayHeld}/{remainingDayHeld})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemainingDayAttended(0)}
                      className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-300"
                    >
                      Missed All (0/{remainingDayHeld})
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-center">
                  <p className="text-xs font-bold text-amber-300">Marked as Holiday</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">This day will not be included in attendance calculations.</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveRemainingDay}
                className="w-full py-3.5 bg-primary hover:bg-primary-dark text-black font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <span>{remainingDayIndex + 1 === remainingDays.length ? 'Finish & Save Attendance' : 'Save & Next Day'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* FULL MANUAL DAY-BY-DAY FLOW */}
          {step === 'FULL_MANUAL_DAY_BY_DAY' && fullManualDays.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Day {fullManualIndex + 1} of {fullManualDays.length}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {safeParse(fullManualDays[fullManualIndex]) 
                      ? format(safeParse(fullManualDays[fullManualIndex])!, 'EEEE, dd MMMM yyyy') 
                      : fullManualDays[fullManualIndex]}
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
                  {Math.round(((fullManualIndex + 1) / fullManualDays.length) * 100)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((fullManualIndex + 1) / fullManualDays.length) * 100}%` }}
                />
              </div>

              {/* Holiday Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFullManualIsHoliday(false);
                    if (fullManualHeld === 0) setFullManualHeld(4);
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    !fullManualIsHoliday
                      ? 'bg-primary/20 border-primary text-primary-light'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  Regular Class Day
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFullManualIsHoliday(true);
                    setFullManualHeld(0);
                    setFullManualAttended(0);
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    fullManualIsHoliday
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <AlertCircle size={14} />
                  Holiday / No Class
                </button>
              </div>

              {!fullManualIsHoliday ? (
                <div className="space-y-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
                  {/* Classes Held */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Classes Held</h4>
                      <p className="text-[10px] text-zinc-500">Total lectures scheduled</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.max(1, fullManualHeld - 1);
                          setFullManualHeld(val);
                          if (fullManualAttended > val) setFullManualAttended(val);
                        }}
                        className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-black text-white">{fullManualHeld}</span>
                      <button
                        type="button"
                        onClick={() => setFullManualHeld(prev => prev + 1)}
                        className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Classes Attended */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Classes Attended</h4>
                      <p className="text-[10px] text-zinc-500">Lectures you sat in</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFullManualAttended(prev => Math.max(0, prev - 1))}
                        className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-black text-primary">{fullManualAttended}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const val = fullManualAttended + 1;
                          setFullManualAttended(val);
                          if (val > fullManualHeld) setFullManualHeld(val);
                        }}
                        className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Fast Action Buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setFullManualAttended(fullManualHeld)}
                      className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-300"
                    >
                      Attended All ({fullManualHeld}/{fullManualHeld})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFullManualAttended(0)}
                      className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-300"
                    >
                      Missed All (0/{fullManualHeld})
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-center">
                  <p className="text-xs font-bold text-amber-300">Marked as Holiday</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">This day will not be included in attendance calculations.</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveFullManualDay}
                className="w-full py-3.5 bg-primary hover:bg-primary-dark text-black font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <span>{fullManualIndex + 1 === fullManualDays.length ? 'Finish & Save Attendance' : 'Save & Next Day'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};
