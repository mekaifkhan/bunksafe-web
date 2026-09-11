import { format, parseISO, eachDayOfInterval, startOfDay } from 'date-fns';
import { getJamiaHoliday } from './dateUtils';
import { Profile, AttendanceRecord } from '../types';

export interface TimetableEntry {
  id: string;
  academicYear: string; // "2026-27"
  semester: string; // "Semester 1"
  programme: 'Regular' | 'Self-Financed' | string;
  branch: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  subjectCode: string;
  subjectName: string;
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "10:00" or "10:40"
  type: 'THEORY' | 'LAB' | 'PRACTICAL' | 'WHOLE_CLASS_PRACTICAL';
  group: 'G1' | 'G2' | null;
  isWholeClass: boolean;
  room?: string;
  faculty?: string;
  sessionDuration?: number; // e.g. 60, 100, 200 minutes
  attendanceUnit: number; // Always 1 per scheduled session
}

export interface JmiSem1Subject {
  code: string;
  name: string;
  type: 'Theory' | 'Lab';
  credits: number;
  isWholeClass?: boolean;
}

// Master Subject Data for JMI FET Semester 1 (2026-27)
export const JMI_SEM1_SUBJECT_MASTER: JmiSem1Subject[] = [
  { code: 'ASB-101', name: 'Engineering Physics-I', type: 'Theory', credits: 3 },
  { code: 'ASB-102', name: 'Engineering Chemistry', type: 'Theory', credits: 3 },
  { code: 'ASB-103', name: 'Engineering Mathematics-I', type: 'Theory', credits: 3 },
  { code: 'ASB-104', name: 'Biology for Engineers', type: 'Theory', credits: 3 },
  { code: 'ASB-105', name: 'Environmental Science', type: 'Theory', credits: 2 },
  { code: 'AST-101', name: 'Communication Skills', type: 'Theory', credits: 2 },
  { code: 'ASM-101', name: 'Constitution of India', type: 'Theory', credits: 0 },
  { code: 'CSS-101', name: 'Fundamentals of Computing', type: 'Theory', credits: 3 },
  { code: 'CES-101', name: 'Basics of Civil Engineering', type: 'Theory', credits: 3 },
  { code: 'MES-101', name: 'Basics of Mechanical Engineering', type: 'Theory', credits: 3 },
  { code: 'EES-101', name: 'Basics of Electrical Engineering', type: 'Theory', credits: 3 },
  { code: 'ECS-101', name: 'Basics of Electronics & Communication Engineering', type: 'Theory', credits: 3 },
  { code: 'ASL-101', name: 'Language Laboratory', type: 'Lab', credits: 1 },
  { code: 'ASL-102', name: 'Engineering Physics Laboratory-I', type: 'Lab', credits: 1 },
  { code: 'ASL-103', name: 'Engineering Chemistry Laboratory', type: 'Lab', credits: 1 },
  { code: 'ASL-104', name: 'Design Thinking Lab', type: 'Lab', credits: 1 },
  { code: 'MEL-101', name: 'Engineering Graphics & Design', type: 'Lab', credits: 2, isWholeClass: true },
  { code: 'MEL-102', name: 'Engineering Mechanics Laboratory', type: 'Lab', credits: 1 },
  { code: 'MEL-103', name: 'Workshop Practice', type: 'Lab', credits: 2, isWholeClass: true },
];

export const JMI_10_BRANCHES = [
  { code: 'CIVIL', name: 'Civil Engineering', programme: 'Regular' },
  { code: 'ELEC', name: 'Electrical Engineering', programme: 'Regular' },
  { code: 'MECH', name: 'Mechanical Engineering', programme: 'Regular' },
  { code: 'ECE', name: 'Electronics & Communication Engineering', programme: 'Regular' },
  { code: 'COMP', name: 'Computer Engineering', programme: 'Regular' },
  { code: 'EEC', name: 'Electrical & Computer Engineering', programme: 'Self-Financed' },
  { code: 'VLSI', name: 'Electronics / VLSI Design & Technology', programme: 'Self-Financed' },
  { code: 'CSDS', name: 'Computer Science & Engineering (Data Sciences)', programme: 'Self-Financed' },
  { code: 'ROBOTICS', name: 'Robotics & Artificial Intelligence', programme: 'Self-Financed' },
  { code: 'CONST_TECH', name: 'Construction Technology', programme: 'Self-Financed' }
];

export function normalizeJmiBranch(branchName?: string): string {
  if (!branchName) return 'Civil Engineering';
  const b = branchName.toLowerCase().trim();
  if (b.includes('construction')) return 'Construction Technology';
  if (b.includes('electrical') && b.includes('computer')) return 'Electrical & Computer Engineering';
  if (b.includes('vlsi')) return 'Electronics / VLSI Design & Technology';
  if (b.includes('data science') || b.includes('data sciences') || b.includes('csds')) return 'Computer Science & Engineering (Data Sciences)';
  if (b.includes('robotics') || b.includes('ai')) return 'Robotics & Artificial Intelligence';
  if (b.includes('computer') && !b.includes('electrical')) return 'Computer Engineering';
  if (b.includes('electronics') || b.includes('ece')) return 'Electronics & Communication Engineering';
  if (b.includes('electrical')) return 'Electrical Engineering';
  if (b.includes('mechanical')) return 'Mechanical Engineering';
  if (b.includes('civil')) return 'Civil Engineering';
  return 'Civil Engineering';
}

// Master Timetable Entries Generator for JMI FET Semester 1
function createTimetableForBranch(branch: string): TimetableEntry[] {
  const normBranch = normalizeJmiBranch(branch);
  const entries: TimetableEntry[] = [];
  let idCount = 1;

  const add = (
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday',
    subjectCode: string,
    subjectName: string,
    startTime: string,
    endTime: string,
    type: 'THEORY' | 'LAB' | 'PRACTICAL' | 'WHOLE_CLASS_PRACTICAL',
    group: 'G1' | 'G2' | null = null,
    isWholeClass: boolean = false,
    room?: string
  ) => {
    entries.push({
      id: `jmi_sem1_${normBranch.replace(/\s+/g, '_')}_${idCount++}`,
      academicYear: '2026-27',
      semester: 'Semester 1',
      programme: ['Electrical & Computer Engineering', 'Electronics / VLSI Design & Technology', 'Computer Science & Engineering (Data Sciences)', 'Robotics & Artificial Intelligence', 'Construction Technology'].includes(normBranch) ? 'Self-Financed' : 'Regular',
      branch: normBranch,
      day,
      subjectCode,
      subjectName,
      startTime,
      endTime,
      type,
      group,
      isWholeClass,
      room,
      attendanceUnit: 1
    });
  };

  // Branch-specific Subject Specs
  let coreCode = 'CES-101';
  let coreName = 'Basics of Civil Engineering';
  if (normBranch === 'Electrical Engineering') { coreCode = 'EES-101'; coreName = 'Basics of Electrical Engineering'; }
  else if (normBranch === 'Mechanical Engineering') { coreCode = 'MES-101'; coreName = 'Basics of Mechanical Engineering'; }
  else if (normBranch === 'Electronics & Communication Engineering' || normBranch === 'Electronics / VLSI Design & Technology') { coreCode = 'ECS-101'; coreName = 'Basics of Electronics & Communication Engineering'; }
  else if (normBranch === 'Computer Engineering' || normBranch === 'Computer Science & Engineering (Data Sciences)') { coreCode = 'CSS-101'; coreName = 'Fundamentals of Computing'; }
  else if (normBranch === 'Electrical & Computer Engineering') { coreCode = 'EES-101'; coreName = 'Basics of Electrical Engineering'; }
  else if (normBranch === 'Robotics & Artificial Intelligence') { coreCode = 'MES-101'; coreName = 'Basics of Mechanical Engineering'; }

  // MONDAY
  add('Monday', 'ASB-103', 'Engineering Mathematics-I', '09:00', '10:00', 'THEORY', null, true, 'LT-1');
  add('Monday', coreCode, coreName, '10:00', '11:00', 'THEORY', null, true, 'LT-1');
  add('Monday', 'ASB-101', 'Engineering Physics-I', '11:00', '12:00', 'THEORY', null, true, 'LT-1');
  add('Monday', 'AST-101', 'Communication Skills', '12:00', '01:00', 'THEORY', null, true, 'LT-1');
  // Monday Afternoon Whole Class Practical
  add('Monday', 'MEL-103', 'Workshop Practice', '02:10', '05:30', 'WHOLE_CLASS_PRACTICAL', null, true, 'Workshop Block');

  // TUESDAY
  add('Tuesday', 'ASB-102', 'Engineering Chemistry', '09:00', '10:00', 'THEORY', null, true, 'LT-1');
  add('Tuesday', coreCode, coreName, '10:00', '11:00', 'THEORY', null, true, 'LT-1');
  add('Tuesday', 'ASB-103', 'Engineering Mathematics-I', '11:00', '12:00', 'THEORY', null, true, 'LT-1');
  add('Tuesday', 'ASM-101', 'Constitution of India', '12:00', '01:00', 'THEORY', null, true, 'LT-1');
  // Tuesday Afternoon Group Labs
  add('Tuesday', 'ASL-102', 'Engineering Physics Laboratory-I', '02:10', '03:50', 'LAB', 'G1', false, 'Physics Lab');
  add('Tuesday', 'ASL-103', 'Engineering Chemistry Laboratory', '02:10', '03:50', 'LAB', 'G2', false, 'Chemistry Lab');
  add('Tuesday', 'ASL-103', 'Engineering Chemistry Laboratory', '03:50', '05:30', 'LAB', 'G1', false, 'Chemistry Lab');
  add('Tuesday', 'ASL-102', 'Engineering Physics Laboratory-I', '03:50', '05:30', 'LAB', 'G2', false, 'Physics Lab');

  // WEDNESDAY
  add('Wednesday', 'ASB-101', 'Engineering Physics-I', '09:00', '10:00', 'THEORY', null, true, 'LT-1');
  add('Wednesday', 'ASB-102', 'Engineering Chemistry', '10:00', '11:00', 'THEORY', null, true, 'LT-1');
  add('Wednesday', coreCode, coreName, '11:00', '12:00', 'THEORY', null, true, 'LT-1');
  add('Wednesday', 'AST-101', 'Communication Skills', '12:00', '01:00', 'THEORY', null, true, 'LT-1');
  // Wednesday Afternoon Whole Class Practical
  add('Wednesday', 'MEL-101', 'Engineering Graphics & Design', '02:10', '05:30', 'WHOLE_CLASS_PRACTICAL', null, true, 'Graphics Hall');

  // THURSDAY
  // Thursday Morning Group Labs
  add('Thursday', 'MEL-102', 'Engineering Mechanics Laboratory', '09:00', '10:40', 'LAB', 'G1', false, 'Mechanics Lab');
  add('Thursday', 'ASL-101', 'Language Laboratory', '09:00', '10:40', 'LAB', 'G2', false, 'Language Lab');
  add('Thursday', 'ASL-101', 'Language Laboratory', '10:40', '12:20', 'LAB', 'G1', false, 'Language Lab');
  add('Thursday', 'MEL-102', 'Engineering Mechanics Laboratory', '10:40', '12:20', 'LAB', 'G2', false, 'Mechanics Lab');
  // Thursday Afternoon Theory
  add('Thursday', 'ASB-103', 'Engineering Mathematics-I', '02:00', '03:00', 'THEORY', null, true, 'LT-1');
  add('Thursday', 'ASB-101', 'Engineering Physics-I', '03:00', '04:00', 'THEORY', null, true, 'LT-1');
  add('Thursday', 'ASB-102', 'Engineering Chemistry', '04:00', '05:00', 'THEORY', null, true, 'LT-1');

  // FRIDAY
  add('Friday', 'ASB-103', 'Engineering Mathematics-I', '09:00', '10:00', 'THEORY', null, true, 'LT-1');
  add('Friday', 'ASB-101', 'Engineering Physics-I', '10:00', '11:00', 'THEORY', null, true, 'LT-1');
  add('Friday', 'ASB-102', 'Engineering Chemistry', '11:00', '12:00', 'THEORY', null, true, 'LT-1');
  add('Friday', coreCode, coreName, '02:00', '03:00', 'THEORY', null, true, 'LT-1');

  return entries;
}

// Cached Master Timetable Map
const JMI_SEM1_TIMETABLE_CACHE: Record<string, TimetableEntry[]> = {};

export function getSem1TimetableForBranch(
  branchName: string,
  group?: 'G1' | 'G2' | string | null
): TimetableEntry[] {
  const normBranch = normalizeJmiBranch(branchName);
  if (!JMI_SEM1_TIMETABLE_CACHE[normBranch]) {
    JMI_SEM1_TIMETABLE_CACHE[normBranch] = createTimetableForBranch(normBranch);
  }
  const full = JMI_SEM1_TIMETABLE_CACHE[normBranch];

  const grp = (group === 'G1' || group === 'G2') ? group : null;

  return full.filter(entry => {
    // If student selected G1 or G2 specifically, filter by it
    if (grp) {
      if (entry.isWholeClass || entry.group === null) {
        return true;
      }
      return entry.group === grp;
    }
    // If no group specified, show all classes and labs so students see complete schedule without being prompted
    return true;
  });
}

// Calculate expected timetable classes for a single day (Monday..Friday)
export function getSem1DailyScheduledCount(
  branchName: string,
  group: 'G1' | 'G2' | string | null | undefined,
  dayName: string
): number {
  if (dayName === 'Saturday' || dayName === 'Sunday') return 0;
  // Use specified group or fallback to 'G1' for representative single-student load to avoid double counting concurrent labs
  const evalGroup = (group === 'G1' || group === 'G2') ? group : 'G1';
  const filtered = getSem1TimetableForBranch(branchName, evalGroup).filter(e => e.day === dayName);
  // Each session represents 1 attendance unit
  return filtered.reduce((acc, curr) => acc + (curr.attendanceUnit || 1), 0);
}

// Calculate expected scheduled classes for each day of the week
export function getSem1WeeklyScheduledCounts(
  branchName: string,
  group: 'G1' | 'G2' | string | null | undefined
): Record<string, number> {
  const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const res: Record<string, number> = {};
  days.forEach(d => {
    res[d] = getSem1DailyScheduledCount(branchName, group, d);
  });
  return res;
}

// User Overrides Storage Helpers
const USER_OVERRIDES_KEY = 'bs_user_override_classes';

export function getUserOverrides(): Record<string, number> {
  try {
    const saved = localStorage.getItem(USER_OVERRIDES_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function setUserOverride(dateStr: string, count: number): void {
  try {
    const current = getUserOverrides();
    current[dateStr] = Math.max(0, count);
    localStorage.setItem(USER_OVERRIDES_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to save user override class count:', err);
  }
}

export function clearUserOverride(dateStr: string): void {
  try {
    const current = getUserOverrides();
    delete current[dateStr];
    localStorage.setItem(USER_OVERRIDES_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to clear user override class count:', err);
  }
}

// Get effective classes for a specific date (YYYY-MM-DD)
export function getEffectiveClassesForDate(
  dateStr: string, // YYYY-MM-DD
  profile: Profile,
  userOverrides?: Record<string, number>,
  records?: Record<string, AttendanceRecord>
): {
  scheduledDefaultClasses: number;
  userOverrideClasses?: number;
  effectiveClasses: number;
  isHoliday: boolean;
  isWeekend: boolean;
} {
  const overrides = userOverrides || getUserOverrides();
  const dateObj = parseISO(dateStr);
  const dayName = format(dateObj, 'EEEE');
  const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';

  const jamiaH = getJamiaHoliday(dateObj);
  const record = records?.[dateStr];
  const isHoliday = !!(record?.isHoliday || (jamiaH.isHoliday && record?.held === 0 && record?.isHoliday !== false));

  // Determine default scheduled classes
  let scheduledDefaultClasses = 0;
  if (!isWeekend && !isHoliday) {
    if (profile.semester === 'Semester 1') {
      const grp = (profile.labGroup === 'G1' || profile.labGroup === 'G2') ? profile.labGroup : null;
      scheduledDefaultClasses = getSem1DailyScheduledCount(profile.department, grp, dayName);
    } else {
      // General fallback for other semesters
      scheduledDefaultClasses = dayName === 'Friday' ? 4 : 5;
    }
  }

  const userOverride = overrides[dateStr];
  const effectiveClasses = typeof userOverride === 'number' ? userOverride : scheduledDefaultClasses;

  return {
    scheduledDefaultClasses,
    userOverrideClasses: userOverride,
    effectiveClasses,
    isHoliday,
    isWeekend
  };
}

// End-of-Month Attendance Prediction Helper
export interface EomPredictionInput {
  profile: Profile;
  stats: {
    totalHeld: number;
    totalAttended: number;
  };
  expectedMissedClasses: number;
  userOverrides?: Record<string, number>;
  records?: Record<string, AttendanceRecord>;
  targetDate?: Date;
}

export interface EomPredictionResult {
  currentHeld: number;
  currentAttended: number;
  currentPercentage: number;
  remainingWorkingDays: number;
  remainingScheduledClasses: number;
  skippedHolidays: Array<{ dateStr: string; name: string }>;
  expectedMissedClasses: number;
  expectedAttendedRemaining: number;
  projectedTotal: number;
  projectedPresent: number;
  projectedAbsent: number;
  predictedPercentage: number;
  targetAttendance: number;
  diff: number;
}

export function calculateEomPrediction(input: EomPredictionInput): EomPredictionResult {
  const { profile, stats, expectedMissedClasses, userOverrides = getUserOverrides(), records = {}, targetDate = new Date() } = input;

  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysRemainingInMonth = eachDayOfInterval({
    start: startOfDay(targetDate),
    end: startOfDay(lastDayOfMonth),
  });

  let remainingWorkingDays = 0;
  let remainingScheduledClasses = 0;
  const skippedHolidays: Array<{ dateStr: string; name: string }> = [];

  daysRemainingInMonth.forEach((d) => {
    const dStr = format(d, 'yyyy-MM-dd');
    const dayName = format(d, 'EEEE');
    const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';

    if (isWeekend) return;

    const rec = records[dStr];
    // Avoid double counting if attendance is already recorded for this date
    const isAlreadyRecorded = rec && (rec.held > 0 || rec.isHoliday);
    if (isAlreadyRecorded) return;

    const jamiaH = getJamiaHoliday(d);
    const isHoliday = !!(rec?.isHoliday || (jamiaH.isHoliday && rec?.held === 0 && rec?.isHoliday !== false));

    if (isHoliday) {
      skippedHolidays.push({
        dateStr: format(d, 'MMM d'),
        name: jamiaH.name || rec?.date || 'Jamia Holiday'
      });
      return;
    }

    // Calculate effective classes for this remaining date
    const eff = getEffectiveClassesForDate(dStr, profile, userOverrides, records);
    if (eff.effectiveClasses > 0) {
      remainingWorkingDays++;
      remainingScheduledClasses += eff.effectiveClasses;
    }
  });

  const currentHeld = Math.max(0, stats.totalHeld);
  const currentAttended = Math.max(0, Math.min(currentHeld, stats.totalAttended));
  const currentPercentage = currentHeld > 0 ? (currentAttended / currentHeld) * 100 : 0;

  const validMissed = Math.min(Math.max(0, expectedMissedClasses), remainingScheduledClasses);
  const expectedAttendedRemaining = Math.max(0, remainingScheduledClasses - validMissed);

  const projectedTotal = currentHeld + remainingScheduledClasses;
  const projectedPresent = currentAttended + expectedAttendedRemaining;
  const projectedAbsent = Math.max(0, projectedTotal - projectedPresent);

  const predictedPercentage = projectedTotal > 0 ? Math.min(100, Math.max(0, (projectedPresent / projectedTotal) * 100)) : 0;
  const targetAttendance = profile.attendanceTarget || 75;
  const diff = predictedPercentage - currentPercentage;

  return {
    currentHeld,
    currentAttended,
    currentPercentage,
    remainingWorkingDays,
    remainingScheduledClasses,
    skippedHolidays,
    expectedMissedClasses: validMissed,
    expectedAttendedRemaining,
    projectedTotal,
    projectedPresent,
    projectedAbsent,
    predictedPercentage,
    targetAttendance,
    diff
  };
}
