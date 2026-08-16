import { format, startOfMonth, endOfMonth, isBefore, startOfDay } from 'date-fns';
import { 
  Profile, 
  Semester, 
  AttendanceRecord, 
  Exam, 
  Subject, 
  DailyAttendanceSnapshot, 
  DailySyncResult 
} from '../types';
import { 
  getKolkataTodayStr, 
  getKolkataMonthStr, 
  getKolkataTimeStr,
  getJamiaHoliday, 
  isExamDay, 
  safeParse, 
  calculateAttendance, 
  calculateBunkInfo 
} from './dateUtils';
import { getAcademicBatchId } from './leaderboardUtils';

/**
 * Normalizes user identifier to ensure per-user cache isolation
 */
export function getNormalizedUserId(profile?: Profile | null): string {
  if (!profile) return 'default_user';
  const email = (profile.email || '').toLowerCase().trim();
  if (email) return email.replace(/[^a-z0-9_.-]/g, '_');
  const roll = (profile.rollNumber || '').toLowerCase().trim();
  if (roll) return roll.replace(/[^a-z0-9_.-]/g, '_');
  const name = (profile.name || '').toLowerCase().trim();
  if (name) return name.replace(/[^a-z0-9_.-]/g, '_');
  return 'default_user';
}

/**
 * Generates user-isolated storage key for daily snapshot
 * Example: bunksafe_attendance_snapshot_mekhankaif_gmail_com_2026-08-16
 */
export function getSnapshotStorageKey(userId: string, dateStr: string): string {
  return `bunksafe_attendance_snapshot_${userId}_${dateStr}`;
}

export function getLastSyncDateKey(userId: string): string {
  return `bunksafe_last_attendance_sync_date_${userId}`;
}

export function getLastSyncTimeKey(userId: string): string {
  return `bunksafe_last_attendance_sync_time_${userId}`;
}

export function getSyncLockKey(userId: string): string {
  return `bunksafe_daily_sync_lock_${userId}`;
}

export function getLatestSnapshotKey(userId: string): string {
  return `bunksafe_latest_attendance_snapshot_${userId}`;
}

/**
 * Retrieves today's cached daily snapshot for the specified user, if available
 */
export function getCachedDailySnapshot(userId: string, dateStr: string = getKolkataTodayStr()): DailyAttendanceSnapshot | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const key = getSnapshotStorageKey(userId, dateStr);
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved) as DailyAttendanceSnapshot;
      if (parsed && parsed.date === dateStr && parsed.userId === userId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[DailySync] Error reading cached snapshot from storage:', e);
  }
  return null;
}

/**
 * Retrieves the latest available valid snapshot (for offline fallback)
 */
export function getLatestAvailableSnapshot(userId: string): DailyAttendanceSnapshot | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const key = getLatestSnapshotKey(userId);
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as DailyAttendanceSnapshot;
    }
  } catch (e) {
    console.warn('[DailySync] Error reading latest snapshot fallback:', e);
  }
  return null;
}

/**
 * Persists a daily snapshot to local storage with multi-level indexing
 */
export function saveDailyAttendanceSnapshot(snapshot: DailyAttendanceSnapshot): boolean {
  if (typeof localStorage === 'undefined' || !snapshot) return false;
  try {
    const key = getSnapshotStorageKey(snapshot.userId, snapshot.date);
    const serialized = JSON.stringify(snapshot);
    localStorage.setItem(key, serialized);
    // Also update the latest fallback pointer for this user
    localStorage.setItem(getLatestSnapshotKey(snapshot.userId), serialized);
    return true;
  } catch (e) {
    console.error('[DailySync] Failed to save daily attendance snapshot:', e);
    return false;
  }
}

/**
 * Calculates and aggregates comprehensive attendance metrics for the snapshot
 */
export function computeAttendanceSnapshot(params: {
  userId: string;
  profile: Profile;
  semester: Semester;
  records: Record<string, AttendanceRecord>;
  exams?: Exam[];
  subjects?: Subject[];
  subjectAttendance?: Record<string, { attended: number; held: number }>;
  dateStr?: string;
  syncStatus?: 'synced' | 'cached' | 'offline_fallback' | 'manual_update';
}): DailyAttendanceSnapshot {
  const {
    userId,
    profile,
    semester,
    records,
    exams = [],
    subjects = [],
    subjectAttendance = {},
    dateStr = getKolkataTodayStr(),
    syncStatus = 'synced'
  } = params;

  // 1. Overall stats
  const overallStats = calculateAttendance(
    records,
    semester.initialHeld || 0,
    semester.initialAttended || 0,
    semester.startDate,
    exams
  );

  const totalHeld = overallStats.totalHeld;
  const totalAttended = overallStats.totalAttended;
  const totalAbsent = Math.max(0, totalHeld - totalAttended);
  const percentage = totalHeld > 0 ? Number(overallStats.percentage.toFixed(2)) : 0;

  // 2. Current Month stats (in Asia/Kolkata)
  const currentMonthKey = getKolkataMonthStr();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthName = format(now, 'MMMM yyyy');

  const parsedSDate = safeParse(semester.startDate);
  const sDate = parsedSDate ? startOfDay(parsedSDate) : null;

  let mHeld = 0;
  let mAttended = 0;

  Object.entries(records || {}).forEach(([date, r]) => {
    if (!r) return;
    const d = safeParse(date);
    if (!d) return;

    // Check if within current month and semester range
    if (d >= monthStart && d <= monthEnd && (!sDate || !isBefore(d, sDate))) {
      const jmiHoliday = getJamiaHoliday(date);
      const isSelHoliday = r.isHoliday || (jmiHoliday.isHoliday && r.held === 0 && r.isHoliday !== false);
      const isExam = isExamDay(date, exams);
      if (!isSelHoliday && !isExam) {
        mHeld += Math.max(0, r.held || 0);
        mAttended += Math.max(0, Math.min(r.held || 0, r.attended || 0));
      }
    }
  });

  const monthPercentage = mHeld > 0 ? Number(((mAttended / mHeld) * 100).toFixed(2)) : 0;

  // 3. Subject-wise attendance breakdown
  const subjectsMap: DailyAttendanceSnapshot['subjects'] = {};
  subjects.forEach(sub => {
    const att = subjectAttendance[sub.id] || { attended: 0, held: 0 };
    const sHeld = Math.max(0, att.held || 0);
    const sAttended = Math.max(0, Math.min(sHeld, att.attended || 0));
    const sPct = sHeld > 0 ? Number(((sAttended / sHeld) * 100).toFixed(2)) : 0;

    subjectsMap[sub.id] = {
      id: sub.id,
      name: sub.name,
      type: sub.type,
      held: sHeld,
      attended: sAttended,
      percentage: sPct
    };
  });

  // 4. Bunk calculations
  const target = semester.targetAttendance || 75;
  const bunkCalc = calculateBunkInfo(totalHeld, totalAttended, target);

  const academicBatchId = getAcademicBatchId(profile) || undefined;
  const timestamp = new Date().toISOString();

  return {
    date: dateStr,
    syncedAt: timestamp,
    userId,
    academicBatchId,
    overall: {
      totalHeld,
      totalAttended,
      totalAbsent,
      percentage
    },
    currentMonth: {
      totalHeld: mHeld,
      totalAttended: mAttended,
      percentage: monthPercentage,
      monthName,
      monthKey: currentMonthKey
    },
    semester: {
      totalHeld,
      totalAttended,
      percentage,
      targetAttendance: target,
      startDate: semester.startDate,
      endDate: semester.endDate
    },
    subjects: subjectsMap,
    bunkInfo: {
      status: bunkCalc.status as 'SAFE' | 'WARNING' | 'OK',
      canBunk: bunkCalc.canBunk || 0,
      mustAttend: bunkCalc.mustAttend || 0
    },
    syncStatus
  };
}

/**
 * Multi-tab concurrency lock helper
 * Prevents simultaneous daily sync API calls when multiple tabs open at once.
 */
export function acquireDailySyncLock(userId: string): boolean {
  if (typeof localStorage === 'undefined') return true;
  try {
    const lockKey = getSyncLockKey(userId);
    const now = Date.now();
    const existingLock = localStorage.getItem(lockKey);

    if (existingLock) {
      const lockTime = parseInt(existingLock, 10);
      // If lock was acquired within the last 15 seconds, consider it active
      if (!isNaN(lockTime) && now - lockTime < 15000) {
        return false;
      }
    }

    localStorage.setItem(lockKey, now.toString());
    return true;
  } catch (e) {
    return true;
  }
}

export function releaseDailySyncLock(userId: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const lockKey = getSyncLockKey(userId);
    localStorage.removeItem(lockKey);
  } catch (e) {}
}

/**
 * Core daily first-open sync executor.
 * 
 * Rules:
 * - If lastAttendanceSyncDate !== todayInKolkata: runs the daily sync, collects data, saves snapshot,
 *   and sets lastAttendanceSyncDate = todayInKolkata upon success.
 * - If lastAttendanceSyncDate === todayInKolkata: skips sync and returns the cached snapshot.
 * - Multi-tab deduplicated.
 * - Offline-safe with fallback.
 */
export async function executeDailyFirstOpenSync(params: {
  profile: Profile;
  semester: Semester;
  records: Record<string, AttendanceRecord>;
  exams?: Exam[];
  subjects?: Subject[];
  subjectAttendance?: Record<string, { attended: number; held: number }>;
  forceRefresh?: boolean;
}): Promise<DailySyncResult> {
  const {
    profile,
    semester,
    records,
    exams = [],
    subjects = [],
    subjectAttendance = {},
    forceRefresh = false
  } = params;

  const userId = getNormalizedUserId(profile);
  const todayKolkata = getKolkataTodayStr();
  const lastSyncDateKey = getLastSyncDateKey(userId);
  const lastSyncTimeKey = getLastSyncTimeKey(userId);

  const lastSyncDate = typeof localStorage !== 'undefined' ? localStorage.getItem(lastSyncDateKey) : null;
  const isAlreadySyncedToday = lastSyncDate === todayKolkata;

  // 1. If already synced today and not forced, serve from local cached snapshot immediately
  if (isAlreadySyncedToday && !forceRefresh) {
    const cached = getCachedDailySnapshot(userId, todayKolkata);
    if (cached) {
      return {
        success: true,
        isFirstOpenToday: false,
        syncDate: todayKolkata,
        snapshot: cached,
        source: 'cache'
      };
    }
  }

  // 2. Multi-tab concurrency protection
  const hasLock = acquireDailySyncLock(userId);
  if (!hasLock && !forceRefresh) {
    // Another tab is actively syncing right now. Wait briefly and return cached or latest snapshot
    const cached = getCachedDailySnapshot(userId, todayKolkata) || getLatestAvailableSnapshot(userId);
    return {
      success: true,
      isFirstOpenToday: false,
      syncDate: todayKolkata,
      snapshot: cached,
      source: 'cache'
    };
  }

  try {
    // 3. Compute fresh authoritative daily snapshot
    const snapshot = computeAttendanceSnapshot({
      userId,
      profile,
      semester,
      records,
      exams,
      subjects,
      subjectAttendance,
      dateStr: todayKolkata,
      syncStatus: 'synced'
    });

    // 4. Save the snapshot to local user-isolated cache
    const saved = saveDailyAttendanceSnapshot(snapshot);
    if (!saved) {
      throw new Error('Failed to persist snapshot to storage');
    }

    // 5. Update lastAttendanceSyncDate ONLY after successful snapshot creation & save
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(lastSyncDateKey, todayKolkata);
      localStorage.setItem(lastSyncTimeKey, new Date().toISOString());
    }

    releaseDailySyncLock(userId);

    return {
      success: true,
      isFirstOpenToday: !isAlreadySyncedToday,
      syncDate: todayKolkata,
      snapshot,
      source: 'network'
    };
  } catch (err: any) {
    releaseDailySyncLock(userId);
    console.error('[DailySync] Daily sync encountered error:', err);

    // Fallback to latest available valid snapshot (do NOT mark today as synced)
    const fallback = getLatestAvailableSnapshot(userId);
    return {
      success: false,
      isFirstOpenToday: !isAlreadySyncedToday,
      syncDate: todayKolkata,
      snapshot: fallback ? { ...fallback, syncStatus: 'offline_fallback' } : null,
      error: err?.message || 'Sync failed',
      source: 'offline_fallback'
    };
  }
}

/**
 * Handles manual attendance modifications made by the user during the day.
 * Immediately updates the active snapshot and cache while preserving local manual state.
 */
export function updateSnapshotOnManualChange(params: {
  userId: string;
  profile: Profile;
  semester: Semester;
  records: Record<string, AttendanceRecord>;
  exams?: Exam[];
  subjects?: Subject[];
  subjectAttendance?: Record<string, { attended: number; held: number }>;
}): DailyAttendanceSnapshot {
  const {
    userId,
    profile,
    semester,
    records,
    exams = [],
    subjects = [],
    subjectAttendance = {}
  } = params;

  const todayKolkata = getKolkataTodayStr();
  const snapshot = computeAttendanceSnapshot({
    userId,
    profile,
    semester,
    records,
    exams,
    subjects,
    subjectAttendance,
    dateStr: todayKolkata,
    syncStatus: 'manual_update'
  });

  snapshot.lastModifiedAt = new Date().toISOString();
  saveDailyAttendanceSnapshot(snapshot);
  return snapshot;
}

/**
 * Generates clean, human-readable sync status label
 */
export function getSyncStatusLabel(snapshot: DailyAttendanceSnapshot | null, todayKolkata: string = getKolkataTodayStr()): {
  label: string;
  badgeType: 'synced' | 'cached' | 'fallback' | 'manual';
  timeTooltip: string;
} {
  if (!snapshot) {
    return {
      label: 'Attendance data unavailable',
      badgeType: 'fallback',
      timeTooltip: 'No sync data found'
    };
  }

  const isToday = snapshot.date === todayKolkata;
  const timeStr = snapshot.syncedAt ? getKolkataTimeStr(new Date(snapshot.syncedAt)) : '';

  if (snapshot.syncStatus === 'manual_update') {
    return {
      label: 'Live (Updated locally)',
      badgeType: 'manual',
      timeTooltip: `Last modified: ${snapshot.lastModifiedAt ? getKolkataTimeStr(new Date(snapshot.lastModifiedAt)) : timeStr}`
    };
  }

  if (isToday) {
    return {
      label: timeStr ? `Synced Today at ${timeStr}` : 'Last synced: Today',
      badgeType: 'synced',
      timeTooltip: `Synced on ${snapshot.date} at ${timeStr} (Asia/Kolkata)`
    };
  }

  return {
    label: `Last synced: ${snapshot.date}`,
    badgeType: 'fallback',
    timeTooltip: `Previous snapshot from ${snapshot.date}`
  };
}
