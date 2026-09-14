import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, FastForward, Sparkles, Users, Video, Lightbulb, Compass, Share2 } from 'lucide-react';
import Logo from './Logo';

export default function IntroSequence({ onComplete, autoAdvance = true }) {
  // Current screen: 1 (Welcome) -> 2 (Collaboration)
  const [screen, setScreen] = useState(1);
  const shouldReduceMotion = useReducedMotion();

  // Timing: 3.5 seconds per screen auto-advance
  useEffect(() => {
    if (!autoAdvance) return;

    if (screen === 1) {
      const timer1 = setTimeout(() => {
        setScreen(2);
      }, 3500);
      return () => clearTimeout(timer1);
    } else if (screen === 2) {
      const timer2 = setTimeout(() => {
        onComplete();
      }, 3500);
      return () => clearTimeout(timer2);
    }
  }, [screen, autoAdvance, onComplete]);

  const handleSkip = () => {
    onComplete();
  };

  const handleNext = () => {
    if (screen === 1) {
      setScreen(2);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-white via-[#FAF8FF] to-brand-50/70 select-none">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-indigo-100/35 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Header Controls */}
      <header className="relative z-10 flex items-center justify-between p-6 sm:p-8 max-w-7xl mx-auto w-full">
        <Logo size="md" />

        <div className="flex items-center gap-3">
          {/* Progress dots */}
          <div className="flex items-center gap-2 mr-2">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                screen === 1 ? 'w-8 bg-brand-600' : 'w-2 bg-slate-300'
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                screen === 2 ? 'w-8 bg-brand-600' : 'w-2 bg-slate-300'
              }`}
            />
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="group flex items-center gap-1.5 px-4 py-2 text-xs font-semibold tracking-wider text-slate-600 hover:text-brand-700 bg-white/90 hover:bg-white border border-slate-200 rounded-full shadow-sm hover:shadow transition-all"
          >
            <span>Skip Intro</span>
            <FastForward className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* Center Animated Screen Stage */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* ========================================================
              SCREEN 1: WELCOME SCREEN
              Exact required text: "welcome to the chakri's meet"
             ======================================================== */}
          {screen === 1 && (
            <motion.div
              key="screen-1"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.98 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center max-w-3xl"
            >
              {/* Floating emblem with gentle pulse */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.55 }}
                className="relative mb-8"
              >
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white shadow-2xl shadow-brand-500/20 border border-white p-4 flex items-center justify-center">
                  <Logo size="xl" className="justify-center" />
                </div>

                {/* Floating pill 1: HD Video */}
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-3 -right-12 hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-slate-200 shadow-md text-xs font-semibold text-brand-700"
                >
                  <Video className="w-3.5 h-3.5 text-brand-600" />
                  <span>HD Video</span>
                </motion.div>

                {/* Floating pill 2: Zero Install */}
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                  className="absolute -bottom-3 -left-12 hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-slate-200 shadow-md text-xs font-semibold text-sky-700"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                  <span>Browser-Native</span>
                </motion.div>
              </motion.div>

              {/* Exact Screen 1 Text: "welcome to the chakri's meet" */}
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.55 }}
                className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight leading-tight"
              >
                welcome to the{' '}
                <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                  chakri's meet
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-5 text-base sm:text-lg text-slate-600 max-w-xl font-medium"
              >
                Instant, secure, and crafted with uncompromising modern elegance.
                Zero downloads required.
              </motion.p>
            </motion.div>
          )}

          {/* ========================================================
              SCREEN 2: COLLABORATION SCREEN
              Exact required text: "discuss and create the new things"
             ======================================================== */}
          {screen === 2 && (
            <motion.div
              key="screen-2"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.98 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center max-w-3xl"
            >
              {/* Creative Collaboration Visual Architecture */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.55 }}
                className="relative mb-8 w-full max-w-md h-44 flex items-center justify-center"
              >
                {/* Connected nodes animation */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-xl shadow-brand-500/30 flex items-center justify-center text-white z-20">
                    <Lightbulb className="w-8 h-8" />
                  </div>

                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="absolute -top-2 left-10 px-3 py-1.5 bg-white shadow-lg border border-slate-200 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                      <Compass className="w-3.5 h-3.5 text-brand-600" />
                      <span>Smart Board</span>
                    </div>

                    <div className="absolute -bottom-2 right-10 px-3 py-1.5 bg-white shadow-lg border border-slate-200 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                      <Share2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>Live Polls</span>
                    </div>

                    <div className="absolute right-2 top-8 px-3 py-1.5 bg-white shadow-lg border border-slate-200 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                      <Users className="w-3.5 h-3.5 text-violet-600" />
                      <span>Shared Notes</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Exact Screen 2 Text: "discuss and create the new things" */}
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.55 }}
                className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight leading-tight"
              >
                <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
                  discuss and create the new things
                </span>
              </motion.h1>

              {/* Supporting subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-5 text-base sm:text-lg text-slate-600 max-w-xl font-medium"
              >
                Collaborative canvas, real-time polling, synchronized notes, and ultra-fast video
                built for team innovation.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Footer Actions */}
      <footer className="relative z-10 flex items-center justify-between p-6 sm:p-8 max-w-7xl mx-auto w-full">
        <span className="text-xs text-slate-500 font-medium">
          Screen {screen} of 2 &bull; Auto-advancing to Pre-Join Lobby
        </span>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-brand-600 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <span>{screen === 1 ? 'Next' : 'Proceed to Meeting'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}
