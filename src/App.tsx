import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  BarChart3, 
  User, 
  Settings, 
  Plus, 
  Minus, 
  ChevronLeft, 
  ChevronRight,
  Lock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  LogOut,
  Trash2,
  Bell,
  BellOff,
  Sparkles,
  TrendingUp,
  Zap,
  Mail,
  Loader2,
  Download,
  BookOpen,
  CalendarDays,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  addDays, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  isSameMonth,
  eachDayOfInterval, 
  eachMonthOfInterval,
  isSameDay, 
  isToday, 
  parseISO, 
  differenceInDays,
  isBefore,
  isAfter,
  startOfDay,
  getDay
} from 'date-fns';
import { 
  Profile, 
  Semester, 
  AttendanceRecord, 
  SemesterHistory, 
  AppState,
  Exam
} from './types';
import { 
  formatDate, 
  getTodayStr, 
  calculateAttendance, 
  calculateBunkInfo 
} from './utils/dateUtils';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// --- Shared Tailwind Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string, key?: any }) => (
  <div className={`bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 shadow-xl ${className}`}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = "", 
  disabled = false,
  type = 'button'
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost',
  className?: string,
  disabled?: boolean,
  type?: 'button' | 'submit' | 'reset'
}) => {
  const variants = {
    primary: 'bg-primary text-zinc-950 hover:opacity-90 font-bold',
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 font-medium',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-medium',
    ghost: 'bg-transparent text-zinc-400 hover:text-zinc-100 font-medium'
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`px-4 py-3 rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder = "", min, max }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{label}</label>}
    <input 
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-sm"
    />
  </div>
);

export default function App() {
  // Authentication & Loading States
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isSplashActive, setIsSplashActive] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const lastSyncedDataRef = useRef<string>('');

  // Persistence States
  const [profile, setProfile] = useState<Profile>(() => {
    const saved = localStorage.getItem('bs_profile');
    const defaultProfile = { name: '', email: '', college: '', department: '', semester: '', mobile: '', avatar: '' };
    if (!saved) return defaultProfile;
    const parsed = JSON.parse(saved);
    return { ...defaultProfile, ...parsed };
  });

  const [semester, setSemester] = useState<Semester>(() => {
    const saved = localStorage.getItem('bs_semester');
    const defaultSemester = { title: '', startDate: '', endDate: '', targetAttendance: 75, isInitialized: false };
    if (!saved) return defaultSemester;
    const parsed = JSON.parse(saved);
    return { ...defaultSemester, ...parsed };
  });

  const [records, setRecords] = useState<Record<string, AttendanceRecord>>(() => {
    const saved = localStorage.getItem('bs_records');
    return saved ? JSON.parse(saved) : {};
  });

  const [history, setHistory] = useState<SemesterHistory[]>(() => {
    const saved = localStorage.getItem('bs_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('bs_exams');
    return saved ? JSON.parse(saved) : [];
  });

  // Navigation & UI States
  const [appState, setAppState] = useState<AppState>('WELCOME');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('bs_theme_color') || '#10b981';
  });
  
  // Other interactive states
  const [onlineCount, setOnlineCount] = useState(450);
  const [extraHolidayInput, setExtraHolidayInput] = useState('');
  const [gapDays, setGapDays] = useState<string[]>([]);
  const [currentGapIndex, setCurrentGapIndex] = useState(0);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayStr());
  const [combiSelectedMonths, setCombiSelectedMonths] = useState<string[]>([]);
  
  // Exams states
  const [showExamModal, setShowExamModal] = useState(false);
  const [examType, setExamType] = useState<'Mid-sem' | 'End-sem'>('Mid-sem');
  const [examLabel, setExamLabel] = useState('');
  const [examStart, setExamStart] = useState('');
  const [examEnd, setExamEnd] = useState('');

  // Local state persistence watchers
  useEffect(() => localStorage.setItem('bs_profile', JSON.stringify(profile)), [profile]);
  useEffect(() => localStorage.setItem('bs_semester', JSON.stringify(semester)), [semester]);
  useEffect(() => localStorage.setItem('bs_records', JSON.stringify(records)), [records]);
  useEffect(() => localStorage.setItem('bs_history', JSON.stringify(history)), [history]);
  useEffect(() => localStorage.setItem('bs_exams', JSON.stringify(exams)), [exams]);

  // Firestore automatic state syncing watcher
  useEffect(() => {
    if (!user || !isDataLoaded) return;

    const currentDataStr = JSON.stringify({
      profile,
      semester,
      records,
      history,
      exams
    });

    // If state matches what is already in Firestore / what we loaded, skip writing!
    if (currentDataStr === lastSyncedDataRef.current) {
      return;
    }

    const syncToFirestore = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'appData');
        await setDoc(docRef, {
          profile,
          semester,
          records,
          history,
          exams,
          lastUpdated: new Date().toISOString()
        });
        lastSyncedDataRef.current = currentDataStr;
      } catch (err) {
        console.error("Error syncing state to Firestore:", err);
      }
    };

    // Debounce writes by 1 second to avoid hitting Firestore on every key stroke or toggle
    const timeoutId = setTimeout(() => {
      syncToFirestore();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [user, profile, semester, records, history, exams, isDataLoaded]);

  // Splash Screen 2-second Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashActive(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Handle CSS variable theme colors dynamically
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', themeColor);
    const hex = themeColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 16;
    const g = parseInt(hex.substring(2, 4), 16) || 185;
    const b = parseInt(hex.substring(4, 6), 16) || 129;
    const darken = (c: number) => Math.max(0, Math.floor(c * 0.85)).toString(16).padStart(2, '0');
    const hoverColor = `#${darken(r)}${darken(g)}${darken(b)}`;
    document.documentElement.style.setProperty('--primary-hover', hoverColor);
    localStorage.setItem('bs_theme_color', themeColor);
  }, [themeColor]);

  // Auth synchronization & smart state routing
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid, 'appData');
          const docSnap = await getDoc(docRef);

          // Get current local state from localStorage before merging
          const localProfileRaw = localStorage.getItem('bs_profile');
          const localSemesterRaw = localStorage.getItem('bs_semester');
          const localRecordsRaw = localStorage.getItem('bs_records');
          const localHistoryRaw = localStorage.getItem('bs_history');
          const localExamsRaw = localStorage.getItem('bs_exams');

          const localProfile: Profile = localProfileRaw 
            ? JSON.parse(localProfileRaw) 
            : { name: '', email: '', college: '', department: '', semester: '', mobile: '', avatar: '' };
          const localSemester: Semester = localSemesterRaw 
            ? JSON.parse(localSemesterRaw) 
            : { startDate: '', endDate: '', targetAttendance: 75, isInitialized: false };
          const localRecords: Record<string, AttendanceRecord> = localRecordsRaw 
            ? JSON.parse(localRecordsRaw) 
            : {};
          const localHistory: SemesterHistory[] = localHistoryRaw 
            ? JSON.parse(localHistoryRaw) 
            : [];
          const localExams: Exam[] = localExamsRaw 
            ? JSON.parse(localExamsRaw) 
            : [];

          let finalProfile = { ...localProfile };
          let finalSemester = { ...localSemester };
          let finalRecords = { ...localRecords };
          let finalHistory = [ ...localHistory ];
          let finalExams = [ ...localExams ];

          if (docSnap.exists()) {
            // Returning user: Load Firestore data and merge with local data, keeping both safe and preventing duplicates
            const cloudData = docSnap.data();

            // Profile merge
            finalProfile = {
              name: cloudData.profile?.name || localProfile.name || firebaseUser.displayName || 'BunkSafe User',
              email: cloudData.profile?.email || localProfile.email || firebaseUser.email || '',
              college: cloudData.profile?.college || localProfile.college || '',
              department: cloudData.profile?.department || localProfile.department || '',
              semester: cloudData.profile?.semester || localProfile.semester || '',
              mobile: cloudData.profile?.mobile || localProfile.mobile || '',
              avatar: cloudData.profile?.avatar || localProfile.avatar || firebaseUser.photoURL || '',
            };

            // Semester merge
            finalSemester = {
              title: cloudData.semester?.title || localSemester.title || '',
              startDate: cloudData.semester?.startDate || localSemester.startDate || '',
              endDate: cloudData.semester?.endDate || localSemester.endDate || '',
              targetAttendance: cloudData.semester?.targetAttendance || localSemester.targetAttendance || 75,
              isInitialized: cloudData.semester?.isInitialized || localSemester.isInitialized || false,
              initialHeld: cloudData.semester?.initialHeld !== undefined ? cloudData.semester.initialHeld : (localSemester.initialHeld !== undefined ? localSemester.initialHeld : 0),
              initialAttended: cloudData.semester?.initialAttended !== undefined ? cloudData.semester.initialAttended : (localSemester.initialAttended !== undefined ? localSemester.initialAttended : 0),
              lockedUntil: cloudData.semester?.lockedUntil || localSemester.lockedUntil || undefined,
            };

            // Records merge
            const cloudRecords = cloudData.records || {};
            for (const date in cloudRecords) {
              const fRec = cloudRecords[date];
              const lRec = finalRecords[date];
              if (!lRec) {
                finalRecords[date] = fRec;
              } else {
                finalRecords[date] = {
                  date: fRec.date || lRec.date,
                  held: Math.max(fRec.held || 0, lRec.held || 0),
                  attended: Math.max(fRec.attended || 0, lRec.attended || 0),
                  isHoliday: fRec.isHoliday !== undefined ? fRec.isHoliday : lRec.isHoliday,
                  isLocked: fRec.isLocked !== undefined ? fRec.isLocked : lRec.isLocked,
                };
              }
            }

            // Semester History array merge (avoid duplicates by matching ID)
            const cloudHistory: SemesterHistory[] = cloudData.history || [];
            const historyMap = new Map<string, SemesterHistory>();
            finalHistory.forEach(h => { if (h && h.id) historyMap.set(h.id, h); });
            cloudHistory.forEach(h => { if (h && h.id) historyMap.set(h.id, h); });
            finalHistory = Array.from(historyMap.values());

            // Exam dates array merge (avoid duplicates by matching ID)
            const cloudExams: Exam[] = cloudData.exams || [];
            const examsMap = new Map<string, Exam>();
            finalExams.forEach(e => { if (e && e.id) examsMap.set(e.id, e); });
            cloudExams.forEach(e => { if (e && e.id) examsMap.set(e.id, e); });
            finalExams = Array.from(examsMap.values());

          } else {
            // First time Google Sign-In user: migrate local localStorage data immediately to Firestore
            finalProfile = {
              ...localProfile,
              name: localProfile.name || firebaseUser.displayName || 'BunkSafe User',
              email: localProfile.email || firebaseUser.email || '',
              avatar: localProfile.avatar || firebaseUser.photoURL || '',
            };

            await setDoc(docRef, {
              profile: finalProfile,
              semester: finalSemester,
              records: finalRecords,
              history: finalHistory,
              exams: finalExams,
              lastUpdated: new Date().toISOString()
            });
          }

          // Update the initial reference so the watcher doesn't trigger a redundant immediate write
          lastSyncedDataRef.current = JSON.stringify({
            profile: finalProfile,
            semester: finalSemester,
            records: finalRecords,
            history: finalHistory,
            exams: finalExams
          });

          // Force-update all state fields at once so they propagate correctly
          setProfile(finalProfile);
          setSemester(finalSemester);
          setRecords(finalRecords);
          setHistory(finalHistory);
          setExams(finalExams);

          // Mark data loading & merging as completed successfully
          setIsDataLoaded(true);

          // Smart routing path detection
          const hasFullProfile = finalProfile.college && finalProfile.department && finalProfile.semester;
          if (!hasFullProfile) {
            setAppState('EMAIL_COLLECTION');
          } else if (!finalSemester.isInitialized) {
            setAppState('SEMESTER_SETUP');
          } else {
            if (finalSemester.endDate) {
              const end = startOfDay(parseISO(finalSemester.endDate));
              const today = startOfDay(new Date());
              if (isAfter(today, end)) {
                setAppState('SEMESTER_END_REPORT');
              } else {
                setAppState('MAIN');
              }
            } else {
              setAppState('MAIN');
            }
          }

        } catch (err) {
          console.error("Firestore merge / migration error:", err);
          
          // Graceful fallback: setup state routing using current offline local cache
          const storedProfile = localStorage.getItem('bs_profile');
          const storedSemester = localStorage.getItem('bs_semester');
          
          const fallbackProfile: Profile = storedProfile ? JSON.parse(storedProfile) : profile;
          const fallbackSemester: Semester = storedSemester ? JSON.parse(storedSemester) : semester;

          const hasFullProfile = fallbackProfile.college && fallbackProfile.department && fallbackProfile.semester;
          if (!hasFullProfile) {
            setAppState('EMAIL_COLLECTION');
          } else if (!fallbackSemester.isInitialized) {
            setAppState('SEMESTER_SETUP');
          } else {
            setAppState('MAIN');
          }
          setIsDataLoaded(true);
        }
      } else {
        setAppState('WELCOME');
        setIsDataLoaded(false);
      }

      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Web Socket mock live synced user count
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'USER_COUNT') {
            setOnlineCount(data.count);
          }
        } catch (err) {
          console.error('WS Error:', err);
        }
      };

      socket.onclose = () => {
        reconnectTimeout = setTimeout(connect, 5000);
      };
    };

    connect();
    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Live Calculations using utils
  const stats = useMemo(() => {
    return calculateAttendance(records, semester.initialHeld, semester.initialAttended, semester.startDate, exams);
  }, [records, semester, exams]);

  const bunkInfo = useMemo(() => {
    return calculateBunkInfo(stats.totalHeld, stats.totalAttended, semester.targetAttendance);
  }, [stats, semester]);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const sDate = semester.startDate ? startOfDay(parseISO(semester.startDate)) : null;

    const monthRecords = Object.entries(records).filter(([date]) => {
      const d = parseISO(date);
      return d >= start && d <= end && (!sDate || !isBefore(d, sDate));
    }) as [string, AttendanceRecord][];
    
    let held = 0;
    let attended = 0;
    monthRecords.forEach(([_, r]) => {
      if (!r.isHoliday) {
        held += r.held;
        attended += r.attended;
      }
    });

    return { held, attended, percentage: held > 0 ? (attended / held) * 100 : 0 };
  }, [records, semester]);

  const missedDays = useMemo(() => {
    if (!semester.startDate) return [];
    const start = semester.lockedUntil 
      ? addDays(parseISO(semester.lockedUntil), 1)
      : parseISO(semester.startDate);
      
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);
    
    if (isAfter(start, yesterday)) return [];
    
    const days = eachDayOfInterval({ start, end: yesterday });
    return days.filter(day => {
      const dateStr = formatDate(day);
      return !records[dateStr];
    }).map(d => formatDate(d));
  }, [records, semester.startDate, semester.lockedUntil]);

  const semesterMonthlyStats = useMemo(() => {
    if (!semester.startDate) return [];
    const start = startOfDay(parseISO(semester.startDate));
    if (isNaN(start.getTime())) return [];
    
    const end = endOfMonth(new Date());
    if (isAfter(start, end)) return [];
    
    const months = eachMonthOfInterval({ start, end });
    const now = new Date();
    
    return months.map(month => {
      const mStart = startOfMonth(month);
      const mEnd = endOfMonth(month);
      const isCompleted = isBefore(mEnd, now);
      const isCurrent = isSameMonth(month, now);
      
      const monthRecords = Object.entries(records).filter(([date]) => {
        const d = parseISO(date);
        const sDate = startOfDay(parseISO(semester.startDate!));
        return d >= mStart && d <= mEnd && !isBefore(d, sDate);
      }) as [string, AttendanceRecord][];
      
      let held = 0;
      let attended = 0;
      monthRecords.forEach(([date, r]) => {
        const isExam = exams.some(e => {
          const start = startOfDay(parseISO(e.startDate));
          const end = startOfDay(parseISO(e.endDate));
          const d = startOfDay(parseISO(date));
          return d >= start && d <= end;
        });
        if (!r.isHoliday && !isExam) {
          held += r.held;
          attended += r.attended;
        }
      });
      
      return {
        month: format(month, 'MMM'),
        percentage: held > 0 ? (attended / held) * 100 : 0,
        held,
        attended,
        isCompleted,
        isCurrent
      };
    });
  }, [records, semester, exams]);

  const combiStats = useMemo(() => {
    const selectedData = semesterMonthlyStats.filter(s => combiSelectedMonths.includes(s.month));
    if (selectedData.length === 0) return null;

    const totalHeld = selectedData.reduce((acc, curr) => acc + curr.held, 0);
    const totalAttended = selectedData.reduce((acc, curr) => acc + curr.attended, 0);
    const percentage = totalHeld > 0 ? (totalAttended / totalHeld) * 100 : 0;
    
    const target = semester.targetAttendance;
    let mustAttend = 0;
    if (percentage < target && totalHeld > 0) {
      mustAttend = Math.ceil((target * totalHeld - 100 * totalAttended) / (100 - target));
    }

    return { totalHeld, totalAttended, percentage, mustAttend, selectedMonths: selectedData.map(s => s.month) };
  }, [combiSelectedMonths, semesterMonthlyStats, semester.targetAttendance]);

  const toggleCombiMonth = (month: string) => {
    setCombiSelectedMonths(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  // Wizard States
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    percentage: 75,
    untilDate: getTodayStr(),
    schedule: [0, 0, 0, 0, 0, 0, 0], // Sun-Sat classes per day
    holidays: [] as number[], // days of week
    extraHolidays: [] as string[] // custom dates
  });

  // --- Actions & Helpers ---

  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const firebaseUser = result.user;
        const updatedProfile = {
          ...profile,
          name: firebaseUser.displayName || 'BunkSafe User',
          email: firebaseUser.email || '',
          avatar: firebaseUser.photoURL || '',
        };
        setProfile(updatedProfile);
        
        const hasFullProfile = updatedProfile.college && updatedProfile.department && updatedProfile.semester;
        if (!hasFullProfile) {
          setAppState('EMAIL_COLLECTION');
        } else if (!semester.isInitialized) {
          setAppState('SEMESTER_SETUP');
        } else {
          setAppState('MAIN');
        }
      }
    } catch (err: any) {
      console.error("Firebase Login Error: ", err);
      let errorMsg = "Failed to sign in with Google.";
      if (err?.code === 'auth/popup-closed-by-user') {
        errorMsg = "The sign-in popup was closed before completing.";
      } else if (err?.code === 'auth/unauthorized-domain') {
        errorMsg = "This domain is not authorized in your Firebase Project. Please add this domain to Authorized Domains in Firebase Console.";
      } else if (typeof window !== 'undefined' && window.self !== window.top) {
        errorMsg = "Google Sign-In is blocked in the iframe preview. Please open BunkSafe in a new tab to sign in.";
      } else {
        errorMsg = err?.message || errorMsg;
      }
      setLoginError(errorMsg);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsDataLoaded(false);
      lastSyncedDataRef.current = '';
      setProfile({ name: '', email: '', college: '', department: '', semester: '', mobile: '', avatar: '' });
      setSemester({ title: '', startDate: '', endDate: '', targetAttendance: 75, isInitialized: false });
      setRecords({});
      setExams([]);
      setHistory([]);
      localStorage.removeItem('bs_profile');
      localStorage.removeItem('bs_semester');
      localStorage.removeItem('bs_records');
      localStorage.removeItem('bs_exams');
      localStorage.removeItem('bs_history');
      setAppState('WELCOME');
    } catch (err) {
      console.error("Logout Error: ", err);
    }
  };

  const handleProfileSetupSubmit = async () => {
    if (profile.college && profile.department && profile.semester) {
      // Notify setup endpoint on server
      try {
        await fetch('/api/notify-setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile)
        });
      } catch (e) {
        console.error("Failed to notify setup", e);
      }

      if (!semester.isInitialized) {
        setAppState('SEMESTER_SETUP');
      } else {
        setAppState('MAIN');
      }
    }
  };

  const handleSemesterSubmit = () => {
    if (semester.startDate && semester.endDate) {
      const start = startOfDay(parseISO(semester.startDate));
      const today = startOfDay(new Date());

      if (isBefore(start, today)) {
        setAppState('LATE_DETECTION');
      } else {
        setSemester(prev => ({ ...prev, isInitialized: true }));
        setAppState('MAIN');
      }
    }
  };

  const startFromToday = () => {
    setSemester(prev => ({ 
      ...prev, 
      isInitialized: true,
      lockedUntil: formatDate(subDays(new Date(), 1))
    }));
    setAppState('MAIN');
  };

  const handleManualPastAttendance = (held: number, attended: number) => {
    setSemester(prev => ({ 
      ...prev, 
      isInitialized: true, 
      initialHeld: held, 
      initialAttended: attended,
      lockedUntil: formatDate(subDays(new Date(), 1))
    }));
    setAppState('MAIN');
  };

  const handleWizardComplete = () => {
    const start = parseISO(semester.startDate!);
    const until = parseISO(wizardData.untilDate);
    const days = eachDayOfInterval({ start, end: until });
    
    let estimatedHeld = 0;
    days.forEach(day => {
      const dateStr = formatDate(day);
      const dayOfWeek = getDay(day);
      if (!wizardData.holidays.includes(dayOfWeek) && !wizardData.extraHolidays.includes(dateStr)) {
        estimatedHeld += wizardData.schedule[dayOfWeek];
      }
    });

    const estimatedAttended = Math.round((wizardData.percentage / 100) * estimatedHeld);
    const today = startOfDay(new Date());
    const nextDay = addDays(until, 1);
    
    if (isBefore(until, subDays(today, 1))) {
      const gap = eachDayOfInterval({ start: nextDay, end: subDays(today, 1) });
      setGapDays(gap.map(d => formatDate(d)));
      setSemester(prev => ({ 
        ...prev, 
        initialHeld: estimatedHeld, 
        initialAttended: estimatedAttended,
        lockedUntil: formatDate(until)
      }));
      setAppState('GAP_HANDLING');
    } else {
      setSemester(prev => ({ 
        ...prev, 
        isInitialized: true, 
        initialHeld: estimatedHeld, 
        initialAttended: estimatedAttended,
        lockedUntil: formatDate(until)
      }));
      setAppState('MAIN');
    }
  };

  const saveGapAttendance = (held: number, attended: number) => {
    const date = gapDays[currentGapIndex];
    setRecords(prev => ({
      ...prev,
      [date]: { date, held, attended, isHoliday: false, isLocked: true }
    }));

    if (currentGapIndex < gapDays.length - 1) {
      setCurrentGapIndex(prev => prev + 1);
    } else {
      setSemester(prev => ({ ...prev, isInitialized: true, lockedUntil: getTodayStr() }));
      setAppState('MAIN');
    }
  };

  const updateAttendance = (date: string, held: number, attended: number, isHoliday: boolean) => {
    setRecords(prev => ({
      ...prev,
      [date]: { date, held, attended, isHoliday }
    }));
  };

  const handleFillMissed = () => {
    if (missedDays.length > 0) {
      setGapDays(missedDays);
      setCurrentGapIndex(0);
      setAppState('GAP_HANDLING');
    }
  };

  const handleSaveExam = () => {
    if (examLabel && examStart && examEnd) {
      const newExam: Exam = {
        id: Date.now().toString(),
        type: examType,
        label: examLabel,
        startDate: examStart,
        endDate: examEnd
      };
      setExams(prev => [...prev, newExam]);
      setShowExamModal(false);
      setExamLabel('');
      setExamStart('');
      setExamEnd('');
    }
  };

  const handleDeleteExam = (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
  };

  const getExamForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return exams.find(e => {
      const start = startOfDay(parseISO(e.startDate));
      const end = startOfDay(parseISO(e.endDate));
      const d = startOfDay(parseISO(dateStr));
      return d >= start && d <= end;
    });
  };

  // --- Screens Rendering ---

  if (isSplashActive) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-between p-12 text-center select-none">
        <div /> {/* Top spacer for balancing layout */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <div className="w-24 h-24 bg-primary rounded-[28px] mx-auto flex items-center justify-center text-zinc-950 shadow-[0_0_50px_rgba(16,185,129,0.25)] border border-primary/20">
            <CalendarIcon size={44} className="text-zinc-950 stroke-[2.25]" />
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white mt-5 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            BunkSafe
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            Attendance Margins & Safety
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-3"
        >
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.25em] font-extrabold">
            BunkSafe by Kaif Khan
          </p>
          <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
            <Loader2 size={12} className="animate-spin text-primary" />
            <span>Initializing Guard...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center text-zinc-950 shadow-2xl shadow-primary/20 animate-pulse">
          <CalendarIcon size={32} />
        </div>
        <div className="mt-6 flex items-center gap-2 text-zinc-400 font-medium">
          <Loader2 size={18} className="animate-spin text-primary" />
          <span>Synchronizing BunkSafe Secure Session...</span>
        </div>
      </div>
    );
  }

  // Welcome Screen with Google Sign-in
  if (appState === 'WELCOME') {
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 max-w-sm w-full"
        >
          <div className="w-20 h-20 bg-primary rounded-2xl mx-auto flex items-center justify-center text-zinc-950 shadow-2xl shadow-primary/30">
            <CalendarIcon size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-white">BunkSafe</h1>
            <p className="text-zinc-400 font-medium text-sm leading-relaxed">
              Smart attendance monitoring and safety margins calculator for college students.
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-left text-xs text-zinc-500 flex items-center gap-2">
            <Zap size={14} className="text-primary shrink-0 animate-bounce" />
            <span>Currently protecting <b>{onlineCount}</b> student bunks online right now.</span>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-left text-xs text-red-400 space-y-2">
              <p className="font-semibold flex items-center gap-1.5">
                <span>⚠️</span> Sign-In Issue
              </p>
              <p className="text-zinc-300 leading-relaxed">{loginError}</p>
              {isInIframe && (
                <a
                  href={window.location.origin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-bold mt-1.5"
                >
                  Open in New Tab ↗
                </a>
              )}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3.5 px-4 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all duration-150 active:scale-[0.98]"
            >
              {/* Simple Google SVG Icon */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.28 1.845 15.548 1 12.24 1 5.866 1 .7 6.166.7 12.5s5.166 11.5 11.54 11.5c6.65 0 11.07-4.68 11.07-11.27 0-.76-.08-1.34-.18-1.895l-10.89-.05z" />
              </svg>
              Continue with Google
            </button>

            {isInIframe && !loginError && (
              <div className="bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl text-left text-xs text-zinc-400 space-y-1.5 mt-3">
                <p className="text-amber-400 font-semibold flex items-center gap-1">
                  <span>💡</span> Preview Iframe Tip
                </p>
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  Google Auth may be blocked inside the editor's preview iframe. If clicking doesn't work, open the app in a new tab.
                </p>
                <a
                  href={window.location.origin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-bold text-[11px] mt-1"
                >
                  Open in New Tab ↗
                </a>
              </div>
            )}
          </div>

          <p className="text-[10px] text-zinc-600 tracking-wider uppercase font-bold">
            Created by Kaif Khan
          </p>
        </motion.div>
      </div>
    );
  }

  // Profile Setup Screen (EMAIL_COLLECTION)
  if (appState === 'EMAIL_COLLECTION') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col justify-center gap-8 max-w-md mx-auto">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <img src={profile.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-zinc-800" referrerPolicy="no-referrer" />
            <div>
              <p className="text-[10px] uppercase font-bold text-primary tracking-widest">Logged in as</p>
              <p className="text-sm font-bold">{profile.name}</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight mt-4">Profile Details</h2>
          <p className="text-zinc-500 text-sm">Tell us about your educational institution to unlock smart calculations.</p>
        </div>
        <div className="space-y-5">
          <Input 
            label="College / University Name" 
            value={profile.college} 
            onChange={(v: string) => setProfile({ ...profile, college: v })} 
            placeholder="e.g. IIT Delhi" 
          />
          <Input 
            label="Department / Course" 
            value={profile.department} 
            onChange={(v: string) => setProfile({ ...profile, department: v })} 
            placeholder="e.g. Computer Science" 
          />
          <Input 
            label="Current Semester / Class" 
            value={profile.semester} 
            onChange={(v: string) => setProfile({ ...profile, semester: v })} 
            placeholder="e.g. Semester 3" 
          />
          <Button onClick={handleProfileSetupSubmit} className="w-full py-4 text-lg text-zinc-950" disabled={!profile.college || !profile.department || !profile.semester}>
            Save & Continue
          </Button>
          <Button variant="ghost" onClick={handleSignOut} className="w-full py-2 flex items-center justify-center gap-2">
            <LogOut size={16} /> Use Different Account
          </Button>
        </div>
      </div>
    );
  }

  // Semester Setup Screen
  if (appState === 'SEMESTER_SETUP') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col justify-center gap-8 max-w-md mx-auto">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Semester Dates</h2>
          <p className="text-zinc-500 text-sm">Define your current academic duration and target attendance percentage.</p>
        </div>
        <div className="space-y-5">
          <Input 
            label="Semester Title / Number" 
            value={semester.title} 
            onChange={(v: string) => setSemester({ ...semester, title: v })} 
            placeholder="e.g. Semester 4" 
          />
          <Input 
            type="date" 
            label="Start Date" 
            value={semester.startDate} 
            onChange={(v: string) => setSemester({ ...semester, startDate: v })} 
          />
          <Input 
            type="date" 
            label="End Date" 
            value={semester.endDate} 
            onChange={(v: string) => setSemester({ ...semester, endDate: v })} 
          />
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Target Attendance</label>
              <span className="text-primary font-black">{semester.targetAttendance}%</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="100" 
              value={semester.targetAttendance}
              onChange={(e) => setSemester({ ...semester, targetAttendance: parseInt(e.target.value) })}
              className="w-full accent-primary h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <Button onClick={handleSemesterSubmit} className="w-full py-4 text-zinc-950" disabled={!semester.startDate || !semester.endDate}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // Late Start Detection Screen
  if (appState === 'LATE_DETECTION') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col justify-center gap-6 max-w-md mx-auto">
        <div className="bg-primary/10 border border-primary/20 p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <Info size={24} />
            <h3 className="text-xl font-bold">Late Start Detected</h3>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Your semester started on <b>{semester.startDate && format(parseISO(semester.startDate), 'PPP')}</b>. 
            You are tracking late by <b>{semester.startDate && differenceInDays(new Date(), parseISO(semester.startDate))}</b> days.
          </p>
        </div>
        
        <div className="space-y-3">
          <Button variant="secondary" className="w-full py-4 text-left flex flex-col gap-1 items-start" onClick={() => setAppState('WIZARD')}>
            <span className="font-bold text-white">Help me calculate past attendance</span>
            <span className="text-xs text-zinc-500">Step-by-step wizard to estimate records.</span>
          </Button>
          
          <Button variant="secondary" className="w-full py-4 text-left flex flex-col gap-1 items-start" onClick={() => {
            const held = prompt("Total classes held so far?");
            const attended = prompt("Total classes attended?");
            if (held && attended) handleManualPastAttendance(parseInt(held), parseInt(attended));
          }}>
            <span className="font-bold text-white">I know my past attendance</span>
            <span className="text-xs text-zinc-500">Enter total held and attended classes manually.</span>
          </Button>

          <Button 
            className="w-full py-4 bg-primary text-zinc-950 font-bold hover:opacity-90 transition-all rounded-xl" 
            onClick={() => setAppState('TODAY_CONFIRMATION')}
          >
            Start tracking from today
          </Button>
        </div>
      </div>
    );
  }

  // Today Confirmation
  if (appState === 'TODAY_CONFIRMATION') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col justify-center gap-8 max-w-md mx-auto">
        <div className="space-y-4 text-center">
          <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full mx-auto flex items-center justify-center text-primary">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Important Note</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Your past attendance and classes will not be counted. This might affect your cumulative semester calculations.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            variant="secondary" 
            className="w-full py-4 flex flex-col gap-1 items-center" 
            onClick={() => { setWizardStep(1); setAppState('WIZARD'); }}
          >
            <span className="font-bold text-white">Help me calculate</span>
            <span className="text-xs text-zinc-500">Estimate records using percentage.</span>
          </Button>

          <Button 
            className="w-full py-4 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 rounded-xl" 
            onClick={startFromToday}
          >
            Continue without past attendance
          </Button>

          <Button 
            variant="ghost" 
            className="w-full py-2" 
            onClick={() => setAppState('LATE_DETECTION')}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Attendance Wizard
  if (appState === 'WIZARD') {
    const handleWizardBack = () => {
      if (wizardStep > 1) {
        setWizardStep(prev => prev - 1);
      } else {
        setAppState('LATE_DETECTION');
      }
    };

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col gap-8 max-w-md mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleWizardBack} className="p-2"><ChevronLeft /></Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Attendance Wizard</h2>
            <p className="text-xs text-zinc-500">Step {wizardStep} of 5</p>
          </div>
        </div>

        <div className="flex-1 space-y-8">
          {wizardStep === 1 && (
            <div className="space-y-6">
              <p className="text-zinc-400 text-sm">What is your current estimated attendance percentage?</p>
              <div className="flex items-center gap-4">
                <input 
                  type="range" min="0" max="100" value={wizardData.percentage} 
                  onChange={(e) => setWizardData({...wizardData, percentage: parseInt(e.target.value)})}
                  className="flex-1 accent-primary"
                />
                <span className="text-2xl font-bold w-16 text-right text-primary">{wizardData.percentage}%</span>
              </div>
              <Button onClick={() => setWizardStep(2)} className="w-full py-4 text-zinc-950">Next</Button>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-6">
              <p className="text-zinc-400 text-sm">Until what date do you know this percentage?</p>
              <Input type="date" value={wizardData.untilDate} onChange={(v: string) => setWizardData({...wizardData, untilDate: v})} />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setWizardStep(1)} className="flex-1 py-4">Previous</Button>
                <Button onClick={() => setWizardStep(3)} className="flex-2 py-4 text-zinc-950">Next</Button>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-6">
              <p className="text-zinc-400 text-sm">Weekly Class Schedule (Lectures/Labs per day):</p>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                  <div key={day} className="flex items-center justify-between bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                    <span className="font-bold text-zinc-300">{day}</span>
                    <div className="flex items-center gap-4">
                      <Button variant="secondary" className="p-1 px-2.5" onClick={() => {
                        const s = [...wizardData.schedule];
                        s[i] = Math.max(0, s[i] - 1);
                        setWizardData({...wizardData, schedule: s});
                      }}><Minus size={14}/></Button>
                      <span className="w-4 text-center font-bold text-primary">{wizardData.schedule[i]}</span>
                      <Button variant="secondary" className="p-1 px-2.5" onClick={() => {
                        const s = [...wizardData.schedule];
                        s[i] = s[i] + 1;
                        setWizardData({...wizardData, schedule: s});
                      }}><Plus size={14}/></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setWizardStep(2)} className="flex-1 py-4">Previous</Button>
                <Button onClick={() => setWizardStep(4)} className="flex-2 py-4 text-zinc-950">Next</Button>
              </div>
            </div>
          )}

          {wizardStep === 4 && (
            <div className="space-y-6">
              <p className="text-zinc-400 text-sm">Fixed Weekly Holidays (Select days with no classes):</p>
              <div className="grid grid-cols-2 gap-3">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                  <button 
                    key={day}
                    onClick={() => {
                      const h = wizardData.holidays.includes(i) 
                        ? wizardData.holidays.filter(x => x !== i)
                        : [...wizardData.holidays, i];
                      setWizardData({...wizardData, holidays: h});
                    }}
                    className={`p-4 rounded-2xl border font-bold transition-all ${wizardData.holidays.includes(i) ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setWizardStep(3)} className="flex-1 py-4">Previous</Button>
                <Button onClick={() => setWizardStep(5)} className="flex-2 py-4 text-zinc-950">Next</Button>
              </div>
            </div>
          )}

          {wizardStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-zinc-400 text-sm">Other Holidays / Institutional Offs:</p>
                <p className="text-xs text-zinc-600">Add specific calendar dates where you had no classes.</p>
              </div>
              
              <div className="flex gap-2">
                <input 
                  type="date" 
                  value={extraHolidayInput}
                  onChange={(e) => setExtraHolidayInput(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-zinc-100 outline-none focus:border-primary transition-all text-sm"
                />
                <Button onClick={() => {
                  if (extraHolidayInput && !wizardData.extraHolidays.includes(extraHolidayInput)) {
                    setWizardData({...wizardData, extraHolidays: [...wizardData.extraHolidays, extraHolidayInput]});
                    setExtraHolidayInput('');
                  }
                }} className="px-4 text-zinc-950"><Plus size={20}/></Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                {wizardData.extraHolidays.length === 0 ? (
                  <p className="text-center py-4 text-zinc-600 text-xs">No extra holidays added.</p>
                ) : (
                  wizardData.extraHolidays.sort().map(date => (
                    <div key={date} className="flex items-center justify-between bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                      <span className="text-xs font-medium">{format(parseISO(date), 'PPP')}</span>
                      <button onClick={() => setWizardData({...wizardData, extraHolidays: wizardData.extraHolidays.filter(d => d !== date)})} className="text-red-500 p-1">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setWizardStep(4)} className="flex-1 py-4">Previous</Button>
                <Button onClick={handleWizardComplete} className="flex-2 py-4 text-zinc-950">Finish Calculation</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Gap Attendance Handling
  if (appState === 'GAP_HANDLING') {
    const date = gapDays[currentGapIndex];
    const r = records[date] || { held: 0, attended: 0, isHoliday: false };
    
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col gap-8 max-w-md mx-auto justify-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Fill Gap Attendance</h2>
          <p className="text-zinc-500 text-sm">Entry {currentGapIndex + 1} of {gapDays.length}</p>
        </div>

        <Card className="flex flex-col gap-8 py-8">
          <div className="text-center space-y-1">
            <h3 className="text-2xl font-black text-primary">{format(parseISO(date), 'EEEE')}</h3>
            <p className="text-zinc-500 text-sm">{format(parseISO(date), 'PPP')}</p>
          </div>

          <div className="space-y-6">
             <div className="space-y-3 text-center">
                <p className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Total Available Attendance</p>
                <div className="flex items-center justify-center gap-6">
                  <Button variant="secondary" className="p-3 rounded-full" onClick={() => {
                    updateAttendance(date, Math.max(0, r.held - 1), Math.min(r.attended, Math.max(0, r.held - 1)), false);
                  }}><Minus size={14} /></Button>
                  <span className="text-4xl font-extrabold w-12 text-center text-white">{r.held}</span>
                  <Button variant="secondary" className="p-3 rounded-full" onClick={() => {
                    updateAttendance(date, r.held + 1, r.attended, false);
                  }}><Plus size={14} /></Button>
                </div>
                <div className="flex gap-1.5 justify-center overflow-x-auto pb-1 scrollbar-hide">
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <button
                      key={`gap-held-${num}`}
                      onClick={() => updateAttendance(date, num, Math.min(r.attended, num), false)}
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 ${r.held === num ? 'bg-primary border-primary text-zinc-950' : 'bg-zinc-850 border-zinc-800 text-zinc-400'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
             </div>

             <div className="space-y-3 text-center">
                <p className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Classes Attended</p>
                <div className="flex items-center justify-center gap-6">
                  <Button variant="secondary" className="p-3 rounded-full" onClick={() => {
                    updateAttendance(date, r.held, Math.max(0, r.attended - 1), false);
                  }}><Minus size={14} /></Button>
                  <span className="text-4xl font-extrabold w-12 text-center text-primary">{r.attended}</span>
                  <Button variant="secondary" className="p-3 rounded-full" onClick={() => {
                    updateAttendance(date, r.held, Math.min(r.held, r.attended + 1), false);
                  }}><Plus size={14} /></Button>
                </div>
                <div className="flex gap-1.5 justify-center overflow-x-auto pb-1 scrollbar-hide">
                  {Array.from({ length: r.held + 1 }, (_, i) => i).map(num => (
                    <button
                      key={`gap-attended-${num}`}
                      onClick={() => updateAttendance(date, r.held, num, false)}
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 ${r.attended === num ? 'bg-primary border-primary text-zinc-950' : 'bg-zinc-850 border-zinc-800 text-zinc-400'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
             </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-850">
            <button 
              onClick={() => {
                updateAttendance(date, 0, 0, true);
                saveGapAttendance(0, 0);
              }}
              className="w-full py-3 rounded-xl font-bold transition-all active:scale-95 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20 text-sm"
            >
              Mark as Holiday
            </button>
            <Button onClick={() => saveGapAttendance(r.held, r.attended)} className="w-full py-4 text-zinc-950">
              Save & Next
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Semester End Report State
  if (appState === 'SEMESTER_END_REPORT') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col items-center justify-center text-center max-w-md mx-auto gap-6">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary">
          <CheckCircle2 size={40} />
        </div>
        
        <h1 className="text-3xl font-black tracking-tight">Semester Completed!</h1>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Your semester has officially ended according to your scheduled dates. Here is your final summary.
        </p>
        
        <Card className="w-full space-y-4 py-8">
          <div className="flex flex-col items-center">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Final Attendance Score</p>
            <h2 className="text-5xl font-black text-primary">{stats.percentage.toFixed(1)}%</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Classes</p>
              <p className="text-lg font-bold">{stats.totalHeld}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Attended</p>
              <p className="text-lg font-bold">{stats.totalAttended}</p>
            </div>
          </div>
        </Card>

        <Button 
          className="w-full py-4 text-zinc-950" 
          onClick={() => {
            const h: SemesterHistory = {
              id: Date.now().toString(),
              title: semester.title,
              startDate: semester.startDate!,
              endDate: semester.endDate!,
              finalPercentage: stats.percentage,
              totalHeld: stats.totalHeld,
              totalAttended: stats.totalAttended
            };
            setHistory([h, ...history]);
            setSemester({ title: '', startDate: '', endDate: '', targetAttendance: 75, isInitialized: false });
            setRecords({});
            setAppState('SEMESTER_SETUP');
          }}
        >
          Start New Semester
        </Button>
      </div>
    );
  }

  // --- Main Application UI (MAIN State) ---

  const renderDashboardTab = () => {
    const today = getTodayStr();
    const todayRecord = records[today] || { held: 0, attended: 0, isHoliday: false };
    const isNotStarted = semester.startDate && isBefore(startOfDay(new Date()), startOfDay(parseISO(semester.startDate)));

    return (
      <div className="space-y-6 pb-24">
        {/* Compact Header */}
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-zinc-900 rounded-full border border-zinc-800 flex items-center justify-center overflow-hidden">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-zinc-950 font-black text-lg">
                  {profile.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="text-zinc-500 text-xs">Welcome back,</p>
              <h1 className="text-xl font-bold text-zinc-100">{profile.name}</h1>
            </div>
          </div>
          <div className="bg-zinc-900/80 p-2.5 rounded-full border border-zinc-800 flex items-center justify-center">
            <Sparkles size={20} className="text-primary" />
          </div>
        </header>

        {isNotStarted ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="bg-primary/5 border-primary/20 py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto flex items-center justify-center text-primary">
                <CalendarDays size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Semester Not Started</h2>
                <p className="text-zinc-400 text-sm max-w-[280px] mx-auto leading-relaxed">
                  Your "<b>{semester.title || 'Next Semester'}</b>" is scheduled to begin on <span className="text-primary font-bold">{format(parseISO(semester.startDate!), 'PPP')}</span>.
                </p>
                <div className="pt-4">
                  <span className="bg-primary/20 text-primary text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">Entries are locked</span>
                </div>
              </div>
            </Card>
            
            <Card className="space-y-3">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Semester Schedule</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                  <span className="text-sm text-zinc-400">Start Date</span>
                  <span className="text-sm font-bold text-zinc-100">{format(parseISO(semester.startDate!), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-zinc-400">End Date</span>
                  <span className="text-sm font-bold text-zinc-100">{format(parseISO(semester.endDate!), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </Card>

            <p className="text-center text-zinc-600 text-[10px] uppercase font-bold tracking-widest">
              Daily entries are disabled until start date.
            </p>
          </motion.div>
        ) : (
          <>
            {missedDays.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 text-primary">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-xs font-semibold">You missed {missedDays.length} attendance entries.</p>
                </div>
                <Button variant="secondary" className="text-xs py-1.5 px-3 font-bold" onClick={handleFillMissed}>Fill Now</Button>
              </motion.div>
            )}

            {/* Attendance Analytics */}
            <div className="space-y-4">
              <Card className="relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">{semester.title || 'Semester'} Overall Score</p>
                      <h2 className="text-5xl font-black text-white">{stats.percentage.toFixed(1)}%</h2>
                      {semester.initialHeld && semester.initialHeld > 0 ? (
                        <p className="text-[10px] text-primary font-bold uppercase mt-1 flex items-center gap-1">
                          <Info size={10} /> Includes {semester.initialAttended}/{semester.initialHeld} past records
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-400 font-bold text-sm">{stats.totalAttended} / {stats.totalHeld}</p>
                      <p className="text-zinc-500 text-[10px] uppercase font-medium tracking-wide">classes logged</p>
                    </div>
                  </div>
                  <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, stats.percentage)}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${stats.percentage < semester.targetAttendance ? 'bg-red-500 shadow-lg shadow-red-500/20' : 'bg-primary shadow-lg shadow-primary/20'}`}
                    />
                  </div>
                </div>
              </Card>

              {/* Monthly Sub Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="space-y-1">
                  <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{format(new Date(), 'MMMM')}</p>
                  <h3 className="text-2xl font-black text-zinc-100">{monthlyStats.percentage.toFixed(1)}%</h3>
                  <p className="text-zinc-500 text-[10px] font-medium">{monthlyStats.attended} / {monthlyStats.held} classes</p>
                </Card>
                <Card className="space-y-1">
                  <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Target Goal</p>
                  <h3 className="text-2xl font-black text-primary">{semester.targetAttendance}%</h3>
                  <p className="text-zinc-500 text-[10px] font-medium">Keep above limit</p>
                </Card>
              </div>

              {/* Smart Bunk Status Banner */}
              <Card className={`border-l-4 ${bunkInfo.status === 'SAFE' ? 'border-l-primary bg-primary/5' : 'border-l-red-500 bg-red-500/5'}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${bunkInfo.status === 'SAFE' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
                    {bunkInfo.status === 'SAFE' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-zinc-100 text-sm">
                      {bunkInfo.status === 'SAFE' 
                        ? `You can bunk ${bunkInfo.canBunk} classes safely.` 
                        : `Attend next ${bunkInfo.mustAttend} classes to reach ${semester.targetAttendance}%.`}
                    </h3>
                    <p className="text-zinc-500 text-xs">
                      {bunkInfo.status === 'SAFE' 
                        ? "Enjoy your free time, but stay above target!" 
                        : "Time to get serious and hit those lectures."}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Daily Entrance Area */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <CalendarIcon size={14} className="text-primary" /> Daily Entry <span className="text-zinc-600 font-normal text-xs">— {format(new Date(), 'PPP')}</span>
              </h3>
              <Card className="space-y-6">
                {/* Classes Held Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-bold text-zinc-200 text-sm">Classes Available Today</p>
                      <p className="text-[10px] text-zinc-500">How many classes were scheduled?</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="secondary" className="p-2 rounded-xl" onClick={() => updateAttendance(today, Math.max(0, todayRecord.held - 1), Math.min(todayRecord.attended, Math.max(0, todayRecord.held - 1)), false)}><Minus size={16}/></Button>
                      <span className="text-xl font-bold w-6 text-center text-white">{todayRecord.held}</span>
                      <Button variant="secondary" className="p-2 rounded-xl" onClick={() => updateAttendance(today, todayRecord.held + 1, todayRecord.attended, false)}><Plus size={16}/></Button>
                    </div>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <button
                        key={`held-${num}`}
                        onClick={() => updateAttendance(today, num, Math.min(todayRecord.attended, num), false)}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shrink-0 ${todayRecord.held === num ? 'bg-primary border-primary text-zinc-950' : 'bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-white'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Classes Attended Section */}
                <div className="space-y-3 border-t border-zinc-850 pt-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-bold text-zinc-200 text-sm">Classes Attended</p>
                      <p className="text-[10px] text-zinc-500">How many did you actually go to?</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="secondary" className="p-2 rounded-xl" onClick={() => updateAttendance(today, todayRecord.held, Math.max(0, todayRecord.attended - 1), false)}><Minus size={16}/></Button>
                      <span className="text-xl font-bold w-6 text-center text-primary">{todayRecord.attended}</span>
                      <Button variant="secondary" className="p-2 rounded-xl" onClick={() => updateAttendance(today, todayRecord.held, Math.min(todayRecord.held, todayRecord.attended + 1), false)}><Plus size={16}/></Button>
                    </div>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    {Array.from({ length: todayRecord.held + 1 }, (_, i) => i).map(num => (
                      <button
                        key={`attended-${num}`}
                        onClick={() => updateAttendance(today, todayRecord.held, num, false)}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shrink-0 ${todayRecord.attended === num ? 'bg-primary border-primary text-zinc-950' : 'bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-white'}`}
                      >
                        {num}
                      </button>
                    ))}
                    {todayRecord.held > 0 && (
                      <button
                        onClick={() => updateAttendance(today, todayRecord.held, todayRecord.held, false)}
                        className="px-3.5 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold shrink-0 hover:bg-primary/20"
                      >
                        All
                      </button>
                    )}
                  </div>
                </div>

                {/* Holiday Toggle Button - styled yellow/amber as requested */}
                <div className="space-y-3 pt-4 border-t border-zinc-850">
                  <button 
                    onClick={() => updateAttendance(today, 0, 0, !todayRecord.isHoliday)}
                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-md ${
                      todayRecord.isHoliday 
                        ? 'bg-yellow-500 text-zinc-950 shadow-yellow-500/20 font-black' 
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {todayRecord.isHoliday ? 'Today is a Holiday' : 'Mark Today as Holiday'}
                  </button>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderCalendarTab = () => {
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(viewDate),
      end: endOfMonth(viewDate)
    });

    const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activeRecord = selectedDate ? (records[selectedDate] || { held: 0, attended: 0, isHoliday: false }) : null;

    const changeMonth = (direction: 'prev' | 'next') => {
      setViewDate(prev => direction === 'prev' ? subDays(prev, 30) : addDays(prev, 30));
    };

    return (
      <div className="space-y-6 pb-24">
        <header className="flex justify-between items-center">
          <h2 className="text-xl font-black">Attendance Calendar</h2>
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
            <button onClick={() => changeMonth('prev')} className="p-1.5 hover:text-primary transition-colors"><ChevronLeft size={16}/></button>
            <span className="text-xs font-extrabold px-2 text-zinc-300 uppercase tracking-widest">{format(viewDate, 'MMMM yyyy')}</span>
            <button onClick={() => changeMonth('next')} className="p-1.5 hover:text-primary transition-colors"><ChevronRight size={16}/></button>
          </div>
        </header>

        <Card className="p-4">
          <div className="grid grid-cols-7 gap-1 text-center mb-2 border-b border-zinc-850 pb-2">
            {weekdayLabels.map(label => (
              <span key={label} className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {/* Pad calendar start */}
            {Array.from({ length: getDay(daysInMonth[0]) }).map((_, idx) => (
              <div key={`pad-${idx}`} className="aspect-square opacity-0" />
            ))}
            
            {daysInMonth.map(day => {
              const dateStr = formatDate(day);
              const rec = records[dateStr];
              const isSel = selectedDate === dateStr;
              const isTodayDay = isToday(day);
              const sDate = semester.startDate ? startOfDay(parseISO(semester.startDate)) : null;
              const eDate = semester.endDate ? startOfDay(parseISO(semester.endDate)) : null;
              const activeDay = startOfDay(day);
              const inSemester = sDate && eDate && activeDay >= sDate && activeDay <= eDate;
              const exam = getExamForDate(day);

              let statusClasses = 'border-zinc-800 text-zinc-400 hover:border-zinc-700 bg-zinc-900/30';
              if (rec) {
                if (rec.isHoliday) {
                  statusClasses = 'border-yellow-500/40 bg-yellow-500/5 text-yellow-500';
                } else if (rec.held > 0) {
                  const pct = rec.attended / rec.held;
                  if (pct >= 1) {
                    statusClasses = 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400';
                  } else if (pct > 0) {
                    statusClasses = 'border-primary/40 bg-primary/5 text-primary';
                  } else {
                    statusClasses = 'border-red-500/40 bg-red-500/5 text-red-400';
                  }
                }
              }

              if (!inSemester) {
                statusClasses = 'opacity-25 border-zinc-900 text-zinc-600 pointer-events-none';
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => inSemester && setSelectedDate(dateStr)}
                  className={`aspect-square rounded-lg border text-xs font-bold transition-all relative flex flex-col items-center justify-center ${statusClasses} ${isSel ? 'ring-2 ring-primary border-primary scale-[1.05]' : ''} ${isTodayDay && !isSel ? 'ring-1 ring-zinc-500' : ''}`}
                >
                  <span>{format(day, 'd')}</span>
                  {exam && (
                    <span className="absolute bottom-0.5 w-1 h-1 bg-red-500 rounded-full animate-pulse" title={exam.label} />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {selectedDate && activeRecord && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-white">{format(parseISO(selectedDate), 'EEEE')}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{format(parseISO(selectedDate), 'MMMM dd, yyyy')}</p>
                </div>
                {getExamForDate(parseISO(selectedDate)) && (
                  <span className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Exam Period</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Classes Held</label>
                  <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-1 justify-between">
                    <button onClick={() => updateAttendance(selectedDate, Math.max(0, activeRecord.held - 1), Math.min(activeRecord.attended, Math.max(0, activeRecord.held - 1)), false)} className="p-1 px-2.5 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white"><Minus size={12}/></button>
                    <span className="font-bold text-sm text-white">{activeRecord.held}</span>
                    <button onClick={() => updateAttendance(selectedDate, activeRecord.held + 1, activeRecord.attended, false)} className="p-1 px-2.5 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white"><Plus size={12}/></button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Classes Attended</label>
                  <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-1 justify-between">
                    <button onClick={() => updateAttendance(selectedDate, activeRecord.held, Math.max(0, activeRecord.attended - 1), false)} className="p-1 px-2.5 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white"><Minus size={12}/></button>
                    <span className="font-bold text-sm text-primary">{activeRecord.attended}</span>
                    <button onClick={() => updateAttendance(selectedDate, activeRecord.held, Math.min(activeRecord.held, activeRecord.attended + 1), false)} className="p-1 px-2.5 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white"><Plus size={12}/></button>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => updateAttendance(selectedDate, 0, 0, !activeRecord.isHoliday)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeRecord.isHoliday 
                    ? 'bg-yellow-500 text-zinc-950 font-black' 
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {activeRecord.isHoliday ? 'Holiday Marked' : 'Mark as Holiday'}
              </button>
            </Card>
          </motion.div>
        )}
      </div>
    );
  };

  const renderStatsTab = () => {
    return (
      <div className="space-y-6 pb-24">
        <header>
          <h2 className="text-xl font-black">Monthly Trends</h2>
          <p className="text-zinc-500 text-xs">Analyze logs on a month-by-month basis.</p>
        </header>

        <div className="space-y-4">
          {semesterMonthlyStats.length === 0 ? (
            <p className="text-center py-8 text-zinc-600 text-xs font-bold uppercase tracking-wider">No monthly records found yet</p>
          ) : (
            semesterMonthlyStats.map(s => (
              <Card key={s.month} className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-zinc-200">{s.month}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{s.attended} / {s.held} classes</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className={`text-lg font-black ${s.percentage < semester.targetAttendance ? 'text-red-500' : 'text-primary'}`}>{s.percentage.toFixed(1)}%</span>
                  {s.isCurrent && (
                    <span className="bg-primary/20 text-primary text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Current</span>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Combined Month Cumulative Analyzer */}
        {semesterMonthlyStats.length > 0 && (
          <Card className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-200">Combined Months Analyzer</h3>
              <p className="text-zinc-500 text-xs">Select multiple months to analyze your cumulative margin.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {semesterMonthlyStats.map(s => {
                const selected = combiSelectedMonths.includes(s.month);
                return (
                  <button
                    key={`combi-${s.month}`}
                    onClick={() => toggleCombiMonth(s.month)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      selected 
                        ? 'bg-primary border-primary text-zinc-950' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    {s.month}
                  </button>
                );
              })}
            </div>

            {combiStats ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Combined Percentage</p>
                    <h4 className="text-3xl font-black text-white">{combiStats.percentage.toFixed(1)}%</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-300">{combiStats.totalAttended} / {combiStats.totalHeld}</p>
                    <p className="text-zinc-600 text-[8px] uppercase tracking-widest">classes total</p>
                  </div>
                </div>

                {combiStats.percentage < semester.targetAttendance ? (
                  <div className="flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-xs font-semibold">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>Must attend next <b>{combiStats.mustAttend}</b> classes to reach {semester.targetAttendance}% in these months.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-primary bg-primary/10 border border-primary/20 p-2.5 rounded-lg text-xs font-semibold">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>Attendance target met safely inside selected months!</span>
                  </div>
                )}
              </motion.div>
            ) : (
              <p className="text-center text-[10px] text-zinc-600 uppercase font-bold tracking-widest pt-2">Select months above to calculate cumulative statistics</p>
            )}
          </Card>
        )}
      </div>
    );
  };

  const renderExamsTab = () => {
    return (
      <div className="space-y-6 pb-24">
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black">Exam Schedule</h2>
            <p className="text-zinc-500 text-xs">Exams dates are automatically locked to avoid safety penalties.</p>
          </div>
          <Button onClick={() => setShowExamModal(true)} className="p-2 py-2 px-3 text-xs text-zinc-950">Add Exam</Button>
        </header>

        <div className="space-y-4">
          {exams.length === 0 ? (
            <Card className="text-center py-12 space-y-3">
              <div className="w-12 h-12 bg-zinc-950 rounded-full mx-auto border border-zinc-850 flex items-center justify-center text-zinc-600">
                <BookOpen size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-zinc-300 text-sm">No Exams Scheduled</h3>
                <p className="text-zinc-600 text-xs max-w-[200px] mx-auto">Add mid-semesters or end-semesters to calculate margins properly.</p>
              </div>
            </Card>
          ) : (
            exams.map(e => (
              <Card key={e.id} className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-500/10 border border-red-500/30 text-red-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">{e.type}</span>
                    <h4 className="font-bold text-sm text-zinc-200">{e.label}</h4>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{format(parseISO(e.startDate), 'MMM dd')} - {format(parseISO(e.endDate), 'MMM dd, yyyy')}</p>
                </div>
                <button onClick={() => handleDeleteExam(e.id)} className="text-red-500 hover:text-red-400 p-2 transition-colors"><Trash2 size={16} /></button>
              </Card>
            ))
          )}
        </div>

        {/* Add Exam Dialog */}
        {showExamModal && (
          <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <Card className="max-w-sm w-full space-y-4 border border-zinc-800">
              <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-300">New Exam Schedule</h3>
                <button onClick={() => setShowExamModal(false)} className="text-zinc-500 hover:text-zinc-300"><XCircle size={18} /></button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Exam Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setExamType('Mid-sem')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${examType === 'Mid-sem' ? 'bg-primary border-primary text-zinc-950' : 'bg-zinc-950 border-zinc-850 text-zinc-500'}`}
                    >
                      Mid-Semester
                    </button>
                    <button 
                      onClick={() => setExamType('End-sem')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${examType === 'End-sem' ? 'bg-primary border-primary text-zinc-950' : 'bg-zinc-950 border-zinc-850 text-zinc-500'}`}
                    >
                      End-Semester
                    </button>
                  </div>
                </div>

                <Input label="Subject / Exam Title" value={examLabel} onChange={setExamLabel} placeholder="e.g. Chemistry Lab, Mathematics" />
                <Input type="date" label="Start Date" value={examStart} onChange={setExamStart} />
                <Input type="date" label="End Date" value={examEnd} onChange={setExamEnd} />
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button variant="secondary" onClick={() => setShowExamModal(false)} className="flex-1 py-3 text-xs">Cancel</Button>
                <Button onClick={handleSaveExam} className="flex-1 py-3 text-xs text-zinc-950" disabled={!examLabel || !examStart || !examEnd}>Schedule</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  };

  const renderProfileTab = () => {
    return (
      <div className="space-y-6 pb-24">
        {/* Profile Avatar and Information */}
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="relative group">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-4xl font-extrabold text-zinc-950 shadow-xl shadow-primary/20 overflow-hidden border-4 border-zinc-900">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                profile.name.charAt(0)
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-primary text-zinc-950 p-2 rounded-full cursor-pointer shadow-lg active:scale-90 transition-all">
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
          <div>
            <h2 className="text-xl font-bold text-white">{profile.name}</h2>
            <p className="text-xs text-zinc-500 font-medium">{profile.email}</p>
          </div>
        </div>

        {/* Edit details form */}
        <div className="space-y-4">
          <h3 className="text-zinc-500 uppercase text-xs font-bold tracking-widest">Academic Info</h3>
          <Card className="space-y-4">
            <Input label="Student Name" value={profile.name} onChange={(v: string) => setProfile({...profile, name: v})} />
            <Input label="College / University" value={profile.college} onChange={(v: string) => setProfile({...profile, college: v})} />
            <Input label="Department / Course" value={profile.department} onChange={(v: string) => setProfile({...profile, department: v})} />
            <Input label="Semester / Title" value={semester.title} onChange={(v: string) => setSemester({...semester, title: v})} />
          </Card>
        </div>

        {/* Update Semester Dates */}
        <div className="space-y-4">
          <h3 className="text-zinc-500 uppercase text-xs font-bold tracking-widest">Semester Limits</h3>
          <Card className="space-y-4">
            <Input type="date" label="Start Date" value={semester.startDate} onChange={(v: string) => setSemester({...semester, startDate: v})} />
            <Input type="date" label="End Date" value={semester.endDate} onChange={(v: string) => setSemester({...semester, endDate: v})} />
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-400 uppercase tracking-widest">Target Attendance Limit</span>
                <span className="text-primary font-black">{semester.targetAttendance}%</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="100" 
                value={semester.targetAttendance}
                onChange={(e) => setSemester({ ...semester, targetAttendance: parseInt(e.target.value) })}
                className="w-full accent-primary h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </Card>
        </div>

        {/* Preset Colors Picker */}
        <div className="space-y-4">
          <h3 className="text-zinc-500 uppercase text-xs font-bold tracking-widest">Visual Aesthetics</h3>
          <Card className="space-y-3">
            <p className="text-xs text-zinc-400">Select app accent theme color:</p>
            <div className="flex gap-3.5">
              {[
                { name: 'Emerald', value: '#10b981' },
                { name: 'Blue', value: '#3b82f6' },
                { name: 'Violet', value: '#8b5cf6' },
                { name: 'Amber', value: '#f59e0b' },
                { name: 'Rose', value: '#f43f5e' }
              ].map(color => (
                <button
                  key={color.name}
                  onClick={() => setThemeColor(color.value)}
                  className="w-8 h-8 rounded-full border-2 transition-all relative"
                  style={{ 
                    backgroundColor: color.value,
                    borderColor: themeColor === color.value ? 'white' : 'transparent'
                  }}
                  title={color.name}
                >
                  {themeColor === color.value && (
                    <span className="absolute inset-0 m-auto w-2 h-2 bg-zinc-950 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* History Area */}
        <div className="space-y-4">
          <h3 className="text-zinc-500 uppercase text-xs font-bold tracking-widest">Semester History</h3>
          {history.length === 0 ? (
            <p className="text-center text-zinc-600 text-xs font-bold uppercase tracking-widest py-4">No past records saved yet</p>
          ) : (
            <div className="space-y-3">
              {history.map(h => (
                <Card key={h.id} className="flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-200">{h.title || 'Past Semester'}</h4>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold mt-0.5">
                      {format(parseISO(h.startDate), 'MMM dd, yyyy')} - {format(parseISO(h.endDate), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1.5 font-medium">{h.totalAttended} / {h.totalHeld} classes</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <p className="text-xl font-black text-primary">{h.finalPercentage.toFixed(1)}%</p>
                    <button onClick={() => setHistory(prev => prev.filter(x => x.id !== h.id))} className="text-zinc-500 hover:text-red-500 transition-colors p-1"><Trash2 size={14}/></button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Reset & Sign Out Options */}
        <div className="space-y-3 pt-6 border-t border-zinc-850">
          <Button variant="secondary" className="w-full flex items-center justify-center gap-2" onClick={handleSignOut}>
            <LogOut size={16} /> Sign Out Account
          </Button>

          <Button variant="danger" className="w-full flex items-center justify-center gap-2" onClick={() => {
            const h: SemesterHistory = {
              id: Date.now().toString(),
              title: semester.title,
              startDate: semester.startDate!,
              endDate: semester.endDate!,
              finalPercentage: stats.percentage,
              totalHeld: stats.totalHeld,
              totalAttended: stats.totalAttended
            };
            setHistory([h, ...history]);
            setSemester({ title: '', startDate: '', endDate: '', targetAttendance: 75, isInitialized: false });
            setRecords({});
            setAppState('SEMESTER_SETUP');
          }}>
            <Trash2 size={16} /> Save and Complete Current Semester
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 flex flex-col justify-between selection:bg-primary selection:text-zinc-950">
      <div className="flex-1 max-w-md w-full mx-auto p-5 overflow-y-auto">
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'calendar' && renderCalendarTab()}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'exams' && renderExamsTab()}
        {activeTab === 'profile' && renderProfileTab()}
      </div>

      {/* Persistent Bottom Navigation Header */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-800/80 px-6 py-3.5 flex justify-between items-center z-40">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
          { id: 'calendar', icon: CalendarIcon, label: 'Calendar' },
          { id: 'stats', icon: BarChart3, label: 'Stats' },
          { id: 'exams', icon: BookOpen, label: 'Exams' },
          { id: 'profile', icon: User, label: 'Profile' }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Icon size={20} className={active ? 'scale-110 transition-transform duration-150' : ''} />
              <span className="text-[9px] uppercase tracking-widest font-extrabold">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
