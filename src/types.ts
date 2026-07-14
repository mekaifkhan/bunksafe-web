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
}

export interface Subject {
  id: string;
  name: string;
  type: 'Theory' | 'Lab';
  credits: number;
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


