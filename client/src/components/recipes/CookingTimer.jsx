import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_DURATION   = 5 * 60;
const CIRCUMFERENCE      = 2 * Math.PI * 54;

function formatTime(s) {
  return `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;
}

function playChime() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(); osc.stop(ctx.currentTime + 0.6);
  } catch {}
}

export default function CookingTimer({ steps = [] }) {
  const [stepIndex,  setStepIndex]  = useState(0);
  const [duration,   setDuration]   = useState(DEFAULT_DURATION);
  const [remaining,  setRemaining]  = useState(DEFAULT_DURATION);
  const [isRunning,  setIsRunning]  = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);

  const currentStep = steps[stepIndex];
  const progress    = duration > 0 ? remaining / duration : 0;
  const offset      = CIRCUMFERENCE * progress;

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setRemaining((p) => {
        if (p <= 1) { clearInterval(intervalRef.current); setIsRunning(false); setIsComplete(true); playChime(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setIsRunning(false); setIsComplete(false); setRemaining(duration);
  }, [duration]);

  const goToStep = (idx) => { reset(); setStepIndex(idx); setIsComplete(false); };

  return (
    <div className="card p-5">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">Cooking Timer</h3>

      {/* Step navigator */}
      {steps.length > 1 && (
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => goToStep(stepIndex - 1)} disabled={stepIndex === 0}
            className="btn-ghost p-1 disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span className="text-xs font-medium text-text-muted">Step {stepIndex + 1} / {steps.length}</span>
          <button onClick={() => goToStep(stepIndex + 1)} disabled={stepIndex === steps.length - 1}
            className="btn-ghost p-1 disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      )}

      {currentStep && (
        <p className="text-sm text-text-secondary mb-5 line-clamp-3 min-h-[3.75rem] leading-relaxed">{currentStep.text}</p>
      )}

      <div className="flex flex-col items-center gap-4">
        {/* SVG ring */}
        <div className="relative" role="timer" aria-live="polite">
          <svg width="128" height="128" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
            <motion.circle cx="64" cy="64" r="54" fill="none"
              stroke={isComplete ? '#22d3ee' : 'url(#timerGrad)'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.5, ease: 'linear' }}
              style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }} />
            <defs>
              <linearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7c3aed"/>
                <stop offset="100%" stopColor="#06b6d4"/>
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {isComplete ? (
                <motion.span key="done" initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-2xl">✅</motion.span>
              ) : (
                <motion.span key="time" className="text-2xl font-bold font-mono gradient-text tabular-nums">
                  {formatTime(remaining)}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Duration adjust */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <button onClick={() => { const n = Math.max(30, duration - 60); setDuration(n); setRemaining(n); setIsComplete(false); }}
            className="btn-ghost py-1 px-2 text-xs">−1m</button>
          <span className="font-mono">{formatTime(duration)}</span>
          <button onClick={() => { const n = duration + 60; setDuration(n); setRemaining(n); setIsComplete(false); }}
            className="btn-ghost py-1 px-2 text-xs">+1m</button>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setIsRunning((r) => !r)}
            className="btn-primary px-6 py-2 flex items-center gap-2"
          >
            {isRunning ? (
              <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>Pause</>
            ) : (
              <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>{isComplete ? 'Restart' : 'Start'}</>
            )}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={reset} className="btn-secondary px-4 py-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </motion.button>
        </div>

        {isComplete && (
          <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium gradient-text" role="alert">
            Step complete! {stepIndex < steps.length - 1 ? 'Move to next step →' : '🎉 Recipe done!'}
          </motion.p>
        )}
      </div>
    </div>
  );
}