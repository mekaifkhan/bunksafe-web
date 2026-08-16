import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Trophy, 
  Medal, 
  Crown, 
  RefreshCw, 
  Users, 
  Sparkles, 
  GraduationCap, 
  ShieldCheck, 
  AlertCircle,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Profile, Semester, AttendanceRecord, LeaderboardMember } from '../types';
import { 
  getAcademicBatchId, 
  getAcademicDisplayDetails, 
  calculateBatchAttendanceStats, 
  sortLeaderboardMembers 
} from '../utils/leaderboardUtils';
import { 
  syncStudentLeaderboardToFirestore, 
  fetchBatchLeaderboardFromFirestore 
} from '../firebase';

interface AttendanceLeaderboardProps {
  profile: Profile;
  semester: Semester;
  records: Record<string, AttendanceRecord>;
  exams?: any[];
  onOpenSettings?: () => void;
}

export const AttendanceLeaderboard: React.FC<AttendanceLeaderboardProps> = ({
  profile,
  semester,
  records,
  exams = [],
  onOpenSettings
}) => {
  const [members, setMembers] = useState<LeaderboardMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Compute current user's batch ID and academic details
  const academicDetails = useMemo(() => getAcademicDisplayDetails(profile), [profile]);
  const batchId = academicDetails?.batchId || null;

  // Compute current user's attendance stats for the batch
  const myStats = useMemo(() => {
    return calculateBatchAttendanceStats(records, semester, exams);
  }, [records, semester, exams]);

  // Current user's leaderboard object
  const currentMember: LeaderboardMember | null = useMemo(() => {
    if (!batchId) return null;
    const studentId = (
      profile.email || 
      profile.rollNumber || 
      (typeof window !== 'undefined' ? (window as any).AndroidDeviceID : null) || 
      (typeof localStorage !== 'undefined' ? localStorage.getItem('bs_device_id') : null) || 
      `student_${(profile.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    ).toLowerCase().trim();

    return {
      studentId,
      name: profile.name || 'Student',
      rollNumber: profile.rollNumber || '',
      academicBatchId: batchId,
      department: profile.department || '',
      programme: profile.programme || 'Regular',
      semester: profile.semester || 'Semester 1',
      academicYear: profile.academicSession || '2026-27',
      semesterPercentage: myStats.semesterPercentage,
      semesterHeld: myStats.semesterHeld,
      semesterAttended: myStats.semesterAttended,
      monthPercentage: myStats.monthPercentage,
      monthHeld: myStats.monthHeld,
      monthAttended: myStats.monthAttended,
      updatedAt: new Date().toISOString()
    };
  }, [batchId, profile, myStats]);

  // Fetch and sync batch leaderboard
  const loadLeaderboardData = useCallback(async (isManualRefresh = false) => {
    if (!batchId || !currentMember) {
      setIsLoading(false);
      return;
    }

    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // 1. Sync current user's updated record to Firestore & backend API
      await syncStudentLeaderboardToFirestore(currentMember);

      // 2. Fetch all classmates belonging to this exact batch
      const batchList = await fetchBatchLeaderboardFromFirestore(batchId);

      // 3. Ensure current user is in the list with latest calculated stats
      const filtered = batchList.filter(m => m.studentId.toLowerCase() !== currentMember.studentId.toLowerCase());
      filtered.push(currentMember);

      setMembers(filtered);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`bunksafe_leaderboard_${batchId}`, JSON.stringify(filtered));
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [batchId, currentMember]);

  // Trigger sync and fetch on mount or when batchId / attendance stats change
  useEffect(() => {
    loadLeaderboardData();

    // Periodic live refresh every 20 seconds
    const interval = setInterval(() => {
      loadLeaderboardData(false);
    }, 20000);

    // Refresh when user returns to tab
    const handleFocus = () => {
      loadLeaderboardData(false);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [batchId, myStats.semesterPercentage, myStats.monthPercentage, myStats.semesterHeld, myStats.semesterAttended, loadLeaderboardData]);

  // Sorted members
  const rankedMembers = useMemo(() => {
    return sortLeaderboardMembers(members);
  }, [members]);

  // Find current user's rank
  const myRankIndex = useMemo(() => {
    if (!currentMember) return -1;
    return rankedMembers.findIndex(m => m.studentId.toLowerCase() === currentMember.studentId.toLowerCase());
  }, [rankedMembers, currentMember]);

  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : null;

  // Non-JMI Mode or Incomplete Profile
  if (!batchId || !academicDetails) {
    return (
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 text-center space-y-4">
        <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
          <Trophy size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-zinc-100 uppercase tracking-tight">
            Attendance Leaderboard
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            The Attendance Leaderboard is strictly isolated to registered academic batches in <strong>JMI FET Smart Mode</strong> (Jamia Millia Islamia).
          </p>
        </div>
        <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-left text-xs text-zinc-400 space-y-2 max-w-md mx-auto">
          <div className="flex items-center gap-2 text-zinc-200 font-bold">
            <ShieldCheck size={14} className="text-primary" />
            <span>Strict Batch Isolation Policy</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            To view attendance rankings among your exact classmates, ensure your college is set to <strong>Jamia Millia Islamia</strong> and select your branch and semester.
          </p>
        </div>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <span>Configure Academic Profile</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    );
  }

  const topThree = rankedMembers.slice(0, 3);
  const restRanked = rankedMembers.slice(3);

  return (
    <div className="space-y-5">
      {/* Header & Academic Batch Context */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none text-yellow-500">
          <Trophy size={110} />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                <Crown size={12} className="text-yellow-400" />
                <span>Batch Attendance Leaderboard</span>
              </div>
              <h2 className="text-xl font-black text-zinc-100 flex items-center gap-2 tracking-tight">
                🏆 Attendance Leaderboard
              </h2>
              <p className="text-xs text-zinc-400">
                See where you stand among your exact academic batchmates.
              </p>
            </div>

            <button
              onClick={() => loadLeaderboardData(true)}
              disabled={isRefreshing}
              className="p-2.5 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Refresh Leaderboard"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-primary' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Academic Identity Details */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-zinc-800/80">
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <GraduationCap size={15} className="text-primary shrink-0" />
                <span className="font-semibold text-zinc-200 truncate">
                  {academicDetails.programmeTitle} {academicDetails.branchTitle}
                </span>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-800/90 text-zinc-300 border border-zinc-700/80 shrink-0">
                {academicDetails.modeTitle}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <span className="text-zinc-300 font-medium px-2 py-0.5 bg-zinc-950/70 rounded-md border border-zinc-800/80 shrink-0">
                {academicDetails.semesterTitle}
              </span>
              <span className="text-zinc-400 px-2 py-0.5 bg-zinc-950/70 rounded-md border border-zinc-800/80 shrink-0">
                {academicDetails.sessionTitle}
              </span>
              <span className="inline-flex items-center gap-1.5 text-primary font-bold px-2.5 py-0.5 bg-primary/10 rounded-md border border-primary/20 shrink-0">
                <Users size={13} className="shrink-0" />
                <span>{rankedMembers.length} {rankedMembers.length === 1 ? 'student' : 'students'}</span>
              </span>
            </div>
          </div>

          {/* Batch Security Pill */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 bg-zinc-950/70 px-2 py-1 rounded-md border border-zinc-800">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>Batch Key: {academicDetails.batchId}</span>
            </div>

            {lastUpdated && (
              <span className="text-[10px] text-zinc-500">
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Current User Standing Card */}
      {currentMember && (
        <div className="bg-primary/10 border-2 border-primary/40 rounded-2xl p-4 shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary text-zinc-950 font-black flex flex-col items-center justify-center shrink-0 shadow-md">
                <span className="text-[10px] uppercase font-extrabold tracking-tighter leading-none">RANK</span>
                <span className="text-lg leading-none font-black mt-0.5">#{myRank || '-'}</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-primary text-zinc-950 text-[9px] font-black uppercase rounded tracking-wider">
                    YOU
                  </span>
                  <h4 className="font-extrabold text-sm text-zinc-100">{currentMember.name}</h4>
                  {currentMember.rollNumber && (
                    <span className="text-[10px] text-zinc-400 font-mono">
                      (Roll: {currentMember.rollNumber})
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-300">
                  {myRank 
                    ? `You're ranked #${myRank} out of ${rankedMembers.length} batchmate${rankedMembers.length > 1 ? 's' : ''}`
                    : 'Syncing your rank in the batch...'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto bg-zinc-950/60 p-2.5 rounded-xl border border-primary/20">
              <div className="text-center sm:text-right px-2">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">
                  Semester
                </span>
                <span className="text-base font-black text-primary">
                  {currentMember.semesterPercentage.toFixed(2)}%
                </span>
                <span className="text-[9px] text-zinc-500 block font-mono">
                  {currentMember.semesterAttended}/{currentMember.semesterHeld} classes
                </span>
              </div>

              <div className="text-center sm:text-right px-2 border-l border-zinc-800">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">
                  This Month
                </span>
                <span className="text-base font-black text-zinc-200">
                  {currentMember.monthPercentage !== null 
                    ? `${currentMember.monthPercentage.toFixed(2)}%` 
                    : 'N/A'}
                </span>
                <span className="text-[9px] text-zinc-500 block font-mono">
                  {currentMember.monthHeld > 0 
                    ? `${currentMember.monthAttended}/${currentMember.monthHeld} classes` 
                    : 'No classes yet'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium Cards */}
      {rankedMembers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Sparkles size={14} className="text-yellow-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Top Batch Performers
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topThree.map((member, index) => {
              const rank = index + 1;
              const isCurrentUser = currentMember && member.studentId.toLowerCase() === currentMember.studentId.toLowerCase();

              const badgeStyles = [
                {
                  border: 'border-yellow-500/40 bg-gradient-to-b from-yellow-500/15 via-zinc-900 to-zinc-950',
                  rankColor: 'bg-yellow-500 text-zinc-950',
                  icon: '🥇',
                  title: 'Rank 1',
                  accent: 'text-yellow-400'
                },
                {
                  border: 'border-slate-400/40 bg-gradient-to-b from-slate-400/10 via-zinc-900 to-zinc-950',
                  rankColor: 'bg-slate-300 text-zinc-950',
                  icon: '🥈',
                  title: 'Rank 2',
                  accent: 'text-slate-300'
                },
                {
                  border: 'border-amber-600/40 bg-gradient-to-b from-amber-600/10 via-zinc-900 to-zinc-950',
                  rankColor: 'bg-amber-600 text-white',
                  icon: '🥉',
                  title: 'Rank 3',
                  accent: 'text-amber-400'
                },
              ][index];

              return (
                <div
                  key={member.studentId}
                  className={`p-4 rounded-2xl border ${badgeStyles.border} relative overflow-hidden transition-all shadow-md ${
                    isCurrentUser ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{badgeStyles.icon}</span>
                      <div>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${badgeStyles.accent}`}>
                          {badgeStyles.title}
                        </span>
                        <h4 className="font-extrabold text-sm text-zinc-100 truncate max-w-[140px] flex items-center gap-1.5">
                          {member.name}
                          {isCurrentUser && (
                            <span className="px-1 py-0.2 bg-primary text-zinc-950 text-[8px] font-black rounded">
                              YOU
                            </span>
                          )}
                        </h4>
                      </div>
                    </div>

                    {member.rollNumber && (
                      <span className="text-[10px] font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400 shrink-0">
                        Roll: {member.rollNumber}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">Semester</span>
                      <span className="text-sm font-black text-zinc-100">
                        {member.semesterPercentage.toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">This Month</span>
                      <span className="text-sm font-black text-zinc-300">
                        {member.monthPercentage !== null ? `${member.monthPercentage.toFixed(2)}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Complete Batch Leaderboard Table */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-primary" />
            <h3 className="font-extrabold text-sm text-zinc-200">
              Complete Batch Ranking
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-medium">
            Sorted by Semester Attendance %
          </span>
        </div>

        {isLoading ? (
          <div className="p-10 text-center space-y-3">
            <RefreshCw size={24} className="animate-spin text-primary mx-auto" />
            <p className="text-xs text-zinc-400">Loading batch leaderboard...</p>
          </div>
        ) : rankedMembers.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <AlertCircle size={28} className="text-zinc-600 mx-auto" />
            <p className="text-sm font-bold text-zinc-300">No attendance data available yet.</p>
            <p className="text-xs text-zinc-500">
              When students in this batch update their attendance, they will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-400 font-black">
                  <th className="py-3 px-4 w-16 text-center">Rank</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 text-center">Roll No.</th>
                  <th className="py-3 px-4 text-right">This Month</th>
                  <th className="py-3 px-4 text-right">Semester</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-xs">
                {rankedMembers.map((member, index) => {
                  const rank = index + 1;
                  const isCurrentUser = currentMember && member.studentId.toLowerCase() === currentMember.studentId.toLowerCase();

                  return (
                    <tr
                      key={member.studentId}
                      className={`transition-colors ${
                        isCurrentUser 
                          ? 'bg-primary/10 font-bold text-zinc-100 hover:bg-primary/15' 
                          : 'hover:bg-zinc-800/40 text-zinc-300'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-black">
                        {rank === 1 ? (
                          <span className="text-base" title="Rank 1">🥇</span>
                        ) : rank === 2 ? (
                          <span className="text-base" title="Rank 2">🥈</span>
                        ) : rank === 3 ? (
                          <span className="text-base" title="Rank 3">🥉</span>
                        ) : (
                          <span className="text-zinc-400 font-mono font-bold">#{rank}</span>
                        )}
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`truncate font-semibold ${isCurrentUser ? 'text-primary' : 'text-zinc-200'}`}>
                            {member.name}
                          </span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.5 bg-primary text-zinc-950 text-[9px] font-black rounded uppercase">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Roll Number */}
                      <td className="py-3.5 px-4 text-center font-mono text-zinc-400 text-[11px]">
                        {member.rollNumber ? member.rollNumber : '—'}
                      </td>

                      {/* Current Month Attendance */}
                      <td className="py-3.5 px-4 text-right font-medium">
                        {member.monthPercentage !== null ? (
                          <span className="text-zinc-200 font-semibold">
                            {member.monthPercentage.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-zinc-500 font-normal">N/A</span>
                        )}
                      </td>

                      {/* Semester Attendance */}
                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-black text-sm ${
                          member.semesterPercentage >= 75 
                            ? 'text-emerald-400' 
                            : member.semesterPercentage >= 60 
                            ? 'text-amber-400' 
                            : 'text-rose-400'
                        }`}>
                          {member.semesterPercentage.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Privacy & Fairness Note */}
      <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-zinc-400">
        <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold text-zinc-300">
            Privacy Protected & Strictly Isolated
          </p>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Only aggregate attendance percentages and roll numbers are visible to verified classmates within your exact academic batch ({academicDetails.batchId}). Private logs, personal contacts, and calendar dates remain strictly confidential.
          </p>
        </div>
      </div>
    </div>
  );
};
