/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  logCustomEvent, 
  saveUserSubjectsToFirestore, 
  loadUserSubjectsFromFirestore, 
  saveUserProfileToFirestore, 
  loadUserProfileFromFirestore,
  saveUserAttendanceStatusToFirestore,
  auth
} from './firebase';
import { getDefaultCurriculumSubjects } from './utils/curriculum';
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
  Search,
  Star,
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
  Edit2,
  GraduationCap,
  Check,
  Clock,
  X
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
  Exam,
  SubjectGradeConfig,
  Subject,
  formatSubjectName
} from './types';
import SettingsTab from './components/SettingsTab';
import ExamsTab from './components/ExamsTab';
import AirtelAdModal from './components/AirtelAdModal';
import { 
  formatDate, 
  getTodayStr, 
  calculateAttendance, 
  calculateBunkInfo,
  safeParse,
  parseTimeRange,
  getJamiaHoliday
} from './utils/dateUtils';

// --- Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string, key?: string | number }) => {
  const hasPadding = className.includes('p-') || className.includes('px-') || className.includes('py-');
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl ${hasPadding ? '' : 'p-4'} ${className}`}>
      {children}
    </div>
  );
};

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = "", 
  disabled = false,
  type = 'button',
  style
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost',
  className?: string,
  disabled?: boolean,
  type?: 'button' | 'submit' | 'reset',
  style?: React.CSSProperties
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
      style={style}
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

const UNIVERSITIES_LIST = [
  "Delhi University",
  "Jawaharlal Nehru University",
  "Banaras Hindu University",
  "Aligarh Muslim University",
  "Jamia Hamdard",
  "IIT Delhi",
  "IIT Bombay",
  "IIT Madras",
  "IIT Kanpur",
  "IIT Kharagpur",
  "IIT Guwahati",
  "IIT Roorkee",
  "IIT Hyderabad",
  "IIIT Delhi",
  "IIIT Allahabad",
  "NIT Trichy",
  "NIT Surathkal",
  "NIT Warangal",
  "Anna University",
  "Jadavpur University",
  "VIT",
  "SRM",
  "LPU",
  "Manipal",
  "BITS Pilani",
  "Amity",
  "Chandigarh University",
  "Sharda University",
  "Galgotias University",
  "Noida International University"
];

const JAMIA_FACULTIES_DEPARTMENTS: Record<string, string[]> = {
  "Faculty of Architecture & Ekistics": ["Architecture", "Planning"],
  "Faculty of Dentistry": ["Dental Sciences"],
  "Faculty of Education": ["Teacher Training", "Educational Studies"],
  "Faculty of Engineering & Technology": [
    "Civil Engineering",
    "Computer Engineering",
    "Electrical Engineering",
    "Electronics & Communication Engineering",
    "Mechanical Engineering",
    "Applied Sciences & Humanities",
    "University Polytechnic",
    "Civil Engineering (Construction Technology) (Self-Financed)",
    "Electrical & Computer Engineering (Self-Financed)",
    "Robotics & Artificial Intelligence (Self-Financed)",
    "Electronics (VLSI Design & Technology) (Self-Financed)",
    "Computer Science & Engineering (Data Sciences) (Self-Financed)"
  ],
  "Faculty of Fine Arts": [
    "Applied Art",
    "Painting",
    "Graphic Art",
    "Sculpture",
    "Art Education",
    "Art History",
    "Design & Innovation"
  ],
  "Faculty of Humanities & Languages": [
    "English",
    "Hindi",
    "Urdu",
    "Arabic",
    "Persian",
    "Sanskrit",
    "Islamic Studies",
    "History & Culture",
    "Foreign Languages"
  ],
  "Faculty of Law": ["Law"],
  "Faculty of Life Sciences": ["Biosciences", "Biotechnology"],
  "Faculty of Management Studies": [
    "Management Studies",
    "Tourism & Hospitality",
    "Hospital Management"
  ],
  "Faculty of Sciences": [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Computer Science",
    "Environmental Science"
  ],
  "Faculty of Social Sciences": [
    "Economics",
    "Political Science",
    "Psychology",
    "Sociology",
    "Social Work",
    "Commerce & Business Studies",
    "Adult & Continuing Education"
  ]
};

// --- Main App ---

export default function App() {
  // Persistence
  const [profile, setProfile] = useState<Profile>(() => {
    const saved = localStorage.getItem('bs_profile');
    const defaultProfile = { name: 'Kaif Khan', email: 'kaif@example.com', college: 'IIT Delhi', department: 'Computer Science', semester: 'Semester 1', mobile: '', avatar: '' };
    if (!saved) return defaultProfile;
    const parsed = JSON.parse(saved);
    const profileMerged = { ...defaultProfile, ...parsed };

    // Backward compatibility: If an existing profile has a department (branch), migrate/infer programme safely
    if (profileMerged.department && !profileMerged.programme) {
      const deptLower = profileMerged.department.toLowerCase();
      if (deptLower.includes('applied science') || deptLower.includes('applied sciences')) {
        profileMerged.department = 'Applied Science & Humanities';
        profileMerged.programme = 'Regular';
      } else if (deptLower.includes('self-financed') || deptLower.includes('self-finance')) {
        profileMerged.programme = 'Self-Financed';
      } else {
        profileMerged.programme = 'Regular';
      }
    }
    return profileMerged;
  });

  const [semester, setSemester] = useState<Semester>(() => {
    const saved = localStorage.getItem('bs_semester');
    const defaultSemester = {
      title: 'Semester 1',
      startDate: '2026-05-01',
      endDate: '2026-10-31',
      targetAttendance: 75,
      isInitialized: false,
      initialHeld: 0,
      initialAttended: 0
    };
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

  const [gradeSubjects, setGradeSubjects] = useState<SubjectGradeConfig[]>(() => {
    const saved = localStorage.getItem('bs_grade_planner_subjects');
    return saved ? JSON.parse(saved) : [];
  });

  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [showAttendanceInfoModal, setShowAttendanceInfoModal] = useState(false);
  const [forceShowAd, setForceShowAd] = useState(false);

  const [appState, setAppState] = useState<AppState>('MAIN');

  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
    return localStorage.getItem('bs_onboarding_completed') === 'true' || localStorage.getItem('bs_semester') !== null;
  });
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [isJamiaStudent, setIsJamiaStudent] = useState<boolean | null>(null);

  // New Manual Onboarding States
  const [isManualOnboarding, setIsManualOnboarding] = useState<boolean>(false);
  const [manualOnboardingStep, setManualOnboardingStep] = useState<number>(1);
  const [manualName, setManualName] = useState<string>('');
  const [manualUniversity, setManualUniversity] = useState<string>('Jamia Millia Islamia');
  const [manualUniversityInput, setManualUniversityInput] = useState<string>('');
  const [univSearchQuery, setUnivSearchQuery] = useState<string>('');
  const [manualFaculty, setManualFaculty] = useState<string>('Faculty of Engineering & Technology');
  const [manualFacultyInput, setManualFacultyInput] = useState<string>('');
  const [facultySearchQuery, setFacultySearchQuery] = useState<string>('');
  const [manualDept, setManualDept] = useState<string>('Computer Engineering');
  const [manualDeptInput, setManualDeptInput] = useState<string>('');
  const [deptSearchQuery, setDeptSearchQuery] = useState<string>('');
  const [manualSem, setManualSem] = useState<string>('Semester 1');
  const [manualSemInput, setManualSemInput] = useState<string>('');
  const [manualStartDate, setManualStartDate] = useState<string>('2026-07-17');
  const [manualEndDate, setManualEndDate] = useState<string>('2026-11-20');
  const [manualTargetAttendance, setManualTargetAttendance] = useState<number>(75);
  const [syllabusLoadStatus, setSyllabusLoadStatus] = useState<'none' | 'loaded' | 'not_found'>('none');

  const [onboardName, setOnboardName] = useState('');
  const [onboardProgramme, setOnboardProgramme] = useState<'Regular' | 'Self-Financed' | ''>('');
  const [onboardDept, setOnboardDept] = useState('');
  const [onboardSem, setOnboardSem] = useState('Semester 3');

  const [onboardStartDate, setOnboardStartDate] = useState('2026-07-17');
  const [onboardEndDate, setOnboardEndDate] = useState('2026-11-20');

  const [onboardMid1Start, setOnboardMid1Start] = useState('2026-09-14');
  const [onboardMid1End, setOnboardMid1End] = useState('2026-09-18');

  const [onboardMid2Start, setOnboardMid2Start] = useState('2026-11-02');
  const [onboardMid2End, setOnboardMid2End] = useState('2026-11-06');

  const [onboardEndSemStart, setOnboardEndSemStart] = useState('2026-11-25');
  const [onboardEndSemEnd, setOnboardEndSemEnd] = useState('2026-12-20');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scheduleSubTab, setScheduleSubTab] = useState<'schedule' | 'calendar'>('schedule');
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [showLatePopup, setShowLatePopup] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [onlineCount, setOnlineCount] = useState(450);
  const [extraHolidayInput, setExtraHolidayInput] = useState('');
  const [gapDays, setGapDays] = useState<string[]>([]);
  const [currentGapIndex, setCurrentGapIndex] = useState(0);
  const [gapHeld, setGapHeld] = useState(1);
  const [gapAttended, setGapAttended] = useState(1);
  const [gapIsHoliday, setGapIsHoliday] = useState(false);

  useEffect(() => {
    if (gapDays.length > 0 && currentGapIndex < gapDays.length) {
      setGapHeld(1);
      setGapAttended(1);
      setGapIsHoliday(false);
    }
  }, [currentGapIndex, gapDays]);

  const [themeColor, setThemeColor] = useState(() => {
    const saved = localStorage.getItem('bs_theme_color');
    if (!saved || saved === '#10b981') {
      return '#facc15';
    }
    return saved;
  });

  // Daily Class Schedule States
  const [classSchedule, setClassSchedule] = useState<Record<string, Record<number, string>>>(() => {
    const saved = localStorage.getItem('bs_class_schedule');
    return saved ? JSON.parse(saved) : {
      'Monday': {},
      'Tuesday': {},
      'Wednesday': {},
      'Thursday': {},
      'Friday': {}
    };
  });

  const [enableLiveWidget, setEnableLiveWidget] = useState<boolean>(() => {
    const saved = localStorage.getItem('bs_enable_live_widget');
    return saved ? JSON.parse(saved) : false;
  });

  const [customClassTimes, setCustomClassTimes] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('bs_custom_class_times');
    return saved ? JSON.parse(saved) : {
      0: '09:00 AM - 10:00 AM',
      1: '10:00 AM - 11:00 AM',
      2: '11:00 AM - 12:00 PM',
      3: '12:00 PM - 01:00 PM',
      [-1]: '01:00 PM - 02:00 PM',
      4: '02:00 PM - 03:00 PM',
      5: '03:00 PM - 04:00 PM',
      6: '04:00 PM - 05:00 PM'
    };
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('bs_subjects');
    return saved ? JSON.parse(saved) : [];
  });

  const [isSubjectPopupDismissed, setIsSubjectPopupDismissed] = useState(false);

  useEffect(() => {
    localStorage.setItem('bs_subjects', JSON.stringify(subjects));
    if (profile.email && subjects.length > 0) {
      saveUserSubjectsToFirestore(profile.email, subjects);
    }
  }, [subjects, profile.email]);

  useEffect(() => {
    const fetchCloudSubjects = async () => {
      if (profile.email) {
        try {
          const cloudSubs = await loadUserSubjectsFromFirestore(profile.email);
          if (cloudSubs && cloudSubs.length > 0) {
            const savedLocal = localStorage.getItem('bs_subjects');
            if (!savedLocal || JSON.parse(savedLocal).length === 0) {
              setSubjects(cloudSubs);
            }
          }
        } catch (e: any) {
          const isOffline = e instanceof Error && (
            e.message.toLowerCase().includes('offline') || 
            e.message.toLowerCase().includes('unavailable')
          );
          if (isOffline) {
            console.warn("Could not load cloud subjects because the client is offline.");
          } else {
            console.error("Failed to load cloud subjects:", e);
          }
        }
      }
    };
    fetchCloudSubjects();
  }, [profile.email]);

  const [subjectAttendance, setSubjectAttendance] = useState<Record<string, { attended: number; held: number }>>(() => {
    const saved = localStorage.getItem('bs_subject_attendance');
    return saved ? JSON.parse(saved) : {};
  });

  // Automatic Master Subject List Migration
  useEffect(() => {
    const savedSubjects = localStorage.getItem('bs_subjects');
    if (!savedSubjects || JSON.parse(savedSubjects).length === 0) {
      const uniqueNames = new Set<string>();
      
      // 1. Gather names from classSchedule
      const savedSchedule = localStorage.getItem('bs_class_schedule');
      if (savedSchedule) {
        try {
          const parsedSchedule = JSON.parse(savedSchedule);
          Object.values(parsedSchedule).forEach((daySlots: any) => {
            Object.values(daySlots).forEach((subName: any) => {
              if (subName && typeof subName === 'string' && subName.trim() && !subName.startsWith('sub_')) {
                uniqueNames.add(formatSubjectName(subName));
              }
            });
          });
        } catch (e) { console.error(e); }
      }

      // 2. Gather names from gradeSubjects
      const savedGradePlanner = localStorage.getItem('bs_grade_planner_subjects');
      if (savedGradePlanner) {
        try {
          const parsedGradePlanner = JSON.parse(savedGradePlanner);
          parsedGradePlanner.forEach((item: any) => {
            if (item.name && typeof item.name === 'string' && item.name.trim()) {
              uniqueNames.add(formatSubjectName(item.name));
            }
          });
        } catch (e) { console.error(e); }
      }

      // 3. Gather keys from subjectAttendance
      const savedAttendance = localStorage.getItem('bs_subject_attendance');
      if (savedAttendance) {
        try {
          const parsedAttendance = JSON.parse(savedAttendance);
          Object.keys(parsedAttendance).forEach(key => {
            if (key && typeof key === 'string' && key.trim() && !key.startsWith('sub_')) {
              uniqueNames.add(formatSubjectName(key));
            }
          });
        } catch (e) { console.error(e); }
      }

      if (uniqueNames.size > 0) {
        const migratedSubjects: Subject[] = Array.from(uniqueNames).map((name, index) => {
          const isLab = /lab|practical|workshop|project/i.test(name);
          return {
            id: `sub_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
            name,
            type: isLab ? 'Lab' : 'Theory',
            credits: isLab ? 1 : 3
          };
        });

        // Save subjects
        localStorage.setItem('bs_subjects', JSON.stringify(migratedSubjects));
        setSubjects(migratedSubjects);

        // Migrate class_schedule
        if (savedSchedule) {
          try {
            const parsedSchedule = JSON.parse(savedSchedule);
            const migratedSchedule: any = {};
            Object.entries(parsedSchedule).forEach(([day, slots]: [string, any]) => {
              migratedSchedule[day] = {};
              Object.entries(slots).forEach(([slotId, subName]: [string, any]) => {
                if (subName && typeof subName === 'string') {
                  const formatted = formatSubjectName(subName);
                  const foundSub = migratedSubjects.find(s => s.name === formatted);
                  migratedSchedule[day][slotId] = foundSub ? foundSub.id : subName;
                } else {
                  migratedSchedule[day][slotId] = subName;
                }
              });
            });
            localStorage.setItem('bs_class_schedule', JSON.stringify(migratedSchedule));
            setClassSchedule(migratedSchedule);
          } catch (e) { console.error(e); }
        }

        // Migrate grade_planner_subjects
        if (savedGradePlanner) {
          try {
            const parsedGradePlanner = JSON.parse(savedGradePlanner);
            const migratedGradePlanner = parsedGradePlanner.map((item: any) => {
              const formatted = formatSubjectName(item.name);
              const foundSub = migratedSubjects.find(s => s.name === formatted);
              if (foundSub) {
                return {
                  ...item,
                  id: foundSub.id,
                  name: foundSub.name
                };
              }
              return item;
            });
            localStorage.setItem('bs_grade_planner_subjects', JSON.stringify(migratedGradePlanner));
            setGradeSubjects(migratedGradePlanner);
          } catch (e) { console.error(e); }
        }

        // Migrate subject_attendance
        if (savedAttendance) {
          try {
            const parsedAttendance = JSON.parse(savedAttendance);
            const migratedAttendance: any = {};
            Object.entries(parsedAttendance).forEach(([key, val]) => {
              const formatted = formatSubjectName(key);
              const foundSub = migratedSubjects.find(s => s.name === formatted);
              if (foundSub) {
                migratedAttendance[foundSub.id] = val;
              } else {
                migratedAttendance[key] = val;
              }
            });
            localStorage.setItem('bs_subject_attendance', JSON.stringify(migratedAttendance));
            setSubjectAttendance(migratedAttendance);
          } catch (e) { console.error(e); }
        }
      }
    }
  }, []);

  const [markedScheduleSlots, setMarkedScheduleSlots] = useState<Record<string, 'present' | 'absent'>>(() => {
    const saved = localStorage.getItem('bs_marked_schedule_slots');
    return saved ? JSON.parse(saved) : {};
  });

  const CLASS_SLOTS = useMemo(() => [
    { id: 0, time: customClassTimes[0] || '09:00 AM - 10:00 AM', label: '09:00 AM' },
    { id: 1, time: customClassTimes[1] || '10:00 AM - 11:00 AM', label: '10:00 AM' },
    { id: 2, time: customClassTimes[2] || '11:00 AM - 12:00 PM', label: '11:00 AM' },
    { id: 3, time: customClassTimes[3] || '12:00 PM - 01:00 PM', label: '12:00 PM' },
    { id: -1, time: customClassTimes[-1] || '01:00 PM - 02:00 PM', label: '01:00 PM', isLunch: true },
    { id: 4, time: customClassTimes[4] || '02:00 PM - 03:00 PM', label: '02:00 PM' },
    { id: 5, time: customClassTimes[5] || '03:00 PM - 04:00 PM', label: '03:00 PM' },
    { id: 6, time: customClassTimes[6] || '04:00 PM - 05:00 PM', label: '04:00 PM' },
  ], [customClassTimes]);

  const uniqueSubjects = useMemo(() => {
    if (subjects && subjects.length > 0) {
      return subjects.map(s => s.name);
    }
    const subjectsSet = new Set<string>();
    Object.values(classSchedule).forEach(daySlots => {
      Object.values(daySlots).forEach(subject => {
        if (subject && subject.trim()) {
          subjectsSet.add(subject.trim());
        }
      });
    });
    return Array.from(subjectsSet).sort();
  }, [subjects, classSchedule]);
  const [reportEmail, setReportEmail] = useState(profile.email || '');
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportStatus, setReportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const isFirstThemeRender = useRef(true);
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
    if (isFirstThemeRender.current) {
      isFirstThemeRender.current = false;
    } else {
      logCustomEvent('theme_changed', { theme: themeColor });
    }
  }, [themeColor]);

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayStr());
  const [combiSelectedMonths, setCombiSelectedMonths] = useState<string[]>([]);

  // Calculations
  const stats = useMemo(() => calculateAttendance(records, semester.initialHeld, semester.initialAttended, semester.startDate, exams), [records, semester, exams]);
  const bunkInfo = useMemo(() => calculateBunkInfo(stats.totalHeld, stats.totalAttended, semester.targetAttendance), [stats, semester]);

  const liveClassInfo = useMemo(() => {
    if (!enableLiveWidget) return null;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentDayName = format(now, 'EEEE');
    
    const todayHoliday = getJamiaHoliday(now);
    if (todayHoliday.isHoliday) {
      return {
        isHoliday: true,
        holidayName: todayHoliday.name || 'JMI Holiday',
        live: null,
        next: null
      };
    }

    const isWeekend = ['Saturday', 'Sunday'].includes(currentDayName);
    if (isWeekend) {
      return {
        isWeekend: true,
        holidayName: 'Weekend',
        live: null,
        next: null
      };
    }
    
    const daySchedule = classSchedule[currentDayName] || {};
    
    let live: { subject: string; time: string; isLunch?: boolean } | null = null;
    let next: { subject: string; time: string; isLunch?: boolean } | null = null;
    
    const activeSlots = CLASS_SLOTS.map(slot => {
      const timeRange = parseTimeRange(slot.time);
      let subject = '';
      if (slot.isLunch) {
        subject = 'Lunch Break';
      } else {
        const subId = (daySchedule[slot.id] || '').trim();
        const foundSub = subjects.find(s => s.id === subId);
        subject = foundSub ? foundSub.name : subId;
      }
      return {
        id: slot.id,
        isLunch: slot.isLunch,
        time: slot.time,
        subject,
        range: timeRange
      };
    }).filter(s => s.range);
    
    // Find active class
    const liveSlot = activeSlots.find(s => currentMinutes >= s.range!.start && currentMinutes < s.range!.end);
    if (liveSlot && liveSlot.subject) {
      live = {
        subject: liveSlot.subject,
        time: liveSlot.time,
        isLunch: liveSlot.isLunch
      };
    }
    
    // Find next class (first non-empty slot after currentMinutes)
    const upcomingSlots = activeSlots
      .filter(s => s.range!.start > currentMinutes && s.subject)
      .sort((a, b) => a.range!.start - b.range!.start);
      
    if (upcomingSlots.length > 0) {
      next = {
        subject: upcomingSlots[0].subject,
        time: upcomingSlots[0].time,
        isLunch: upcomingSlots[0].isLunch
      };
    }
    
    return {
      isWeekend: false,
      live,
      next
    };
  }, [enableLiveWidget, classSchedule, CLASS_SLOTS, subjects]);



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
      const jmiHoliday = getJamiaHoliday(day);
      const isHoliday = (record && record.isHoliday) || jmiHoliday.isHoliday;
      const holidayName = jmiHoliday.name || (record && record.holidayName) || 'Holiday';
      return [
        format(day, 'dd/MM/yyyy (EEE)'),
        isHoliday ? `Holiday: ${holidayName}` : (record ? record.held : '-'),
        isHoliday ? '-' : (record ? record.attended : '-'),
        isHoliday ? '-' : (record && record.held > 0 ? `${((record.attended / record.held) * 100).toFixed(0)}%` : '-')
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
                title: semester.title || `Semester ${history.length + 1}`,
                startDate: semester.startDate,
                endDate: semester.endDate,
                finalPercentage: stats.percentage,
                totalHeld: stats.totalHeld,
                totalAttended: stats.totalAttended
              };
              setHistory([h, ...history]);
              setSemester({
                title: `Semester ${history.length + 2}`,
                startDate: '',
                endDate: '',
                targetAttendance: 75,
                isInitialized: false,
                initialHeld: 0,
                initialAttended: 0
              });
              setRecords({});
              setExams([]); // Clear exams for new semester
              localStorage.removeItem('bs_onboarding_completed');
              setOnboardingCompleted(false);
              setOnboardingStep(1);
              setAppState('MAIN');
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
    
    const parsedStart = safeParse(semester.startDate);
    if (!parsedStart) return [];
    const start = startOfDay(parsedStart);
    
    const end = endOfMonth(new Date());
    
    if (isAfter(start, end)) return [];
    
    const months = eachMonthOfInterval({ start, end });
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    
    // Total initial data
    const lockedUntil = semester.lockedUntil ? safeParse(semester.lockedUntil) : null;
    const initialPeriodDays = (lockedUntil && start <= lockedUntil) ? differenceInDays(lockedUntil, start) + 1 : 0;
    
    return months.map(month => {
      const mStart = startOfMonth(month);
      const mEnd = endOfMonth(month);
      const isCompleted = isBefore(mEnd, now);
      const isCurrent = isSameMonth(month, now);
      
      // Actual records for this month
      const monthRecords = Object.entries(records).filter(([date]) => {
        const d = safeParse(date);
        const sDate = safeParse(semester.startDate);
        if (!d || !sDate) return false;
        return d >= mStart && d <= mEnd && !isBefore(d, startOfDay(sDate));
      }) as [string, AttendanceRecord][];
      
      let held = 0;
      let attended = 0;
      monthRecords.forEach(([date, r]) => {
        const isExam = exams.some(e => {
          const estart = safeParse(e.startDate);
          const eend = safeParse(e.endDate);
          const d = safeParse(date);
          if (!estart || !eend || !d) return false;
          return startOfDay(d) >= startOfDay(estart) && startOfDay(d) <= startOfDay(eend);
        });
        const jmiHoliday = getJamiaHoliday(date);
        if (!r.isHoliday && !jmiHoliday.isHoliday && !isExam) {
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
  }, [records, semester, exams]);

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
  useEffect(() => {
    localStorage.setItem('bs_profile', JSON.stringify(profile));
    if (profile.email) {
      saveUserProfileToFirestore(profile.email, profile);
    }
  }, [profile]);
  useEffect(() => localStorage.setItem('bs_semester', JSON.stringify(semester)), [semester]);
  useEffect(() => localStorage.setItem('bs_records', JSON.stringify(records)), [records]);
  useEffect(() => localStorage.setItem('bs_history', JSON.stringify(history)), [history]);
  useEffect(() => localStorage.setItem('bs_exams', JSON.stringify(exams)), [exams]);
  useEffect(() => localStorage.setItem('bs_class_schedule', JSON.stringify(classSchedule)), [classSchedule]);
  useEffect(() => localStorage.setItem('bs_custom_class_times', JSON.stringify(customClassTimes)), [customClassTimes]);
  useEffect(() => localStorage.setItem('bs_subject_attendance', JSON.stringify(subjectAttendance)), [subjectAttendance]);
  useEffect(() => localStorage.setItem('bs_marked_schedule_slots', JSON.stringify(markedScheduleSlots)), [markedScheduleSlots]);
  useEffect(() => localStorage.setItem('bs_enable_live_widget', JSON.stringify(enableLiveWidget)), [enableLiveWidget]);
  useEffect(() => localStorage.setItem('bs_grade_planner_subjects', JSON.stringify(gradeSubjects)), [gradeSubjects]);

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
    
    const parsedSDate = safeParse(semester.startDate);
    const sDate = parsedSDate ? startOfDay(parsedSDate) : null;

    const monthRecords = Object.entries(records).filter(([date]) => {
      const d = safeParse(date);
      if (!d) return false;
      return d >= start && d <= end && (!sDate || !isBefore(d, sDate));
    }) as [string, AttendanceRecord][];
    
    let held = 0;
    let attended = 0;
    monthRecords.forEach(([date, r]) => {
      const jmiHoliday = getJamiaHoliday(date);
      if (!r.isHoliday && !jmiHoliday.isHoliday) {
        held += r.held;
        attended += r.attended;
      }
    });

    return { held, attended, percentage: held > 0 ? (attended / held) * 100 : 0 };
  }, [records, semester]);

  const missedDays = useMemo(() => {
    if (!semester.startDate) return [];
    
    const parsedStartDate = safeParse(semester.startDate);
    if (!parsedStartDate) return [];
    
    let start: Date | null = null;
    if (semester.lockedUntil) {
      const parsedLocked = safeParse(semester.lockedUntil);
      if (parsedLocked) {
        start = addDays(parsedLocked, 1);
      }
    }
    if (!start) {
      start = parsedStartDate;
    }
      
    if (!start || isNaN(start.getTime())) return [];
      
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);
    
    if (isNaN(yesterday.getTime()) || isAfter(start, yesterday)) return [];
    
    try {
      const days = eachDayOfInterval({ start, end: yesterday });
      return days.filter(day => {
        const dateStr = formatDate(day);
        const jmiHoliday = getJamiaHoliday(day);
        return !records[dateStr] && !jmiHoliday.isHoliday;
      }).map(d => formatDate(d));
    } catch (e) {
      return [];
    }
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

  const handleSaveGapEntry = () => {
    const currentGapDate = gapDays[currentGapIndex];
    if (currentGapDate) {
      updateAttendance(currentGapDate, gapIsHoliday ? 0 : gapHeld, gapIsHoliday ? 0 : gapAttended, gapIsHoliday);
      
      if (currentGapIndex + 1 < gapDays.length) {
        setCurrentGapIndex(prev => prev + 1);
      } else {
        setAppState('MAIN');
        setGapDays([]);
        setCurrentGapIndex(0);
      }
    }
  };

  const handleSkipGapEntry = () => {
    if (currentGapIndex + 1 < gapDays.length) {
      setCurrentGapIndex(prev => prev + 1);
    } else {
      setAppState('MAIN');
      setGapDays([]);
      setCurrentGapIndex(0);
    }
  };

  const handleExitGapHandling = () => {
    setAppState('MAIN');
    setGapDays([]);
    setCurrentGapIndex(0);
  };

  const handleMarkPresent = (slotId: number, subjectName: string) => {
    const today = getTodayStr();
    const key = `${today}_${slotId}`;
    
    // 1. Update subject attendance
    setSubjectAttendance(prev => {
      const current = prev[subjectName] || { attended: 0, held: 0 };
      return {
        ...prev,
        [subjectName]: {
          attended: current.attended + 1,
          held: current.held + 1
        }
      };
    });

    // 2. Mark slot
    setMarkedScheduleSlots(prev => ({
      ...prev,
      [key]: 'present'
    }));

    // 3. Update global daily attendance record
    const todayRecord = records[today] || { date: today, held: 0, attended: 0, isHoliday: false };
    if (!todayRecord.isHoliday) {
      updateAttendance(today, todayRecord.held + 1, todayRecord.attended + 1, false);
    }
  };

  const handleMarkAbsent = (slotId: number, subjectName: string) => {
    const today = getTodayStr();
    const key = `${today}_${slotId}`;
    
    // 1. Update subject attendance
    setSubjectAttendance(prev => {
      const current = prev[subjectName] || { attended: 0, held: 0 };
      return {
        ...prev,
        [subjectName]: {
          ...current,
          held: current.held + 1
        }
      };
    });

    // 2. Mark slot
    setMarkedScheduleSlots(prev => ({
      ...prev,
      [key]: 'absent'
    }));

    // 3. Update global daily attendance record
    const todayRecord = records[today] || { date: today, held: 0, attended: 0, isHoliday: false };
    if (!todayRecord.isHoliday) {
      updateAttendance(today, todayRecord.held + 1, todayRecord.attended, false);
    }
  };

  const handleUndoMark = (slotId: number, subjectName: string) => {
    const today = getTodayStr();
    const key = `${today}_${slotId}`;
    const wasStatus = markedScheduleSlots[key];
    if (!wasStatus) return;

    // 1. Revert subject attendance
    setSubjectAttendance(prev => {
      const current = prev[subjectName] || { attended: 0, held: 0 };
      return {
        ...prev,
        [subjectName]: {
          attended: Math.max(0, current.attended - (wasStatus === 'present' ? 1 : 0)),
          held: Math.max(0, current.held - 1)
        }
      };
    });

    // 2. Unmark slot
    setMarkedScheduleSlots(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });

    // 3. Revert global daily attendance record
    const todayRecord = records[today];
    if (todayRecord && !todayRecord.isHoliday) {
      const nextHeld = Math.max(0, todayRecord.held - 1);
      const nextAttended = Math.max(0, todayRecord.attended - (wasStatus === 'present' ? 1 : 0));
      updateAttendance(today, nextHeld, nextAttended, false);
    }
  };

  // --- Handlers ---

  const updateAttendance = (date: string, held: number, attended: number, isHoliday: boolean) => {
    setRecords(prev => ({
      ...prev,
      [date]: { date, held, attended, isHoliday }
    }));
    if (!isHoliday) {
      logCustomEvent('attendance_marked', {
        branch: profile.department || 'Unknown',
        semester: profile.semester || 'Unknown'
      });
    }

    // Sync marked status to Firestore if user is authenticated
    const currentUser = auth?.currentUser;
    if (currentUser) {
      const isToday = date === getTodayStr();
      if (isToday) {
        saveUserAttendanceStatusToFirestore(currentUser.uid, date, held > 0 && !isHoliday);
      }
    }
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

  if (!onboardingCompleted) {
    return renderOnboarding();
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
    if (!date || isNaN(date.getTime())) return undefined;
    const dateStr = formatDate(date);
    if (!dateStr) return undefined;
    return exams.find(e => {
      const estart = safeParse(e.startDate);
      const eend = safeParse(e.endDate);
      const d = safeParse(dateStr);
      if (!estart || !eend || !d) return false;
      return startOfDay(d) >= startOfDay(estart) && startOfDay(d) <= startOfDay(eend);
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

  const renderSemesterSetup = () => {
    return (
      <div className="space-y-6 pb-24">
        <div className="space-y-2 text-center py-6">
          <h2 className="text-3xl font-black tracking-tight animate-pulse text-primary">New Semester Setup</h2>
          <p className="text-zinc-500 text-sm">Fill in the details to start tracking your new semester.</p>
        </div>

        <Card className="space-y-4 p-6">
          <Input 
            label="Semester Title / Number" 
            value={semester.title || ''} 
            onChange={(v: string) => setSemester({ ...semester, title: v })} 
            placeholder="e.g. Semester 2, 3rd Sem" 
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
          
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Attendance Goal (%)</label>
            <div className="grid grid-cols-3 gap-2">
              {[60, 70, 75, 80, 85, 90].map(t => (
                <button 
                  key={t}
                  type="button"
                  onClick={() => setSemester({...semester, targetAttendance: t})}
                  className={`p-3 rounded-xl border text-sm transition-all font-bold ${semester.targetAttendance === t ? 'bg-primary border-primary text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                >
                  {t}%
                </button>
              ))}
            </div>
            <Input 
              type="number" 
              placeholder="Custom Target" 
              value={semester.targetAttendance} 
              onChange={(v: string) => setSemester({...semester, targetAttendance: parseInt(v) || 75})} 
            />
          </div>
        </Card>

        <Button 
          className="w-full py-4 text-lg font-bold" 
          disabled={!semester.startDate || !semester.endDate}
          onClick={() => {
            if (semester.startDate && semester.endDate) {
              setSemester({
                ...semester,
                isInitialized: true
              });
            }
          }}
        >
          Activate Semester
        </Button>
      </div>
    );
  };

  function renderOnboarding() {
    // Pin Jamia Millia Islamia at the top
    const displayUniversities = (() => {
      const baseList = ["Jamia Millia Islamia", ...UNIVERSITIES_LIST, "Other"];
      if (!univSearchQuery) return baseList;
      return baseList.filter(u => u.toLowerCase().includes(univSearchQuery.toLowerCase()));
    })();

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-primary/20 animate-bounce">
              <CalendarIcon size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">BunkSafe</h1>
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Smart Attendance Planner</p>
          </div>

          <AnimatePresence mode="wait">
            {isManualOnboarding ? (
              <div className="space-y-4">
                {manualOnboardingStep === 1 && (
                  <motion.div key="manual_step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                    <div className="text-center pb-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">Step 1 of 7</span>
                      <h2 className="text-xl font-bold mt-1">Choose Your University</h2>
                      <p className="text-zinc-500 text-sm mt-1">Which university or college do you attend?</p>
                    </div>
                    
                    <Card className="space-y-4 p-5 text-left">
                      <Input
                        label="Full Name"
                        value={manualName}
                        onChange={setManualName}
                        placeholder="Enter your name"
                      />

                      <div className="space-y-1.5 relative">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">Search University</label>
                        <div className="relative">
                          <Search size={18} className="absolute left-3 top-3 text-zinc-500" />
                          <input
                            type="text"
                            placeholder="Search university..."
                            value={univSearchQuery}
                            onChange={(e) => setUnivSearchQuery(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-100 focus:outline-none focus:border-primary transition-colors text-sm font-semibold"
                          />
                        </div>
                        
                        <div className="mt-2 max-h-48 overflow-y-auto bg-zinc-950 border border-zinc-800/80 rounded-xl p-1 divide-y divide-zinc-900 custom-scrollbar">
                          {displayUniversities.map((univ) => {
                            const isSelected = manualUniversity === univ;
                            return (
                              <button
                                key={univ}
                                type="button"
                                onClick={() => {
                                  setManualUniversity(univ);
                                  if (univ !== 'Other') {
                                    setManualUniversityInput('');
                                  }
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${isSelected ? 'bg-primary/15 text-primary font-extrabold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
                              >
                                <span className="flex items-center gap-1.5">
                                  {univ === "Jamia Millia Islamia" && <Star size={12} className="text-yellow-500 fill-yellow-500 animate-pulse" />}
                                  {univ}
                                </span>
                                {isSelected && <Check size={14} className="text-primary" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {manualUniversity === 'Other' && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                          <Input
                            label="Enter University Name"
                            value={manualUniversityInput}
                            onChange={setManualUniversityInput}
                            placeholder="Enter your college or university name"
                          />
                        </motion.div>
                      )}
                    </Card>

                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={() => {
                        setIsManualOnboarding(false);
                        setOnboardingStep(1);
                      }}>
                        Back
                      </Button>
                      <Button
                        className="flex-1"
                        disabled={!manualName.trim() || !manualUniversity || (manualUniversity === 'Other' && !manualUniversityInput.trim())}
                        onClick={() => setManualOnboardingStep(2)}
                      >
                        Next
                      </Button>
                    </div>
                  </motion.div>
                )}

                {manualOnboardingStep === 2 && (() => {
                  const isJmi = manualUniversity === "Jamia Millia Islamia";
                  const facultiesList = Object.keys(JAMIA_FACULTIES_DEPARTMENTS);
                  const filteredFaculties = [...facultiesList, "Other"].filter(f =>
                    f.toLowerCase().includes(facultySearchQuery.toLowerCase())
                  );
                  
                  return (
                    <motion.div key="manual_step2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                      <div className="text-center pb-2">
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Step 2 of 7</span>
                        <h2 className="text-xl font-bold mt-1">Choose Your Faculty</h2>
                        <p className="text-zinc-500 text-sm mt-1">Specify your academic department group or faculty.</p>
                      </div>

                      <Card className="space-y-4 p-5 text-left">
                        {isJmi ? (
                          <div className="space-y-1.5 relative">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">Search Faculty</label>
                            <div className="relative">
                              <Search size={18} className="absolute left-3 top-3 text-zinc-500" />
                              <input
                                type="text"
                                placeholder="Search JMI faculties..."
                                value={facultySearchQuery}
                                onChange={(e) => setFacultySearchQuery(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-100 focus:outline-none focus:border-primary transition-colors text-sm font-semibold"
                              />
                            </div>

                            <div className="mt-2 max-h-48 overflow-y-auto bg-zinc-950 border border-zinc-800/80 rounded-xl p-1 divide-y divide-zinc-900 custom-scrollbar">
                              {filteredFaculties.map((fac) => {
                                const isSelected = manualFaculty === fac;
                                return (
                                  <button
                                    key={fac}
                                    type="button"
                                    onClick={() => {
                                      setManualFaculty(fac);
                                      if (fac !== 'Other') {
                                        setManualFacultyInput('');
                                        const firstDept = JAMIA_FACULTIES_DEPARTMENTS[fac]?.[0] || '';
                                        setManualDept(firstDept);
                                      } else {
                                        setManualDept('Other');
                                      }
                                    }}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${isSelected ? 'bg-primary/15 text-primary font-extrabold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
                                  >
                                    <span>{fac}</span>
                                    {isSelected && <Check size={14} className="text-primary" />}
                                  </button>
                                );
                              })}
                            </div>

                            {manualFaculty === 'Other' && (
                              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
                                <Input
                                  label="Enter Faculty Name"
                                  value={manualFacultyInput}
                                  onChange={setManualFacultyInput}
                                  placeholder="e.g. Faculty of Engineering"
                                />
                              </motion.div>
                            )}
                          </div>
                        ) : (
                          <Input
                            label="Faculty"
                            value={manualFacultyInput}
                            onChange={setManualFacultyInput}
                            placeholder="e.g. Engineering & Technology"
                          />
                        )}
                      </Card>

                      <div className="flex gap-3">
                        <Button variant="secondary" className="flex-1" onClick={() => setManualOnboardingStep(1)}>
                          Back
                        </Button>
                        <Button
                          className="flex-1"
                          disabled={isJmi ? (!manualFaculty || (manualFaculty === 'Other' && !manualFacultyInput.trim())) : !manualFacultyInput.trim()}
                          onClick={() => setManualOnboardingStep(3)}
                        >
                          Next
                        </Button>
                      </div>
                    </motion.div>
                  );
                })()}

                {manualOnboardingStep === 3 && (() => {
                  const isJmi = manualUniversity === "Jamia Millia Islamia";
                  let deptsList: string[] = [];
                  if (isJmi && manualFaculty !== 'Other') {
                    deptsList = JAMIA_FACULTIES_DEPARTMENTS[manualFaculty] || [];
                  }
                  const filteredDepts = [...deptsList, "Other"].filter(d =>
                    d.toLowerCase().includes(deptSearchQuery.toLowerCase())
                  );

                  return (
                    <motion.div key="manual_step3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                      <div className="text-center pb-2">
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Step 3 of 7</span>
                        <h2 className="text-xl font-bold mt-1">Choose Your Department</h2>
                        <p className="text-zinc-500 text-sm mt-1">Which branch, major, or department are you in?</p>
                      </div>

                      <Card className="space-y-4 p-5 text-left">
                        {isJmi && manualFaculty !== 'Other' ? (
                          <div className="space-y-1.5 relative">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">Search Department</label>
                            <div className="relative">
                              <Search size={18} className="absolute left-3 top-3 text-zinc-500" />
                              <input
                                type="text"
                                placeholder="Search departments..."
                                value={deptSearchQuery}
                                onChange={(e) => setDeptSearchQuery(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-100 focus:outline-none focus:border-primary transition-colors text-sm font-semibold"
                              />
                            </div>

                            <div className="mt-2 max-h-48 overflow-y-auto bg-zinc-950 border border-zinc-800/80 rounded-xl p-1 divide-y divide-zinc-900 custom-scrollbar">
                              {filteredDepts.map((dept) => {
                                const isSelected = manualDept === dept;
                                return (
                                  <button
                                    key={dept}
                                    type="button"
                                    onClick={() => {
                                      setManualDept(dept);
                                      if (dept !== 'Other') {
                                        setManualDeptInput('');
                                      }
                                    }}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${isSelected ? 'bg-primary/15 text-primary font-extrabold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
                                  >
                                    <span>{dept}</span>
                                    {isSelected && <Check size={14} className="text-primary" />}
                                  </button>
                                );
                              })}
                            </div>

                            {manualDept === 'Other' && (
                              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
                                <Input
                                  label="Enter Department Name"
                                  value={manualDeptInput}
                                  onChange={setManualDeptInput}
                                  placeholder="e.g. Information Technology"
                                />
                              </motion.div>
                            )}
                          </div>
                        ) : (
                          <Input
                            label="Department / Branch"
                            value={manualDeptInput}
                            onChange={setManualDeptInput}
                            placeholder="e.g. Computer Science"
                          />
                        )}
                      </Card>

                      <div className="flex gap-3">
                        <Button variant="secondary" className="flex-1" onClick={() => setManualOnboardingStep(2)}>
                          Back
                        </Button>
                        <Button
                          className="flex-1"
                          disabled={(isJmi && manualFaculty !== 'Other') ? (!manualDept || (manualDept === 'Other' && !manualDeptInput.trim())) : !manualDeptInput.trim()}
                          onClick={() => setManualOnboardingStep(4)}
                        >
                          Next
                        </Button>
                      </div>
                    </motion.div>
                  );
                })()}

                {manualOnboardingStep === 4 && (
                  <motion.div key="manual_step4" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                    <div className="text-center pb-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">Step 4 of 7</span>
                      <h2 className="text-xl font-bold mt-1">Select Your Semester</h2>
                      <p className="text-zinc-500 text-sm mt-1">Which semester are you currently in?</p>
                    </div>

                    <Card className="space-y-4 p-5 text-left">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Semester</label>
                        <div className="grid grid-cols-3 gap-2">
                          {Array.from({ length: 10 }, (_, i) => `Semester ${i + 1}`).map(sem => {
                            const isSelected = manualSem === sem;
                            return (
                              <button
                                key={sem}
                                type="button"
                                onClick={() => {
                                  setManualSem(sem);
                                  setManualSemInput('');
                                }}
                                className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${isSelected ? 'bg-primary border-primary text-white font-black shadow-lg shadow-primary/25' : 'bg-zinc-800 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'}`}
                              >
                                Sem {sem.split(' ')[1]}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => {
                              setManualSem('Other');
                            }}
                            className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${manualSem === 'Other' ? 'bg-primary border-primary text-white font-black shadow-lg shadow-primary/25' : 'bg-zinc-800 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'}`}
                          >
                            Other
                          </button>
                        </div>
                      </div>

                      {manualSem === 'Other' && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                          <Input
                            label="Enter Semester Name"
                            value={manualSemInput}
                            onChange={setManualSemInput}
                            placeholder="e.g. Trimester 1, Year 2"
                          />
                        </motion.div>
                      )}
                    </Card>

                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={() => setManualOnboardingStep(3)}>
                        Back
                      </Button>
                      <Button
                        className="flex-1"
                        disabled={!manualSem || (manualSem === 'Other' && !manualSemInput.trim())}
                        onClick={() => setManualOnboardingStep(5)}
                      >
                        Next
                      </Button>
                    </div>
                  </motion.div>
                )}

                {manualOnboardingStep === 5 && (
                  <motion.div key="manual_step5" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                    <div className="text-center pb-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">Step 5 of 7</span>
                      <h2 className="text-xl font-bold mt-1">Semester Start Date</h2>
                      <p className="text-zinc-500 text-sm mt-1">When does your current semester begin?</p>
                    </div>

                    <Card className="p-5 text-left space-y-4">
                      <Input
                        type="date"
                        label="Start Date"
                        value={manualStartDate}
                        onChange={setManualStartDate}
                      />
                    </Card>

                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={() => setManualOnboardingStep(4)}>
                        Back
                      </Button>
                      <Button
                        className="flex-1"
                        disabled={!manualStartDate}
                        onClick={() => setManualOnboardingStep(6)}
                      >
                        Next
                      </Button>
                    </div>
                  </motion.div>
                )}

                {manualOnboardingStep === 6 && (
                  <motion.div key="manual_step6" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                    <div className="text-center pb-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">Step 6 of 7</span>
                      <h2 className="text-xl font-bold mt-1">Semester End Date</h2>
                      <p className="text-zinc-500 text-sm mt-1">When does your semester classes or examinations end?</p>
                    </div>

                    <Card className="p-5 text-left space-y-4">
                      <Input
                        type="date"
                        label="End Date"
                        value={manualEndDate}
                        onChange={setManualEndDate}
                      />
                      {manualStartDate && manualEndDate && manualEndDate < manualStartDate && (
                        <p className="text-xs text-red-500 font-semibold mt-1">⚠️ End Date must be after Start Date.</p>
                      )}
                    </Card>

                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={() => setManualOnboardingStep(5)}>
                        Back
                      </Button>
                      <Button
                        className="flex-1"
                        disabled={!manualEndDate || (manualStartDate && manualEndDate < manualStartDate)}
                        onClick={() => setManualOnboardingStep(7)}
                      >
                        Next
                      </Button>
                    </div>
                  </motion.div>
                )}

                {manualOnboardingStep === 7 && (
                  <motion.div key="manual_step7" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                    <div className="text-center pb-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">Step 7 of 7</span>
                      <h2 className="text-xl font-bold mt-1">Set Target Attendance</h2>
                      <p className="text-zinc-500 text-sm mt-1">Choose the minimum attendance percentage you want to maintain.</p>
                    </div>

                    <Card className="space-y-4 p-5 text-left">
                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Attendance Goal (%)</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[60, 70, 75, 80, 85, 90].map(t => (
                            <button 
                              key={t}
                              type="button"
                              onClick={() => setManualTargetAttendance(t)}
                              className={`py-3 px-1 rounded-xl border text-sm transition-all font-bold ${manualTargetAttendance === t ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25 font-black' : 'bg-zinc-800 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'}`}
                            >
                              {t}%
                            </button>
                          ))}
                        </div>
                        <div className="pt-2">
                          <Input 
                            type="number" 
                            placeholder="Custom Target" 
                            value={manualTargetAttendance} 
                            onChange={(v: string) => setManualTargetAttendance(parseInt(v) || 75)} 
                          />
                        </div>
                      </div>
                    </Card>

                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={() => setManualOnboardingStep(6)}>
                        Back
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          const isJmi = (manualUniversity === 'Jamia Millia Islamia');
                          const isEngTech = (manualFaculty === 'Faculty of Engineering & Technology');
                          const deptValue = manualDept === 'Other' ? manualDeptInput : manualDept;
                          
                          const isJmiECE = deptValue === 'Electronics & Communication Engineering';
                          const isJmiCivil = deptValue.includes('Civil Engineering');
                          const isJmiVLSI = deptValue.includes('VLSI Design');
                          const isJmiElec = deptValue === 'Electrical Engineering';
                          const isJmiMech = deptValue === 'Mechanical Engineering';
                          const isJmiCsds = deptValue.includes('Computer Science') && deptValue.includes('Data Science');
                          const isJmiCompEng = deptValue === 'Computer Engineering' || (deptValue.includes('Computer') && !deptValue.includes('Data Science') && !deptValue.includes('Electrical'));
                          const isJmiEec = deptValue.includes('Electrical & Computer');
                          
                          const semTitleValue = manualSem === 'Other' ? manualSemInput : manualSem;
                          const isSupportedBranch = isJmiECE || isJmiCivil || isJmiVLSI || isJmiElec || isJmiMech || isJmiCsds || isJmiCompEng || isJmiEec;
                          
                          let loadedSubjects: any[] = [];
                          if (isJmi && isEngTech && isSupportedBranch) {
                            const { subjects: defaultSubs } = getDefaultCurriculumSubjects(semTitleValue, deptValue, 'SetA');
                            if (defaultSubs && defaultSubs.length > 0) {
                              loadedSubjects = defaultSubs;
                            }
                          }

                          const calculatedProfile = {
                            name: manualName || 'Student',
                            email: profile.email || 'student@jmi.ac.in',
                            college: manualUniversity === 'Other' ? manualUniversityInput : manualUniversity,
                            department: deptValue,
                            semester: semTitleValue,
                            mobile: '',
                            avatar: profile.avatar || '',
                            faculty: manualFaculty === 'Other' ? manualFacultyInput : manualFaculty,
                            semesterStartDate: manualStartDate,
                            semesterEndDate: manualEndDate,
                            attendanceTarget: manualTargetAttendance,
                            programme: 'Regular'
                          };
                          setProfile(calculatedProfile);

                          setSemester({
                            title: semTitleValue,
                            startDate: manualStartDate,
                            endDate: manualEndDate,
                            targetAttendance: manualTargetAttendance,
                            isInitialized: true,
                            initialHeld: 0,
                            initialAttended: 0
                          });

                          if (loadedSubjects.length > 0) {
                            setSubjects(loadedSubjects);
                            setSyllabusLoadStatus('loaded');
                          } else {
                            setSubjects([]);
                            setSyllabusLoadStatus('not_found');
                          }

                          setManualOnboardingStep(8);
                        }}
                      >
                        Finish Setup
                      </Button>
                    </div>
                  </motion.div>
                )}

                {manualOnboardingStep === 8 && (
                  <motion.div key="manual_step8" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                    <div className="text-center pb-2">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary mb-2">
                        <Sparkles size={24} className="animate-pulse" />
                      </div>
                      <h2 className="text-xl font-bold">Setup Completed!</h2>
                      <p className="text-zinc-500 text-sm mt-1">Here is your customized setup overview.</p>
                    </div>

                    <Card className="space-y-4 p-5 text-left max-h-[320px] overflow-y-auto custom-scrollbar">
                      <div>
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">University</label>
                        <span className="text-sm font-bold text-white block mt-0.5">{manualUniversity === 'Other' ? manualUniversityInput : manualUniversity}</span>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">Faculty & Department</label>
                        <span className="text-sm font-bold text-white block mt-0.5">
                          {manualFaculty === 'Other' ? manualFacultyInput : manualFaculty} &rarr; {manualDept === 'Other' ? manualDeptInput : manualDept}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">Semester</label>
                          <span className="text-sm font-bold text-white block mt-0.5">{manualSem === 'Other' ? manualSemInput : manualSem}</span>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">Attendance Goal</label>
                          <span className="text-sm font-bold text-white block mt-0.5">{manualTargetAttendance}%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">Start Date</label>
                          <span className="text-sm font-bold text-white block mt-0.5">{manualStartDate}</span>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">End Date</label>
                          <span className="text-sm font-bold text-white block mt-0.5">{manualEndDate}</span>
                        </div>
                      </div>

                      <hr className="border-zinc-850" />

                      {syllabusLoadStatus === 'loaded' ? (
                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3.5 space-y-2">
                          <div className="flex gap-2 items-center text-primary">
                            <CheckCircle2 size={16} />
                            <h4 className="text-xs font-black uppercase tracking-wider">JMI B.Tech Syllabus Loaded</h4>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            We found a pre-configured JMI syllabus for your branch and successfully loaded all the subjects for you.
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {subjects.map(s => (
                              <span key={s.id} className="text-[10px] font-bold px-2 py-0.5 bg-primary/20 text-primary-light rounded-md">
                                {s.name.split(' ').slice(1).join(' ') || s.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3.5 space-y-2">
                          <div className="flex gap-2 items-center text-amber-500">
                            <AlertCircle size={16} />
                            <h4 className="text-xs font-black uppercase tracking-wider">No Default Syllabus Available</h4>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            No pre-configured syllabus was found for your specific course combinations. Don't worry! You can manually add your classes and subjects exactly as you like directly on your dashboard.
                          </p>
                        </div>
                      )}
                    </Card>

                    <Button
                      className="w-full py-3.5 shadow-lg shadow-primary/20 text-sm font-bold mt-2"
                      onClick={() => {
                        localStorage.setItem('bs_onboarding_completed', 'true');
                        setOnboardingCompleted(true);
                      }}
                    >
                      Go to Dashboard &rarr;
                    </Button>
                  </motion.div>
                )}
              </div>
            ) : (
              <>
                {onboardingStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="text-center pb-2">
                      <h2 className="text-2xl font-black text-white">Welcome to BunkSafe</h2>
                      <p className="text-zinc-400 text-sm mt-2">Are you a Jamia B.Tech student?</p>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsJamiaStudent(true);
                          setOnboardingStep(2);
                        }}
                        className="w-full text-left p-5 rounded-2xl bg-zinc-900 border border-zinc-850 hover:border-primary/50 transition-all hover:bg-zinc-900/80 group flex gap-4 items-center"
                      >
                        <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                          <GraduationCap size={24} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h3 className="font-bold text-zinc-200 group-hover:text-white transition-all">✅ Yes</h3>
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            Continue with the Jamia B.Tech student academic calendar, syllabus & exam tracking.
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsManualOnboarding(true);
                          setManualOnboardingStep(1);
                        }}
                        className="w-full text-left p-5 rounded-2xl bg-zinc-900 border border-zinc-850 hover:border-zinc-700 transition-all hover:bg-zinc-900/80 group flex gap-4 items-center"
                      >
                        <div className="p-3 bg-zinc-850 text-zinc-400 rounded-xl group-hover:bg-zinc-700 group-hover:text-zinc-200 transition-all">
                          <Settings size={24} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h3 className="font-bold text-zinc-300 group-hover:text-white transition-all">❌ No (Manual Setup)</h3>
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            Set up custom college, department, semester dates, and target attendance.
                          </p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {onboardingStep === 2 && (() => {
                  const isSem1or2 = onboardSem === 'Semester 1' || onboardSem === 'Semester 2';
                  const isFormValid = !!(onboardName.trim() && onboardSem && (isSem1or2 || (onboardProgramme && onboardDept)));

                  return (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-5"
                    >
                      <div className="text-center">
                        <h2 className="text-xl font-bold">Your Details</h2>
                        <p className="text-zinc-500 text-sm mt-1">Please enter your academic information.</p>
                      </div>

                      <Card className="space-y-4 p-5">
                        <Input 
                          label="Full Name" 
                          value={onboardName} 
                          onChange={setOnboardName} 
                          placeholder="Enter your name" 
                        />

                        <div className="space-y-2 text-left">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Semester</label>
                          <div className="grid grid-cols-4 gap-2">
                            {Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`).map(sem => (
                              <button
                                key={sem}
                                type="button"
                                onClick={() => {
                                  setOnboardSem(sem);
                                  logCustomEvent('semester_selected', { semester: sem });
                                  const is1or2 = sem === 'Semester 1' || sem === 'Semester 2';
                                  if (is1or2) {
                                    setOnboardDept('Applied Science & Humanities');
                                    setOnboardProgramme('');
                                    logCustomEvent('branch_selected', { branch: 'Applied Science & Humanities' });
                                  } else {
                                    setOnboardDept('');
                                    setOnboardProgramme('Regular');
                                  }

                                  // Jamia B.Tech-specific Odd/Even academic calendar preset dates
                                  const semNum = parseInt(sem.split(' ')[1]) || 1;
                                  const isEvenSem = semNum % 2 === 0;
                                  if (isEvenSem) {
                                    setOnboardStartDate('2026-01-05');
                                    setOnboardEndDate('2026-05-10');
                                    setOnboardMid1Start('2026-03-02');
                                    setOnboardMid1End('2026-03-06');
                                    setOnboardMid2Start('2026-04-20');
                                    setOnboardMid2End('2026-04-24');
                                    setOnboardEndSemStart('2026-05-15');
                                    setOnboardEndSemEnd('2026-06-10');
                                  } else {
                                    setOnboardStartDate('2026-07-17');
                                    setOnboardEndDate('2026-11-20');
                                    setOnboardMid1Start('2026-09-14');
                                    setOnboardMid1End('2026-09-18');
                                    setOnboardMid2Start('2026-11-02');
                                    setOnboardMid2End('2026-11-06');
                                    setOnboardEndSemStart('2026-11-25');
                                    setOnboardEndSemEnd('2026-12-20');
                                  }
                                }}
                                className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${onboardSem === sem ? 'bg-primary border-primary text-white font-black' : 'bg-zinc-800 border-zinc-700/60 text-zinc-400'}`}
                              >
                                Sem {sem.split(' ')[1]}
                              </button>
                            ))}
                          </div>
                        </div>

                        <AnimatePresence mode="popLayout">
                          {!isSem1or2 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-4 overflow-hidden"
                            >
                              <div className="space-y-2 text-left">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Programme</label>
                                <div className="grid grid-cols-2 gap-2">
                                  {(['Regular', 'Self-Financed'] as const).map(prog => (
                                    <button
                                      key={prog}
                                      type="button"
                                      onClick={() => {
                                        setOnboardProgramme(prog);
                                        setOnboardDept('');
                                      }}
                                      className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${onboardProgramme === prog ? 'bg-primary border-primary text-white font-black' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-400'}`}
                                    >
                                      {prog}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {onboardProgramme && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="space-y-1 text-left"
                                >
                                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Branch</label>
                                  <select
                                    value={onboardDept}
                                    onChange={(e) => {
                                      setOnboardDept(e.target.value);
                                      logCustomEvent('branch_selected', { branch: e.target.value });
                                    }}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-primary transition-colors text-sm font-bold"
                                  >
                                    <option value="">Select your branch</option>
                                    {onboardProgramme === 'Regular' ? (
                                      <>
                                        <option value="Civil Engineering">Civil Engineering</option>
                                        <option value="Electrical Engineering">Electrical Engineering</option>
                                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                                        <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                                        <option value="Computer Engineering">Computer Engineering</option>
                                      </>
                                    ) : (
                                      <>
                                        <option value="Civil Engineering (Construction Technology) (Self-Financed)">Civil Engineering (Construction Technology) (Self-Financed)</option>
                                        <option value="Electrical & Computer Engineering (Self-Financed)">Electrical & Computer Engineering (Self-Financed)</option>
                                        <option value="Robotics & Artificial Intelligence (Self-Financed)">Robotics & Artificial Intelligence (Self-Financed)</option>
                                        <option value="Electronics (VLSI Design & Technology) (Self-Financed)">Electronics (VLSI Design & Technology) (Self-Financed)</option>
                                        <option value="Computer Science & Engineering (Data Sciences) (Self-Financed)">Computer Science & Engineering (Data Sciences) (Self-Financed)</option>
                                      </>
                                    )}
                                  </select>
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>

                      <div className="flex gap-3">
                        <Button variant="secondary" className="flex-1" onClick={() => setOnboardingStep(1)}>
                          Back
                        </Button>
                        <Button 
                          className="flex-1" 
                          onClick={() => {
                            if (isFormValid) {
                              setOnboardingStep(3);
                            }
                          }}
                          disabled={!isFormValid}
                        >
                          Next
                        </Button>
                      </div>
                    </motion.div>
                  );
                })()}

                {onboardingStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-5"
                  >
                    <div className="text-center space-y-1">
                      <h2 className="text-xl font-bold text-primary">Academic Calendar</h2>
                      <p className="text-zinc-500 text-sm">Review & customize dates loaded from Jamia calendar.</p>
                    </div>

                    <div className="bg-primary/10 border border-primary/25 rounded-2xl p-4 flex gap-3 items-start text-left">
                      <Info size={18} className="text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-primary/90 leading-relaxed font-medium">
                        We have fetched these details as per Jamia academic calendar. Feel free to edit them now, or you can modify them anytime in the app settings later.
                      </p>
                    </div>

                    <Card className="space-y-4 p-5 max-h-[350px] overflow-y-auto custom-scrollbar text-left">
                      <div>
                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Semester Timeline</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <Input 
                            type="date" 
                            label="Start Date" 
                            value={onboardStartDate} 
                            onChange={setOnboardStartDate} 
                          />
                          <Input 
                            type="date" 
                            label="End Date" 
                            value={onboardEndDate} 
                            onChange={setOnboardEndDate} 
                          />
                        </div>
                      </div>

                      <hr className="border-zinc-800" />

                      <div>
                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">1st Mid Sem Exam</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <Input 
                            type="date" 
                            label="Start Date" 
                            value={onboardMid1Start} 
                            onChange={setOnboardMid1Start} 
                          />
                          <Input 
                            type="date" 
                            label="End Date" 
                            value={onboardMid1End} 
                            onChange={setOnboardMid1End} 
                          />
                        </div>
                      </div>

                      <hr className="border-zinc-800" />

                      <div>
                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">2nd Mid Sem Exam</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <Input 
                            type="date" 
                            label="Start Date" 
                            value={onboardMid2Start} 
                            onChange={setOnboardMid2Start} 
                          />
                          <Input 
                            type="date" 
                            label="End Date" 
                            value={onboardMid2End} 
                            onChange={setOnboardMid2End} 
                          />
                        </div>
                      </div>

                      <hr className="border-zinc-800" />

                      <div>
                        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">End Sem Exam</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <Input 
                            type="date" 
                            label="Start Date" 
                            value={onboardEndSemStart} 
                            onChange={setOnboardEndSemStart} 
                          />
                          <Input 
                            type="date" 
                            label="End Date" 
                            value={onboardEndSemEnd} 
                            onChange={setOnboardEndSemEnd} 
                          />
                        </div>
                      </div>
                    </Card>

                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1" onClick={() => setOnboardingStep(2)}>
                        Back
                      </Button>
                      <Button className="flex-1" onClick={() => {
                        setProfile({
                          name: onboardName,
                          email: profile.email || 'student@jmi.ac.in',
                          college: 'Jamia Millia Islamia',
                          department: onboardDept,
                          semester: onboardSem,
                          mobile: '',
                          avatar: '',
                          programme: (onboardSem === 'Semester 1' || onboardSem === 'Semester 2') ? 'Regular' : onboardProgramme
                        });

                        logCustomEvent('branch_selected', { branch: onboardDept });
                        logCustomEvent('semester_selected', { semester: onboardSem });

                        setSemester({
                          title: onboardSem,
                          startDate: onboardStartDate,
                          endDate: onboardEndDate,
                          targetAttendance: 75,
                          isInitialized: true,
                          initialHeld: 0,
                          initialAttended: 0
                        });

                        const preparedExams: Exam[] = [
                          {
                            id: 'j_mid1',
                            type: 'Mid-sem',
                            label: '1st Mid Sem',
                            startDate: onboardMid1Start,
                            endDate: onboardMid1End
                          },
                          {
                            id: 'j_mid2',
                            type: 'Mid-sem',
                            label: '2nd Mid Sem',
                            startDate: onboardMid2Start,
                            endDate: onboardMid2End
                          },
                          {
                            id: 'j_endsem',
                            type: 'End-sem',
                            label: 'End-sem Exam',
                            startDate: onboardEndSemStart,
                            endDate: onboardEndSemEnd
                          }
                        ];
                        setExams(preparedExams);

                        const isJmiECE = onboardDept === 'Electronics & Communication Engineering';
                        const isJmiCivil = onboardDept.includes('Civil Engineering');
                        const isJmiVLSI = onboardDept.includes('VLSI Design');
                        const isJmiElec = onboardDept === 'Electrical Engineering';
                        const isJmiMech = onboardDept === 'Mechanical Engineering';
                        const isJmiCsds = onboardDept.includes('Computer Science') && onboardDept.includes('Data Science');
                        const isJmiCompEng = onboardDept === 'Computer Engineering' || (onboardDept.includes('Computer') && !onboardDept.includes('Data Science') && !onboardDept.includes('Electrical'));
                        const isJmiEec = onboardDept.includes('Electrical & Computer');
                        const isFirstYear = onboardSem === 'Semester 1' || onboardSem === 'Semester 2';

                        if (isFirstYear || isJmiECE || isJmiCivil || isJmiVLSI || isJmiElec || isJmiMech || isJmiCsds || isJmiCompEng || isJmiEec) {
                          const { subjects: defaultSubs } = getDefaultCurriculumSubjects(onboardSem, onboardDept, 'SetA');
                          if (defaultSubs && defaultSubs.length > 0) {
                            setSubjects(defaultSubs);
                          }
                        }

                        localStorage.setItem('bs_onboarding_completed', 'true');
                        setOnboardingCompleted(true);
                      }}>
                        Finish & Activate
                      </Button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };;

  const renderGapHandling = () => {
    if (gapDays.length === 0 || currentGapIndex >= gapDays.length) return null;
    const currentDateStr = gapDays[currentGapIndex];
    const currentDate = safeParse(currentDateStr);
    if (!currentDate) return null;

    return (
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <AlertCircle size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Missed Attendance</h1>
              <p className="text-xs text-zinc-500 font-medium">Resolve pending class days</p>
            </div>
          </div>
          <Button variant="ghost" className="text-xs px-2.5 py-1" onClick={handleExitGapHandling}>
            Exit
          </Button>
        </header>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-500 font-bold uppercase tracking-wider">
            <span>Progress</span>
            <span>{currentGapIndex + 1} of {gapDays.length} Days</span>
          </div>
          <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentGapIndex + 1) / gapDays.length) * 100}%` }}
            />
          </div>
        </div>

        <Card className="p-6 space-y-6 relative overflow-hidden">
          {/* Subtle date display banner */}
          <div className="text-center py-4 bg-zinc-800/20 rounded-2xl border border-zinc-800/40">
            <span className="text-[10px] font-black tracking-widest text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
              {format(currentDate, 'EEEE')}
            </span>
            <h2 className="text-2xl font-black text-white mt-3">
              {format(currentDate, 'dd/MM/yyyy')}
            </h2>
          </div>

          {/* Toggle Choice */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setGapIsHoliday(false)}
              className={`py-3 px-4 rounded-xl font-bold text-sm border transition-all flex flex-col items-center justify-center gap-1.5 ${
                !gapIsHoliday 
                  ? 'bg-primary/10 border-primary text-primary' 
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <CheckCircle2 size={18} />
              Regular Class Day
            </button>
            <button
              onClick={() => setGapIsHoliday(true)}
              className={`py-3 px-4 rounded-xl font-bold text-sm border transition-all flex flex-col items-center justify-center gap-1.5 ${
                gapIsHoliday 
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400' 
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Info size={18} />
              Holiday / No Class
            </button>
          </div>

          {!gapIsHoliday ? (
            <div className="space-y-6 pt-2">
              {/* Classes Held Counter */}
              <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">Classes Held</h3>
                  <p className="text-xs text-zinc-500">Total lectures scheduled</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      const val = Math.max(1, gapHeld - 1);
                      setGapHeld(val);
                      if (gapAttended > val) setGapAttended(val);
                    }}
                    className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center text-zinc-300 font-bold"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-xl font-black text-white w-6 text-center">{gapHeld}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setGapHeld(prev => prev + 1);
                    }}
                    className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center text-zinc-300 font-bold"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Classes Attended Counter */}
              <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-zinc-100">Classes Attended</h3>
                  <p className="text-xs text-zinc-500">Lectures you sat in</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setGapAttended(prev => Math.max(0, prev - 1));
                    }}
                    className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center text-zinc-300 font-bold"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-xl font-black text-primary w-6 text-center">{gapAttended}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const val = gapAttended + 1;
                      setGapAttended(val);
                      if (val > gapHeld) setGapHeld(val);
                    }}
                    className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center text-zinc-300 font-bold"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-2xl text-center space-y-1 py-8">
              <p className="text-blue-400 font-bold text-sm">Marked as Holiday</p>
              <p className="text-zinc-500 text-xs">This date will be excluded from all attendance percentages.</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex gap-3">
            <Button
              variant="secondary"
              className="flex-1 py-3 text-sm font-bold"
              onClick={handleSkipGapEntry}
            >
              Skip Day
            </Button>
            <Button
              variant="primary"
              className="flex-1 py-3 text-sm font-bold"
              onClick={handleSaveGapEntry}
            >
              Save & Next
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  const renderDashboard = () => {
    if (!semester.isInitialized) {
      return renderSemesterSetup();
    }

    if (appState === 'GAP_HANDLING') {
      return renderGapHandling();
    }

    const parsedEndDate = semester.endDate ? parseISO(semester.endDate) : null;
    const isEnded = semester.isInitialized && parsedEndDate && !isNaN(parsedEndDate.getTime()) && isAfter(startOfDay(new Date()), startOfDay(parsedEndDate));
    if (isEnded) {
      return renderSemesterEndReport();
    }

    const today = getTodayStr();
    const currentDayName = format(new Date(), 'EEEE');
    const isWeekday = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(currentDayName);
    const todayRecord = records[today] || { held: 0, attended: 0, isHoliday: false };
    const parsedStartDate = semester.startDate ? parseISO(semester.startDate) : null;
    const isNotStarted = parsedStartDate && !isNaN(parsedStartDate.getTime()) && isBefore(startOfDay(new Date()), startOfDay(parsedStartDate));

    const todayHolidayInfo = getJamiaHoliday(new Date());
    const isTodayHoliday = todayRecord.isHoliday || todayHolidayInfo.isHoliday;
    const todayHolidayName = todayHolidayInfo.name || todayRecord.holidayName || 'Holiday';

    return (
      <div className="space-y-6 pb-24">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-black text-lg border border-zinc-800 shadow-md shadow-primary/10 select-none"
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-zinc-500 text-sm">
                {(() => {
                  const hours = new Date().getHours();
                  if (hours < 10) return "Good Morning";
                  if (hours < 15) return "Good Afternoon";
                  return "Good Evening";
                })()}
              </p>
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
                  Your "{semester.title || 'Next Semester'}" is scheduled to begin on <span className="text-primary font-bold">{semester.startDate && !isNaN(parseISO(semester.startDate).getTime()) ? format(parseISO(semester.startDate), 'dd/MM/yyyy') : 'N/A'}</span>.
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
                  <span className="text-sm font-bold text-zinc-100">{semester.startDate && !isNaN(parseISO(semester.startDate).getTime()) ? format(parseISO(semester.startDate), 'dd/MM/yyyy') : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-zinc-400">End Date</span>
                  <span className="text-sm font-bold text-zinc-100">{semester.endDate && !isNaN(parseISO(semester.endDate).getTime()) ? format(parseISO(semester.endDate), 'dd/MM/yyyy') : 'N/A'}</span>
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

            <div className="grid grid-cols-1 gap-3">
              <Card className="relative overflow-hidden p-2.5">
                <div className="relative z-10 space-y-1.5">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">{semester.title || 'Semester'} Attendance</p>
                      <h2 className="text-2xl font-black">{stats.percentage.toFixed(1)}%</h2>
                      {semester.initialHeld > 0 && (
                        <p className="text-[9px] text-primary font-bold uppercase mt-0.5 flex items-center gap-1">
                          <Info size={9} /> Includes {semester.initialAttended}/{semester.initialHeld} from setup
                        </p>
                      )}
                    </div>
                    <p className="text-zinc-400 text-[11px] font-bold">{stats.totalAttended} / {stats.totalHeld}</p>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, stats.percentage)}%` }}
                      className={`h-full ${stats.percentage < semester.targetAttendance ? 'bg-red-500' : 'bg-primary'}`}
                    />
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Card className="space-y-1 p-3">
                  <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">{format(new Date(), 'MMMM')}</p>
                  <h3 className="text-xl font-extrabold">{monthlyStats.percentage.toFixed(1)}%</h3>
                  <p className="text-zinc-500 text-[11px] font-medium">{monthlyStats.attended} / {monthlyStats.held} classes</p>
                </Card>
                <Card className="space-y-1 p-3">
                  <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Target</p>
                  <h3 className="text-xl font-extrabold text-primary">{semester.targetAttendance}%</h3>
                  <p className="text-zinc-500 text-[11px] font-medium">Current Goal</p>
                </Card>
              </div>

              <Card className={`border-l-4 ${bunkInfo.status === 'SAFE' ? 'border-l-primary' : 'border-l-red-500'} p-4`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${bunkInfo.status === 'SAFE' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
                    {bunkInfo.status === 'SAFE' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-extrabold text-sm text-zinc-100 leading-snug">
                      {bunkInfo.status === 'SAFE' 
                        ? `You can bunk ${bunkInfo.canBunk} classes safely.` 
                        : `Attend next ${bunkInfo.mustAttend} classes to reach ${semester.targetAttendance}%.`}
                    </h3>
                    <p className="text-zinc-400 text-xs font-medium leading-relaxed">
                      {bunkInfo.status === 'SAFE' 
                        ? "Enjoy your free time, but stay above target!" 
                        : "Time to get serious and hit those lectures."}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Live & Next Class Status Widget */}
            {enableLiveWidget && liveClassInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                <Card className="p-2 overflow-hidden border border-zinc-800/80 bg-zinc-950/40">
                  <div className="grid grid-cols-2 divide-x divide-zinc-900">
                    {/* Live Class Section */}
                    <div className="px-3 py-1 flex flex-col justify-center gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-1.5 w-1.5">
                          {liveClassInfo.live ? (
                            <>
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                            </>
                          ) : (
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-zinc-600"></span>
                          )}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${liveClassInfo.live ? 'text-primary' : 'text-zinc-500'}`}>
                          {liveClassInfo.live ? 'LIVE NOW' : 'NO CLASS RUNNING'}
                        </span>
                      </div>
                      {liveClassInfo.isHoliday || liveClassInfo.isWeekend ? (
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-amber-500 text-xs truncate max-w-[130px] md:max-w-[200px]">
                            {liveClassInfo.holidayName}
                          </h4>
                          <p className="text-zinc-500 text-[10px] leading-tight font-medium">No classes scheduled today</p>
                        </div>
                      ) : liveClassInfo.live ? (
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-white text-xs truncate max-w-[130px] md:max-w-[200px]" title={liveClassInfo.live.subject}>
                            {liveClassInfo.live.subject}
                          </h4>
                          <p className="text-zinc-400 text-[10px] font-medium flex items-center gap-1">
                            <Clock size={10} className="text-primary" />
                            {liveClassInfo.live.time}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-zinc-500 text-[11px] italic">Between lectures</h4>
                          <p className="text-zinc-500 text-[9px]">No active class</p>
                        </div>
                      )}
                    </div>

                    {/* Next Class Section */}
                    <div className="px-3 py-1 flex flex-col justify-center gap-1">
                      <div className="flex items-center gap-1 text-zinc-500 text-[9px] font-black uppercase tracking-widest">
                        <BookOpen size={10} className="text-primary" />
                        <span>NEXT UP</span>
                      </div>
                      {liveClassInfo.isHoliday || liveClassInfo.isWeekend ? (
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-zinc-500 text-[11px] italic">Enjoy your day!</h4>
                          <p className="text-zinc-500 text-[9px]">Classes resume next working day</p>
                        </div>
                      ) : liveClassInfo.next ? (
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-zinc-200 text-xs truncate max-w-[130px] md:max-w-[200px]" title={liveClassInfo.next.subject}>
                            {liveClassInfo.next.subject}
                          </h4>
                          <p className="text-zinc-400 text-[10px] font-medium flex items-center gap-1">
                            <Clock size={10} className="text-primary" />
                            {liveClassInfo.next.time}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-zinc-500 text-[11px] italic">No more classes</h4>
                          <p className="text-zinc-500 text-[9px]">All done today</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                Daily Entry <span className="text-zinc-500 text-sm font-normal">— {format(new Date(), 'dd/MM/yyyy')}</span>
              </h3>
              <Card className="space-y-8">
                {isTodayHoliday ? (
                  <div className="text-center py-8 px-4 space-y-4">
                    <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full mx-auto flex items-center justify-center animate-bounce">
                      <CalendarDays size={32} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-black text-amber-500">Today is a Holiday!</h4>
                      <p className="text-sm text-zinc-300 font-extrabold bg-zinc-950/50 py-2 px-4 rounded-xl border border-zinc-800/80 inline-block">
                        🎉 {todayHolidayName}
                      </p>
                      <p className="text-xs text-zinc-500 max-w-[280px] mx-auto leading-relaxed">
                        No attendance marking is required today as per JMI academic calendar rules. Enjoy your day off!
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Held Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold">Total Available Attendance Today</p>
                            <button
                              type="button"
                              onClick={() => setShowAttendanceInfoModal(true)}
                              className="p-1 hover:bg-zinc-850 rounded-full text-zinc-400 hover:text-primary transition-all"
                              title="View detailed Jamia Attendance System"
                            >
                              <Info size={14} />
                            </button>
                          </div>
                          <p className="text-xs text-zinc-500">Theory (1 hr class) = 1 | Labs = 2{(profile.semester === 'Semester 1' || profile.semester === 'Semester 2') ? ' or 4' : ''} attendance units</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Button variant="secondary" className="p-2" onClick={() => updateAttendance(today, Math.max(0, todayRecord.held - 1), Math.min(todayRecord.attended, Math.max(0, todayRecord.held - 1)), false)}><Minus size={18}/></Button>
                          <span className="text-2xl font-bold w-6 text-center">{todayRecord.held}</span>
                          <Button variant="secondary" className="p-2" onClick={() => updateAttendance(today, todayRecord.held + 1, todayRecord.attended, false)}><Plus size={18}/></Button>
                        </div>
                      </div>

                      {/* Attendance Guidelines Box */}
                      <div className="bg-zinc-900/50 p-3.5 rounded-2xl border border-zinc-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setShowAttendanceInfoModal(true)}
                            className="flex items-center gap-2 text-xs font-bold text-zinc-300 hover:text-primary transition-all text-left"
                          >
                            <Info size={14} className="text-primary shrink-0" />
                            <span>JMI Attendance Rules (Marking Guide)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAttendanceInfoModal(true)}
                            className="text-[10px] text-primary hover:underline font-bold"
                          >
                            Detailed Guide &rarr;
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] leading-tight text-zinc-400">
                          <div className="p-2.5 bg-zinc-950/40 rounded-xl border border-zinc-900">
                            <strong className="text-zinc-200 block mb-0.5">Theory Classes</strong>
                            <span>Count as <strong className="text-primary">1</strong> Attendance</span>
                          </div>
                          <div className="p-2.5 bg-zinc-950/40 rounded-xl border border-zinc-900">
                            <strong className="text-zinc-200 block mb-0.5">General Labs</strong>
                            <span>Count as <strong className="text-primary">2</strong> Attendance</span>
                          </div>
                        </div>
                        {(profile.semester === 'Semester 1' || profile.semester === 'Semester 2') && (
                          <div className="pt-2 border-t border-zinc-850 space-y-1.5">
                            <p className="font-black text-[9px] text-zinc-500 uppercase tracking-wider">For 1st Year (Semester 1 & 2) Students:</p>
                            <ul className="space-y-1.5 text-[11px] text-zinc-400 pl-1">
                              <li className="flex items-start gap-1.5 leading-snug">
                                <span className="w-1.5 h-1.5 bg-primary/80 rounded-full mt-1.5 shrink-0" />
                                <span>Labs (Physics, Chemistry, Design Thinking, Language Lab, Engineering Mechanics Labs) = <strong className="text-zinc-200 font-bold">2 Attendance</strong></span>
                              </li>
                              <li className="flex items-start gap-1.5 leading-snug">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                                <span>Mechanical Workshop & Engineering Drawing = <strong className="text-zinc-200 font-bold">4 Attendance</strong></span>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {[1, 2, 3, 4, 5, 6]
                          .filter(num => (profile.semester === 'Semester 1' || profile.semester === 'Semester 2' || num !== 4))
                          .map(num => (
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
                        style={{ backgroundColor: '#afb910' }}
                        className={`w-full py-3 rounded-lg font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
                          todayRecord.isHoliday 
                            ? 'bg-amber-500 text-black shadow-amber-500/40 ring-2 ring-white/20' 
                            : 'bg-primary text-white opacity-90 hover:opacity-100 shadow-primary/40'
                        }`}
                      >
                        {todayRecord.isHoliday ? 'Today is a Holiday' : 'Mark Today as Holiday'}
                      </button>
                      <Button 
                        onClick={() => alert("Attendance Saved!")} 
                        style={{ backgroundColor: '#b91010' }}
                        className="w-full py-3 text-lg"
                      >
                        Save Attendance
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            </div>

            {/* Today's Class Schedule */}
            {isWeekday && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  Today's Classes <span className="text-zinc-500 text-sm font-normal">— {currentDayName}</span>
                </h3>
                <Card className="space-y-4">
                  <div className="space-y-3">
                    {(() => {
                      const daySchedule = classSchedule[currentDayName] || {};
                      const hasScheduledClasses = Object.values(daySchedule).some(sub => typeof sub === 'string' && sub.trim());

                      if (!hasScheduledClasses) {
                        return (
                          <div className="text-center py-6">
                            <Clock className="mx-auto mb-2 text-zinc-700 opacity-30" size={32} />
                            <p className="text-zinc-500 text-xs italic">No classes scheduled for {currentDayName}.</p>
                            <button
                              onClick={() => { setActiveTab('calendar'); setScheduleSubTab('schedule'); }}
                              className="text-primary text-xs font-bold mt-2 hover:underline"
                            >
                              Configure Weekly Schedule →
                            </button>
                          </div>
                        );
                      }

                      return CLASS_SLOTS.map(slot => {
                        if (slot.isLunch) {
                          return (
                            <div key="today-lunch" className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl px-4 py-3 flex items-center justify-between text-zinc-500 text-xs">
                              <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                                <Clock size={14} className="opacity-60" />
                                <span>{slot.time}</span>
                              </div>
                              <span className="font-black text-[10px] tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">🍱 LUNCH BREAK</span>
                            </div>
                          );
                        }

                        const subId = daySchedule[slot.id];
                        if (!subId || !subId.trim()) {
                          return null; // Don't show empty slots on the dashboard for cleaner UI
                        }
                        const foundSub = subjects.find(s => s.id === subId);
                        const subjectName = foundSub ? foundSub.name : subId;

                        return (
                          <div key={slot.id} className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">{slot.time}</span>
                              <h4 className="font-extrabold text-white text-sm">{subjectName}</h4>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/80 bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10 self-start sm:self-auto">
                              Active
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </Card>
              </div>
            )}

            {/* Master Subject Setup Floating Card Popup */}
            {subjects.length === 0 && !isSubjectPopupDismissed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:max-w-xs z-40 bg-zinc-900/95 border border-primary/40 rounded-3xl p-5 shadow-2xl backdrop-blur-xl space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-primary/20 text-primary rounded-2xl">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-zinc-100 uppercase tracking-wider">Configure Subjects</h4>
                      <p className="text-[10px] text-zinc-500">First-time semester setup</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsSubjectPopupDismissed(true)}
                    className="text-zinc-500 hover:text-zinc-300 p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Every semester should have one master list of subjects. Create yours once to track attendance, timetable slots, and predict grades effortlessly.
                </p>
                <div className="flex gap-2 text-[10px]">
                  <button
                    onClick={() => {
                      setIsSubjectPopupDismissed(true);
                      setActiveTab('settings');
                      // Wait a brief moment for the tab to render, then open the manager modal
                      setTimeout(() => {
                        const btn = document.getElementById('btn-manage-subjects');
                        if (btn) btn.click();
                      }, 150);
                    }}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary/95 text-white font-extrabold uppercase rounded-xl transition-all shadow-lg shadow-primary/20 text-center"
                  >
                    Set Up Now
                  </button>
                  <button
                    onClick={() => setIsSubjectPopupDismissed(true)}
                    className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 rounded-xl font-bold uppercase transition-all"
                  >
                    Maybe Later
                  </button>
                </div>
              </motion.div>
            )}
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
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Schedule</h1>
            <p className="text-xs text-zinc-500">Track your weekly classes and monthly attendance calendar</p>
          </div>
          
          {/* Sub-tab Switcher */}
          <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 gap-1 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setScheduleSubTab('schedule')}
              className={`flex-1 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                scheduleSubTab === 'schedule'
                  ? 'bg-primary text-white shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Schedule
            </button>
            <button
              onClick={() => setScheduleSubTab('calendar')}
              className={`flex-1 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                scheduleSubTab === 'calendar'
                  ? 'bg-primary text-white shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Calendar
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {scheduleSubTab === 'schedule' ? (
            <motion.div
              key="schedule-subtab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Weekly Class Schedule Manager */}
              <Card className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/20 rounded-lg text-primary">
                    <Clock size={18} />
                  </div>
                  <h3 className="font-bold text-sm uppercase tracking-wider">Weekly Class Schedule</h3>
                </div>
                <p className="text-xs text-zinc-500">
                  Set up your 1-hour classes (starting from 9:00 AM) for Monday to Friday. 1:00 PM - 2:00 PM is Lunch Break.
                </p>

                {/* Live and Next Class Toggle Option */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles size={14} className="text-primary" />
                      Live & Next Class Status
                    </span>
                    <p className="text-[11px] text-zinc-500 max-w-md">
                      Show your active class and upcoming class in real-time directly on the Home screen dashboard.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableLiveWidget(!enableLiveWidget)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      enableLiveWidget ? 'bg-primary' : 'bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        enableLiveWidget ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Day Selector */}
                <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 overflow-x-auto gap-1">
                  {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const).map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedScheduleDay(day)}
                      className={`flex-1 min-w-[70px] text-center py-2 rounded-lg text-xs font-bold transition-all ${
                        selectedScheduleDay === day 
                          ? 'bg-primary text-white shadow-md font-extrabold' 
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>

                {/* Time Slots List */}
                <div className="space-y-3 pt-1">
                  {CLASS_SLOTS.map(slot => {
                    if (slot.isLunch) {
                      return (
                        <div key="lunch-break" className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-zinc-500 text-xs">
                          <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                            <Clock size={14} className="opacity-60 shrink-0" />
                            <div className="flex items-center gap-1.5">
                              <span className="text-zinc-500 text-[10px] font-medium uppercase shrink-0">Time:</span>
                              <input
                                type="text"
                                value={customClassTimes[-1] ?? '01:00 PM - 02:00 PM'}
                                onChange={(e) => {
                                  const newTime = e.target.value;
                                  setCustomClassTimes(prev => ({
                                    ...prev,
                                    [-1]: newTime
                                  }));
                                }}
                                className="bg-zinc-900/80 border border-zinc-800/80 rounded-lg px-2.5 py-1 text-xs font-bold text-zinc-400 focus:border-primary focus:outline-none transition-all w-48"
                                placeholder="01:00 PM - 02:00 PM"
                              />
                            </div>
                          </div>
                          <span className="font-black text-[10px] tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md self-start sm:self-auto">🍱 LUNCH BREAK</span>
                        </div>
                      );
                    }

                    const subId = (classSchedule[selectedScheduleDay]?.[slot.id] || '').trim();
                    const foundSub = subjects.find(s => s.id === subId);
                    const subjectName = foundSub ? foundSub.name : subId;

                    return (
                      <div key={slot.id} className="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-3.5 flex flex-col gap-2.5">
                        <div className="flex justify-between items-center gap-4">
                          <div className="flex items-center gap-1.5 w-full max-w-[240px]">
                            <Clock size={12} className="text-zinc-500 shrink-0" />
                            <span className="text-[10px] text-zinc-500 font-bold uppercase shrink-0">Time:</span>
                            <input
                              type="text"
                              value={customClassTimes[slot.id] ?? ''}
                              onChange={(e) => {
                                const newTime = e.target.value;
                                setCustomClassTimes(prev => ({
                                  ...prev,
                                  [slot.id]: newTime
                                }));
                              }}
                              className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg px-2.5 py-1 text-xs font-bold text-zinc-300 focus:border-primary focus:outline-none transition-all w-full"
                              placeholder="Enter time range"
                            />
                          </div>
                          {subjectName && (
                            <button
                              onClick={() => {
                                setClassSchedule(prev => {
                                  const daySlots = { ...prev[selectedScheduleDay] };
                                  delete daySlots[slot.id];
                                  return { ...prev, [selectedScheduleDay]: daySlots };
                                });
                              }}
                              className="text-[10px] text-red-500/80 hover:text-red-500 font-bold uppercase transition-colors shrink-0"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Select Master Subject</span>
                          {subjects.length === 0 ? (
                            <div className="bg-zinc-950 border border-zinc-800 border-dashed rounded-xl px-3 py-2.5 flex items-center justify-between gap-3 text-[11px] text-zinc-400">
                              <span>No subjects defined yet. Configure them first in Settings.</span>
                              <button
                                type="button"
                                onClick={() => { setActiveTab('settings'); setTimeout(() => { const btn = document.getElementById('btn-manage-subjects'); if (btn) btn.click(); }, 150); }}
                                className="text-primary font-black uppercase tracking-wider shrink-0 hover:underline"
                              >
                                Setup
                              </button>
                            </div>
                          ) : (
                            <select
                              value={classSchedule[selectedScheduleDay]?.[slot.id] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setClassSchedule(prev => ({
                                  ...prev,
                                  [selectedScheduleDay]: {
                                    ...prev[selectedScheduleDay],
                                    [slot.id]: val
                                  }
                                }));
                              }}
                              className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white font-bold tracking-wide transition-colors cursor-pointer"
                            >
                              <option value="">-- Choose Subject --</option>
                              {subjects.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.type})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="calendar-subtab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Calendar Month Header Controller */}
              <div className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
                <span className="font-black text-sm text-zinc-200 uppercase tracking-wider">{format(viewDate, 'MMMM yyyy')}</span>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" className="p-2" onClick={() => setViewDate(subDays(startOfMonth(viewDate), 1))}><ChevronLeft /></Button>
                  <Button variant="secondary" className="p-2" onClick={() => setViewDate(addDays(endOfMonth(viewDate), 1))}><ChevronRight /></Button>
                </div>
              </div>

              {/* Monthly Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={`${d}-${i}`} className="text-center text-xs font-bold text-zinc-500 py-2">{d}</div>
                ))}
                {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                {days.map(day => {
                  const dateStr = formatDate(day);
                  const record = records[dateStr];
                  const parsedSDate = semester.startDate ? parseISO(semester.startDate) : null;
                  const sDate = parsedSDate && !isNaN(parsedSDate.getTime()) ? startOfDay(parsedSDate) : null;
                  const isBeforeSemester = sDate && isBefore(day, sDate);
                  const parsedLocked = semester.lockedUntil ? parseISO(semester.lockedUntil) : null;
                  const isLocked = parsedLocked && !isNaN(parsedLocked.getTime()) && !isAfter(day, parsedLocked);
                  const exam = getExamForDate(day);
                  
                  const jmiHoliday = getJamiaHoliday(day);
                  const isHoliday = (record && record.isHoliday) || jmiHoliday.isHoliday;

                  let bgColor = 'bg-zinc-900';
                  let borderColor = 'border-zinc-800';
                  let textColor = 'text-zinc-100';

                  if (exam) {
                    bgColor = 'bg-amber-500/20';
                    borderColor = 'border-amber-500/30';
                    textColor = 'text-amber-500';
                  } else if ((record || jmiHoliday.isHoliday) && !isBeforeSemester) {
                    if (isHoliday) {
                      bgColor = 'bg-blue-500/20';
                      borderColor = 'border-blue-500/30';
                      textColor = 'text-blue-500';
                    } else if (record && record.held > 0) {
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
                      {record && record.held > 0 && !isHoliday && (
                        <span className="text-[9px] font-black mt-0.5 opacity-80">{record.attended}/{record.held}</span>
                      )}
                      {isHoliday && (
                        <span className="text-[8px] font-bold mt-0.5 opacity-60" title={jmiHoliday.name || 'Holiday'}>
                          {jmiHoliday.name ? (jmiHoliday.name === 'Saturday' ? 'SAT' : jmiHoliday.name === 'Sunday' ? 'SUN' : 'HOL') : 'H'}
                        </span>
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
                      {(() => {
                        const selJmiHoliday = getJamiaHoliday(selectedDate);
                        const isSelHoliday = (records[selectedDate] && records[selectedDate].isHoliday) || selJmiHoliday.isHoliday;
                        const selHolidayName = selJmiHoliday.name || (records[selectedDate] && records[selectedDate].holidayName) || 'Holiday';
                        return (
                          <>
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-bold">
                                  {selectedDate && !isNaN(parseISO(selectedDate).getTime()) ? format(parseISO(selectedDate), 'EEEE, dd/MM/yyyy') : 'N/A'}
                                </h3>
                                <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold">
                                  {selectedDate && !isNaN(parseISO(selectedDate).getTime()) && getExamForDate(parseISO(selectedDate)) 
                                    ? `Exam: ${getExamForDate(parseISO(selectedDate))?.label}` 
                                    : isSelHoliday 
                                      ? `Holiday: ${selHolidayName}` 
                                      : 'Regular Class Day'}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {!isSelHoliday && (
                                  <Button 
                                    variant="secondary" 
                                    className="text-xs py-1.5 px-3" 
                                    onClick={() => {
                                      const record = records[selectedDate];
                                      const parsedSelDate = selectedDate ? parseISO(selectedDate) : null;
                                      const parsedLocked = semester.lockedUntil ? parseISO(semester.lockedUntil) : null;
                                      const isLocked = semester.lockedUntil && parsedSelDate && !isNaN(parsedSelDate.getTime()) && parsedLocked && !isNaN(parsedLocked.getTime()) && !isAfter(parsedSelDate, parsedLocked);
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
                                )}
                              </div>
                            </div>
                            
                            {records[selectedDate] && !isSelHoliday && records[selectedDate].held > 0 ? (
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
                            ) : isSelHoliday ? (
                              <div className="bg-zinc-800/50 border border-zinc-700 p-6 rounded-2xl text-center">
                                <Info className="mx-auto mb-2 text-primary" size={32} />
                                <p className="text-zinc-200 font-extrabold text-sm uppercase tracking-wide">Holiday: {selHolidayName}</p>
                                <p className="text-zinc-500 text-xs mt-1">No attendance marking is required. Enjoy your day off!</p>
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
                          </>
                        );
                      })()}
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-3 mt-4">
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
            </motion.div>
          )}
        </AnimatePresence>
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
                    {h.startDate && safeParse(h.startDate) ? format(safeParse(h.startDate)!, 'dd/MM/yyyy') : 'N/A'} - {h.endDate && safeParse(h.endDate) ? format(safeParse(h.endDate)!, 'dd/MM/yyyy') : 'N/A'}
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
      { name: 'Yellow & Black', color: '#facc15' },
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
                placeholder="#facc15"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-xs font-mono text-zinc-100 focus:outline-none focus:border-primary"
              />
            </div>
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

  const renderExams = () => {
    return (
      <ExamsTab 
        exams={exams}
        setExams={setExams}
        editingExam={editingExam}
        setEditingExam={setEditingExam}
        showExamModal={showExamModal}
        setShowExamModal={setShowExamModal}
        handleDeleteExam={handleDeleteExam}
        gradeSubjects={gradeSubjects}
        setGradeSubjects={setGradeSubjects}
        subjects={subjects}
        profile={profile}
      />
    );
  };

  const renderSettings = () => {
    return (
      <SettingsTab 
        profile={profile}
        setProfile={setProfile}
        semester={semester}
        setSemester={setSemester}
        records={records}
        setRecords={setRecords}
        history={history}
        setHistory={setHistory}
        setExams={setExams}
        setOnboardingCompleted={setOnboardingCompleted}
        setOnboardingStep={setOnboardingStep}
        setAppState={setAppState}
        notificationPermission={notificationPermission}
        requestNotificationPermission={requestNotificationPermission}
        stats={stats}
        updateAttendance={updateAttendance}
        subjects={subjects}
        setSubjects={setSubjects}
        classSchedule={classSchedule}
        setClassSchedule={setClassSchedule}
        gradeSubjects={gradeSubjects}
        setGradeSubjects={setGradeSubjects}
        subjectAttendance={subjectAttendance}
        setSubjectAttendance={setSubjectAttendance}
        onShowAirtelAd={() => setForceShowAd(true)}
      />
    );
  };

  const showFirstYearPatternModal = false;

  const renderFirstYearPatternModal = () => {
    if (!showFirstYearPatternModal) return null;

    return (
      <div id="first-year-pattern-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-2xl"
        >
          <div className="space-y-2 text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Sparkles size={24} className="text-primary" />
            </div>
            <h2 className="text-xl font-extrabold text-zinc-100">First Year Syllabus Pattern</h2>
            <p className="text-xs text-zinc-400">
              JMI B.Tech branches have different subject allocations in the first year. Select the pattern followed by your branch.
            </p>
          </div>

          <div className="space-y-3">
            {/* Option 1 */}
            <button
              onClick={() => {
                const pattern = 'SetA';
                const updatedProfile = { ...profile, firstYearPattern: pattern };
                setProfile(updatedProfile);
                const { subjects: defaultSubs } = getDefaultCurriculumSubjects(profile.semester, profile.department, pattern);
                if (defaultSubs && defaultSubs.length > 0) {
                  setSubjects(defaultSubs);
                }
              }}
              className="w-full text-left p-4 rounded-2xl bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700/80 hover:bg-zinc-800/80 transition-all flex flex-col gap-1 group text-zinc-100 font-sans"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-sm text-zinc-200 group-hover:text-primary transition-colors">Option 1: Set A → Set B</span>
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full font-mono">Standard</span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal mt-1">
                <strong className="text-zinc-300">Semester 1:</strong> Physics I, Chemistry, Math I, Electrical, Computing, etc.<br />
                <strong className="text-zinc-300">Semester 2:</strong> Physics II, Math II, Biology, ECE, Mechanical, Civil, etc.
              </p>
            </button>

            {/* Option 2 */}
            <button
              onClick={() => {
                const pattern = 'SetB';
                const updatedProfile = { ...profile, firstYearPattern: pattern };
                setProfile(updatedProfile);
                const { subjects: defaultSubs } = getDefaultCurriculumSubjects(profile.semester, profile.department, pattern);
                if (defaultSubs && defaultSubs.length > 0) {
                  setSubjects(defaultSubs);
                }
              }}
              className="w-full text-left p-4 rounded-2xl bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700/80 hover:bg-zinc-800/80 transition-all flex flex-col gap-1 group text-zinc-100 font-sans"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-sm text-zinc-200 group-hover:text-primary transition-colors">Option 2: Set B → Set A</span>
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full font-mono">Alternate</span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal mt-1">
                <strong className="text-zinc-300">Semester 1:</strong> Physics II, Math II, Biology, ECE, Mechanical, Civil, etc.<br />
                <strong className="text-zinc-300">Semester 2:</strong> Physics I, Chemistry, Math I, Electrical, Computing, etc.
              </p>
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderAttendanceInfoModal = () => {
    if (!showAttendanceInfoModal) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-2xl overflow-y-auto max-h-[85vh]"
        >
          <div className="space-y-2 text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Info size={24} className="text-primary animate-pulse" />
            </div>
            <h2 className="text-xl font-extrabold text-zinc-100">Jamia Attendance System</h2>
            <p className="text-xs text-zinc-400">
              Official lecture to attendance unit mapping guide
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-850/60 space-y-1.5">
              <h4 className="font-black text-xs text-zinc-200 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Theory Classes (Lectures)
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Every <strong className="text-zinc-200 font-bold">1 hour class</strong> counts as <strong className="text-primary font-black">1 Attendance</strong> unit.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-850/60 space-y-1.5">
              <h4 className="font-black text-xs text-zinc-200 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Laboratory / Practical sessions
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Standard <strong className="text-zinc-200 font-bold">2 hours lab classes</strong> count as <strong className="text-primary font-black">2 Attendance</strong> units.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-850/60 space-y-1.5">
              <h4 className="font-black text-xs text-zinc-200 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                First Year Special Rules
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                For B.Tech 1st Year (Semester 1 & 2) Students:
              </p>
              <ul className="space-y-2 text-[11px] text-zinc-400 mt-2 pl-1">
                <li className="flex items-start gap-1.5 leading-snug">
                  <span className="w-1 h-1 bg-zinc-600 rounded-full mt-1.5 shrink-0" />
                  <span><strong>Labs:</strong> Physics Lab, Chemistry Lab, Design Thinking Lab, Language Lab, and Engineering Mechanics Labs count as <strong className="text-zinc-200 font-bold">2 Attendance</strong> units.</span>
                </li>
                <li className="flex items-start gap-1.5 leading-snug">
                  <span className="w-1 h-1 bg-zinc-600 rounded-full mt-1.5 shrink-0" />
                  <span><strong>Workshops & Drawing:</strong> Mechanical Workshop and Engineering Drawing count as <strong className="text-zinc-200 font-bold">4 Attendance</strong> units.</span>
                </li>
              </ul>
            </div>
          </div>

          <Button 
            className="w-full font-bold py-3 text-sm rounded-xl"
            onClick={() => setShowAttendanceInfoModal(false)}
          >
            Got it, close
          </Button>
        </motion.div>
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
            {activeTab === 'exams' && renderExams()}
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
          <NavButton active={activeTab === 'calendar'} onClick={() => { setActiveTab('calendar'); setScheduleSubTab('schedule'); }} icon={<CalendarIcon size={24} />} label="Schedule" />
          <NavButton active={activeTab === 'special'} onClick={() => setActiveTab('special')} icon={<Sparkles size={24} />} label="Special" />
          <NavButton active={activeTab === 'exams'} onClick={() => setActiveTab('exams')} icon={<GraduationCap size={24} />} label="Exams" />
          <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={24} />} label="Settings" />
        </div>
      </nav>

      {showExamModal && <ExamModal />}
      {renderFirstYearPatternModal()}
      {renderAttendanceInfoModal()}
      <AirtelAdModal forceShow={forceShowAd} onClose={() => setForceShowAd(false)} />
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
