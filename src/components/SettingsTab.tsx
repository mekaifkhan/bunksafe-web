import React, { useState } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  Sparkles, 
  Plus, 
  Trash2, 
  Bell, 
  BellOff, 
  Download, 
  Upload, 
  Calendar as CalendarIcon, 
  LogOut, 
  Info,
  ShieldCheck,
  MessageSquare,
  Github,
  Heart,
  Globe,
  RefreshCw,
  Edit2,
  CalendarDays,
  GraduationCap,
  X,
  ArrowUp,
  ArrowDown,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { Profile, Semester, AttendanceRecord, SemesterHistory, AppState, Subject, SubjectGradeConfig, formatSubjectName } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { logCustomEvent } from '../firebase';
import { JMI_CURRICULUM, JMI_CIVIL_CURRICULUM, getDefaultCurriculumSubjects } from '../utils/curriculum';

interface SettingsTabProps {
  profile: Profile;
  setProfile: (p: Profile) => void;
  semester: Semester;
  setSemester: (s: Semester) => void;
  records: Record<string, AttendanceRecord>;
  setRecords: (r: Record<string, AttendanceRecord>) => void;
  history: SemesterHistory[];
  setHistory: (h: SemesterHistory[]) => void;
  setExams: (e: any[]) => void;
  setOnboardingCompleted: (c: boolean) => void;
  setOnboardingStep: (s: number) => void;
  setAppState: (s: AppState) => void;
  notificationPermission: string;
  requestNotificationPermission: () => void;
  stats: any;
  updateAttendance: (date: string, held: number, attended: number, isHoliday: boolean) => void;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  classSchedule: Record<string, Record<number, string>>;
  setClassSchedule: React.Dispatch<React.SetStateAction<Record<string, Record<number, string>>>>;
  gradeSubjects: SubjectGradeConfig[];
  setGradeSubjects: React.Dispatch<React.SetStateAction<SubjectGradeConfig[]>>;
  subjectAttendance: Record<string, { attended: number; held: number }>;
  setSubjectAttendance: React.Dispatch<React.SetStateAction<Record<string, { attended: number; held: number }>>>;
}

export default function SettingsTab({
  profile,
  setProfile,
  semester,
  setSemester,
  records,
  setRecords,
  history,
  setHistory,
  setExams,
  setOnboardingCompleted,
  setOnboardingStep,
  setAppState,
  notificationPermission,
  requestNotificationPermission,
  stats,
  updateAttendance,
  subjects,
  setSubjects,
  classSchedule,
  setClassSchedule,
  gradeSubjects,
  setGradeSubjects,
  subjectAttendance,
  setSubjectAttendance
}: SettingsTabProps) {
  // Local state for holiday manager
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showAboutDev, setShowAboutDev] = useState(false);

  // Subject Manager local states
  const [showSubjectManager, setShowSubjectManager] = useState(false);
  const [showAddEditSubjectModal, setShowAddEditSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  
  const [subjNameInput, setSubjNameInput] = useState('');
  const [subjTypeInput, setSubjTypeInput] = useState<'Theory' | 'Lab'>('Theory');
  const [subjCreditsInput, setSubjCreditsInput] = useState<number | ''>('');
  
  const [deleteConfirmSubjectId, setDeleteConfirmSubjectId] = useState<string | null>(null);

  // Curriculum Database helpers
  const isJmiECE = profile.programme === 'Regular' && profile.department === 'Electronics & Communication Engineering';
  const isJmiCivil = profile.programme === 'Regular' && profile.department === 'Civil Engineering';
  const isJmiCurriculumBranch = isJmiECE || isJmiCivil;
  const activeCurriculum = isJmiCivil ? JMI_CIVIL_CURRICULUM : JMI_CURRICULUM;

  const getSelectedElectiveCode = (groupId: string, options: any[]) => {
    const found = subjects.find(s => 
      (s as any).electiveGroupId === groupId || 
      options.some(opt => s.name.toLowerCase().startsWith(opt.code.toLowerCase()))
    );
    if (found) {
      const opt = options.find(o => 
        found.name.toLowerCase().startsWith(o.code.toLowerCase()) || 
        ((found as any).electiveGroupId === groupId && found.name.toLowerCase().includes(o.name.toLowerCase()))
      );
      return opt ? opt.code : options[0].code;
    }
    return options[0].code;
  };

  const handleElectiveChange = (groupId: string, oldCode: string, newCode: string, options: any[]) => {
    const oldOpt = options.find(o => o.code === oldCode);
    const newOpt = options.find(o => o.code === newCode);
    if (!newOpt) return;

    const exists = subjects.some(s => 
      (s as any).electiveGroupId === groupId || 
      (oldOpt && s.name.toLowerCase().startsWith(oldOpt.code.toLowerCase()))
    );

    if (exists) {
      const updated = subjects.map(s => {
        if ((s as any).electiveGroupId === groupId || (oldOpt && s.name.toLowerCase().startsWith(oldOpt.code.toLowerCase()))) {
          return {
            ...s,
            name: `${newOpt.code} ${newOpt.name}`,
            credits: newOpt.credits,
            type: newOpt.type,
            electiveGroupId: groupId
          };
        }
        return s;
      });
      setSubjects(updated);

      const oldSubjectName = subjects.find(s => (s as any).electiveGroupId === groupId || (oldOpt && s.name.toLowerCase().startsWith(oldOpt.code.toLowerCase())))?.name;
      if (oldSubjectName) {
        setGradeSubjects(prev => prev.map(item => 
          item.name === oldSubjectName 
            ? { ...item, name: `${newOpt.code} ${newOpt.name}` }
            : item
        ));
      }
    } else {
      const newSub = {
        id: `sub_jmi_${profile.semester.replace(/\s+/g, '_')}_elective_${groupId}`,
        name: `${newOpt.code} ${newOpt.name}`,
        type: newOpt.type,
        credits: newOpt.credits,
        isCurriculum: true,
        electiveGroupId: groupId
      };
      setSubjects([...subjects, newSub]);
    }

    logCustomEvent('elective_selected', { 
      semester: profile.semester, 
      group: groupId, 
      selected_code: newCode 
    });
    logCustomEvent('subject_customized', { action: 'elective_change', group: groupId, code: newCode });
  };

  // Reorder subjects
  const handleMoveSubject = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= subjects.length) return;
    
    const updated = [...subjects];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setSubjects(updated);
  };

  // Save subject
  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (subjCreditsInput === '' || isNaN(Number(subjCreditsInput))) {
      alert("Please select academic credits.");
      return;
    }
    const formattedName = formatSubjectName(subjNameInput);
    if (!formattedName) return;

    const isDuplicate = subjects.some(s => 
      s.name.toLowerCase() === formattedName.toLowerCase() && 
      (!editingSubject || s.id !== editingSubject.id)
    );

    if (isDuplicate) {
      alert(`A subject named "${formattedName}" already exists!`);
      return;
    }

    const creditsNum = Number(subjCreditsInput);

    if (editingSubject) {
      const updatedSubjects = subjects.map(s => 
        s.id === editingSubject.id 
          ? { ...s, name: formattedName, type: subjTypeInput, credits: creditsNum }
          : s
      );
      setSubjects(updatedSubjects);

      // Cascade rename to Grade Planner
      setGradeSubjects(prev => prev.map(item => 
        item.id === editingSubject.id 
          ? { ...item, name: formattedName }
          : item
      ));

      setEditingSubject(null);
      logCustomEvent('subject_customized', { action: 'edit_subject', name: formattedName });
    } else {
      const newSub: Subject = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: formattedName,
        type: subjTypeInput,
        credits: creditsNum
      };
      setSubjects([...subjects, newSub]);
      logCustomEvent('subject_customized', { action: 'add_subject', name: formattedName, type: subjTypeInput });
    }

    setShowAddEditSubjectModal(false);
    setSubjNameInput('');
    setSubjTypeInput('Theory');
    setSubjCreditsInput('');
  };

  // Delete subject with cascade cleanup
  const handleDeleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    logCustomEvent('subject_customized', { action: 'delete_subject', id });

    setClassSchedule(prev => {
      const copy = { ...prev };
      Object.keys(copy).forEach(day => {
        const slots = { ...copy[day] };
        Object.keys(slots).forEach(slotId => {
          if (slots[slotId] === id) {
            delete slots[slotId];
          }
        });
        copy[day] = slots;
      });
      return copy;
    });

    setGradeSubjects(prev => prev.filter(s => s.id !== id));

    setSubjectAttendance(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    setDeleteConfirmSubjectId(null);
  };

  // List all holiday dates from records
  const holidayRecords = Object.values(records).filter(r => r.isHoliday);

  const handleAddHoliday = () => {
    if (!newHolidayDate) return;
    updateAttendance(newHolidayDate, 0, 0, true);
    setNewHolidayDate('');
    alert('Holiday marked successfully!');
  };

  const handleRemoveHoliday = (date: string) => {
    updateAttendance(date, 0, 0, false);
    alert('Holiday removed!');
  };

  // Export Backup
  const exportBackup = () => {
    const data: Record<string, any> = {};
    const keys = [
      'bs_profile', 'bs_semester', 'bs_records', 'bs_history', 'bs_exams',
      'bs_class_schedule', 'bs_custom_class_times', 'bs_subject_attendance',
      'bs_marked_schedule_slots', 'bs_enable_live_widget', 'bs_grade_planner_subjects',
      'bs_subjects'
    ];
    keys.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) {
        try {
          data[key] = JSON.parse(val);
        } catch (e) {
          data[key] = val;
        }
      }
    });
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bunksafe_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        Object.entries(data).forEach(([key, val]) => {
          if (key.startsWith('bs_')) {
            localStorage.setItem(key, JSON.stringify(val));
          }
        });
        alert('Backup imported successfully! App will reload now.');
        window.location.reload();
      } catch (err) {
        alert('Error: Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  // Reset Attendance Data Only
  const handleResetAttendance = () => {
    if (confirm('Are you absolutely sure you want to reset all attendance records? Your profile and semester setup will be kept.')) {
      setRecords({});
      alert('Attendance data reset completed!');
    }
  };

  // Clear Local Storage
  const handleClearLocalStorage = () => {
    if (confirm('Are you absolutely sure? This will delete all settings, history, and records forever. This cannot be undone!')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // End/Reset Semester
  const handleEndSemester = () => {
    if (confirm('This will archive your current semester data into History and let you start a completely new semester. Proceed?')) {
      const h: SemesterHistory = {
        id: Date.now().toString(),
        title: semester.title || 'Semester',
        startDate: semester.startDate,
        endDate: semester.endDate,
        finalPercentage: stats.percentage,
        totalHeld: stats.totalHeld,
        totalAttended: stats.totalAttended
      };
      setHistory([h, ...history]);
      setSemester({
        title: 'Semester 1',
        startDate: '',
        endDate: '',
        targetAttendance: 75,
        isInitialized: false,
        initialHeld: 0,
        initialAttended: 0
      });
      setRecords({});
      setExams([]);
      localStorage.removeItem('bs_onboarding_completed');
      setOnboardingCompleted(false);
      setOnboardingStep(1);
      setAppState('MAIN');
    }
  };

  return (
    <div className="space-y-6 pb-24 text-zinc-100">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <SettingsIcon className="text-primary animate-spin-slow" size={24} /> Settings
        </h1>
        <span className="text-xs bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-full text-zinc-400 font-bold">
          v2.4.0
        </span>
      </header>

      {/* Avatar Display & Banner */}
      <div className="flex flex-col items-center gap-3 py-4 bg-zinc-900/40 border border-zinc-850 rounded-2xl p-4">
        <div className="relative group">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-primary/20 overflow-hidden border-4 border-zinc-900">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              (profile.name || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full cursor-pointer shadow-lg active:scale-90 transition-all border border-zinc-900">
            <Edit2 size={12} />
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setProfile({ ...profile, avatar: reader.result as string });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-black text-zinc-100">{profile.name}</h2>
          <p className="text-xs text-zinc-500 font-medium">{profile.college} — {profile.department}</p>
        </div>
      </div>

      {/* SUBJECTS QUICK ACTION PANEL */}
      <div className="bg-gradient-to-r from-zinc-900 via-primary/5 to-zinc-900 border border-primary/25 p-4 rounded-2xl flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-primary" size={18} />
            <span className="text-xs font-black text-zinc-200 uppercase tracking-wider">Subject Management</span>
          </div>
          <p className="text-[11px] text-zinc-500 max-w-xs leading-relaxed">
            Configure your master list of semester subjects, types, and academic credits.
          </p>
        </div>
        <button
          id="btn-manage-subjects"
          onClick={() => setShowSubjectManager(true)}
          className="bg-primary hover:bg-primary/95 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20 uppercase shrink-0"
        >
          Manage Subjects
        </button>
      </div>

      {/* 1. PERSONAL INFORMATION */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
          <User size={14} className="text-primary" /> Personal Information
        </h3>
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Full Name</label>
            <input 
              type="text" 
              value={profile.name} 
              onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-primary transition-colors font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">College</label>
              <input 
                type="text" 
                value={profile.college} 
                onChange={(e) => setProfile({ ...profile, college: e.target.value })} 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-primary transition-colors font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Semester</label>
              <select
                value={profile.semester}
                onChange={(e) => {
                  const sem = e.target.value;
                  const is1or2 = sem === 'Semester 1' || sem === 'Semester 2';
                  setProfile({
                    ...profile,
                    semester: sem,
                    department: is1or2 ? 'Applied Science & Humanities' : '',
                    programme: is1or2 ? 'Regular' : ''
                  });
                  logCustomEvent('semester_selected', { semester: sem });
                  if (is1or2) {
                    logCustomEvent('branch_selected', { branch: 'Applied Science & Humanities' });
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-primary transition-colors font-bold"
              >
                {Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`).map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>
          </div>

          {!(profile.semester === 'Semester 1' || profile.semester === 'Semester 2') && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Programme</label>
                <select
                  value={profile.programme || ''}
                  onChange={(e) => {
                    setProfile({ ...profile, programme: e.target.value, department: '' });
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-primary transition-colors font-bold"
                >
                  <option value="">Select Programme</option>
                  <option value="Regular">Regular</option>
                  <option value="Self-Financed">Self-Financed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Branch</label>
                <select
                  value={profile.department}
                  onChange={(e) => {
                    setProfile({ ...profile, department: e.target.value });
                    logCustomEvent('branch_selected', { branch: e.target.value });
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-primary transition-colors font-bold text-zinc-100"
                  disabled={!profile.programme}
                >
                  <option value="">Select Branch</option>
                  {profile.programme === 'Regular' ? (
                    <>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                      <option value="Computer Engineering">Computer Engineering</option>
                    </>
                  ) : profile.programme === 'Self-Financed' ? (
                    <>
                      <option value="Civil Engineering (Construction Technology) (Self-Financed)">Civil Engineering (Construction Technology) (Self-Financed)</option>
                      <option value="Electrical & Computer Engineering (Self-Financed)">Electrical & Computer Engineering (Self-Financed)</option>
                      <option value="Robotics & Artificial Intelligence (Self-Financed)">Robotics & Artificial Intelligence (Self-Financed)</option>
                      <option value="Electronics (VLSI Design & Technology) (Self-Financed)">Electronics (VLSI Design & Technology) (Self-Financed)</option>
                      <option value="Computer Science & Engineering (Data Sciences) (Self-Financed)">Computer Science & Engineering (Data Sciences) (Self-Financed)</option>
                    </>
                  ) : null}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Academic Session</label>
              <input 
                type="text" 
                value={profile.academicSession || '2025-26'} 
                onChange={(e) => setProfile({ ...profile, academicSession: e.target.value })} 
                placeholder="e.g. 2025-26"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-primary transition-colors font-bold"
              />
            </div>
          </div>
          
          <button 
            onClick={() => {
              const isSem1or2 = profile.semester === 'Semester 1' || profile.semester === 'Semester 2';
              if (!profile.name.trim()) {
                alert('Please enter your full name.');
                return;
              }
              if (!isSem1or2 && (!profile.programme || !profile.department)) {
                alert('Please select both Programme and Branch.');
                return;
              }
              logCustomEvent('branch_selected', { branch: profile.department });
              logCustomEvent('semester_selected', { semester: profile.semester });
              
              const isNewJmiECE = profile.programme === 'Regular' && profile.department === 'Electronics & Communication Engineering';
              const isNewJmiCivil = profile.programme === 'Regular' && profile.department === 'Civil Engineering';
              if (isNewJmiECE && subjects.length === 0) {
                const { subjects: defaultSubs } = getDefaultCurriculumSubjects(profile.semester, profile.department);
                if (defaultSubs && defaultSubs.length > 0) {
                  setSubjects(defaultSubs);
                  alert(`Profile updated. Automatically loaded default JMI ECE curriculum for ${profile.semester}!`);
                } else {
                  alert('Profile and Personal settings updated locally!');
                }
              } else if (isNewJmiCivil && subjects.length === 0) {
                const { subjects: defaultSubs } = getDefaultCurriculumSubjects(profile.semester, profile.department);
                if (defaultSubs && defaultSubs.length > 0) {
                  setSubjects(defaultSubs);
                  alert(`Profile updated. Automatically loaded default JMI Civil Engineering curriculum for ${profile.semester}!`);
                } else {
                  alert('Profile and Personal settings updated locally!');
                }
              } else {
                alert('Profile and Personal settings updated locally!');
              }
            }}
            className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold uppercase transition-all"
          >
            Save Information
          </button>
        </div>
      </div>

      {/* 2. ATTENDANCE SETTINGS */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
          <Sparkles size={14} className="text-primary" /> Attendance Settings
        </h3>
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 space-y-5">
          {/* Target */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Target Attendance %</label>
            <div className="grid grid-cols-6 gap-1.5">
              {[60, 70, 75, 80, 85, 90].map(t => (
                <button 
                  key={t}
                  type="button"
                  onClick={() => setSemester({...semester, targetAttendance: t})}
                  className={`py-2 rounded-lg border text-xs font-extrabold transition-all ${semester.targetAttendance === t ? 'bg-primary border-primary text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                >
                  {t}%
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold shrink-0">Custom Target:</span>
              <input 
                type="number" 
                value={semester.targetAttendance} 
                onChange={(e) => setSemester({...semester, targetAttendance: parseInt(e.target.value) || 75})} 
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-primary w-20 text-center font-bold"
              />
              <span className="text-[10px] text-zinc-500 font-bold">%</span>
            </div>
          </div>

          {/* Alerts */}
          <div className="border-t border-zinc-800/80 pt-4 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${notificationPermission === 'granted' ? 'bg-primary/10 text-primary' : 'bg-zinc-800 text-zinc-500'}`}>
                {notificationPermission === 'granted' ? <Bell size={18} /> : <BellOff size={18} />}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold">Attendance Reminders</p>
                <p className="text-[10px] text-zinc-500">8 AM & 6 PM Alerts</p>
              </div>
            </div>
            <button 
              type="button"
              disabled={notificationPermission === 'granted'}
              onClick={requestNotificationPermission}
              className={`text-xs py-1.5 px-3 rounded-lg font-bold border ${notificationPermission === 'granted' ? 'bg-zinc-850 border-zinc-800 text-zinc-500' : 'bg-primary border-primary text-white hover:bg-primary/95 active:scale-95 transition-all'}`}
            >
              {notificationPermission === 'granted' ? 'Active' : 'Enable'}
            </button>
          </div>

          {/* Holiday Settings */}
          <div className="border-t border-zinc-800/80 pt-4 space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-bold">Holiday Manager</p>
              <p className="text-[10px] text-zinc-500">Add official holidays or off-days directly to the calendar.</p>
            </div>
            <div className="flex gap-2">
              <input 
                type="date"
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-primary"
              />
              <button 
                onClick={handleAddHoliday}
                className="bg-primary hover:bg-primary/95 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all"
              >
                <Plus size={14} /> Add Holiday
              </button>
            </div>

            {holidayRecords.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Active Holidays ({holidayRecords.length})</span>
                <div className="space-y-1">
                  {holidayRecords.sort((a, b) => b.date.localeCompare(a.date)).map(h => (
                    <div key={h.date} className="flex justify-between items-center text-[11px] bg-zinc-900 border border-zinc-850 px-2 py-1.5 rounded-lg">
                      <span className="font-mono text-zinc-300">{format(new Date(h.date), 'dd/MM/yyyy')}</span>
                      <button 
                        onClick={() => handleRemoveHoliday(h.date)}
                        className="text-red-500 hover:text-red-400 p-0.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. SEMESTER SETTINGS */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
          <CalendarIcon size={14} className="text-primary" /> Semester Settings
        </h3>
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Semester Title / Number</label>
            <input 
              type="text" 
              value={semester.title} 
              onChange={(e) => setSemester({...semester, title: e.target.value})} 
              placeholder="e.g. Semester 3" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-primary transition-colors font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Semester Start Date</label>
              <input 
                type="date" 
                value={semester.startDate} 
                onChange={(e) => setSemester({...semester, startDate: e.target.value})} 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Semester End Date</label>
              <input 
                type="date" 
                value={semester.endDate} 
                onChange={(e) => setSemester({...semester, endDate: e.target.value})} 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-zinc-800/80 pt-4 flex gap-2">
            <button 
              type="button"
              onClick={handleEndSemester}
              className="flex-1 py-3 px-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <LogOut size={14} /> End & Reset Semester
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 text-center">Ending the current semester will archive the attendance rates inside your History log.</p>
        </div>
      </div>

      {/* 4. DATA SECTION */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
          <RefreshCw size={14} className="text-primary" /> Data & Backups
        </h3>
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={exportBackup}
              className="py-3 px-4 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 text-zinc-300 transition-all active:scale-95"
            >
              <Download size={14} className="text-primary" /> Export Backup
            </button>

            <label className="py-3 px-4 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 text-zinc-300 transition-all active:scale-95 cursor-pointer text-center">
              <Upload size={14} className="text-primary" /> Import Backup
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportBackup} 
                className="hidden" 
              />
            </label>
          </div>

          <div className="border-t border-zinc-800/80 pt-3.5 space-y-2">
            <button 
              onClick={handleResetAttendance}
              className="w-full py-2.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border border-amber-500/20 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1 transition-all"
            >
              Reset Attendance Data
            </button>

            <button 
              onClick={handleClearLocalStorage}
              className="w-full py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1 transition-all"
            >
              Clear Local Storage
            </button>
          </div>
        </div>
      </div>

      {/* 5. APPLICATION SECTION */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
          <Info size={14} className="text-primary" /> Application Info
        </h3>
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <button 
            onClick={() => setShowPrivacyPolicy(true)}
            className="w-full flex justify-between items-center py-2.5 px-3 bg-zinc-950/40 border border-zinc-850/60 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-primary" /> Privacy Policy</span>
            <span className="text-[10px] text-zinc-500">Offline & Secure</span>
          </button>

          <a 
            href="mailto:feedback@bunksafe.app?subject=BunkSafe%20Feedback"
            className="w-full flex justify-between items-center py-2.5 px-3 bg-zinc-950/40 border border-zinc-850/60 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2"><MessageSquare size={14} className="text-primary" /> Send Feedback</span>
            <span className="text-[10px] text-zinc-500">Email Dev</span>
          </a>

          <button 
            onClick={() => setShowAboutDev(true)}
            className="w-full flex justify-between items-center py-2.5 px-3 bg-zinc-950/40 border border-zinc-850/60 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2"><Heart size={14} className="text-rose-500" /> About Developer</span>
            <span className="text-[10px] text-zinc-500">Made for Students</span>
          </button>
        </div>
      </div>

      {/* PRIVACY POLICY DIALOG */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-black flex items-center gap-2 text-zinc-100">
              <ShieldCheck size={20} className="text-primary" /> Privacy Policy
            </h3>
            <div className="text-xs text-zinc-400 space-y-3 leading-relaxed max-h-64 overflow-y-auto">
              <p><strong>100% Offline & Private</strong></p>
              <p>BunkSafe stores all of your personal details, college data, class schedules, exam calendars, and grade calculations exclusively on your own device's local storage.</p>
              <p>We do not collect, transmit, or share your data with any external servers. There are no tracking scripts, trackers, or cookies used inside this app.</p>
              <p>You can export or clear your local storage details at any point directly from the settings panel above.</p>
            </div>
            <button 
              onClick={() => setShowPrivacyPolicy(false)}
              className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase transition-all"
            >
              Close Privacy Policy
            </button>
          </div>
        </div>
      )}

      {/* ABOUT DEV DIALOG */}
      {showAboutDev && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm space-y-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-3xl mx-auto border border-primary/20 text-primary">
              <Heart size={32} className="animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-zinc-100">About Developer</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              BunkSafe is designed and built with passion to help university students manage attendance targets, track lectures, log exams, and strategically plan sessional/grade results with ease.
            </p>
            <p className="text-[11px] text-zinc-500 font-bold uppercase">
              Created for JMI and college students worldwide ❤️
            </p>
            <button 
              onClick={() => setShowAboutDev(false)}
              className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase transition-all"
            >
              Close Dialog
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SUBJECT MANAGER OVERLAY MODAL              */}
      {/* ========================================== */}
      <AnimatePresence>
        {showSubjectManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md flex flex-col max-h-[85vh] shadow-2xl"
            >
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <GraduationCap className="text-primary" size={22} />
                  <div>
                    <h3 className="text-base font-black text-zinc-100 uppercase tracking-wider">
                      Subject Management
                    </h3>
                    <p className="text-[10px] text-zinc-500">Configure semester master subjects</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSubjectManager(false)} 
                  className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800/50 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Subject list */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                {isJmiCurriculumBranch && activeCurriculum[profile.semester]?.electives && (
                  <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4 mb-4 space-y-3">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                      <Sliders size={12} /> Elective Selections
                    </h4>
                    <div className="space-y-3">
                      {activeCurriculum[profile.semester].electives?.map((group: any) => {
                        const selectedCode = getSelectedElectiveCode(group.id, group.options);
                        return (
                          <div key={group.id} className="space-y-1.5 text-left">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                              {group.label}
                            </label>
                            <select
                              value={selectedCode}
                              onChange={(e) => handleElectiveChange(group.id, selectedCode, e.target.value, group.options)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-primary transition-colors text-xs"
                            >
                              {group.options.map((opt: any) => (
                                <option key={opt.code} value={opt.code}>
                                  {opt.code} - {opt.name} ({opt.credits} Credits)
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {subjects.length === 0 ? (
                  <div className="text-center py-10 border border-zinc-800 border-dashed rounded-2xl bg-zinc-950/20">
                    <GraduationCap className="mx-auto mb-2 text-zinc-700" size={36} />
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-wider">No subjects defined</p>
                    <p className="text-[10px] text-zinc-600 mt-1 max-w-[220px] mx-auto leading-relaxed">
                      Create your semester subjects to start tracking attendance and predicting grades.
                    </p>
                  </div>
                ) : (
                  subjects.map((sub, idx) => (
                    <div 
                      key={sub.id} 
                      className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-zinc-750 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-zinc-100 truncate">{sub.name}</span>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${sub.type === 'Lab' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                            {sub.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">
                          Credits: <span className="text-zinc-300 font-black">{sub.credits}</span>
                        </p>
                      </div>

                      {/* Reordering & actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Reorder Up */}
                        <button
                          onClick={() => handleMoveSubject(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Move Up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        {/* Reorder Down */}
                        <button
                          onClick={() => handleMoveSubject(idx, 'down')}
                          disabled={idx === subjects.length - 1}
                          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          title="Move Down"
                        >
                          <ArrowDown size={14} />
                        </button>

                        <div className="w-px h-5 bg-zinc-800 mx-1" />

                        {/* Edit */}
                        <button
                          onClick={() => {
                            setEditingSubject(sub);
                            setSubjNameInput(sub.name);
                            setSubjTypeInput(sub.type);
                            setSubjCreditsInput(sub.credits);
                            setShowAddEditSubjectModal(true);
                          }}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteConfirmSubjectId(sub.id)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-zinc-800/80 flex flex-col gap-2">
                {isJmiCurriculumBranch && activeCurriculum[profile.semester] && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to reset your curriculum for ${profile.semester}? This will restore all default theory and lab subjects. Existing attendance tracking for deleted subjects will be lost.`)) {
                        const { subjects: defaultSubs } = getDefaultCurriculumSubjects(profile.semester, profile.department);
                        setSubjects(defaultSubs);
                        logCustomEvent('subject_reset', { semester: profile.semester });
                        alert('Curriculum reset to default successfully!');
                      }
                    }}
                    className="w-full py-2.5 bg-zinc-800/60 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 border border-zinc-800"
                  >
                    <RefreshCw size={12} className="text-primary" /> Reset to Default Curriculum
                  </button>
                )}
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => {
                      setEditingSubject(null);
                      setSubjNameInput('');
                      setSubjTypeInput('Theory');
                      setSubjCreditsInput('');
                      setShowAddEditSubjectModal(true);
                    }}
                    className="flex-1 py-3 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-primary/20"
                  >
                    <Plus size={14} /> Add New Subject
                  </button>
                  <button
                    onClick={() => setShowSubjectManager(false)}
                    className="px-5 py-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs font-bold uppercase transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* ADD / EDIT SUBJECT MODAL                   */}
      {/* ========================================== */}
      <AnimatePresence>
        {showAddEditSubjectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-850 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl"
            >
              <div>
                <h3 className="text-base font-black text-zinc-100 flex items-center gap-2">
                  <GraduationCap className="text-primary" size={18} />
                  {editingSubject ? 'Edit Subject Details' : 'Add New Subject'}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1">Configure name, classification, and academic credits</p>
              </div>

              <form onSubmit={handleSaveSubject} className="space-y-4 text-xs">
                {/* Subject Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Subject Name</label>
                  <input 
                    type="text" 
                    value={subjNameInput} 
                    onChange={(e) => setSubjNameInput(e.target.value)} 
                    placeholder="e.g. Theory Of Computation"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-primary font-bold"
                    required
                  />
                </div>

                {/* Subject Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Subject Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSubjTypeInput('Theory')}
                      className={`py-2.5 rounded-xl border text-center font-bold uppercase text-[10px] transition-all ${subjTypeInput === 'Theory' ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-950 border-zinc-850 text-zinc-400'}`}
                    >
                      Theory Course
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubjTypeInput('Lab')}
                      className={`py-2.5 rounded-xl border text-center font-bold uppercase text-[10px] transition-all ${subjTypeInput === 'Lab' ? 'bg-amber-500/10 border-amber-500/60 text-amber-400' : 'bg-zinc-950 border-zinc-850 text-zinc-400'}`}
                    >
                      Lab / Practical
                    </button>
                  </div>
                </div>

                {/* Subject Credits */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Academic Credits</label>
                  <select
                    value={subjCreditsInput}
                    onChange={(e) => setSubjCreditsInput(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-primary font-bold"
                    required
                  >
                    <option value="">Select Credits</option>
                    <option value="1">1 Credit</option>
                    <option value="2">2 Credits</option>
                    <option value="3">3 Credits</option>
                    <option value="4">4 Credits</option>
                    <option value="5">5 Credits</option>
                  </select>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-black uppercase transition-all shadow-lg"
                  >
                    Save Subject
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddEditSubjectModal(false)}
                    className="px-5 py-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs font-bold uppercase transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* DELETE CONFIRMATION DIALOG                 */}
      {/* ========================================== */}
      <AnimatePresence>
        {deleteConfirmSubjectId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <AlertTriangle size={24} />
              </div>
              <div className="text-center space-y-1.5">
                <h4 className="font-extrabold text-base text-zinc-100">Delete Subject?</h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Are you sure? This action is permanent. Deleting this subject will instantly remove:
                </p>
                <div className="bg-zinc-950 p-2.5 rounded-xl text-left text-[10px] text-zinc-500 space-y-1 font-mono">
                  <div>• Timetable Class Entries</div>
                  <div>• Attendance Tracking Statistics</div>
                  <div>• Grade Planner Configuration & Scores</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteSubject(deleteConfirmSubjectId)}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-red-600/20"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setDeleteConfirmSubjectId(null)}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs font-bold uppercase transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
