import { format } from 'date-fns';
import { Profile, Semester, AttendanceRecord, LeaderboardMember } from '../types';
import { getJamiaHoliday, isExamDay } from './dateUtils';

/**
 * Normalizes branch name to a standard token
 */
export function normalizeBranchCode(department?: string): string {
  if (!department) return 'UNKNOWN';
  const d = department.toLowerCase().trim();

  if (d.includes('applied science') || d.includes('ash')) return 'ASH';
  if (d.includes('construction') || (d.includes('civil') && d.includes('self'))) return 'CONST_TECH';
  if (d.includes('civil')) return 'CIVIL';
  if (d.includes('electrical & computer') || d.includes('ele_comp')) return 'ELE_COMP';
  if (d.includes('electrical') || d === 'ee') return 'EE';
  if (d.includes('mechanical') || d === 'me') return 'MECH';
  if (d.includes('vlsi')) return 'VLSI';
  if (d.includes('data science') || d.includes('data sciences') || d.includes('cs_ds')) return 'CS_DS';
  if (d.includes('robotics')) return 'ROBOTICS';
  if (d.includes('electronics & communication') || d.includes('ece')) return 'ECE';
  if (d.includes('computer')) return 'COMP';

  return d.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').slice(0, 16);
}

/**
 * Normalizes programme mode
 */
export function normalizeMode(programme?: string, department?: string): 'REGULAR' | 'SELF_FINANCED' {
  const p = (programme || '').toLowerCase();
  const d = (department || '').toLowerCase();
  if (p.includes('self') || d.includes('self')) {
    return 'SELF_FINANCED';
  }
  return 'REGULAR';
}

/**
 * Generates a deterministic academicBatchId for exact batch isolation.
 * Example: JMI_FET_BTECH_ECE_REGULAR_SEM5_2026_27
 */
export function getAcademicBatchId(profile: Profile): string | null {
  if (!profile) return null;

  // Verify JMI Smart Mode
  const college = (profile.college || '').toLowerCase().trim();
  const isJMI = college.includes('jamia') || college.includes('jmi');
  if (!isJMI) return null;

  // Extract Semester number
  const semRaw = (profile.semester || '').trim();
  if (!semRaw) return null;
  const semMatch = semRaw.match(/\d+/);
  const semNum = semMatch ? semMatch[0] : semRaw.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const semCode = `SEM${semNum}`;

  // Department handling (Sem 1 & Sem 2 are ASH by default if not set)
  let dept = profile.department?.trim();
  if (!dept && (semRaw === 'Semester 1' || semRaw === 'Semester 2')) {
    dept = 'Applied Science & Humanities';
  }
  if (!dept) return null;

  const branchCode = normalizeBranchCode(dept);
  const modeCode = normalizeMode(profile.programme, dept);

  // Normalize academic session / year
  let session = (profile.academicSession || '2026-27').trim();
  session = session.replace(/[^0-9]/g, '_').replace(/_+/g, '_');
  if (!session) session = '2026_27';

  return `JMI_FET_BTECH_${branchCode}_${modeCode}_${semCode}_${session}`;
}

/**
 * Returns human-readable academic context for display
 */
export function getAcademicDisplayDetails(profile: Profile): {
  programmeTitle: string;
  branchTitle: string;
  modeTitle: string;
  semesterTitle: string;
  sessionTitle: string;
  batchId: string;
} | null {
  const batchId = getAcademicBatchId(profile);
  if (!batchId) return null;

  const isSelfFinanced = normalizeMode(profile.programme, profile.department) === 'SELF_FINANCED';
  const branchCode = normalizeBranchCode(profile.department);
  
  const branchMap: Record<string, string> = {
    ASH: 'Applied Science & Humanities',
    CIVIL: 'Civil Engineering',
    CONST_TECH: 'Civil Engg (Construction Technology)',
    EE: 'Electrical Engineering',
    ELE_COMP: 'Electrical & Computer Engineering',
    MECH: 'Mechanical Engineering',
    ECE: 'Electronics & Communication Engineering',
    COMP: 'Computer Engineering',
    VLSI: 'Electronics (VLSI Design & Technology)',
    CS_DS: 'Computer Science (Data Sciences)',
    ROBOTICS: 'Robotics & Artificial Intelligence',
  };

  return {
    programmeTitle: 'B.Tech',
    branchTitle: branchMap[branchCode] || profile.department || 'B.Tech',
    modeTitle: isSelfFinanced ? 'Self-Financed' : 'Regular',
    semesterTitle: profile.semester || 'Current Semester',
    sessionTitle: profile.academicSession || '2026-27',
    batchId
  };
}

/**
 * Calculates current month and semester attendance statistics for batch leaderboard
 */
export function calculateBatchAttendanceStats(
  records: Record<string, AttendanceRecord>,
  semester: Semester,
  exams: any[] = []
): {
  semesterHeld: number;
  semesterAttended: number;
  semesterPercentage: number;
  monthHeld: number;
  monthAttended: number;
  monthPercentage: number | null;
} {
  const now = new Date();
  const currentMonthPrefix = format(now, 'yyyy-MM');

  let semHeld = Math.max(0, semester.initialHeld || 0);
  let semAttended = Math.max(0, Math.min(semHeld, semester.initialAttended || 0));

  let mHeld = 0;
  let mAttended = 0;

  const startDateStr = semester.startDate ? format(new Date(semester.startDate), 'yyyy-MM-dd') : null;

  Object.entries(records || {}).forEach(([dateStr, record]) => {
    if (!record) return;

    // Check if within semester
    if (startDateStr && dateStr < startDateStr) return;

    const jmiHoliday = getJamiaHoliday(dateStr);
    const isHoliday = record.isHoliday === true || (jmiHoliday.isHoliday && (record.held || 0) === 0 && record.isHoliday !== false);
    const isExam = isExamDay(dateStr, exams);

    const held = Math.max(0, record.held || 0);
    const attended = Math.max(0, Math.min(held, record.attended || 0));

    // Semester tally (exclude non-held holidays and exam days)
    if (!isHoliday && !isExam) {
      semHeld += held;
      semAttended += attended;
    }

    // Month tally (only for current calendar month)
    if (dateStr.startsWith(currentMonthPrefix)) {
      if (!isHoliday && !isExam) {
        mHeld += held;
        mAttended += attended;
      }
    }
  });

  const semesterPercentage = semHeld > 0 
    ? Math.min(100, Math.max(0, Number(((semAttended / semHeld) * 100).toFixed(2))))
    : 0;

  const monthPercentage = mHeld > 0 
    ? Math.min(100, Math.max(0, Number(((mAttended / mHeld) * 100).toFixed(2))))
    : null;

  return {
    semesterHeld: semHeld,
    semesterAttended: semAttended,
    semesterPercentage,
    monthHeld: mHeld,
    monthAttended: mAttended,
    monthPercentage
  };
}

/**
 * Deterministically sorts leaderboard members according to BunkSafe rules:
 * 1. Semester Attendance % DESC
 * 2. Current Month Attendance % DESC (null treated as lower)
 * 3. Total semester classes attended DESC
 * 4. Roll Number ASC
 * 5. Student Name ASC
 */
export function sortLeaderboardMembers(members: LeaderboardMember[]): LeaderboardMember[] {
  return [...members].sort((a, b) => {
    // 1. Primary: Semester Attendance %
    if (Math.abs(b.semesterPercentage - a.semesterPercentage) > 0.0001) {
      return b.semesterPercentage - a.semesterPercentage;
    }

    // 2. First tie-breaker: Current Month Attendance %
    const aMonth = a.monthPercentage !== null ? a.monthPercentage : -1;
    const bMonth = b.monthPercentage !== null ? b.monthPercentage : -1;
    if (Math.abs(bMonth - aMonth) > 0.0001) {
      return bMonth - aMonth;
    }

    // 3. Second tie-breaker: Total Semester Classes Attended
    if (b.semesterAttended !== a.semesterAttended) {
      return b.semesterAttended - a.semesterAttended;
    }

    // 4. Third tie-breaker: Roll number ascending
    const aRoll = (a.rollNumber || '').trim();
    const bRoll = (b.rollNumber || '').trim();
    if (aRoll && bRoll) {
      const aNum = parseInt(aRoll, 10);
      const bNum = parseInt(bRoll, 10);
      if (!isNaN(aNum) && !isNaN(bNum) && aNum !== bNum) {
        return aNum - bNum;
      }
      const cmp = aRoll.localeCompare(bRoll, undefined, { numeric: true });
      if (cmp !== 0) return cmp;
    } else if (aRoll && !bRoll) {
      return -1;
    } else if (!aRoll && bRoll) {
      return 1;
    }

    // 5. Final deterministic fallback: Name ascending, then studentId
    const nameCmp = a.name.localeCompare(b.name);
    if (nameCmp !== 0) return nameCmp;
    return a.studentId.localeCompare(b.studentId);
  });
}
