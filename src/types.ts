export interface Profile {
  name: string;
  email: string;
  college: string;
  department: string;
  semester: string;
  mobile: string;
}

export interface Semester {
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
  startDate: string;
  endDate: string;
  finalPercentage: number;
  totalHeld: number;
  totalAttended: number;
}

export type AppState = 'WELCOME' | 'EMAIL_COLLECTION' | 'SEMESTER_SETUP' | 'LATE_DETECTION' | 'WIZARD' | 'GAP_HANDLING' | 'MAIN' | 'TODAY_CONFIRMATION';

export interface Exam {
  id: string;
  type: 'Mid-sem' | 'End-sem';
  label: string; // e.g., "Mid-sem 1", "End-sem"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}
