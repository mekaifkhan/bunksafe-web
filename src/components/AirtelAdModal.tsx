import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, GraduationCap, DollarSign, Award, BookOpen, Clock, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

interface AirtelAdModalProps {
  onClose?: () => void;
  forceShow?: boolean;
}

export default function AirtelAdModal({ onClose, forceShow = false }: AirtelAdModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    // Check if the date is exactly 12th July 2026 OR if it is a forceShow
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const isTargetDate = todayStr === '2026-07-12';
    const hasSeenAd = localStorage.getItem('airtel_ad_seen_20260712') === 'true';

    if (forceShow || (isTargetDate && !hasSeenAd)) {
      setIsOpen(true);
      setTimeLeft(5);
      
      // If showing naturally, record that they have seen it
      if (!forceShow && isTargetDate) {
        localStorage.setItem('airtel_ad_seen_20260712', 'true');
      }
    }
  }, [forceShow]);

  // Handle countdown
  useEffect(() => {
    if (!isOpen) return;
    if (timeLeft <= 0) {
      // Auto close after 5 seconds
      handleClose();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOpen, timeLeft]);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 180 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col md:flex-row text-zinc-100"
        >
          {/* Top/Right floating Timer & Skip Controls */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {/* 5s Timer indicator */}
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-zinc-800 py-1.5 px-3 rounded-full text-[11px] font-black tracking-wider text-amber-500">
              <Clock size={12} className="animate-spin" style={{ animationDuration: '3s' }} />
              <span>{timeLeft > 0 ? `${timeLeft}S REMAINING` : 'AUTO CLOSING'}</span>
            </div>

            {/* Skip Button */}
            <button
              onClick={handleClose}
              className="flex items-center gap-1 bg-primary border border-primary text-white hover:bg-primary-hover py-1.5 px-4 rounded-full text-xs font-black tracking-wide shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <span>Skip</span>
              <X size={14} />
            </button>
          </div>

          {/* Left Column: Visual Branding & Curved Airtel Stripe */}
          <div className="relative w-full md:w-[42%] bg-gradient-to-br from-red-600 via-red-700 to-red-950 p-6 flex flex-col justify-between overflow-hidden shrink-0">
            {/* Curved red/white decorative elements typical of Airtel */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-red-500 rounded-full mix-blend-screen opacity-40 blur-2xl pointer-events-none" />
            
            {/* Top Wave */}
            <svg className="absolute top-0 right-0 h-full w-24 text-red-900/10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,0 C50,40 50,60 100,100 L100,0 Z" fill="currentColor" />
            </svg>

            {/* Logo area */}
            <div className="relative z-10 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-lg shadow-red-950/40">
                {/* Airtel 'o' shape logo approximation */}
                <div className="w-5 h-5 rounded-full border-4 border-red-600 border-t-transparent animate-pulse" />
              </div>
              <div>
                <span className="text-white text-base font-black tracking-tight block">airtel</span>
                <span className="text-red-200 text-[9px] uppercase font-bold tracking-widest -mt-1 block">foundation</span>
              </div>
            </div>

            {/* Mid Banner Student Illustration Placeholder / Graduation Cap Icon */}
            <div className="relative z-10 my-12 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center mb-4 shadow-xl">
                <GraduationCap size={44} className="text-white drop-shadow" />
              </div>
              <div className="bg-black/25 backdrop-blur-sm border border-white/10 rounded-2xl py-1 px-3 inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-red-200">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                <span>Scholarship Launch</span>
              </div>
            </div>

            {/* Footer lines */}
            <div className="relative z-10 text-[10px] text-red-100/85 font-medium leading-relaxed mt-auto">
              <p className="border-t border-white/15 pt-3">
                Empowering Education. Transforming Lives.
              </p>
              <p className="text-[9px] text-red-200/70 mt-1 font-bold">
                Merit + Means = Equal Opportunities
              </p>
            </div>
          </div>

          {/* Right Column: Key Details & Apply Action */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-between bg-zinc-950">
            <div className="space-y-4 md:mt-4">
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 py-1 px-2.5 rounded-full inline-block">
                  Airtel Corporate Social Responsibility
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none">
                  Bharti Airtel <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">
                    Scholarship Program
                  </span>
                </h2>
                <p className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  A Step Towards Your Bright Future
                </p>
              </div>

              {/* Sub-text info */}
              <div className="bg-zinc-900/60 border border-zinc-850 p-3.5 rounded-2xl space-y-1.5">
                <p className="text-xs font-bold text-zinc-200">Financial Support for Deserving Students</p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Bharti Airtel Foundation invites applications for professional courses (B.Tech / IT) with 100% scholarship coverage.
                </p>
              </div>

              {/* Grid of Key Features */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-900 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                    <DollarSign size={14} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Tuition Support</span>
                    <span className="text-xs text-zinc-200 font-extrabold leading-tight block">100% Academic Fees</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-900 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <BookOpen size={14} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Hostel & Mess</span>
                    <span className="text-xs text-zinc-200 font-extrabold leading-tight block">Assistance Provided</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-900 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <Award size={14} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Academic Aid</span>
                    <span className="text-xs text-zinc-200 font-extrabold leading-tight block">Excellence Awards</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-900 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                    <CalendarDays size={14} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Eligibility</span>
                    <span className="text-xs text-zinc-200 font-extrabold leading-tight block">B.Tech First Year</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Call To Actions */}
            <div className="mt-6 pt-4 border-t border-zinc-900 flex flex-col sm:flex-row items-center gap-3">
              <a
                href="https://bhartiairtelfoundation.org/bharti-airtel-scholarship-program/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClose}
                className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-red-900/20 text-center flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Apply Online (Buddy4Study)</span>
                <ExternalLink size={14} />
              </a>
              
              <div className="text-[9px] text-zinc-500 text-center font-bold">
                *Register via buddy4study.com/page/bharti-airtel-scholarship-program
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
