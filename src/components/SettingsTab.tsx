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
  Eye,
  ArrowUp,
  ArrowDown,
  Sliders,
  AlertTriangle,
  Camera,
  Instagram,
  Star,
  Share2,
  HelpCircle,
  FileText,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Profile, Semester, AttendanceRecord, SemesterHistory, AppState, Subject, SubjectGradeConfig, formatSubjectName } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { logCustomEvent, addFeatureRequestToFirestore, fetchLatestAppVersionFromFirestore, fetchChangelogsFromFirestore, deleteUserAccountFromFirestore } from '../firebase';
import { JMI_CURRICULUM, JMI_CIVIL_CURRICULUM, JMI_VLSI_CURRICULUM, JMI_ELECTRICAL_CURRICULUM, JMI_MECHANICAL_CURRICULUM, JMI_CSE_DS_CURRICULUM, JMI_COMP_ENG_CURRICULUM, JMI_ELECTRICAL_COMPUTER_CURRICULUM, JMI_FIRST_YEAR_SET_A, JMI_FIRST_YEAR_SET_B, getDefaultCurriculumSubjects } from '../utils/curriculum';

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
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  profilePhoto?: string | null;
  updateProfilePhoto?: (base64: string | null) => void;
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
  setSubjectAttendance,
  showToast,
  profilePhoto,
  updateProfilePhoto
}: SettingsTabProps) {
  // Local state for holiday manager
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showAboutDev, setShowAboutDev] = useState(false);

  // New production-ready local states
  const [showAboutBunkSafe, setShowAboutBunkSafe] = useState(false);
  const [showTermsConditions, setShowTermsConditions] = useState(false);
  const [showReportBug, setShowReportBug] = useState(false);
  const [showFeatureRequest, setShowFeatureRequest] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  const [bugTitle, setBugTitle] = useState('');
  const [bugDesc, setBugDesc] = useState('');
  const [isSubmittingBug, setIsSubmittingBug] = useState(false);

  const [featureTitle, setFeatureTitle] = useState('');
  const [featureDesc, setFeatureDesc] = useState('');
  const [isSubmittingFeature, setIsSubmittingFeature] = useState(false);

  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [changelogs, setChangelogs] = useState<any[]>([]);
  const [isLoadingChangelogs, setIsLoadingChangelogs] = useState(false);

  // Subject Manager local states
  const [showSubjectManager, setShowSubjectManager] = useState(false);
  const [showAddEditSubjectModal, setShowAddEditSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  
  const [subjNameInput, setSubjNameInput] = useState('');
  const [subjTypeInput, setSubjTypeInput] = useState<'Theory' | 'Lab'>('Theory');
  const [subjCreditsInput, setSubjCreditsInput] = useState<number | ''>('');
  
  const [deleteConfirmSubjectId, setDeleteConfirmSubjectId] = useState<string | null>(null);
  
  // Track initial branch/semester to detect changes
  const [initialBranch] = useState(profile.department);
  const [initialSem] = useState(profile.semester);

  // Profile Photo Management states
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maximum width: 256px
        if (width > 256) {
          height = Math.round((height * 256) / width);
          width = 256;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // JPEG quality: 0.7
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          
          if (updateProfilePhoto) {
            updateProfilePhoto(compressedBase64);
          }
          if (showToast) {
            showToast('Profile photo updated!', 'success');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Curriculum Database helpers
  const isFirstYear = profile.semester === 'Semester 1' || profile.semester === 'Semester 2';
  const isJmiECE = profile.department === 'Electronics & Communication Engineering';
  const isJmiCivil = profile.department.includes('Civil Engineering');
  const isJmiVLSI = profile.department.includes('VLSI Design');
  const isJmiElec = profile.department === 'Electrical Engineering';
  const isJmiMech = profile.department === 'Mechanical Engineering';
  const isJmiCsds = profile.department.includes('Computer Science') && profile.department.includes('Data Science');
  const isJmiCompEng = profile.department === 'Computer Engineering' || (profile.department.includes('Computer') && !profile.department.includes('Data Science') && !profile.department.includes('Electrical'));
  const isJmiEec = profile.department.includes('Electrical & Computer');
  const isJmiCurriculumBranch = isJmiECE || isJmiCivil || isJmiVLSI || isJmiElec || isJmiMech || isJmiCsds || isJmiCompEng || isJmiEec || isFirstYear;
  const activeCurriculum = isFirstYear
    ? (profile.firstYearPattern === 'SetB' ? JMI_FIRST_YEAR_SET_B : JMI_FIRST_YEAR_SET_A)
    : isJmiCivil 
      ? JMI_CIVIL_CURRICULUM 
      : isJmiVLSI 
        ? JMI_VLSI_CURRICULUM 
        : isJmiElec
          ? JMI_ELECTRICAL_CURRICULUM
          : isJmiMech
            ? JMI_MECHANICAL_CURRICULUM
            : isJmiCsds
              ? JMI_CSE_DS_CURRICULUM
              : isJmiCompEng
                ? JMI_COMP_ENG_CURRICULUM
                : isJmiEec
                  ? JMI_ELECTRICAL_COMPUTER_CURRICULUM
                  : JMI_CURRICULUM;

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

  // Share App
  const handleShareApp = async () => {
    const shareData = {
      title: 'BunkSafe',
      text: 'BunkSafe - Smart Attendance & Academic Companion for College Students!',
      url: 'https://bunk-safe-downloader.vercel.app/'
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        logCustomEvent('app_shared', { method: 'WebShare' });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        if (showToast) {
          showToast('Sharing link copied to clipboard!', 'success');
        } else {
          alert('Sharing link copied to clipboard!');
        }
        logCustomEvent('app_shared', { method: 'Clipboard' });
      } catch (err) {
        if (showToast) {
          showToast('Could not copy link to clipboard.', 'error');
        } else {
          alert('Could not copy link to clipboard.');
        }
      }
    }
  };

  // Submit Feature Request
  const handleFeatureRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureTitle.trim() || !featureDesc.trim()) {
      alert('Please fill in all fields.');
      return;
    }
    setIsSubmittingFeature(true);
    try {
      await addFeatureRequestToFirestore(profile.email || 'anonymous@bunksafe.app', featureTitle, featureDesc);
      setIsSubmittingFeature(false);
      alert('Your feature request has been successfully submitted to Firestore! Thank you for helping improve BunkSafe.');
      setFeatureTitle('');
      setFeatureDesc('');
      setShowFeatureRequest(false);
      logCustomEvent('feature_requested', { title: featureTitle });
    } catch (err) {
      setIsSubmittingFeature(false);
      console.error(err);
      alert('Failed to submit feature request. Please try again.');
    }
  };

  // Submit Bug Report
  const handleBugReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugTitle.trim() || !bugDesc.trim()) {
      alert('Please fill in all fields.');
      return;
    }
    setIsSubmittingBug(true);
    try {
      await addFeatureRequestToFirestore(profile.email || 'anonymous@bunksafe.app', `[BUG] ${bugTitle}`, bugDesc);
      setIsSubmittingBug(false);
      alert('Your bug report has been securely registered in our system. Thank you!');
      setBugTitle('');
      setBugDesc('');
      setShowReportBug(false);
      logCustomEvent('bug_reported', { title: bugTitle });
    } catch (err) {
      setIsSubmittingBug(false);
      console.error(err);
      alert('Failed to submit report. Please try again.');
    }
  };

  // Check for Updates
  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      const config = await fetchLatestAppVersionFromFirestore();
      setIsCheckingUpdates(false);
      if (config && config.latestVersion) {
        if (config.latestVersion !== '2.4.0') {
          setUpdateInfo(config);
        } else {
          alert('You are already on the latest production release (v2.4.0)!');
        }
      } else {
        alert('You are on the latest production release (v2.4.0)!');
      }
    } catch (err) {
      setIsCheckingUpdates(false);
      alert('Already on the latest stable build (v2.4.0).');
    }
  };

  // Load Changelogs
  const handleLoadChangelogs = async () => {
    setIsLoadingChangelogs(true);
    try {
      const logs = await fetchChangelogsFromFirestore();
      if (logs && logs.length > 0) {
        setChangelogs(logs);
      } else {
        // Fallback static changelog data
        setChangelogs([
          {
            version: '2.4.0',
            releaseDate: 'July 2026',
            newFeatures: [
              'Complete About BunkSafe and professional settings suite',
              'Integrated update checking mechanism and changelog views',
              'Secure cloud account and local database deletion features',
              'Advanced Privacy Policy & Terms compliance definitions'
            ],
            bugFixes: [
              'Deleted legacy BAA AI helper for optimized native wrappers',
              'Fixed UI glitch with custom class intervals'
            ]
          },
          {
            version: '2.3.0',
            releaseDate: 'May 2026',
            newFeatures: [
              'Custom time-slot manager for tailored lecture schedules',
              'Automatic curriculum loading database for Jamia Millia Islamia'
            ],
            bugFixes: [
              'Optimized layout resizing behavior on tablet devices'
            ]
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoadingChangelogs(false);
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      alert('Please type DELETE to confirm.');
      return;
    }
    try {
      if (profile.email) {
        await deleteUserAccountFromFirestore(profile.email);
      }
      localStorage.clear();
      alert('Your BunkSafe Cloud Account and all data have been completely deleted from both cloud and local storage.');
      window.location.reload();
    } catch (err) {
      alert('Error during deletion. Resetting local state.');
      localStorage.clear();
      window.location.reload();
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

      {/* Initials Display & Banner */}
      <div className="flex flex-col items-center gap-3 py-4 bg-zinc-900/40 border border-zinc-850 rounded-2xl p-4">
        <div className="relative group select-none">
          <button
            onClick={() => {
              if (profilePhoto) {
                setShowPhotoModal(true);
              } else if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-primary/20 overflow-hidden border-4 border-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary/50 relative"
            title={profilePhoto ? "View profile photo" : "Upload profile photo"}
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              (profile.name || 'U').charAt(0).toUpperCase()
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
          </button>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-black text-zinc-100">{profile.name}</h2>
          <p className="text-xs text-zinc-500 font-medium">{profile.college} — {profile.department}</p>
        </div>

        {/* Profile Photo Controls */}
        <div className="flex items-center justify-center gap-2 mt-1">
          <button
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-xl text-xs font-bold transition-all border border-zinc-700/50"
          >
            <Camera size={14} />
            Change Photo
          </button>
          {profilePhoto && (
            <>
              <button
                onClick={() => setShowPhotoModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-xl text-xs font-bold transition-all border border-zinc-700/50"
              >
                <Eye size={14} />
                View Photo
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to remove your profile photo?')) {
                    if (updateProfilePhoto) {
                      updateProfilePhoto(null);
                    }
                    if (showToast) {
                      showToast('Profile photo removed.', 'info');
                    }
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-950/60 text-red-400 rounded-xl text-xs font-bold transition-all border border-red-900/30"
              >
                <Trash2 size={14} />
                Remove
              </button>
            </>
          )}
        </div>

        {/* Hidden input element as requested */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelect}
          className="hidden"
        />
      </div>

      {/* Profile Photo Viewer Modal */}
      <AnimatePresence>
        {showPhotoModal && profilePhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-450">Profile Photo</h3>
                <button
                  onClick={() => setShowPhotoModal(false)}
                  className="p-1 rounded-full bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="aspect-square w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-850 flex items-center justify-center relative mb-4">
                <img
                  src={profilePhoto}
                  alt={profile.name}
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowPhotoModal(false);
                    if (fileInputRef.current) fileInputRef.current.click();
                  }}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary/95 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Camera size={14} />
                  Change
                </button>
                <button
                  onClick={() => {
                    setShowPhotoModal(false);
                    if (confirm('Are you sure you want to remove your profile photo?')) {
                      if (updateProfilePhoto) {
                        updateProfilePhoto(null);
                      }
                      if (showToast) {
                        showToast('Profile photo removed.', 'info');
                      }
                    }
                  }}
                  className="px-4 py-2.5 bg-red-950/40 hover:bg-red-950/60 border border-red-900/30 text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center"
                  title="Remove Photo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              
              const isNewJmiECE = profile.department === 'Electronics & Communication Engineering';
              const isNewJmiCivil = profile.department.includes('Civil Engineering');
              const isNewJmiVLSI = profile.department.includes('VLSI Design');
              const isNewJmiElec = profile.department === 'Electrical Engineering';
              const isNewJmiMech = profile.department === 'Mechanical Engineering';
              const isNewJmiCsds = profile.department.includes('Computer Science') && profile.department.includes('Data Science');
              const isNewJmiCompEng = profile.department === 'Computer Engineering' || (profile.department.includes('Computer') && !profile.department.includes('Data Science') && !profile.department.includes('Electrical'));
              const isNewJmiEec = profile.department.includes('Electrical & Computer');
              const isJmiCurriculum = isSem1or2 || isNewJmiECE || isNewJmiCivil || isNewJmiVLSI || isNewJmiElec || isNewJmiMech || isNewJmiCsds || isNewJmiCompEng || isNewJmiEec;

              const branchChanged = profile.department !== initialBranch || profile.semester !== initialSem;

              if (isJmiCurriculum) {
                if (branchChanged || subjects.length === 0) {
                  const confirmLoad = subjects.length === 0 || confirm(`You changed your branch/semester to ${profile.semester} - ${profile.department || 'Applied Science'}. Would you like to automatically load the default JMI curriculum/subjects for this selection? This will update your attendance screen with the correct subjects.`);
                  if (confirmLoad) {
                    const { subjects: defaultSubs } = getDefaultCurriculumSubjects(profile.semester, profile.department, profile.firstYearPattern);
                    if (defaultSubs && defaultSubs.length > 0) {
                      setSubjects(defaultSubs);
                      alert(`Profile updated. Successfully loaded default curriculum for ${profile.semester} ${profile.department || 'Applied Science'}!`);
                    } else {
                      alert('Profile and Personal settings updated locally!');
                    }
                  } else {
                    alert('Profile and Personal settings updated locally! Existing subjects kept.');
                  }
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
      </div>      {/* 4. BACKUP & DATA SECURITY */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
          <RefreshCw size={14} className="text-primary" /> Backup & Data Security
        </h3>
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={exportBackup}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-zinc-950/40 border border-zinc-850 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-colors"
            >
              <Download size={14} className="text-primary" /> Export Backup
            </button>
            <label className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-zinc-950/40 border border-zinc-850 rounded-xl text-xs font-bold text-zinc-300 hover:text-white cursor-pointer transition-colors">
              <Upload size={14} className="text-primary" /> Import Backup
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportBackup} 
                className="hidden" 
              />
            </label>
          </div>

          <button 
            onClick={handleResetAttendance}
            className="w-full flex justify-between items-center py-2.5 px-3 bg-red-600/5 border border-red-900/20 rounded-xl text-xs font-bold text-red-400 hover:bg-red-600/10 transition-colors"
          >
            <span className="flex items-center gap-2"><Trash2 size={14} /> Clear Attendance Logs</span>
            <span className="text-[10px] text-red-500/80 font-medium">Reset Records</span>
          </button>

          <button 
            onClick={handleClearLocalStorage}
            className="w-full flex justify-between items-center py-2.5 px-3 bg-red-600/5 border border-red-900/20 rounded-xl text-xs font-bold text-red-400 hover:bg-red-600/10 transition-colors"
          >
            <span className="flex items-center gap-2"><AlertTriangle size={14} /> Delete All Local Data</span>
            <span className="text-[10px] text-red-500/80 font-medium">Reset Entire App</span>
          </button>

          <button 
            onClick={() => {
              setDeleteConfirmationText('');
              setDeleteConfirmSubjectId('CLOUD_DELETE');
            }}
            className="w-full flex justify-between items-center py-2.5 px-3 bg-red-600/10 border border-red-600/20 rounded-xl text-xs font-bold text-red-500 hover:bg-red-600/20 transition-colors"
          >
            <span className="flex items-center gap-2"><LogOut size={14} /> Delete Cloud Account</span>
            <span className="text-[10px] text-red-500/80 font-medium">Cloud Wipe</span>
          </button>
        </div>
      </div>

      {/* 5. COMMUNITY & FEEDBACK */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
          <MessageSquare size={14} className="text-primary" /> Community & Feedback
        </h3>
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <button 
            onClick={() => setShowReportBug(true)}
            className="w-full flex justify-between items-center py-2.5 px-3 bg-zinc-950/40 border border-zinc-850/60 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" /> Report a Bug</span>
            <span className="text-[10px] text-zinc-500">Submit Bug Report</span>
          </button>

          <button 
            onClick={() => setShowFeatureRequest(true)}
            className="w-full flex justify-between items-center py-2.5 px-3 bg-zinc-950/40 border border-zinc-850/60 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2"><Sparkles size={14} className="text-yellow-500" /> Request a Feature</span>
            <span className="text-[10px] text-zinc-500">Saves to Firestore</span>
          </button>

          <button 
            onClick={handleShareApp}
            className="w-full flex justify-between items-center py-2.5 px-3 bg-zinc-950/40 border border-zinc-850/60 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2"><Share2 size={14} className="text-blue-500" /> Share BunkSafe App</span>
            <span className="text-[10px] text-zinc-500">Web Share API</span>
          </button>
        </div>
      </div>

      {/* 6. LEGAL & SECURITY */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
          <ShieldCheck size={14} className="text-primary" /> Legal & Security
        </h3>
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <button 
            onClick={() => setShowAboutBunkSafe(true)}
            className="w-full flex justify-between items-center py-2.5 px-3 bg-zinc-950/40 border border-zinc-850/60 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2"><Info size={14} className="text-primary" /> About BunkSafe</span>
            <span className="text-[10px] text-zinc-500">App Specs & Tech</span>
          </button>

          <button 
            onClick={() => setShowPrivacyPolicy(true)}
            className="w-full flex justify-between items-center py-2.5 px-3 bg-zinc-950/40 border border-zinc-850/60 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-green-500" /> Privacy Policy</span>
            <span className="text-[10px] text-zinc-500">Firebase & Perms</span>
          </button>

          <button 
            onClick={() => setShowTermsConditions(true)}
            className="w-full flex justify-between items-center py-2.5 px-3 bg-zinc-950/40 border border-zinc-850/60 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2"><FileText size={14} className="text-amber-500" /> Terms & Conditions</span>
            <span className="text-[10px] text-zinc-500">Disclaimers & Liability</span>
          </button>

          <button 
            onClick={() => setShowAboutDev(true)}
            className="w-full flex justify-between items-center py-2.5 px-3 bg-zinc-950/40 border border-zinc-850/60 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2"><Heart size={14} className="text-rose-500" /> About Developer</span>
            <span className="text-[10px] text-zinc-500">Kaif Khan, JMI</span>
          </button>
        </div>
      </div>

      {/* 7. OPERATIONS */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
          <Sliders size={14} className="text-primary" /> App Operations
        </h3>
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <button 
            onClick={handleCheckUpdates}
            disabled={isCheckingUpdates}
            className="w-full flex justify-between items-center py-2.5 px-3 bg-zinc-950/40 border border-zinc-850/60 rounded-xl text-xs font-bold text-zinc-300 hover:text-white disabled:opacity-50 transition-colors"
          >
            <span className="flex items-center gap-2"><RefreshCw size={14} className={`text-primary ${isCheckingUpdates ? 'animate-spin' : ''}`} /> Check for Updates</span>
            <span className="text-[10px] text-zinc-500">{isCheckingUpdates ? 'Checking...' : 'v2.4.0'}</span>
          </button>

          <button 
            onClick={async () => {
              await handleLoadChangelogs();
              setShowChangelog(true);
            }}
            className="w-full flex justify-between items-center py-2.5 px-3 bg-zinc-950/40 border border-zinc-850/60 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2"><CalendarDays size={14} className="text-primary" /> Release History / Changelog</span>
            <span className="text-[10px] text-zinc-500">Build History</span>
          </button>
        </div>
      </div>

      {/* ABOUT BUNKSAFE DIALOG */}
      {showAboutBunkSafe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black flex items-center gap-2 text-zinc-100">
                <Info size={20} className="text-primary" /> About BunkSafe
              </h3>
              <button onClick={() => setShowAboutBunkSafe(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="text-xs text-zinc-400 space-y-3 leading-relaxed max-h-96 overflow-y-auto pr-1">
              <div className="bg-zinc-950 p-3 rounded-2xl text-center space-y-1 border border-zinc-850">
                <p className="text-base font-black text-white">BunkSafe</p>
                <p className="text-[10px] text-primary font-bold">Smart Attendance & Academic Companion</p>
                <p className="text-[10px] text-zinc-500 font-mono">v2.4.0 • Build #1024</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tagline</p>
                <p className="text-zinc-300 font-medium">Smart Attendance & Academic Companion for College Students</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Developer</p>
                <p className="text-zinc-300 font-medium font-mono">Kaif Khan</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Support Email</p>
                <a href="mailto:mekhankaif@gmail.com" className="text-primary hover:underline font-mono">mekhankaif@gmail.com</a>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Official Website</p>
                <a href="https://bunk-safe-downloader.vercel.app/" target="_blank" rel="noreferrer" className="text-primary hover:underline break-all font-mono">https://bunk-safe-downloader.vercel.app/</a>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Target Audience</p>
                <p className="text-zinc-300 font-medium">All University and College Students globally.</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Technology Stack</p>
                <p className="text-zinc-300">React, Vite, TypeScript, Tailwind CSS, Firebase Client SDK (Firestore & Storage), Web Share API, Motion animations.</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Open Source Libraries</p>
                <p className="text-zinc-300">lucide-react, date-fns, motion (framer-motion), Recharts.</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Credits</p>
                <p className="text-zinc-300">Specially optimized for student scheduling routines. Deep gratitude to Jamia Millia Islamia (JMI) peers and our amazing community of beta testers!</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAboutBunkSafe(false)}
              className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase transition-all"
            >
              Close Info
            </button>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY DIALOG */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black flex items-center gap-2 text-zinc-100">
                <ShieldCheck size={20} className="text-primary" /> Privacy Policy
              </h3>
              <button onClick={() => setShowPrivacyPolicy(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="text-xs text-zinc-400 space-y-3 leading-relaxed max-h-96 overflow-y-auto pr-1">
              <p><strong>BunkSafe Privacy Commitment</strong></p>
              <p>Your privacy is central to how we construct BunkSafe. We support transparent data management.</p>
              
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">1. External Services Used</p>
              <p>This app integrates with the following Firebase Cloud services for optimal operations:</p>
              <ul className="list-disc list-inside pl-1 space-y-1">
                <li><strong>Firebase Authentication:</strong> Secure session identification.</li>
                <li><strong>Firebase Firestore:</strong> Live backing store to back up your profiles and subjects list.</li>
                <li><strong>Firebase Storage:</strong> Secure user-specific uploaded assets (e.g. avatar files).</li>
                <li><strong>Firebase Analytics:</strong> High-level application usage and telemetry analysis.</li>
                <li><strong>Firebase Cloud Messaging (FCM):</strong> Delivers daily attendance checklist alerts.</li>
              </ul>

              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">2. System Permissions</p>
              <p>BunkSafe requests minimal hardware permissions to execute local utilities:</p>
              <ul className="list-disc list-inside pl-1 space-y-1">
                <li><strong>Camera:</strong> Allows scanning profile avatars or uploading schedules.</li>
                <li><strong>Internet:</strong> Communicates with cloud databases for real-time backup and sync.</li>
                <li><strong>Notifications:</strong> Powers the daily 8 AM and 6 PM attendance reminder checklists.</li>
              </ul>

              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">3. Local & Cloud Storage</p>
              <p>All schedules, records, grades, and exams are stored locally on your device via standard localStorage. Standard syncing regularly updates this to our secure Firestore servers under your unique email document.</p>

              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">4. Data Deletion Requests</p>
              <p>You own your data. You can completely delete all cloud database tables or wipe local caches instantly using the 'Delete Cloud Account' or 'Delete All Local Data' options inside settings. If you require manual deletion assistance, contact: <a href="mailto:mekhankaif@gmail.com" className="text-primary hover:underline">mekhankaif@gmail.com</a>.</p>
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

      {/* TERMS & CONDITIONS DIALOG */}
      {showTermsConditions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black flex items-center gap-2 text-zinc-100">
                <FileText size={20} className="text-primary" /> Terms & Conditions
              </h3>
              <button onClick={() => setShowTermsConditions(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            <div className="text-xs text-zinc-400 space-y-3 leading-relaxed max-h-96 overflow-y-auto pr-1">
              <p><strong>BunkSafe Academic Terms of Use</strong></p>
              
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">1. Estimation & Predictions</p>
              <p>BunkSafe is an academic planning utility. All predictions, bunk limits, and GPA estimations are calculated purely based on the parameters, timetables, and weights that you input.</p>
              
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">2. Verification Mandate</p>
              <p>Estimates do not replace official university or college attendance books. Users are strictly required to double-check their official attendance logs directly with their departments or university portals to avoid registration defaults.</p>

              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">3. Developer Liability Disclaimer</p>
              <p>BunkSafe is designed purely as an academic assistance tool. The developer (Kaif Khan) is not responsible or liable for any attendance calculation errors, changes in institutional attendance criteria, sessional/exam entry bars, or any academic outcome resulting from the use of this app.</p>
            </div>
            <button 
              onClick={() => setShowTermsConditions(false)}
              className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase transition-all"
            >
              Agree & Close
            </button>
          </div>
        </div>
      )}

      {/* REPORT BUG DIALOG */}
      {showReportBug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black flex items-center gap-2 text-zinc-100">
                <AlertTriangle size={20} className="text-amber-500" /> Report a Bug
              </h3>
              <button onClick={() => setShowReportBug(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>
            
            <a 
              href="https://chat.whatsapp.com/IAsmtq8aMkZ54EAhkZ25tu?s=cl&p=a&ilr=4"
              target="_blank"
              rel="noreferrer"
              className="block p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl text-center space-y-1 transition-all"
            >
              <p className="text-xs font-black text-emerald-400">Join WhatsApp Support Group</p>
              <p className="text-[10px] text-zinc-400">Get direct, rapid assistance from the developer & community</p>
            </a>

            <form onSubmit={handleBugReportSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Bug Title / Issue</label>
                <input 
                  type="text" 
                  value={bugTitle}
                  onChange={(e) => setBugTitle(e.target.value)}
                  placeholder="e.g. Schedule reset glitch" 
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-primary font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Steps to Reproduce / Description</label>
                <textarea 
                  value={bugDesc}
                  onChange={(e) => setBugDesc(e.target.value)}
                  placeholder="Explain exactly what happens..." 
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-primary min-h-20"
                  required
                />
              </div>

              <div className="pt-1 flex gap-2">
                <button 
                  type="submit"
                  disabled={isSubmittingBug}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase disabled:opacity-50 font-black"
                >
                  {isSubmittingBug ? 'Reporting...' : 'Register Bug'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowReportBug(false)}
                  className="px-4 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold uppercase"
                >
                  Cancel
                </button>
              </div>
            </form>

            <div className="text-center pt-2 border-t border-zinc-800/60">
              <p className="text-[10px] text-zinc-500">Or email directly: <a href="mailto:mekhankaif@gmail.com" className="text-primary font-bold font-mono">mekhankaif@gmail.com</a></p>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE REQUEST DIALOG */}
      {showFeatureRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black flex items-center gap-2 text-zinc-100">
                <Sparkles size={20} className="text-yellow-400" /> Request a Feature
              </h3>
              <button onClick={() => setShowFeatureRequest(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Have an idea to make BunkSafe better? Suggest widgets, analytics tables, or notifications and submit them directly to our planning roadmap!
            </p>

            <form onSubmit={handleFeatureRequestSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Feature Title</label>
                <input 
                  type="text" 
                  value={featureTitle}
                  onChange={(e) => setFeatureTitle(e.target.value)}
                  placeholder="e.g. Export schedule to PDF" 
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-primary font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Describe Your Idea</label>
                <textarea 
                  value={featureDesc}
                  onChange={(e) => setFeatureDesc(e.target.value)}
                  placeholder="Explain why this feature would be helpful..." 
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-primary min-h-24"
                  required
                />
              </div>

              <div className="pt-1 flex gap-2">
                <button 
                  type="submit"
                  disabled={isSubmittingFeature}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase disabled:opacity-50 font-black"
                >
                  {isSubmittingFeature ? 'Submitting...' : 'Submit Request'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowFeatureRequest(false)}
                  className="px-4 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold uppercase"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECK FOR UPDATES DIALOG */}
      {updateInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-black flex items-center gap-2 text-zinc-100">
              <CheckCircle size={20} className="text-primary animate-bounce" /> Update Available
            </h3>
            <div className="space-y-2">
              <p className="text-xs text-zinc-300">A new production version is available!</p>
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-850 text-left">
                <p className="text-sm font-black text-white font-mono">Version {updateInfo.latestVersion}</p>
                <p className="text-[10px] text-zinc-500 font-mono">Released: {updateInfo.releasedAt ? format(new Date(updateInfo.releasedAt), 'dd MMM yyyy') : 'Recently'}</p>
                {updateInfo.changelog && (
                  <ul className="list-disc list-inside mt-2 text-[11px] text-zinc-400 space-y-1">
                    {updateInfo.changelog.map((log: string, i: number) => (
                      <li key={i}>{log}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <a 
                href={updateInfo.downloadUrl || "https://bunk-safe-downloader.vercel.app/"}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-primary text-white text-center rounded-xl text-xs font-bold uppercase font-black"
              >
                Download Update
              </a>
              <button 
                onClick={() => setUpdateInfo(null)}
                className="px-4 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold uppercase"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGELOG DIALOG */}
      {showChangelog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black flex items-center gap-2 text-zinc-100">
                <CalendarDays size={20} className="text-primary" /> Release History
              </h3>
              <button onClick={() => setShowChangelog(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
            </div>

            <div className="text-xs text-zinc-400 space-y-4 leading-relaxed max-h-96 overflow-y-auto pr-1">
              {isLoadingChangelogs ? (
                <p className="text-center text-zinc-500 py-8">Loading logs...</p>
              ) : changelogs.map((log, idx) => (
                <div key={idx} className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-850 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-sm text-white">v{log.version}</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium font-mono">{log.releaseDate}</span>
                  </div>
                  {log.newFeatures && log.newFeatures.length > 0 && (
                    <div className="space-y-1 text-left">
                      <p className="text-[9px] font-black text-primary uppercase">New Features</p>
                      <ul className="list-disc list-inside text-[11px] text-zinc-300 pl-1 space-y-0.5">
                        {log.newFeatures.map((feat: string, i: number) => <li key={i}>{feat}</li>)}
                      </ul>
                    </div>
                  )}
                  {log.bugFixes && log.bugFixes.length > 0 && (
                    <div className="space-y-1 text-left">
                      <p className="text-[9px] font-black text-red-400 uppercase">Bug Fixes</p>
                      <ul className="list-disc list-inside text-[11px] text-zinc-300 pl-1 space-y-0.5">
                        {log.bugFixes.map((fix: string, i: number) => <li key={i}>{fix}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowChangelog(false)}
              className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase transition-all"
            >
              Close History
            </button>
          </div>
        </div>
      )}

      {/* CLOUD DATA DELETE DIALOG */}
      {deleteConfirmSubjectId === 'CLOUD_DELETE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm space-y-4">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center space-y-2">
              <h4 className="font-extrabold text-base text-zinc-100">Permanently Delete Account?</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This will delete your Cloud Profile, Subjects list, and sessional records. There is no fallback backup, and it cannot be undone!
              </p>
              <div className="bg-zinc-950 p-3 rounded-2xl text-left text-[11px] text-zinc-500 space-y-1 font-mono">
                <div>• Permanent Cloud Wipe</div>
                <div>• Clears Local Caches</div>
                <div>• Returns to Onboarding</div>
              </div>
              <div className="space-y-1.5 text-left pt-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Type "DELETE" to confirm</label>
                <input 
                  type="text" 
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="Type DELETE" 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 text-center font-bold"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText !== 'DELETE'}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                Permanently Delete
              </button>
              <button
                onClick={() => {
                  setDeleteConfirmSubjectId(null);
                  setDeleteConfirmationText('');
                }}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs font-bold uppercase transition-all"
              >
                Cancel
              </button>
            </div>
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
            <h3 className="text-lg font-black text-zinc-100 font-mono">About Developer</h3>
            
            <div className="bg-zinc-950/50 border border-zinc-850 p-3 rounded-2xl space-y-1">
              <p className="text-sm font-black text-zinc-100">Kaif Ahmad Khan</p>
              <p className="text-[11px] text-zinc-400 font-medium">B.Tech Electronics & Communication Engineering</p>
              <p className="text-[10px] text-primary font-bold uppercase tracking-wider">3rd Year, JMI</p>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              BunkSafe is designed and built with passion to help university students manage attendance targets, track lectures, log exams, and strategically plan sessional/grade results with ease.
            </p>

            <div className="pt-1">
              <a 
                href="https://www.instagram.com/me_kaifkhan" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Instagram size={14} /> Follow @me_kaifkhan on Instagram
              </a>
            </div>

            <button 
              onClick={() => setShowAboutDev(false)}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold uppercase transition-all"
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
                          <span className="font-extrabold text-sm text-zinc-100 break-words leading-snug">{sub.name}</span>
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
                        const { subjects: defaultSubs } = getDefaultCurriculumSubjects(profile.semester, profile.department, profile.firstYearPattern);
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
