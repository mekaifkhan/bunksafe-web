import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit2, 
  CalendarDays, 
  Info, 
  Sparkles, 
  Calculator, 
  CheckCircle2, 
  AlertTriangle,
  Award,
  ChevronDown,
  ChevronUp,
  Sliders,
  Settings,
  HelpCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, differenceInDays } from 'date-fns';
import { Exam, SubjectGradeConfig, Subject } from '../types';

interface ExamsTabProps {
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  editingExam: Exam | null;
  setEditingExam: React.Dispatch<React.SetStateAction<Exam | null>>;
  showExamModal: boolean;
  setShowExamModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeleteExam: (id: string) => void;
  gradeSubjects: SubjectGradeConfig[];
  setGradeSubjects: React.Dispatch<React.SetStateAction<SubjectGradeConfig[]>>;
  subjects: Subject[];
}

export default function ExamsTab({
  exams,
  setExams,
  editingExam,
  setEditingExam,
  showExamModal,
  setShowExamModal,
  handleDeleteExam,
  gradeSubjects,
  setGradeSubjects,
  subjects
}: ExamsTabProps) {
  // Navigation active sub-section or scrolling is fine. But let's show them nicely with clear headings or toggles!
  const [activeSection, setActiveSection] = useState<'schedule' | 'grade_planner'>('schedule');

  // State for Subject Setup Modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectGradeConfig | null>(null);

  // Subject Modal fields
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [subjName, setSubjName] = useState('');
  const [maxMid1, setMaxMid1] = useState(40);
  const [maxMid2, setMaxMid2] = useState(40);
  const [hasAssignment, setHasAssignment] = useState(true);
  const [maxAssignment, setMaxAssignment] = useState(10);
  const [maxEndSem, setMaxEndSem] = useState(45);

  const availableSubjectsForPlanner = React.useMemo(() => {
    return subjects.filter(sub => !gradeSubjects.some(gs => gs.id === sub.id));
  }, [subjects, gradeSubjects]);

  // Active expanded subject ID in Grade Planner
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);

  // Helper to parse date safely
  const parseDateSafely = (dateStr: string) => {
    try {
      return new Date(dateStr);
    } catch (e) {
      return new Date();
    }
  };

  // Helper for exam countdown
  const getDaysRemainingText = (startDateStr: string, endDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = parseDateSafely(startDateStr);
    start.setHours(0, 0, 0, 0);
    const end = parseDateSafely(endDateStr);
    end.setHours(0, 0, 0, 0);

    const diffToStart = differenceInDays(start, today);
    const diffToEnd = differenceInDays(end, today);

    if (diffToStart > 0) {
      return {
        text: `${diffToStart} days to go`,
        badgeColor: 'bg-primary/10 text-primary border-primary/20',
        days: diffToStart
      };
    } else if (diffToStart <= 0 && diffToEnd >= 0) {
      return {
        text: 'Ongoing',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        days: 0
      };
    } else {
      return {
        text: 'Finished',
        badgeColor: 'bg-zinc-850 text-zinc-500 border-zinc-800',
        days: -1
      };
    }
  };

  // Sort exams: nearest first
  const sortedExams = [...exams].sort((a, b) => {
    const statusA = getDaysRemainingText(a.startDate, a.endDate);
    const statusB = getDaysRemainingText(b.startDate, b.endDate);
    
    // Ongoing first, then future nearest, then finished
    if (statusA.days === 0 && statusB.days !== 0) return -1;
    if (statusB.days === 0 && statusA.days !== 0) return 1;
    if (statusA.days < 0 && statusB.days >= 0) return 1;
    if (statusB.days < 0 && statusA.days >= 0) return -1;
    
    return a.startDate.localeCompare(b.startDate);
  });

  // Handle Subject Setup Submit
  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSubId = editingSubject?.id || selectedSubjectId;
    const selectedSub = subjects.find(s => s.id === targetSubId);
    if (!selectedSub) return;

    const config: SubjectGradeConfig = {
      id: targetSubId,
      name: selectedSub.name,
      maxMid1,
      maxMid2,
      hasAssignment,
      maxAssignment: hasAssignment ? maxAssignment : undefined,
      maxEndSem,
      obtainedMid1: editingSubject?.obtainedMid1 ?? 0,
      obtainedMid2: editingSubject?.obtainedMid2 ?? 0,
      obtainedAssignment: editingSubject?.obtainedAssignment ?? 0,
      obtainedEndSem: editingSubject?.obtainedEndSem ?? 0,
      targetGrade: editingSubject?.targetGrade || 'A'
    };

    if (editingSubject) {
      setGradeSubjects(prev => prev.map(s => s.id === editingSubject.id ? config : s));
    } else {
      setGradeSubjects(prev => [...prev, config]);
      setExpandedSubjectId(config.id); // auto-expand newly added subject
    }

    setShowSubjectModal(false);
    setEditingSubject(null);
    resetSubjectForm();
  };

  const resetSubjectForm = () => {
    const nextAvailable = subjects.filter(sub => !gradeSubjects.some(gs => gs.id === sub.id));
    const firstSub = nextAvailable[0];
    setSelectedSubjectId(firstSub?.id || '');
    setSubjName(firstSub?.name || '');
    setMaxMid1(40);
    setMaxMid2(40);
    setHasAssignment(true);
    setMaxAssignment(10);
    setMaxEndSem(45);
  };

  const handleEditSubjectClick = (subj: SubjectGradeConfig) => {
    setEditingSubject(subj);
    const resolvedName = subjects.find(s => s.id === subj.id)?.name || subj.name;
    setSubjName(resolvedName);
    setSelectedSubjectId(subj.id);
    setMaxMid1(subj.maxMid1);
    setMaxMid2(subj.maxMid2);
    setHasAssignment(subj.hasAssignment);
    setMaxAssignment(subj.maxAssignment ?? 10);
    setMaxEndSem(subj.maxEndSem);
    setShowSubjectModal(true);
  };

  const handleDeleteSubject = (id: string) => {
    if (confirm('Delete this subject from Grade Planner? This cannot be undone.')) {
      setGradeSubjects(prev => prev.filter(s => s.id !== id));
      if (expandedSubjectId === id) setExpandedSubjectId(null);
    }
  };

  // Grade Point & Description Helper based on JMI official system
  const getGradeDetails = (grade: string) => {
    const g = grade ? grade.toUpperCase() : 'A';
    switch (g) {
      case 'O': return { point: 10, label: 'Outstanding', color: 'text-purple-400 font-extrabold' };
      case 'A+': return { point: 9, label: 'Excellent', color: 'text-pink-400 font-extrabold' };
      case 'A': return { point: 8, label: 'Very Good', color: 'text-primary font-extrabold' };
      case 'B+': return { point: 7, label: 'Good', color: 'text-emerald-400 font-extrabold' };
      case 'B': return { point: 6, label: 'Average', color: 'text-amber-400 font-extrabold' };
      case 'C': return { point: 5, label: 'Below Average', color: 'text-orange-400 font-extrabold' };
      case 'P':
      case 'PASS': return { point: 4, label: 'Minimum Passing Grade', color: 'text-yellow-400 font-extrabold' };
      default: return { point: 0, label: 'Fail', color: 'text-red-400 font-extrabold' };
    }
  };

  // Grade Planner Computations
  const getSubjectStats = (subj: SubjectGradeConfig) => {
    // Find the master subject configuration to get credits and type
    const mSub = subjects.find(s => s.id === subj.id);
    const credits = mSub?.credits ?? 3;
    const isLab = mSub?.type === 'Lab';
    
    const totalMarks = credits * 25;
    
    let internalMax = 0;
    let externalMax = 0;
    let internalScore = 0;
    
    if (isLab) {
      // Lab Ratio 3:2
      internalMax = totalMarks * 0.6; // Credits * 15
      externalMax = totalMarks * 0.4; // Credits * 10
      
      const optInt = subj.obtainedInternalLab ?? 0;
      const maxInt = subj.maxInternalLab ?? internalMax;
      
      // Proportional conversion to standard internalMax
      internalScore = maxInt > 0 ? (optInt / maxInt) * internalMax : 0;
    } else {
      // Theory Ratio 2:3
      internalMax = totalMarks * 0.4; // Credits * 10
      externalMax = totalMarks * 0.6; // Credits * 15
      
      const optMid1 = subj.obtainedMid1 ?? 0;
      const optMid2 = subj.obtainedMid2 ?? 0;
      const optAss = subj.hasAssignment ? (subj.obtainedAssignment ?? 0) : 0;
      const midMaxTotal = subj.maxMid1 + subj.maxMid2;
      const midObtainedTotal = optMid1 + optMid2;
      
      if (subj.hasAssignment) {
        const maxAss = subj.maxAssignment ?? 10;
        const midWeight = internalMax - maxAss;
        const midContribution = midMaxTotal > 0 ? (midObtainedTotal / midMaxTotal) * midWeight : 0;
        internalScore = midContribution + optAss;
      } else {
        internalScore = midMaxTotal > 0 ? (midObtainedTotal / midMaxTotal) * internalMax : 0;
      }
    }
    
    internalScore = parseFloat(internalScore.toFixed(2));
    
    // Passing requirements
    const minInternalPass = internalMax * 0.40;
    const minExternalPass = externalMax * 0.40;
    
    const isInternalFailed = internalScore < minInternalPass;
    
    const gradeThresholds: Record<string, number> = {
      'O': totalMarks * 0.90,
      'A+': totalMarks * 0.80,
      'A': totalMarks * 0.70,
      'B+': totalMarks * 0.60,
      'B': totalMarks * 0.50,
      'C': totalMarks * 0.45,
      'P': totalMarks * 0.40
    };
    
    let normTarget = subj.targetGrade;
    if (normTarget === 'Pass' || normTarget === 'PASS') {
      normTarget = 'P';
    }
    
    const targetThreshold = gradeThresholds[normTarget] || (totalMarks * 0.70);
    
    // Calculate required External marks
    const rawRequiredExternal = targetThreshold - internalScore;
    const requiredExternal = Math.max(minExternalPass, Math.ceil(rawRequiredExternal));
    const isImpossible = requiredExternal > externalMax || isInternalFailed;
    
    // Highest Achievable Grade
    const maxTotalPossible = internalScore + externalMax;
    let highestAchievable = 'F';
    
    if (!isInternalFailed) {
      if (maxTotalPossible >= gradeThresholds['O']) highestAchievable = 'O';
      else if (maxTotalPossible >= gradeThresholds['A+']) highestAchievable = 'A+';
      else if (maxTotalPossible >= gradeThresholds['A']) highestAchievable = 'A';
      else if (maxTotalPossible >= gradeThresholds['B+']) highestAchievable = 'B+';
      else if (maxTotalPossible >= gradeThresholds['B']) highestAchievable = 'B';
      else if (maxTotalPossible >= gradeThresholds['C']) highestAchievable = 'C';
      else if (maxTotalPossible >= gradeThresholds['P']) highestAchievable = 'P';
    }
    
    // Dynamic Difficulty Badge
    let difficulty = 'Easy';
    if (isImpossible) {
      difficulty = 'Impossible';
    } else if (requiredExternal >= externalMax * 0.8) {
      difficulty = 'Hard';
    } else if (requiredExternal >= externalMax * 0.5) {
      difficulty = 'Medium';
    }
    
    const difficultyColors: Record<string, string> = {
      'Easy': 'bg-primary/10 text-primary border-primary/20',
      'Medium': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'Hard': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      'Impossible': 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
    };
    
    // Smart Insights
    let insights = '';
    if (isInternalFailed) {
      insights = `⚠️ Critical Alert: Your Internal marks are below ${minInternalPass.toFixed(1)}/${internalMax} (40% minimum passing). Jamia Millia Islamia rules require at least 40% in Internals to pass this course.`;
    } else if (isImpossible) {
      insights = `Grade ${normTarget} is not achievable since you would need ${Math.ceil(rawRequiredExternal)} marks in External exam (Max ${externalMax}). Target ${highestAchievable} instead.`;
    } else if (internalScore >= internalMax * 0.8) {
      insights = `✨ Excellent Internal Performance (${internalScore}/${internalMax})! You only require ${requiredExternal} marks in External exam to secure Grade ${normTarget}.`;
    } else if (internalScore >= internalMax * 0.6) {
      insights = `👍 Strong Internal score. Keep a steady focus on the External exam to secure your target ${normTarget} grade.`;
    } else {
      insights = `Borderline Internal score. Be highly cautious. You need to secure at least ${requiredExternal}/${externalMax} in the External exam.`;
    }
    
    return {
      credits,
      isLab,
      totalMarks,
      internalMax,
      externalMax,
      internalScore,
      rawRequiredExternal,
      requiredExternal,
      minExternalPass,
      minInternalPass,
      isImpossible,
      highestAchievable,
      difficulty,
      badgeClass: difficultyColors[difficulty] || 'bg-zinc-800 text-zinc-400',
      insights,
      gradeThresholds,
      normTarget
    };
  };

  return (
    <div className="space-y-6 pb-24 text-zinc-100">
      {/* HEADER SECTION */}
      <header className="space-y-4">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <BookOpen className="text-primary animate-pulse" size={24} /> Exams & Grade Planner
        </h1>
        
        {/* Sub-tab Toggle */}
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveSection('schedule')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${activeSection === 'schedule' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            📅 Exam Schedule
          </button>
          <button 
            onClick={() => setActiveSection('grade_planner')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${activeSection === 'grade_planner' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            🎓 Smart Grade Planner
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* SECTION 1: EXAM SCHEDULE                                            */}
      {/* ==================================================================== */}
      {activeSection === 'schedule' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black text-zinc-400 uppercase tracking-wider">Your Schedule</h2>
              <p className="text-[11px] text-zinc-500">Upcoming Mid-sem & End-sem exams.</p>
            </div>
            <button 
              onClick={() => { setEditingExam(null); setShowExamModal(true); }}
              className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all"
            >
              <Plus size={14} /> Add Exam
            </button>
          </div>

          <div className="space-y-3">
            {sortedExams.length === 0 ? (
              <div className="text-center py-10 border border-zinc-800 border-dashed rounded-3xl bg-zinc-900/10">
                <CalendarDays className="mx-auto mb-3 text-zinc-800" size={40} />
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">No exams scheduled yet</p>
                <p className="text-[11px] text-zinc-600 mt-1 max-w-[200px] mx-auto">Add sessional or final exams to track countdowns and highlights.</p>
              </div>
            ) : (
              sortedExams.map(exam => {
                const status = getDaysRemainingText(exam.startDate, exam.endDate);
                return (
                  <div key={exam.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex justify-between items-center hover:border-zinc-700 transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${exam.type === 'End-sem' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        <BookOpen size={20} />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-zinc-100">{exam.label}</h4>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${status.badgeColor}`}>
                            {status.text}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                          {format(parseDateSafely(exam.startDate), 'dd MMM yyyy')} - {format(parseDateSafely(exam.endDate), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => { setEditingExam(exam); setShowExamModal(true); }}
                        className="p-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-750 rounded-xl text-zinc-400 hover:text-primary transition-all active:scale-95"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => handleDeleteExam(exam.id)}
                        className="p-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-750 rounded-xl text-zinc-400 hover:text-red-500 transition-all active:scale-95"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 2: SMART GRADE PLANNER                                       */}
      {/* ==================================================================== */}
      {activeSection === 'grade_planner' && (() => {
        const summary = (() => {
          if (gradeSubjects.length === 0) return null;
          
          let totalCredits = 0;
          let weightedTargetPoints = 0;
          let weightedHighestPoints = 0;
          
          gradeSubjects.forEach(subj => {
            const stats = getSubjectStats(subj);
            const targetGP = getGradeDetails(stats.normTarget).point;
            const highestGP = getGradeDetails(stats.highestAchievable).point;
            
            totalCredits += stats.credits;
            weightedTargetPoints += (stats.credits * targetGP);
            weightedHighestPoints += (stats.credits * highestGP);
          });
          
          const estimatedSPI = totalCredits > 0 ? (weightedTargetPoints / totalCredits) : 0;
          const highestSPI = totalCredits > 0 ? (weightedHighestPoints / totalCredits) : 0;
          
          const avgTargetGP = totalCredits > 0 ? Math.round(weightedTargetPoints / totalCredits) : 0;
          
          const getGradeForPoint = (pt: number) => {
            if (pt >= 10) return 'O';
            if (pt >= 9) return 'A+';
            if (pt >= 8) return 'A';
            if (pt >= 7) return 'B+';
            if (pt >= 6) return 'B';
            if (pt >= 5) return 'C';
            if (pt >= 4) return 'P';
            return 'F';
          };
          
          const avgTargetGrade = getGradeForPoint(avgTargetGP);
          
          return {
            subjectCount: gradeSubjects.length,
            totalCredits,
            estimatedSPI,
            highestSPI,
            avgTargetGrade,
            avgTargetGP
          };
        })();

        return (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black text-zinc-400 uppercase tracking-wider">Subjects Grade Book</h2>
                <p className="text-[11px] text-zinc-500">Calculate JMI credit-based weights, internals & SPI forecasts.</p>
              </div>
              {subjects.length === 0 ? (
                <span className="text-[10px] text-zinc-500 italic bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
                  No subjects found. Add subjects in Settings.
                </span>
              ) : availableSubjectsForPlanner.length === 0 ? (
                <span className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-xl font-bold">
                  All semester subjects already have Grade Planners.
                </span>
              ) : (
                <button 
                  onClick={() => { setEditingSubject(null); resetSubjectForm(); setShowSubjectModal(true); }}
                  className="bg-primary hover:bg-primary/95 text-white px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-lg shadow-primary/20"
                >
                  <Plus size={14} /> Add Subject
                </button>
              )}
            </div>

            <div className="space-y-4">
              {gradeSubjects.length === 0 ? (
                <div className="text-center py-10 border border-zinc-800 border-dashed rounded-3xl bg-zinc-900/10">
                  <Calculator className="mx-auto mb-3 text-zinc-800" size={40} />
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">No subjects added yet</p>
                  <p className="text-[11px] text-zinc-600 mt-1 max-w-[210px] mx-auto">Set up subject internal weight parameters to run JMI compliant SPI forecasts.</p>
                </div>
              ) : (
                gradeSubjects.map(subj => {
                  const stats = getSubjectStats(subj);
                  const isExpanded = expandedSubjectId === subj.id;
                  const currentExternal = stats.isLab ? (subj.obtainedExternalLab ?? 0) : (subj.obtainedEndSem ?? 0);
                  const currentTotal = stats.internalScore + currentExternal;

                  return (
                    <div 
                      key={subj.id} 
                      className={`bg-zinc-900 border transition-all rounded-2xl overflow-hidden ${isExpanded ? 'border-primary/40 shadow-xl shadow-primary/5' : 'border-zinc-800/80 hover:border-zinc-750'}`}
                    >
                      {/* Collapsed Header Bar */}
                      <div 
                        onClick={() => setExpandedSubjectId(isExpanded ? null : subj.id)}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${stats.isImpossible ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                            <BookOpen size={20} />
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-sm text-zinc-100 truncate">
                                {subjects.find(s => s.id === subj.id)?.name || subj.name}
                              </h4>
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-zinc-850 text-zinc-400 border border-zinc-800">
                                {stats.isLab ? 'Lab' : 'Theory'}
                              </span>
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                {stats.credits} Credits
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2.5 flex-wrap text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                              <span>Total: <span className="text-zinc-300 font-black">{stats.totalMarks} Marks</span></span>
                              <div className="w-1 h-1 rounded-full bg-zinc-850" />
                              <span>Internal: <span className="text-zinc-300 font-black">{stats.internalScore}/{stats.internalMax}</span></span>
                              <div className="w-1 h-1 rounded-full bg-zinc-850" />
                              <span>Req External: <span className={stats.isImpossible ? 'text-red-400 font-black animate-pulse' : 'text-primary font-black'}>
                                {stats.isImpossible ? 'F' : `${stats.requiredExternal}/${stats.externalMax}`}
                              </span></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-0 border-zinc-800/50 pt-2.5 md:pt-0 shrink-0">
                          <div className="flex items-center gap-2">
                            {/* Target Badge */}
                            <div className="bg-zinc-950/60 border border-zinc-850 px-2.5 py-1 rounded-xl text-right">
                              <span className="text-[8px] text-zinc-500 block font-bold uppercase leading-none">Target</span>
                              <span className="text-xs font-black text-primary tracking-wide">
                                {stats.normTarget} <span className="text-[9px] text-zinc-400">({getGradeDetails(stats.normTarget).point} GP)</span>
                              </span>
                            </div>
                            {/* Status Badge */}
                            <span className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl border ${stats.badgeClass}`}>
                              {stats.isImpossible ? 'Impossible' : (stats.internalScore >= stats.minInternalPass ? 'Passed Int' : 'Failing Int')}
                            </span>
                          </div>
                          <div className="text-zinc-500">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Detail Panel */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-zinc-800/80 bg-zinc-900/40"
                          >
                            <div className="p-4 space-y-5">
                              {/* LAB WORKFLOW vs THEORY WORKFLOW MARK SLIDERS */}
                              {stats.isLab ? (
                                <div className="space-y-4 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-850">
                                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Adjust Lab Marks</span>
                                  
                                  {/* INTERNAL LAB */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-bold text-zinc-400">Internal Marks Obtained</span>
                                      <span className="font-mono font-black text-zinc-200">
                                        {subj.obtainedInternalLab ?? 0} <span className="text-zinc-600 font-normal">/ {subj.maxInternalLab ?? stats.internalMax}</span>
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <input 
                                        type="range"
                                        min="0"
                                        max={subj.maxInternalLab ?? stats.internalMax}
                                        step="0.5"
                                        value={subj.obtainedInternalLab ?? 0}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value);
                                          setGradeSubjects(prev => prev.map(s => s.id === subj.id ? { ...s, obtainedInternalLab: val } : s));
                                        }}
                                        className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                      />
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-[9px] text-zinc-500 font-bold uppercase">Out Of:</span>
                                        <input 
                                          type="number"
                                          min="1"
                                          max="150"
                                          value={subj.maxInternalLab ?? stats.internalMax}
                                          onChange={(e) => {
                                            const val = Math.max(1, parseInt(e.target.value) || 0);
                                            setGradeSubjects(prev => prev.map(s => s.id === subj.id ? { ...s, maxInternalLab: val } : s));
                                          }}
                                          className="w-12 bg-zinc-900 border border-zinc-800 rounded-lg px-1.5 py-0.5 text-center font-mono text-zinc-200 font-bold text-xs"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* EXTERNAL LAB */}
                                  <div className="space-y-2 pt-2 border-t border-zinc-900">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-bold text-zinc-400">External Marks Obtained</span>
                                      <span className="font-mono font-black text-zinc-200">
                                        {subj.obtainedExternalLab ?? 0} <span className="text-zinc-600 font-normal">/ {subj.maxExternalLab ?? stats.externalMax}</span>
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <input 
                                        type="range"
                                        min="0"
                                        max={subj.maxExternalLab ?? stats.externalMax}
                                        step="0.5"
                                        value={subj.obtainedExternalLab ?? 0}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value);
                                          setGradeSubjects(prev => prev.map(s => s.id === subj.id ? { ...s, obtainedExternalLab: val } : s));
                                        }}
                                        className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                      />
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-[9px] text-zinc-500 font-bold uppercase">Out Of:</span>
                                        <input 
                                          type="number"
                                          min="1"
                                          max="150"
                                          value={subj.maxExternalLab ?? stats.externalMax}
                                          onChange={(e) => {
                                            const val = Math.max(1, parseInt(e.target.value) || 0);
                                            setGradeSubjects(prev => prev.map(s => s.id === subj.id ? { ...s, maxExternalLab: val } : s));
                                          }}
                                          className="w-12 bg-zinc-900 border border-zinc-800 rounded-lg px-1.5 py-0.5 text-center font-mono text-zinc-200 font-bold text-xs"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4 bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-850">
                                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Adjust Obtained Marks</span>
                                  
                                  {/* MID 1 */}
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-bold text-zinc-400">Mid Semester 1</span>
                                      <span className="font-mono font-black text-zinc-200">{subj.obtainedMid1 ?? 0} <span className="text-zinc-600 font-normal">/ {subj.maxMid1}</span></span>
                                    </div>
                                    <input 
                                      type="range"
                                      min="0"
                                      max={subj.maxMid1}
                                      step="0.5"
                                      value={subj.obtainedMid1 ?? 0}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setGradeSubjects(prev => prev.map(s => s.id === subj.id ? { ...s, obtainedMid1: val } : s));
                                      }}
                                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                  </div>

                                  {/* MID 2 */}
                                  <div className="space-y-1.5 pt-1">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-bold text-zinc-400">Mid Semester 2</span>
                                      <span className="font-mono font-black text-zinc-200">{subj.obtainedMid2 ?? 0} <span className="text-zinc-600 font-normal">/ {subj.maxMid2}</span></span>
                                    </div>
                                    <input 
                                      type="range"
                                      min="0"
                                      max={subj.maxMid2}
                                      step="0.5"
                                      value={subj.obtainedMid2 ?? 0}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setGradeSubjects(prev => prev.map(s => s.id === subj.id ? { ...s, obtainedMid2: val } : s));
                                      }}
                                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                  </div>

                                  {/* ASSIGNMENTS */}
                                  {subj.hasAssignment && subj.maxAssignment && (
                                    <div className="space-y-1.5 pt-1 border-t border-zinc-900 mt-2">
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-zinc-400">Assignments</span>
                                        <span className="font-mono font-black text-zinc-200">{subj.obtainedAssignment ?? 0} <span className="text-zinc-600 font-normal">/ {subj.maxAssignment}</span></span>
                                      </div>
                                      <input 
                                        type="range"
                                        min="0"
                                        max={subj.maxAssignment}
                                        step="0.5"
                                        value={subj.obtainedAssignment ?? 0}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value);
                                          setGradeSubjects(prev => prev.map(s => s.id === subj.id ? { ...s, obtainedAssignment: val } : s));
                                        }}
                                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                      />
                                    </div>
                                  )}

                                  {/* END SEMESTER OBTAINED (Optional) */}
                                  <div className="space-y-1.5 pt-2 border-t border-zinc-900 mt-2">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-bold text-zinc-400">End Semester Obtained (Optional)</span>
                                      <span className="font-mono font-black text-zinc-200">{subj.obtainedEndSem ?? 0} <span className="text-zinc-600 font-normal">/ {stats.externalMax}</span></span>
                                    </div>
                                    <input 
                                      type="range"
                                      min="0"
                                      max={stats.externalMax}
                                      step="0.5"
                                      value={subj.obtainedEndSem ?? 0}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setGradeSubjects(prev => prev.map(s => s.id === subj.id ? { ...s, obtainedEndSem: val } : s));
                                      }}
                                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* CURRENT CUMULATIVE MARKS CARD */}
                              <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-850/60 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Current Cumulative Marks</span>
                                  <span className="font-mono font-black text-sm text-zinc-200">
                                    {currentTotal.toFixed(1)}
                                    <span className="text-zinc-600 font-normal"> / {stats.totalMarks} Marks</span>
                                  </span>
                                </div>
                                <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-900">
                                  <div 
                                    className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, (currentTotal / stats.totalMarks) * 100)}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[9px] text-zinc-500 font-bold uppercase">
                                  <span>Completed Marks Percentage: {((currentTotal / stats.totalMarks) * 100).toFixed(1)}%</span>
                                  <span>Passing Min: 40%</span>
                                </div>
                              </div>

                              {/* TARGET SELECTION PANEL */}
                              <div className="flex items-center justify-between gap-3 bg-zinc-950/40 p-3 rounded-2xl border border-zinc-850/60">
                                <span className="text-xs font-bold text-zinc-400">Target Grade</span>
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {['O', 'A+', 'A', 'B+', 'B', 'C', 'P'].map(gr => (
                                    <button
                                      key={gr}
                                      onClick={() => {
                                        setGradeSubjects(prev => prev.map(s => s.id === subj.id ? { ...s, targetGrade: gr } : s));
                                      }}
                                      className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase transition-all border ${stats.normTarget === gr ? 'bg-primary border-primary text-white shadow' : 'bg-zinc-850 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                      {gr}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* STATUS CARD & JAMIA MILLIA ISLAMIA CHECKS */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-850/80 space-y-1">
                                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Internal Status</span>
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-base font-black text-zinc-100">{stats.internalScore}/{stats.internalMax}</span>
                                    {!stats.isImpossible && stats.internalScore >= stats.minInternalPass ? (
                                      <span className="text-[9px] text-primary font-black uppercase">Passed</span>
                                    ) : (
                                      <span className="text-[9px] text-red-400 font-black uppercase">Failing</span>
                                    )}
                                  </div>
                                  <span className="text-[9px] text-zinc-600 block leading-none">Min required: {stats.minInternalPass.toFixed(1)} (40%)</span>
                                </div>

                                <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-850/80 space-y-1">
                                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">External Goal</span>
                                  <div className="flex items-baseline gap-1.5">
                                    <span className={`text-base font-black ${stats.isImpossible ? 'text-red-400' : 'text-primary'}`}>
                                      {stats.isImpossible ? 'F' : `${stats.requiredExternal}/${stats.externalMax}`}
                                    </span>
                                    <span className="text-[9px] text-zinc-500 font-bold">Marks</span>
                                  </div>
                                  <span className="text-[9px] text-zinc-600 block leading-none">Min required to pass: {stats.minExternalPass.toFixed(1)} (40%)</span>
                                </div>
                              </div>

                              {/* JAMIA MILLIA ISLAMIA PASSING LOGIC EXPLANATION */}
                              {stats.rawRequiredExternal < stats.minExternalPass && !stats.isImpossible && (
                                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2 text-[11px] text-amber-400/90 leading-normal">
                                  <Info size={14} className="shrink-0 mt-0.5" />
                                  <p>
                                    You only require {Math.max(0, Math.ceil(stats.rawRequiredExternal))} marks mathematically. However, Jamia Millia Islamia strictly requires a minimum of <strong>{stats.minExternalPass.toFixed(1)}/{stats.externalMax} (40%)</strong> in the External. Final Required Marks: <strong>{stats.minExternalPass.toFixed(1)}</strong>.
                                  </p>
                                </div>
                              )}

                              {/* SMART INSIGHTS ALERT BOX */}
                              <div className={`p-3.5 rounded-xl border flex items-start gap-2 text-xs leading-relaxed ${stats.internalScore < stats.minInternalPass || stats.isImpossible ? 'bg-red-500/5 border-red-500/10 text-red-400' : 'bg-primary/5 border-primary/10 text-primary'}`}>
                                {stats.internalScore < stats.minInternalPass || stats.isImpossible ? <AlertTriangle size={16} className="shrink-0 mt-0.5" /> : <Sparkles size={16} className="shrink-0 mt-0.5 text-primary" />}
                                <p className="font-medium">{stats.insights}</p>
                              </div>

                              {/* GRADE MATRIX TABLE */}
                              <div className="bg-zinc-950/50 rounded-2xl border border-zinc-850 overflow-hidden">
                                <div className="p-2.5 bg-zinc-950 border-b border-zinc-850 flex justify-between items-center px-3">
                                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Dynamic JMI Grade Mapping</span>
                                  <span className="text-[9px] text-zinc-600 font-bold">Based on current Internal ({stats.internalScore})</span>
                                </div>
                                <div className="divide-y divide-zinc-900 text-xs">
                                  {Object.entries(stats.gradeThresholds).map(([gr, thresh]) => {
                                    const rawReq = thresh - stats.internalScore;
                                    const req = Math.max(stats.minExternalPass, Math.ceil(rawReq));
                                    const imp = req > stats.externalMax || stats.internalScore < stats.minInternalPass;
                                    const gradeDetail = getGradeDetails(gr);

                                    return (
                                      <div key={gr} className="flex justify-between items-center py-2 px-3 hover:bg-zinc-900/30">
                                        <span className={`font-black uppercase flex items-center gap-1.5 ${stats.normTarget === gr ? 'text-primary' : 'text-zinc-400'}`}>
                                          <span className={gradeDetail.color}>Grade {gr}</span>
                                          <span className="text-[9px] text-zinc-600 font-normal">({Math.round((thresh/stats.totalMarks)*100)}%)</span>
                                          <span className="text-[9px] text-zinc-500 font-bold tracking-wide">[{gradeDetail.label}]</span>
                                        </span>
                                        <span className={`font-mono font-bold ${imp ? 'text-zinc-700 font-normal line-through' : (stats.normTarget === gr ? 'text-primary font-black' : 'text-zinc-200')}`}>
                                          {imp ? 'Impossible' : `Requires ${req} / ${stats.externalMax}`}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* EDIT / DELETE SUBJECT FROM GRADE BOOK */}
                              <div className="flex justify-end gap-2.5 pt-1">
                                <button
                                  onClick={() => handleEditSubjectClick(subj)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-750 text-xs font-bold text-zinc-300 transition-colors"
                                >
                                  <Settings size={12} /> Configure Weight
                               </button>
                               <button
                                  onClick={() => handleDeleteSubject(subj.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/10 text-xs font-bold text-red-500 transition-colors"
                                >
                                  <Trash2 size={12} /> Delete
                                </button>
                              </div>

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>

            {/* JMI SEMESTER SUMMARY CARD */}
            {summary && (
              <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-primary/5 border border-primary/20 rounded-3xl p-6 shadow-2xl space-y-6 mt-6">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  {/* Left Side: Circular Progress */}
                  <div className="flex items-center gap-5">
                    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          className="stroke-zinc-800"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          className="stroke-primary transition-all duration-500 ease-out"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 40}
                          strokeDashoffset={2 * Math.PI * 40 * (1 - summary.estimatedSPI / 10)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-white">{summary.estimatedSPI.toFixed(2)}</span>
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mt-0.5">Est. SPI</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-center lg:text-left">
                      <h3 className="text-sm font-black text-zinc-100 flex items-center justify-center lg:justify-start gap-1.5 uppercase tracking-wider">
                        Semester Predictor Summary
                      </h3>
                      <p className="text-[11px] text-zinc-500 max-w-sm leading-relaxed">
                        Your estimated Semester Performance Index is based on the selected targets of the {summary.subjectCount} active subjects.
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Bento Grid Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
                    {/* Subjects */}
                    <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-850/60 text-center min-w-[90px]">
                      <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-1">Subjects</span>
                      <span className="text-lg font-black text-zinc-200">{summary.subjectCount}</span>
                    </div>

                    {/* Total Credits */}
                    <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-850/60 text-center min-w-[90px]">
                      <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-1">Total Credits</span>
                      <span className="text-lg font-black text-zinc-200">{summary.totalCredits}</span>
                    </div>

                    {/* Highest Possible SPI */}
                    <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-850/60 text-center min-w-[120px]">
                      <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-1">Highest Possible SPI</span>
                      <span className="text-lg font-black text-emerald-400">{summary.highestSPI.toFixed(2)}</span>
                    </div>

                    {/* Avg Target Grade */}
                    <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-850/60 text-center min-w-[110px]">
                      <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider block mb-1">Avg Target Grade</span>
                      <span className="text-lg font-black text-primary">{summary.avgTargetGrade} <span className="text-[10px] text-zinc-500 font-normal">({summary.avgTargetGP})</span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ==================================================================== */}
      {/* SUBJECT CONFIGURATION / SETUP DIALOG                                 */}
      {/* ==================================================================== */}
      {showSubjectModal && (() => {
        const targetId = editingSubject?.id || selectedSubjectId;
        const currentSelectedSub = subjects.find(s => s.id === targetId);
        const isLabSelected = currentSelectedSub?.type === 'Lab';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-zinc-100 flex items-center gap-2">
                  <Calculator className="text-primary" size={20} />
                  {editingSubject ? 'Edit Weight Settings' : 'Setup New Subject'}
                </h3>
                <button 
                  onClick={() => { setShowSubjectModal(false); setEditingSubject(null); }} 
                  className="text-zinc-500 hover:text-white"
                >
                  <X size={16} /> Close
                </button>
              </div>

              <form onSubmit={handleSaveSubject} className="space-y-4 text-xs">
                {/* Subject Name Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Subject</label>
                  {editingSubject ? (
                    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-400 font-bold">
                      {subjects.find(s => s.id === editingSubject.id)?.name || subjName}
                    </div>
                  ) : (
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedSubjectId(val);
                        const sub = subjects.find(s => s.id === val);
                        if (sub) {
                          setSubjName(sub.name);
                        }
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-primary font-bold"
                      required
                    >
                      <option value="">-- Select Subject --</option>
                      {availableSubjectsForPlanner.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.type})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {isLabSelected && currentSelectedSub && (
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-2 text-zinc-300">
                    <div className="flex items-center gap-1.5 text-primary font-black uppercase text-[10px] tracking-wide">
                      <Sparkles size={14} /> JMI Official Lab Evaluation
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-400">
                      This subject is registered as a <strong>Lab Course</strong>. Jamia Millia Islamia standardizes Lab subjects with a <strong>3:2 ratio</strong> (60% Internal, 40% External).
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono font-bold bg-zinc-950 p-2.5 rounded-xl border border-zinc-900">
                      <div>
                        <span className="text-zinc-500 block">INTERNAL MAX</span>
                        <span className="text-zinc-200 text-xs font-black">{currentSelectedSub.credits * 15} Marks</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">EXTERNAL MAX</span>
                        <span className="text-zinc-200 text-xs font-black">{currentSelectedSub.credits * 10} Marks</span>
                      </div>
                    </div>
                  </div>
                )}

                {!isLabSelected && (
                  <>
                    {/* Mid Sem 1 Maximum */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Mid Sem 1 Max Marks</label>
                      <input 
                        type="number" 
                        value={maxMid1} 
                        onChange={(e) => setMaxMid1(Math.max(1, parseInt(e.target.value) || 0))} 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-mono"
                        required
                      />
                    </div>

                    {/* Mid Sem 2 Maximum */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Mid Sem 2 Max Marks</label>
                      <input 
                        type="number" 
                        value={maxMid2} 
                        onChange={(e) => setMaxMid2(Math.max(1, parseInt(e.target.value) || 0))} 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-mono"
                        required
                      />
                    </div>

                    {/* Does this subject have Assignment Marks? */}
                    <div className="space-y-2 p-3 bg-zinc-950 rounded-xl border border-zinc-850">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-zinc-400">Has Assignment component?</span>
                        <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg shrink-0">
                          <button
                            type="button"
                            onClick={() => setHasAssignment(true)}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${hasAssignment ? 'bg-primary text-white' : 'text-zinc-500 hover:text-zinc-400'}`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setHasAssignment(false)}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${!hasAssignment ? 'bg-primary text-white' : 'text-zinc-500 hover:text-zinc-400'}`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {hasAssignment && (
                        <div className="space-y-1 mt-2.5 pt-2 border-t border-zinc-900">
                          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Max Assignment Marks</label>
                          <input 
                            type="number" 
                            value={maxAssignment} 
                            onChange={(e) => setMaxAssignment(Math.max(1, parseInt(e.target.value) || 0))} 
                            className="w-full bg-zinc-900 border border-zinc-900 rounded-lg px-2.5 py-1.5 text-zinc-100 font-mono"
                            required
                          />
                        </div>
                      )}
                    </div>

                    {/* End Semester Maximum Marks */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">End Semester Maximum Marks</label>
                      <input 
                        type="number" 
                        value={maxEndSem} 
                        onChange={(e) => setMaxEndSem(Math.max(1, parseInt(e.target.value) || 45))} 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-mono"
                        required
                      />
                      <span className="text-[9px] text-zinc-500 block leading-tight">Jamia standard is 45 marks. You can customize if required.</span>
                    </div>
                  </>
                )}

                <button 
                  type="submit"
                  className="w-full py-3 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-primary/20"
                >
                  {editingSubject ? 'Save Weight Settings' : 'Create Subject Grade Book'}
                </button>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
