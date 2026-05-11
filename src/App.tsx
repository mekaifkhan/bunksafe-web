/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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

// --- Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string, key?: string | number }) => (
  <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-4 ${className}`}>
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
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20',
    ghost: 'bg-transparent text-zinc-400 hover:text-zinc-100'
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder = "" }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</label>}
    <input 
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-primary transition-colors"
    />
  </div>
);

// --- Main App ---

export default function App() {
  // Persistence
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

  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const [appState, setAppState] = useState<AppState>(() => {
    if (!profile.name) return 'WELCOME';
    if (!profile.email) return 'EMAIL_COLLECTION';
    if (!semester.isInitialized) return 'SEMESTER_SETUP';
    if (semester.endDate) {
      const end = startOfDay(parseISO(semester.endDate));
      const today = startOfDay(new Date());
      if (isAfter(today, end)) return 'SEMESTER_END_REPORT';
    }
    return 'MAIN';
  });

  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLatePopup, setShowLatePopup] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [onlineCount, setOnlineCount] = useState(450);
  const [extraHolidayInput, setExtraHolidayInput] = useState('');
  const [gapDays, setGapDays] = useState<string[]>([]);
  const [currentGapIndex, setCurrentGapIndex] = useState(0);

  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('bs_theme_color') || '#10b981';
  });
  const [reportEmail, setReportEmail] = useState(profile.email || '');
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportStatus, setReportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', themeColor);
    // Simple darken for hover
    const hex = themeColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const darken = (c: number) => Math.max(0, Math.floor(c * 0.85)).toString(16).padStart(2, '0');
    const hoverColor = `#${darken(r)}${darken(g)}${darken(b)}`;
    document.documentElement.style.setProperty('--primary-hover', hoverColor);
    localStorage.setItem('bs_theme_color', themeColor);
  }, [themeColor]);

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayStr());
  const [combiSelectedMonths, setCombiSelectedMonths] = useState<string[]>([]);

  // Calculations
  const stats = useMemo(() => calculateAttendance(records, semester.initialHeld, semester.initialAttended, semester.startDate, exams), [records, semester, exams]);
  const bunkInfo = useMemo(() => calculateBunkInfo(stats.totalHeld, stats.totalAttended, semester.targetAttendance), [stats, semester]);

  // Auto-end semester check
  useEffect(() => {
    if (semester.isInitialized && semester.endDate && appState === 'MAIN') {
      const end = startOfDay(parseISO(semester.endDate));
      const today = startOfDay(new Date());
      if (isAfter(today, end)) {
        setAppState('SEMESTER_END_REPORT');
      }
    }
  }, [semester, appState]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const monthName = format(new Date(), 'MMMM yyyy');
    
    // Helper to convert hex to RGB
    const hexToRgb = (hex: string) => {
      let h = hex.replace('#', '');
      if (h.length === 3) {
        h = h.split('').map(char => char + char).join('');
      }
      const r = parseInt(h.substring(0, 2), 16) || 0;
      const g = parseInt(h.substring(2, 4), 16) || 0;
      const b = parseInt(h.substring(4, 6), 16) || 0;
      return { r, g, b };
    };
    const rgb = hexToRgb(themeColor);
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text('BunkSafe Attendance Report', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated for: ${profile.name}`, 14, 32);
    doc.text(`Month: ${monthName}`, 14, 38);
    doc.text(`College: ${profile.college}`, 14, 44);
    
    // Stats Summary
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Monthly Summary', 14, 58);
    
    autoTable(doc, {
      startY: 62,
      head: [['Metric', 'Value']],
      body: [
        ['Total Classes Held', monthlyStats.held.toString()],
        ['Total Classes Attended', monthlyStats.attended.toString()],
        ['Attendance Percentage', `${monthlyStats.percentage.toFixed(1)}%`],
        ['Status', monthlyStats.percentage >= semester.targetAttendance ? 'SAFE' : 'LOW ATTENDANCE']
      ],
      theme: 'striped',
      headStyles: { fillColor: [rgb.r, rgb.g, rgb.b] }
    });

    // Daily Breakdown
    const currentMonthDays = eachDayOfInterval({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    });

    const tableData = currentMonthDays.map(day => {
      const dateStr = formatDate(day);
      const record = records[dateStr];
      return [
        format(day, 'MMM dd (EEE)'),
        record ? (record.isHoliday ? 'Holiday' : record.held) : '-',
        record ? (record.isHoliday ? '-' : record.attended) : '-',
        record ? (record.isHoliday ? '-' : (record.held > 0 ? `${((record.attended / record.held) * 100).toFixed(0)}%` : '-')) : '-'
      ];
    });

    doc.setFontSize(16);
    doc.text('Daily Breakdown', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Date', 'Held', 'Attended', 'Percentage']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [rgb.r, rgb.g, rgb.b] }
    });

    return { doc, monthName };
  };

  const handleDownloadReport = () => {
    try {
      const { doc, monthName } = generatePDF();
      doc.save(`Attendance_Report_${monthName.replace(/\s+/g, '_')}.pdf`);
      setReportStatus({ type: 'success', message: 'Report downloaded successfully!' });
    } catch (error) {
      console.error('Error downloading report:', error);
      setReportStatus({ type: 'error', message: 'Failed to download report.' });
    }
  };

  const renderSemesterEndReport = () => {
    return (
      <div className="space-y-6 flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-2"
        >
          <CheckCircle2 size={40} />
        </motion.div>
        
        <h1 className="text-3xl font-black tracking-tight">Semester Completed!</h1>
        <p className="text-zinc-500 max-w-xs">Your semester has officially ended according to your scheduled dates. Here is your final summary.</p>
        
        <Card className="w-full space-y-4 py-8">
          <div className="flex flex-col items-center">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1">Final Attendance Score</p>
            <h2 className="text-6xl font-black text-primary">{stats.percentage.toFixed(1)}%</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Classes</p>
              <p className="text-xl font-bold">{stats.totalHeld}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Attended</p>
              <p className="text-xl font-bold">{stats.totalAttended}</p>
            </div>
          </div>
        </Card>

        <div className="w-full space-y-3">
          <Button 
            className="w-full py-4 text-lg" 
            onClick={() => {
              const h: SemesterHistory = {
                id: Date.now().toString(),
                startDate: semester.startDate,
                endDate: semester.endDate,
                finalPercentage: stats.percentage,
                totalHeld: stats.totalHeld,
                totalAttended: stats.totalAttended
              };
              setHistory([h, ...history]);
              setSemester({ startDate: '', endDate: '', targetAttendance: 75, isInitialized: false });
              setRecords({});
              setExams([]); // Clear exams for new semester
              setAppState('SEMESTER_SETUP');
            }}
          >
            Start New Semester
          </Button>
          <Button 
            variant="secondary" 
            className="w-full py-2 flex items-center justify-center gap-2"
            onClick={handleDownloadReport}
          >
            <Download size={16} /> Download Final Report
          </Button>
        </div>
      </div>
    );
  };

  const semesterMonthlyStats = useMemo(() => {
    if (!semester.startDate) return [];
    
    const start = startOfDay(parseISO(semester.startDate));
    if (isNaN(start.getTime())) return [];
    
    const end = endOfMonth(new Date());
    
    if (isAfter(start, end)) return [];
    
    const months = eachMonthOfInterval({ start, end });
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    
    // Total initial data
    const lockedUntil = semester.lockedUntil ? parseISO(semester.lockedUntil) : null;
    const initialPeriodDays = (lockedUntil && start <= lockedUntil) ? differenceInDays(lockedUntil, start) + 1 : 0;
    
    return months.map(month => {
      const mStart = startOfMonth(month);
      const mEnd = endOfMonth(month);
      const isCompleted = isBefore(mEnd, now);
      const isCurrent = isSameMonth(month, now);
      
      // Actual records for this month
      const monthRecords = Object.entries(records).filter(([date]) => {
        const d = parseISO(date);
        const sDate = startOfDay(parseISO(semester.startDate));
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
      
      // If there's initial data and this month is before or during the locked period
      // REMOVED: Initial data is now handled separately to avoid confusion with calendar
      
      return {
        month: format(month, 'MMM'),
        percentage: held > 0 ? (attended / held) * 100 : 0,
        held,
        attended,
        isCompleted,
        isCurrent
      };
    });
  }, [records, semester]);

  const combiStats = useMemo(() => {
    const selectedData = semesterMonthlyStats.filter(s => combiSelectedMonths.includes(s.month));
    if (selectedData.length === 0) return null;

    const totalHeld = selectedData.reduce((acc, curr) => acc + curr.held, 0);
    const totalAttended = selectedData.reduce((acc, curr) => acc + curr.attended, 0);
    const percentage = totalHeld > 0 ? (totalAttended / totalHeld) * 100 : 0;
    
    // Calculate needed for target
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

  // Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    percentage: 75,
    untilDate: getTodayStr(),
    schedule: [0, 0, 0, 0, 0, 0, 0], // Sun-Sat
    holidays: [] as number[], // 0-6
    extraHolidays: [] as string[], // specific dates
  });

  // Effects for saving
  useEffect(() => localStorage.setItem('bs_profile', JSON.stringify(profile)), [profile]);
  useEffect(() => localStorage.setItem('bs_semester', JSON.stringify(semester)), [semester]);
  useEffect(() => localStorage.setItem('bs_records', JSON.stringify(records)), [records]);
  useEffect(() => localStorage.setItem('bs_history', JSON.stringify(history)), [history]);
  useEffect(() => localStorage.setItem('bs_exams', JSON.stringify(exams)), [exams]);

  // Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

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
    
    // Start from the day after lockedUntil, or from startDate
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

  // Notification Logic
  useEffect(() => {
    if (typeof Notification === 'undefined' || notificationPermission !== 'granted') return;

    const checkNotifications = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const todayStr = getTodayStr();
      
      const lastNotified = localStorage.getItem('bs_last_notified') || '{}';
      const notifiedData = JSON.parse(lastNotified);

      // 8:00 AM Reminder (if below 75%)
      if (hours === 8 && minutes === 0 && notifiedData.morning !== todayStr) {
        if (stats.percentage < 75) {
          new Notification("BunkSafe Reminder", {
            body: `Your attendance is ${stats.percentage.toFixed(1)}%. Time to attend classes!`,
          });
          notifiedData.morning = todayStr;
          localStorage.setItem('bs_last_notified', JSON.stringify(notifiedData));
        }
      }

      // 6:00 PM Update Reminder
      if (hours === 18 && minutes === 0 && notifiedData.evening !== todayStr) {
        const todayRecord = records[todayStr];
        const isFilled = todayRecord && (todayRecord.held > 0 || todayRecord.isHoliday);
        if (!isFilled) {
          new Notification("BunkSafe Update", {
            body: "Don't forget to update your attendance for today!",
          });
          notifiedData.evening = todayStr;
          localStorage.setItem('bs_last_notified', JSON.stringify(notifiedData));
        }
      }
    };

    const interval = setInterval(checkNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [stats.percentage, records, notificationPermission]);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  // Live User Count Logic
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
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  const handleFillMissed = () => {
    if (missedDays.length > 0) {
      setGapDays(missedDays);
      setCurrentGapIndex(0);
      setAppState('GAP_HANDLING');
    }
  };

  // --- Handlers ---

  const notifySetup = async (p: Profile) => {
    try {
      await fetch('/api/notify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
    } catch (e) {
      console.error("Failed to notify setup", e);
    }
  };

  const handleWelcomeSubmit = () => {
    if (profile.name && profile.college) {
      setAppState('EMAIL_COLLECTION');
    }
  };

  const handleEmailSubmit = () => {
    if (profile.email && profile.email.includes('@')) {
      if (semester.isInitialized) {
        notifySetup(profile);
        setAppState('MAIN');
      } else {
        setAppState('SEMESTER_SETUP');
      }
    }
  };

  const handleSemesterSubmit = () => {
    if (semester.startDate && semester.endDate) {
      const start = startOfDay(parseISO(semester.startDate));
      const today = startOfDay(new Date());

      notifySetup(profile);

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
    // Estimate classes held
    const start = parseISO(semester.startDate);
    const until = parseISO(wizardData.untilDate);
    const days = eachDayOfInterval({ start, end: until });
    
    let estimatedHeld = 0;
    days.forEach(day => {
      const dateStr = formatDate(day);
      const dayOfWeek = getDay(day);
      // Check if it's a fixed holiday OR an extra holiday
      if (!wizardData.holidays.includes(dayOfWeek) && !wizardData.extraHolidays.includes(dateStr)) {
        estimatedHeld += wizardData.schedule[dayOfWeek];
      }
    });

    const estimatedAttended = Math.round((wizardData.percentage / 100) * estimatedHeld);
    
    // Check for gaps
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

  // --- Screens ---

  if (isSplashVisible) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.2 }}
          className="space-y-4"
        >
          <div className="w-24 h-24 bg-primary rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl shadow-primary/20">
            <CalendarIcon size={48} />
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter text-white">BunkSafe</h1>
            <p className="text-zinc-500 font-medium tracking-widest uppercase text-xs">By Kaif Khan</p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "120px" }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="h-1 bg-primary rounded-full mt-12 opacity-50"
        />
      </div>
    );
  }

  if (appState === 'EMAIL_COLLECTION') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col justify-center gap-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">One Last Thing</h2>
          <p className="text-zinc-500">Please provide your email to complete the setup.</p>
        </div>
        <div className="space-y-6">
          <Input 
            type="email" 
            label="Email Address" 
            value={profile.email} 
            onChange={(v: string) => setProfile({ ...profile, email: v })} 
            placeholder="e.g. kaif@example.com" 
          />
          <Button onClick={handleEmailSubmit} className="w-full py-4 text-lg">Complete Setup</Button>
        </div>
      </div>
    );
  }
  if (appState === 'WELCOME') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col justify-center gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">BunkSafe</h1>
          <p className="text-zinc-500">by Kaif Khan</p>
        </div>
        <div className="space-y-6">
          <Input label="Your Name" value={profile.name} onChange={(v: string) => setProfile({ ...profile, name: v })} placeholder="e.g. Kaif Khan" />
          <Input label="College Name" value={profile.college} onChange={(v: string) => setProfile({ ...profile, college: v })} placeholder="e.g. IIT Delhi" />
          <Button onClick={handleWelcomeSubmit} className="w-full py-4 text-lg">Get Started</Button>
        </div>
      </div>
    );
  }

  if (appState === 'SEMESTER_SETUP') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col justify-center gap-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Semester Setup</h2>
          <p className="text-zinc-500">Give your semester a name and set the dates.</p>
        </div>
        <div className="space-y-6">
          <Input label="Semester Title / Number" value={semester.title} onChange={(v: string) => setSemester({ ...semester, title: v })} placeholder="e.g. Semester 3" />
          <Input type="date" label="Start Date" value={semester.startDate} onChange={(v: string) => setSemester({ ...semester, startDate: v })} />
          <Input type="date" label="End Date" value={semester.endDate} onChange={(v: string) => setSemester({ ...semester, endDate: v })} />
          <Button onClick={handleSemesterSubmit} className="w-full py-4 text-lg">Continue</Button>
        </div>
      </div>
    );
  }

  if (appState === 'LATE_DETECTION') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col justify-center gap-6">
        <div className="bg-primary/10 border border-primary/20 p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <Info size={24} />
            <h3 className="text-xl font-bold">Late Start Detected</h3>
          </div>
          <p className="text-zinc-400">
            Your semester started on {format(parseISO(semester.startDate), 'PPP')}. 
            You are tracking late by {differenceInDays(new Date(), parseISO(semester.startDate))} days.
          </p>
        </div>
        
        <div className="space-y-3">
          <Button variant="secondary" className="w-full py-4 text-left flex flex-col gap-1" onClick={() => setAppState('WIZARD')}>
            <span className="font-bold">Help me calculate past attendance</span>
            <span className="text-xs text-zinc-500">Step-by-step wizard to estimate records</span>
          </Button>
          
          <Button variant="secondary" className="w-full py-4 text-left flex flex-col gap-1" onClick={() => {
            const held = prompt("Total classes held so far?");
            const attended = prompt("Total classes attended?");
            if (held && attended) handleManualPastAttendance(parseInt(held), parseInt(attended));
          }}>
            <span className="font-bold">I know my past attendance</span>
            <span className="text-xs text-zinc-500">Enter total held and attended classes manually</span>
          </Button>

          <Button 
            className="w-full py-4 bg-primary text-white font-bold hover:bg-primary-hover transition-all active:scale-95 rounded-xl" 
            onClick={() => setAppState('TODAY_CONFIRMATION')}
          >
            Start tracking from today
          </Button>
        </div>
      </div>
    );
  }

  if (appState === 'TODAY_CONFIRMATION') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col justify-center gap-8">
        <div className="space-y-4 text-center">
          <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full mx-auto flex items-center justify-center text-primary">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Important Note</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Your past attendance and classes will not be counted and this may not include cumulative semester attendance.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            variant="secondary" 
            className="w-full py-4 flex flex-col gap-1 items-center" 
            onClick={() => setWizardStep(1) || setAppState('WIZARD')}
          >
            <span className="font-bold">Help me calculate</span>
            <span className="text-xs text-zinc-500">Estimate records using percentage</span>
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

  if (appState === 'WIZARD') {
    const handleWizardBack = () => {
      if (wizardStep > 1) {
        setWizardStep(prev => prev - 1);
      } else {
        setAppState('LATE_DETECTION');
      }
    };

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col gap-8">
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
              <p className="text-zinc-400">What is your current attendance percentage?</p>
              <div className="flex items-center gap-4">
                <input 
                  type="range" min="0" max="100" value={wizardData.percentage} 
                  onChange={(e) => setWizardData({...wizardData, percentage: parseInt(e.target.value)})}
                  className="flex-1 accent-primary"
                />
                <span className="text-2xl font-bold w-16 text-right">{wizardData.percentage}%</span>
              </div>
              <Button onClick={() => setWizardStep(2)} className="w-full py-4">Next</Button>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-6">
              <p className="text-zinc-400">Until what date do you know this percentage?</p>
              <Input type="date" value={wizardData.untilDate} onChange={(v: string) => setWizardData({...wizardData, untilDate: v})} />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setWizardStep(1)} className="flex-1 py-4">Previous</Button>
                <Button onClick={() => setWizardStep(3)} className="flex-2 py-4">Next</Button>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-6">
              <p className="text-zinc-400">Weekly Class Schedule (Classes per day)</p>
              <div className="space-y-3">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                  <div key={day} className="flex items-center justify-between bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                    <span className="font-medium">{day}</span>
                    <div className="flex items-center gap-4">
                      <Button variant="secondary" className="p-1" onClick={() => {
                        const s = [...wizardData.schedule];
                        s[i] = Math.max(0, s[i] - 1);
                        setWizardData({...wizardData, schedule: s});
                      }}><Minus size={16}/></Button>
                      <span className="w-4 text-center">{wizardData.schedule[i]}</span>
                      <Button variant="secondary" className="p-1" onClick={() => {
                        const s = [...wizardData.schedule];
                        s[i] = s[i] + 1;
                        setWizardData({...wizardData, schedule: s});
                      }}><Plus size={16}/></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setWizardStep(2)} className="flex-1 py-4">Previous</Button>
                <Button onClick={() => setWizardStep(4)} className="flex-2 py-4">Next</Button>
              </div>
            </div>
          )}

          {wizardStep === 4 && (
            <div className="space-y-6">
              <p className="text-zinc-400">Fixed Holidays (Select days with no classes)</p>
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
                    className={`p-4 rounded-2xl border transition-all ${wizardData.holidays.includes(i) ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setWizardStep(3)} className="flex-1 py-4">Previous</Button>
                <Button onClick={() => setWizardStep(5)} className="flex-2 py-4">Next</Button>
              </div>
            </div>
          )}

          {wizardStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-zinc-400">Other Holidays / Bunks in between</p>
                <p className="text-xs text-zinc-500">Add specific dates where you had no classes or bunked.</p>
              </div>
              
              <div className="flex gap-2">
                <input 
                  type="date" 
                  value={extraHolidayInput}
                  onChange={(e) => setExtraHolidayInput(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-zinc-100 outline-none focus:border-primary transition-all"
                />
                <Button onClick={() => {
                  if (extraHolidayInput && !wizardData.extraHolidays.includes(extraHolidayInput)) {
                    setWizardData({...wizardData, extraHolidays: [...wizardData.extraHolidays, extraHolidayInput]});
                    setExtraHolidayInput('');
                  }
                }} className="px-4"><Plus size={20}/></Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {wizardData.extraHolidays.length === 0 ? (
                  <p className="text-center py-4 text-zinc-600 text-sm">No extra holidays added.</p>
                ) : (
                  wizardData.extraHolidays.sort().map(date => (
                    <div key={date} className="flex items-center justify-between bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                      <span className="text-sm">{format(parseISO(date), 'PPP')}</span>
                      <button onClick={() => setWizardData({...wizardData, extraHolidays: wizardData.extraHolidays.filter(d => d !== date)})} className="text-red-500 p-1">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setWizardStep(4)} className="flex-1 py-4">Previous</Button>
                <Button onClick={handleWizardComplete} className="flex-2 py-4">Finish Calculation</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (appState === 'GAP_HANDLING') {
    const date = gapDays[currentGapIndex];
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col gap-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Fill Gap Attendance</h2>
          <p className="text-zinc-500">Entry {currentGapIndex + 1} of {gapDays.length}</p>
        </div>

        <Card className="flex-1 flex flex-col justify-center gap-12">
          <div className="text-center space-y-2">
            <h3 className="text-3xl font-bold">{format(parseISO(date), 'EEEE')}</h3>
            <p className="text-zinc-500 text-xl">{format(parseISO(date), 'PPP')}</p>
          </div>

          <div className="space-y-8">
             <div className="space-y-4">
                <p className="text-center text-zinc-500 uppercase tracking-widest text-xs font-bold">Total Available Attendance</p>
                <p className="text-center text-[10px] text-zinc-600 -mt-2">Theory: 1 | Labs: 2, 3, or 4 units</p>
                <div className="flex items-center justify-center gap-8">
                  <Button variant="secondary" className="p-4 rounded-full" onClick={() => {
                    const r = records[date] || { held: 0, attended: 0 };
                    updateAttendance(date, Math.max(0, r.held - 1), Math.min(r.attended, Math.max(0, r.held - 1)), false);
                  }}><Minus /></Button>
                  <span className="text-5xl font-bold w-12 text-center">{records[date]?.held || 0}</span>
                  <Button variant="secondary" className="p-4 rounded-full" onClick={() => {
                    const r = records[date] || { held: 0, attended: 0 };
                    updateAttendance(date, r.held + 1, r.attended, false);
                  }}><Plus /></Button>
                </div>
                <div className="flex gap-2 justify-center overflow-x-auto pb-1 scrollbar-hide">
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <button
                      key={`gap-held-${num}`}
                      onClick={() => updateAttendance(date, num, Math.min(records[date]?.attended || 0, num), false)}
                      className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all shrink-0 ${records[date]?.held === num ? 'bg-primary border-primary text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
             </div>

             <div className="space-y-4">
                <p className="text-center text-zinc-500 uppercase tracking-widest text-xs font-bold">Attended</p>
                <div className="flex items-center justify-center gap-8">
                  <Button variant="secondary" className="p-4 rounded-full" onClick={() => {
                    const r = records[date] || { held: 0, attended: 0 };
                    updateAttendance(date, r.held, Math.max(0, r.attended - 1), false);
                  }}><Minus /></Button>
                  <span className="text-5xl font-bold w-12 text-center text-primary">{records[date]?.attended || 0}</span>
                  <Button variant="secondary" className="p-4 rounded-full" onClick={() => {
                    const r = records[date] || { held: 0, attended: 0 };
                    updateAttendance(date, r.held, Math.min(r.held, r.attended + 1), false);
                  }}><Plus /></Button>
                </div>
                <div className="flex gap-2 justify-center overflow-x-auto pb-1 scrollbar-hide">
                  {Array.from({ length: (records[date]?.held || 0) + 1 }, (_, i) => i).map(num => (
                    <button
                      key={`gap-attended-${num}`}
                      onClick={() => updateAttendance(date, records[date]?.held || 0, num, false)}
                      className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all shrink-0 ${records[date]?.attended === num ? 'bg-primary border-primary text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <button 
              onClick={() => {
                const date = gapDays[currentGapIndex];
                updateAttendance(date, 0, 0, true);
                saveGapAttendance(0, 0);
              }}
              className="w-full py-3 rounded-lg font-bold transition-all active:scale-95 flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 text-primary hover:bg-primary-hover"
            >
              Mark as Holiday
            </button>
            <Button onClick={() => saveGapAttendance(records[date]?.held || 0, records[date]?.attended || 0)} className="w-full py-4 text-lg">
              Save & Next
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (appState === 'SEMESTER_END_REPORT') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4">
        {renderSemesterEndReport()}
      </div>
    );
  }

  // --- Main Dashboard ---


  const handleEmailReport = async () => {
    if (!reportEmail) {
      setReportStatus({ type: 'error', message: 'Please enter an email address.' });
      return;
    }

    setIsSendingReport(true);
    setReportStatus(null);

    try {
      const { doc, monthName } = generatePDF();
      
      // Convert to Base64
      const pdfBase64 = doc.output('datauristring');

      // Send to Server
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: reportEmail,
          pdfBase64,
          monthName,
          userName: profile.name
        })
      });

      let result;
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.indexOf("application/json") !== -1) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error("Server returned non-JSON response:", text);
        throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
      }

      if (response.ok && result.success) {
        setReportStatus({ type: 'success', message: 'Report sent successfully to your mail!' });
      } else {
        setReportStatus({ type: 'error', message: result.error || result.message || 'Failed to send report.' });
      }
    } catch (error) {
      console.error('Error generating/sending report:', error);
      setReportStatus({ type: 'error', message: error instanceof Error ? error.message : 'An unexpected error occurred.' });
    } finally {
      setIsSendingReport(false);
    }
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

  const handleSaveExam = (examData: Omit<Exam, 'id'>) => {
    if (editingExam) {
      setExams(prev => prev.map(e => e.id === editingExam.id ? { ...examData, id: e.id } : e));
    } else {
      setExams(prev => [...prev, { ...examData, id: Date.now().toString() }]);
    }
    setShowExamModal(false);
    setEditingExam(null);
  };

  const handleDeleteExam = (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
  };


  const ExamModal = () => {
    const [type, setType] = useState<'Mid-sem' | 'End-sem'>(editingExam?.type || 'Mid-sem');
    const [midSemNum, setMidSemNum] = useState(() => {
      if (!editingExam) return '1';
      if (editingExam.type === 'End-sem') return '1';
      const lastPart = editingExam.label.split(' ').pop();
      if (['1', '2', '3'].includes(lastPart || '')) return lastPart || '1';
      return 'Other';
    });
    const [customLabel, setCustomLabel] = useState(editingExam?.label || '');
    const [startDate, setStartDate] = useState(editingExam?.startDate || getTodayStr());
    const [endDate, setEndDate] = useState(editingExam?.endDate || getTodayStr());

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const label = type === 'Mid-sem' ? (midSemNum === 'Other' ? customLabel : `Mid-sem ${midSemNum}`) : 'End-sem';
      handleSaveExam({
        type,
        label,
        startDate,
        endDate
      });
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md space-y-6"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{editingExam ? 'Edit Exam' : 'Add Exam'}</h2>
            <button onClick={() => { setShowExamModal(false); setEditingExam(null); }} className="text-zinc-500 hover:text-white">
              <XCircle size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Exam Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['Mid-sem', 'End-sem'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t as any)}
                    className={`py-3 rounded-xl border text-sm font-bold transition-all ${type === t ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-800/50 border-zinc-700 text-zinc-500'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {type === 'Mid-sem' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Which Mid-sem?</label>
                <div className="grid grid-cols-4 gap-2">
                  {['1', '2', '3', 'Other'].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMidSemNum(n)}
                      className={`py-2 rounded-lg border text-xs font-bold transition-all ${midSemNum === n ? 'bg-primary/10 border-primary text-primary' : 'bg-zinc-800/50 border-zinc-700 text-zinc-500'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {midSemNum === 'Other' && (
                  <input 
                    type="text"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="e.g. Sessional 1"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-primary"
                    required
                  />
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Start Date</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">End Date</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full py-4 text-lg mt-4">
              {editingExam ? 'Save Changes' : 'Add to Schedule'}
            </Button>
          </form>
        </motion.div>
      </div>
    );
  };

  const renderDashboard = () => {
    const today = getTodayStr();
    const todayRecord = records[today] || { held: 0, attended: 0, isHoliday: false };
    const isNotStarted = semester.startDate && isBefore(startOfDay(new Date()), startOfDay(parseISO(semester.startDate)));

    return (
      <div className="space-y-6 pb-24">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-zinc-900 rounded-full border border-zinc-800 flex items-center justify-center overflow-hidden">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                  {profile.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="text-zinc-500 text-sm">Welcome back,</p>
              <h1 className="text-2xl font-bold">{profile.name}</h1>
            </div>
          </div>
          <div className="bg-zinc-900 p-2 rounded-full border border-zinc-800">
            <Sparkles size={24} className="text-primary" />
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
                <h2 className="text-xl font-bold">Semester Not Started</h2>
                <p className="text-zinc-400 text-sm max-w-[250px] mx-auto leading-relaxed">
                  Your "{semester.title || 'Next Semester'}" is scheduled to begin on <span className="text-primary font-bold">{format(parseISO(semester.startDate), 'PPP')}</span>.
                </p>
                <div className="pt-4">
                  <span className="bg-primary/20 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Entries are locked</span>
                </div>
              </div>
            </Card>
            
            <Card className="space-y-3">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Semester Plan</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                  <span className="text-sm text-zinc-400">Start Date</span>
                  <span className="text-sm font-bold text-zinc-100">{format(parseISO(semester.startDate), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-zinc-400">End Date</span>
                  <span className="text-sm font-bold text-zinc-100">{format(parseISO(semester.endDate), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </Card>

            <p className="text-center text-zinc-600 text-[10px] uppercase font-bold tracking-widest leading-relaxed">
              No attendance entries allowed<br />until the semester starts.
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
                  <AlertCircle size={20} />
                  <p className="text-sm font-medium">You missed {missedDays.length} attendance entries.</p>
                </div>
                <Button variant="secondary" className="text-xs py-1 px-3" onClick={handleFillMissed}>Fill Now</Button>
              </motion.div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <Card className="relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider">{semester.title || 'Semester'} Attendance</p>
                      <h2 className="text-4xl font-bold">{stats.percentage.toFixed(1)}%</h2>
                      {semester.initialHeld > 0 && (
                        <p className="text-[10px] text-primary font-bold uppercase mt-1 flex items-center gap-1">
                          <Info size={10} /> Includes {semester.initialAttended}/{semester.initialHeld} from setup
                        </p>
                      )}
                    </div>
                    <p className="text-zinc-400 font-medium">{stats.totalAttended} / {stats.totalHeld}</p>
                  </div>
                  <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, stats.percentage)}%` }}
                      className={`h-full ${stats.percentage < semester.targetAttendance ? 'bg-red-500' : 'bg-primary'}`}
                    />
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="space-y-2">
                  <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider">{format(new Date(), 'MMMM')}</p>
                  <h3 className="text-2xl font-bold">{monthlyStats.percentage.toFixed(1)}%</h3>
                  <p className="text-zinc-500 text-xs">{monthlyStats.attended} / {monthlyStats.held} classes</p>
                </Card>
                <Card className="space-y-2">
                  <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Target</p>
                  <h3 className="text-2xl font-bold text-primary">{semester.targetAttendance}%</h3>
                  <p className="text-zinc-500 text-xs">Current Goal</p>
                </Card>
              </div>

              <Card className={`border-l-4 ${bunkInfo.status === 'SAFE' ? 'border-l-primary' : 'border-l-red-500'}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl ${bunkInfo.status === 'SAFE' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
                    {bunkInfo.status === 'SAFE' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">
                      {bunkInfo.status === 'SAFE' 
                        ? `You can bunk ${bunkInfo.canBunk} classes safely.` 
                        : `Attend next ${bunkInfo.mustAttend} classes to reach ${semester.targetAttendance}%.`}
                    </h3>
                    <p className="text-zinc-500 text-sm">
                      {bunkInfo.status === 'SAFE' 
                        ? "Enjoy your free time, but stay above target!" 
                        : "Time to get serious and hit those lectures."}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                Daily Entry <span className="text-zinc-500 text-sm font-normal">— {format(new Date(), 'PPP')}</span>
              </h3>
              <Card className="space-y-8">
                {/* Held Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-bold">Total Available Attendance Today</p>
                      <p className="text-xs text-zinc-500">Theory: 1 | Labs: 2, 3, or 4 units</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button variant="secondary" className="p-2" onClick={() => updateAttendance(today, Math.max(0, todayRecord.held - 1), Math.min(todayRecord.attended, Math.max(0, todayRecord.held - 1)), false)}><Minus size={18}/></Button>
                      <span className="text-2xl font-bold w-6 text-center">{todayRecord.held}</span>
                      <Button variant="secondary" className="p-2" onClick={() => updateAttendance(today, todayRecord.held + 1, todayRecord.attended, false)}><Plus size={18}/></Button>
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <button
                        key={`held-${num}`}
                        onClick={() => updateAttendance(today, num, Math.min(todayRecord.attended, num), false)}
                        className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all shrink-0 ${todayRecord.held === num ? 'bg-primary border-primary text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attended Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-bold">Classes Attended</p>
                      <p className="text-xs text-zinc-500">How many did you go to?</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button variant="secondary" className="p-2" onClick={() => updateAttendance(today, todayRecord.held, Math.max(0, todayRecord.attended - 1), false)}><Minus size={18}/></Button>
                      <span className="text-2xl font-bold w-6 text-center text-primary">{todayRecord.attended}</span>
                      <Button variant="secondary" className="p-2" onClick={() => updateAttendance(today, todayRecord.held, Math.min(todayRecord.held, todayRecord.attended + 1), false)}><Plus size={18}/></Button>
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {Array.from({ length: todayRecord.held + 1 }, (_, i) => i).map(num => (
                      <button
                        key={`attended-${num}`}
                        onClick={() => updateAttendance(today, todayRecord.held, num, false)}
                        className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all shrink-0 ${todayRecord.attended === num ? 'bg-primary border-primary text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                      >
                        {num}
                      </button>
                    ))}
                    {todayRecord.held > 0 && (
                      <button
                        onClick={() => updateAttendance(today, todayRecord.held, todayRecord.held, false)}
                        className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold shrink-0"
                      >
                        All
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-800">
                  <button 
                    onClick={() => updateAttendance(today, 0, 0, !todayRecord.isHoliday)}
                    className={`w-full py-3 rounded-lg font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
                      todayRecord.isHoliday 
                        ? 'bg-amber-500 text-black shadow-amber-500/40 ring-2 ring-white/20' 
                        : 'bg-primary text-white opacity-90 hover:opacity-100 shadow-primary/40'
                    }`}
                  >
                    {todayRecord.isHoliday ? 'Today is a Holiday' : 'Mark Today as Holiday'}
                  </button>
                  <Button onClick={() => alert("Attendance Saved!")} className="w-full py-3 text-lg">Save Attendance</Button>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderCalendar = () => {
    const days = eachDayOfInterval({
      start: startOfMonth(viewDate),
      end: endOfMonth(viewDate)
    });

    const startDay = getDay(days[0]);
    const blanks = Array(startDay).fill(null);

    return (
      <div className="space-y-6 pb-24">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="p-2" onClick={() => setViewDate(subDays(startOfMonth(viewDate), 1))}><ChevronLeft /></Button>
            <span className="font-bold min-w-32 text-center">{format(viewDate, 'MMMM yyyy')}</span>
            <Button variant="secondary" className="p-2" onClick={() => setViewDate(addDays(endOfMonth(viewDate), 1))}><ChevronRight /></Button>
          </div>
        </header>

        <div className="grid grid-cols-7 gap-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={`${d}-${i}`} className="text-center text-xs font-bold text-zinc-500 py-2">{d}</div>
          ))}
          {blanks.map((_, i) => <div key={`blank-${i}`} />)}
          {days.map(day => {
            const dateStr = formatDate(day);
            const record = records[dateStr];
            const sDate = semester.startDate ? startOfDay(parseISO(semester.startDate)) : null;
            const isBeforeSemester = sDate && isBefore(day, sDate);
            const isLocked = semester.lockedUntil && !isAfter(day, parseISO(semester.lockedUntil));
            const exam = getExamForDate(day);
            
            let bgColor = 'bg-zinc-900';
            let borderColor = 'border-zinc-800';
            let textColor = 'text-zinc-100';

            if (exam) {
              bgColor = 'bg-amber-500/20';
              borderColor = 'border-amber-500/30';
              textColor = 'text-amber-500';
            } else if (record && !isBeforeSemester) {
              if (record.isHoliday) {
                bgColor = 'bg-blue-500/20';
                borderColor = 'border-blue-500/30';
                textColor = 'text-blue-500';
              } else if (record.held > 0) {
                if (record.attended === record.held) {
                  bgColor = 'bg-primary/20';
                  borderColor = 'border-primary/30';
                  textColor = 'text-primary';
                } else if (record.attended === 0) {
                  bgColor = 'bg-red-500/20';
                  borderColor = 'border-red-500/30';
                  textColor = 'text-red-500';
                } else {
                  bgColor = 'bg-yellow-500/20';
                  borderColor = 'border-yellow-500/30';
                  textColor = 'text-yellow-500';
                }
              }
            } else if (!isBeforeSemester && isBefore(day, startOfDay(new Date()))) {
              bgColor = 'bg-zinc-800/50';
              borderColor = 'border-zinc-700/50';
              textColor = 'text-zinc-600';
            }

            return (
              <button 
                key={dateStr}
                onClick={() => {
                  setSelectedDate(dateStr);
                }}
                className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all active:scale-95 ${bgColor} ${borderColor} ${textColor} ${isToday(day) ? 'ring-2 ring-primary ring-offset-2 ring-offset-zinc-950' : ''} ${selectedDate === dateStr ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950' : ''}`}
              >
                <span className="text-sm font-bold">{format(day, 'd')}</span>
                {record && record.held > 0 && !record.isHoliday && (
                  <span className="text-[9px] font-black mt-0.5 opacity-80">{record.attended}/{record.held}</span>
                )}
                {record && record.isHoliday && (
                  <span className="text-[8px] font-bold mt-0.5 opacity-60">H</span>
                )}
                {exam && (
                  <span className="text-[8px] font-bold mt-0.5 opacity-80">EXAM</span>
                )}
                {isLocked && <Lock size={10} className="absolute top-1 right-1 opacity-50" />}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {selectedDate && (
            <motion.div
              key={selectedDate}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4"
            >
              <Card className="border-t-4 border-t-primary">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{format(parseISO(selectedDate), 'EEEE, MMM do')}</h3>
                    <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold">
                      {getExamForDate(parseISO(selectedDate)) ? `Exam: ${getExamForDate(parseISO(selectedDate))?.label}` : records[selectedDate]?.isHoliday ? 'Holiday' : 'Regular Class Day'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      className="text-xs py-1.5 px-3" 
                      onClick={() => {
                        const record = records[selectedDate];
                        const isLocked = semester.lockedUntil && !isAfter(parseISO(selectedDate), parseISO(semester.lockedUntil));
                        if (isLocked) {
                          alert("This attendance data was initialized during setup and cannot be edited.");
                          return;
                        }
                        const held = prompt("Total classes?", record?.held.toString() || "0");
                        const attended = prompt("Attended classes?", record?.attended.toString() || "0");
                        if (held !== null && attended !== null) {
                          updateAttendance(selectedDate, parseInt(held), parseInt(attended), false);
                        }
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
                
                {records[selectedDate] && !records[selectedDate].isHoliday && records[selectedDate].held > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-800/50 p-4 rounded-2xl text-center border border-zinc-800">
                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Attended</p>
                        <p className="text-3xl font-black text-primary">{records[selectedDate].attended}</p>
                      </div>
                      <div className="bg-zinc-800/50 p-4 rounded-2xl text-center border border-zinc-800">
                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Total Held</p>
                        <p className="text-3xl font-black text-zinc-100">{records[selectedDate].held}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 p-3 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <BarChart3 size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary/80 uppercase tracking-wider">Daily Percentage</p>
                        <p className="text-lg font-bold text-primary">
                          {((records[selectedDate].attended / records[selectedDate].held) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ) : records[selectedDate]?.isHoliday ? (
                  <div className="bg-zinc-800/50 border border-zinc-700 p-6 rounded-2xl text-center">
                    <Info className="mx-auto mb-2 text-zinc-500" size={32} />
                    <p className="text-zinc-400 font-bold">This day is marked as a holiday.</p>
                    <p className="text-zinc-500 text-xs mt-1">No classes were held on this date.</p>
                  </div>
                ) : (
                  <div className="bg-zinc-800/50 p-8 rounded-2xl text-center border border-zinc-800 border-dashed">
                    <AlertCircle className="mx-auto mb-2 text-zinc-700" size={32} />
                    <p className="text-zinc-500 font-medium italic">No attendance data recorded for this date.</p>
                    <Button 
                      variant="ghost" 
                      className="mt-4 text-xs text-primary"
                      onClick={() => {
                        const held = prompt("Total classes?", "0");
                        const attended = prompt("Attended classes?", "0");
                        if (held !== null && attended !== null) {
                          updateAttendance(selectedDate, parseInt(held), parseInt(attended), false);
                        }
                      }}
                    >
                      + Add Record
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary/30" /> Full Attendance
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30" /> Missed All
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30" /> Partial
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500/30" /> Holiday
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="w-3 h-3 rounded-full bg-zinc-900 border border-zinc-800" /> No Data
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    const completedMonths = semesterMonthlyStats.filter(s => s.isCompleted);
    const lastMonth = completedMonths.length > 0 ? completedMonths[completedMonths.length - 1] : null;

    return (
      <div className="space-y-6 pb-24">
        <h1 className="text-2xl font-bold">Analytics</h1>

        {lastMonth && (
          <Card className="bg-primary/10 border-primary/20">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest">Last Month Performance</p>
                <h2 className="text-2xl font-black text-white">{lastMonth.month} {new Date().getFullYear()}</h2>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-primary">{lastMonth.percentage.toFixed(1)}%</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">{lastMonth.attended} / {lastMonth.held} Classes</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-zinc-400 uppercase text-xs tracking-widest">Semester Progress</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[8px] text-zinc-500 uppercase font-bold">Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-zinc-700" />
                <span className="text-[8px] text-zinc-500 uppercase font-bold">Ongoing</span>
              </div>
            </div>
          </div>
          <div className="h-48 flex items-end gap-2 px-2">
            {semesterMonthlyStats.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                <div className="relative w-full h-full flex flex-col justify-end items-center group">
                  <div className="absolute -top-8 bg-zinc-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {s.percentage.toFixed(1)}%
                  </div>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min(100, s.percentage)}%` }}
                    className={`w-full rounded-t-lg transition-colors ${
                      s.isCompleted 
                        ? (s.percentage >= semester.targetAttendance ? 'bg-primary' : 'bg-red-500/50') 
                        : 'bg-zinc-700'
                    }`}
                  />
                </div>
                <span className={`text-[10px] font-bold ${s.isCurrent ? 'text-primary' : 'text-zinc-500'}`}>
                  {s.month}
                </span>
              </div>
            ))}
            {semesterMonthlyStats.length === 0 && (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm italic">
                No data for current semester
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <h3 className="font-bold">Semester History</h3>
          {history.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
              <p>No past semesters found.</p>
            </div>
          ) : (
            history.map(h => (
              <Card key={h.id} className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{h.title || 'Past Semester'}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                    {format(parseISO(h.startDate), 'MMM dd, yyyy')} - {format(parseISO(h.endDate), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">{h.totalAttended} / {h.totalHeld} classes</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-primary">{h.finalPercentage.toFixed(1)}%</p>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderSpecial = () => {
    const themes = [
      { name: 'Emerald', color: '#10b981' },
      { name: 'Blue', color: '#3b82f6' },
      { name: 'Purple', color: '#8b5cf6' },
      { name: 'Rose', color: '#f43f5e' },
      { name: 'Orange', color: '#f97316' },
      { name: 'Amber', color: '#f59e0b' },
    ];

    return (
      <div className="space-y-6 pb-24">
        <h1 className="text-2xl font-bold">Special</h1>

        {/* Theme Customization */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-lg text-primary">
              <Sparkles size={18} />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wider">App Theme</h3>
          </div>
          <p className="text-xs text-zinc-500">Choose your favorite color combination for BunkSafe.</p>
          <div className="grid grid-cols-3 gap-2">
            {themes.map(t => (
              <button
                key={t.name}
                onClick={() => setThemeColor(t.color)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${themeColor === t.color ? 'bg-primary/10 border-primary' : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'}`}
              >
                <div className="w-6 h-6 rounded-full shadow-lg" style={{ backgroundColor: t.color }} />
                <span className={`text-[10px] font-bold uppercase ${themeColor === t.color ? 'text-primary' : 'text-zinc-500'}`}>{t.name}</span>
              </button>
            ))}
          </div>
          <div className="pt-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Custom Hex Color</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={themeColor} 
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 cursor-pointer"
              />
              <input 
                type="text" 
                value={themeColor} 
                onChange={(e) => setThemeColor(e.target.value)}
                placeholder="#10b981"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-xs font-mono text-zinc-100 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </Card>

        {/* Exams Schedule Section */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                <BookOpen size={18} />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Exam Schedule</h3>
            </div>
            <Button 
              onClick={() => { setEditingExam(null); setShowExamModal(true); }} 
              variant="ghost" 
              className="text-xs text-primary"
            >
              <Plus size={14} className="mr-1" /> Add Exam
            </Button>
          </div>
          
          <p className="text-xs text-zinc-500">Add your Mid-sem or End-sem exams to highlight them on the calendar.</p>

          <div className="space-y-3">
            {exams.length === 0 ? (
              <div className="text-center py-6 border border-zinc-800 border-dashed rounded-2xl">
                <CalendarDays className="mx-auto mb-2 text-zinc-700 opacity-30" size={32} />
                <p className="text-zinc-600 text-xs italic">No exams scheduled yet.</p>
              </div>
            ) : (
              exams.sort((a, b) => a.startDate.localeCompare(b.startDate)).map(exam => (
                <div key={exam.id} className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${exam.type === 'End-sem' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{exam.label}</h4>
                      <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                        {format(parseISO(exam.startDate), 'MMM dd')} - {format(parseISO(exam.endDate), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingExam(exam); setShowExamModal(true); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-700/50 text-zinc-300 hover:text-primary hover:bg-primary/10 transition-all text-[10px] font-bold uppercase"
                    >
                      <Edit2 size={12} />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteExam(exam.id)}
                      className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Kaif's Special Section */}
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-indigo-600 to-violet-700 p-0">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Sparkles size={80} />
          </div>
          <div className="relative p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg text-white">
                <Zap size={18} />
              </div>
              <h3 className="font-black text-white uppercase tracking-tighter text-lg">Kaif's Special Section</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-emerald-300" />
                  <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Bunk Strategy</span>
                </div>
                <p className="text-xs text-white/90 leading-relaxed">
                  {stats.percentage >= semester.targetAttendance 
                    ? `You're in the safe zone! You can strategically bunk up to ${bunkInfo.canBunk} classes without dropping below ${semester.targetAttendance}%. Use them wisely for self-study or rest.`
                    : `Focus mode active. You need to attend the next ${bunkInfo.mustAttend} classes to hit your ${semester.targetAttendance}% goal. Avoid any unnecessary bunks this week.`
                  }
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 size={14} className="text-blue-300" />
                  <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Consistency Score</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400" style={{ width: `${Math.min(100, stats.percentage)}%` }} />
                  </div>
                  <span className="text-xs font-black text-white">{Math.round(stats.percentage)}/100</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Combi Attendance Section */}
        <Card className="space-y-4 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-lg text-primary">
              <BarChart3 size={18} />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wider">Combi Attendance</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {semesterMonthlyStats.map(s => (
              <button
                key={s.month}
                onClick={() => toggleCombiMonth(s.month)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border ${
                  combiSelectedMonths.includes(s.month)
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                {s.month}
              </button>
            ))}
          </div>

          {combiStats ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pt-2 border-t border-primary/10"
            >
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Combined Percentage</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">{combiStats.percentage.toFixed(1)}%</span>
                    <span className="text-xs text-zinc-500 font-medium">({combiStats.totalAttended}/{combiStats.totalHeld})</span>
                  </div>
                </div>
                <div className="text-right">
                  {combiStats.percentage >= semester.targetAttendance ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-primary">
                        <CheckCircle2 size={14} />
                        <span className="text-[10px] font-bold uppercase">Safe</span>
                      </div>
                      <p className="text-[9px] text-zinc-500 max-w-[120px]">You are above your {semester.targetAttendance}% target for these months.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-red-500">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-bold uppercase">Action Needed</span>
                      </div>
                      <p className="text-lg font-black text-red-500">+{combiStats.mustAttend}</p>
                      <p className="text-[9px] text-zinc-500">Classes needed to hit {semester.targetAttendance}%</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {semesterMonthlyStats.filter(s => combiSelectedMonths.includes(s.month)).map(s => (
                  <div key={s.month} className="bg-zinc-900/50 p-2 rounded-xl border border-zinc-800 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">{s.month}</span>
                    <span className={`text-xs font-bold ${s.percentage >= semester.targetAttendance ? 'text-primary' : 'text-red-500'}`}>
                      {s.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="py-4 text-center border-t border-zinc-800/50">
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Select months to see combined stats</p>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderProfile = () => {
    return (
      <div className="space-y-6 pb-24">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Button variant="danger" className="p-2" onClick={() => {
            if (confirm("Reset all data? This cannot be undone.")) {
              localStorage.clear();
              window.location.reload();
            }
          }}><Trash2 size={20}/></Button>
        </header>

        <div className="flex flex-col items-center gap-4 py-6">
          <div className="relative group">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-primary/20 overflow-hidden border-4 border-zinc-900">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                profile.name.charAt(0)
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer shadow-lg active:scale-90 transition-all">
              <Edit2 size={14} />
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
            <h2 className="text-xl font-bold">{profile.name}</h2>
            <p className="text-zinc-500">{profile.college}</p>
          </div>
        </div>

        <Card className="space-y-4">
          <Input label="Full Name" value={profile.name} onChange={(v: string) => setProfile({...profile, name: v})} />
          <Input label="Email Address" value={profile.email} onChange={(v: string) => setProfile({...profile, email: v})} />
          <Input label="College" value={profile.college} onChange={(v: string) => setProfile({...profile, college: v})} />
          <Input label="Department" value={profile.department} onChange={(v: string) => setProfile({...profile, department: v})} />
          <Input label="Semester" value={profile.semester} onChange={(v: string) => setProfile({...profile, semester: v})} />
          <Input label="Mobile Number" value={profile.mobile} onChange={(v: string) => setProfile({...profile, mobile: v})} />
        </Card>

        <Button className="w-full py-4" onClick={() => alert("Profile Updated!")}>Save Changes</Button>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="space-y-6 pb-24">
        <h1 className="text-2xl font-bold">Settings</h1>

        <div className="space-y-4">
          <h3 className="text-zinc-500 uppercase text-xs font-bold tracking-widest">Notifications</h3>
          <Card className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${notificationPermission === 'granted' ? 'bg-primary/10 text-primary' : 'bg-zinc-800 text-zinc-500'}`}>
                {notificationPermission === 'granted' ? <Bell size={20} /> : <BellOff size={20} />}
              </div>
              <div>
                <p className="font-bold">Reminders</p>
                <p className="text-xs text-zinc-500">8 AM & 6 PM Alerts</p>
              </div>
            </div>
            <Button 
              variant={notificationPermission === 'granted' ? 'secondary' : 'primary'} 
              className="text-xs py-1 px-3"
              onClick={requestNotificationPermission}
              disabled={notificationPermission === 'granted'}
            >
              {notificationPermission === 'granted' ? 'Enabled' : 'Enable'}
            </Button>
          </Card>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-zinc-500 uppercase text-xs font-bold tracking-widest">Attendance Goal</h3>
          <div className="grid grid-cols-3 gap-3">
            {[60, 70, 75, 80, 85, 90].map(t => (
              <button 
                key={t}
                onClick={() => setSemester({...semester, targetAttendance: t})}
                className={`p-4 rounded-2xl border transition-all font-bold ${semester.targetAttendance === t ? 'bg-primary border-primary text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
              >
                {t}%
              </button>
            ))}
          </div>
          <Input 
            type="number" 
            label="Custom Target %" 
            value={semester.targetAttendance} 
            onChange={(v: string) => setSemester({...semester, targetAttendance: parseInt(v)})} 
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-zinc-500 uppercase text-xs font-bold tracking-widest">Semester Info</h3>
          <Card className="space-y-4">
            <Input label="Semester Title / Number" value={semester.title} onChange={(v: string) => setSemester({...semester, title: v})} placeholder="e.g. Semester 3" />
            <Input type="date" label="Start Date" value={semester.startDate} onChange={(v: string) => setSemester({...semester, startDate: v})} />
            <Input type="date" label="End Date" value={semester.endDate} onChange={(v: string) => setSemester({...semester, endDate: v})} />
          </Card>
        </div>

        <div className="pt-6">
           <Button variant="danger" className="w-full py-4 flex items-center justify-center gap-2" onClick={() => {
             const h: SemesterHistory = {
               id: Date.now().toString(),
               title: semester.title,
               startDate: semester.startDate,
               endDate: semester.endDate,
               finalPercentage: stats.percentage,
               totalHeld: stats.totalHeld,
               totalAttended: stats.totalAttended
             };
             setHistory([h, ...history]);
             setSemester({ title: '', startDate: '', endDate: '', targetAttendance: 75, isInitialized: false });
             setRecords({});
             setAppState('SEMESTER_SETUP');
           }}>
             <LogOut size={20} /> End Current Semester
           </Button>
           <p className="text-center text-zinc-500 text-xs mt-4">This will archive current data and start a new semester.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-primary/30">
      <main className="max-w-md mx-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'calendar' && renderCalendar()}
            {activeTab === 'special' && renderSpecial()}
            {activeTab === 'analytics' && renderAnalytics()}
            {activeTab === 'profile' && renderProfile()}
            {activeTab === 'settings' && renderSettings()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Online Status Floating Badge */}
      <div className="fixed bottom-20 left-4 z-40 flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full backdrop-blur-md">
        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{onlineCount} Live Users</span>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 px-6 py-3 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={24} />} label="Home" />
          <NavButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<CalendarIcon size={24} />} label="Calendar" />
          <NavButton active={activeTab === 'special'} onClick={() => setActiveTab('special')} icon={<Sparkles size={24} />} label="Special" />
          <NavButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart3 size={24} />} label="Stats" />
          <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={24} />} label="Profile" />
          <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={24} />} label="Setup" />
        </div>
      </nav>

      {showExamModal && <ExamModal />}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-primary' : 'text-zinc-500'}`}
    >
      <div className={`p-1 rounded-xl transition-all ${active ? 'bg-primary/10' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}
