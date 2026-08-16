export interface Profile {
  name: string;
  email: string;
  college: string;
  department: string;
  semester: string;
  mobile: string;
  avatar?: string;
  academicSession?: string;
  programme?: string;
  firstYearPattern?: 'SetA' | 'SetB';
  faculty?: string;
  semesterStartDate?: string;
  semesterEndDate?: string;
  attendanceTarget?: number;
  registeredAt?: string;
  labGroup?: 'G1' | 'G2' | 'X1' | 'X2' | 'X3' | 'X4' | string;
  minorHonorsEnabled?: boolean;
  rollNumber?: string;
  academicBatchId?: string;
}

export interface LeaderboardMember {
  studentId: string;
  name: string;
  rollNumber?: string;
  academicBatchId: string;
  department: string;
  programme: string;
  semester: string;
  academicYear: string;
  semesterPercentage: number;
  semesterHeld: number;
  semesterAttended: number;
  monthPercentage: number | null;
  monthHeld: number;
  monthAttended: number;
  updatedAt: string;
}

export interface Semester {
  title?: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  targetAttendance: number; // e.g., 75
  isInitialized: boolean;
  initialHeld?: number;
  initialAttended?: number;
  lockedUntil?: string; // ISO string
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  held: number;
  attended: number;
  isHoliday: boolean;
  isLocked?: boolean;
}

export interface SemesterHistory {
  id: string;
  title?: string;
  startDate: string;
  endDate: string;
  finalPercentage: number;
  totalHeld: number;
  totalAttended: number;
}

export type AppState = 'SEMESTER_SETUP' | 'LATE_DETECTION' | 'WIZARD' | 'GAP_HANDLING' | 'MAIN' | 'TODAY_CONFIRMATION' | 'SEMESTER_END_REPORT';

export interface Exam {
  id: string;
  type: 'Mid-sem' | 'End-sem';
  label: string; // e.g., "Mid-sem 1", "End-sem"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface SubjectGradeConfig {
  id: string;
  name: string;
  maxMid1: number;
  maxMid2: number;
  hasAssignment: boolean;
  maxAssignment?: number;
  maxEndSem: number;
  obtainedMid1?: number;
  obtainedMid2?: number;
  obtainedAssignment?: number;
  obtainedEndSem?: number;
  targetGrade: string; // O, A+, A, B+, B, C, Pass
  obtainedInternalLab?: number;
  maxInternalLab?: number;
  obtainedExternalLab?: number;
  maxExternalLab?: number;
  swayamAssignments?: number[]; // 12 assignments for SWAYAM course mode
}

export interface Subject {
  id: string;
  name: string;
  type: 'Theory' | 'Lab' | 'SWAYAM';
  credits: number;
  room?: string;
}

export interface DailyAttendanceSnapshot {
  date: string; // YYYY-MM-DD in Asia/Kolkata
  syncedAt: string; // ISO timestamp of the sync event
  lastModifiedAt?: string; // ISO timestamp when manual local modifications occur
  userId: string;
  academicBatchId?: string;
  overall: {
    totalHeld: number;
    totalAttended: number;
    totalAbsent: number;
    percentage: number;
  };
  currentMonth: {
    totalHeld: number;
    totalAttended: number;
    percentage: number;
    monthName: string;
    monthKey: string; // YYYY-MM in Asia/Kolkata
  };
  semester: {
    totalHeld: number;
    totalAttended: number;
    percentage: number;
    targetAttendance: number;
    startDate?: string;
    endDate?: string;
  };
  subjects: Record<string, {
    id: string;
    name: string;
    type: 'Theory' | 'Lab' | 'SWAYAM';
    held: number;
    attended: number;
    percentage: number;
  }>;
  bunkInfo: {
    status: 'SAFE' | 'WARNING' | 'OK';
    canBunk: number;
    mustAttend: number;
  };
  syncStatus: 'synced' | 'cached' | 'offline_fallback' | 'manual_update';
}

export interface DailySyncResult {
  success: boolean;
  isFirstOpenToday: boolean;
  syncDate: string; // YYYY-MM-DD in Asia/Kolkata
  snapshot: DailyAttendanceSnapshot | null;
  error?: string;
  source: 'network' | 'cache' | 'offline_fallback';
}

export function formatSubjectName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}


