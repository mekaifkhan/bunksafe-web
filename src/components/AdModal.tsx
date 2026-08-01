import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Zap, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface AdModalProps {
  onClose: () => void;
  downloadUrl?: string;
}

export const AdModal: React.FC<AdModalProps> = ({
  onClose,
  downloadUrl = 'https://r.navi.com/tL07AD',
}) => {
  const [timeLeft, setTimeLeft] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanSkip(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleOpenLink = () => {
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-[#220735] text-white rounded-3xl shadow-2xl overflow-hidden border border-purple-500/30 flex flex-col"
        >
          {/* Top Header Bar with Timer & Skip button */}
          <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
            {/* Sponsored Tag */}
            <div className="px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-[11px] font-semibold tracking-wider text-purple-200 uppercase flex items-center gap-1.5 pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sponsored
            </div>

            {/* Skip Button / Timer */}
            <button
              onClick={handleSkip}
              disabled={!canSkip}
              className={`pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg ${
                canSkip
                  ? 'bg-white text-purple-950 hover:bg-emerald-400 hover:text-black cursor-pointer scale-105 active:scale-95 ring-2 ring-emerald-400/50'
                  : 'bg-black/60 text-zinc-300 border border-white/20 cursor-not-allowed opacity-90'
              }`}
            >
              {canSkip ? (
                <>
                  <span>Skip Ad</span>
                  <X className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Skip in {timeLeft}s</span>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                </>
              )}
            </button>
          </div>

          {/* Progress bar line at top */}
          <div className="w-full bg-purple-950/80 h-1.5 relative overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-300"
            />
          </div>

          {/* Main Card Content Body - Clickable */}
          <div
            onClick={handleOpenLink}
            className="p-6 pt-12 flex flex-col items-center text-center cursor-pointer group relative select-none"
          >
            {/* Background Glow Effects */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-0 w-48 h-48 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

            {/* Navi Logo Header */}
            <div className="flex items-center gap-2 mb-4 group-hover:scale-105 transition-transform">
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                <span className="text-2xl font-black tracking-tighter text-emerald-400 font-mono">
                  n
                </span>
                <span className="text-xl font-extrabold tracking-tight text-white">
                  navi
                </span>
                <span className="text-xs font-bold text-emerald-400 border-l border-white/20 pl-2 ml-0.5 tracking-wider">
                  UPI
                </span>
              </div>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-400 leading-tight mb-1 drop-shadow-sm">
              Fast, very fast
            </h2>

            <p className="text-base font-semibold text-zinc-200 mb-6 flex items-center justify-center gap-1">
              Use Navi UPI.
            </p>

            {/* Smartphone Graphic Replica */}
            <div className="relative my-2 w-full max-w-[220px] aspect-[9/16] bg-zinc-950 rounded-[36px] p-2.5 shadow-2xl border-4 border-zinc-800 ring-1 ring-white/20 group-hover:rotate-1 group-hover:scale-[1.02] transition-all duration-300">
              {/* Dynamic Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-10 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
              </div>

              {/* Screen Content */}
              <div className="w-full h-full bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-[28px] pt-10 pb-6 px-4 flex flex-col items-center justify-between text-white shadow-inner">
                {/* Status Bar Fake Header */}
                <div className="text-[10px] text-emerald-100 font-medium tracking-widest uppercase">
                  Navi Instant Payment
                </div>

                {/* Big Circle Tick */}
                <div className="flex flex-col items-center my-auto">
                  <div className="w-16 h-16 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-lg mb-3">
                    <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                  </div>

                  <span className="text-sm font-bold text-white tracking-wide">
                    Paid Successfully
                  </span>

                  <div className="flex items-center gap-1 mt-3 bg-emerald-700/60 px-3 py-1 rounded-full border border-emerald-300/30">
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300 animate-bounce" />
                    <span className="text-base font-black text-white">
                      in 0.8 seconds
                    </span>
                  </div>
                </div>

                {/* Secure Badge */}
                <div className="flex items-center gap-1 text-[10px] text-emerald-100 font-semibold opacity-90">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>100% Safe & Bank Approved</span>
                </div>
              </div>
            </div>

            {/* Subtext */}
            <p className="text-xs text-zinc-300 mt-4 max-w-xs leading-relaxed font-medium">
              Zero failed transactions. Supercharged UPI payments, instant rewards & simple finance.
            </p>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-purple-950/90 border-t border-purple-500/20 flex flex-col gap-2">
            <button
              onClick={handleOpenLink}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-purple-950 font-black text-base tracking-wide flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <span>Download Navi App</span>
              <ExternalLink className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-2 pt-1">
              <span>https://r.navi.com/tL07AD</span>
              <button
                onClick={handleSkip}
                className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdModal;
