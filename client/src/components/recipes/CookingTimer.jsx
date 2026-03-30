import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Duration per step can come from instructions, or user sets manually
const DEFAULT_STEP_DURATION = 5 * 60; // 5 minutes default
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 54; // radius=54

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Simple audio chime using Web Audio API — no external file needed
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Web Audio not available — silent fallback
  }
}

export default function CookingTimer({ steps = [] }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [duration, setDuration] = useState(DEFAULT_STEP_DURATION);
  const [remaining, setRemaining] = useState(DEFAULT_STEP_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);

  const currentStep = steps[stepIndex];
  const progress = duration > 0 ? remaining / duration : 0;
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * progress;

  // ── Timer tick ────────────────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setIsComplete(true);
            playChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsComplete(false);
    setRemaining(duration);
  }, [duration]);

  const goToStep = (idx) => {
    reset();
    setStepIndex(idx);
    setIsComplete(false);
  };

  const nextStep = () => {
    if (stepIndex < steps.length - 1) goToStep(stepIndex + 1);
  };

  const prevStep = () => {
    if (stepIndex > 0) goToStep(stepIndex - 1);
  };

  const adjustDuration = (delta) => {
    const newDur = Math.max(30, duration + delta);
    setDuration(newDur);
    setRemaining(newDur);
    setIsComplete(false);
  };

  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
        Cooking Timer
      </h3>

      {/* Step navigator */}
      {steps.length > 1 && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevStep}
            disabled={stepIndex === 0}
            className="btn-ghost p-1 disabled:opacity-30"
            aria-label="Previous step"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs font-medium text-text-secondary">
            Step {stepIndex + 1} of {steps.length}
          </span>
          <button
            onClick={nextStep}
            disabled={stepIndex === steps.length - 1}
            className="btn-ghost p-1 disabled:opacity-30"
            aria-label="Next step"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Current step text */}
      {currentStep && (
        <p className="text-sm text-text-secondary mb-5 line-clamp-3 min-h-[3.75rem]">
          {currentStep.text}
        </p>
      )}

      {/* SVG ring timer */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative" role="timer" aria-live="polite" aria-label={`${formatTime(remaining)} remaining`}>
          <svg width="128" height="128" viewBox="0 0 128 128">
            {/* Background track */}
            <circle
              cx="64" cy="64" r="54"
              fill="none" stroke="#e2e8f0" strokeWidth="8"
            />
            {/* Animated progress ring */}
            <motion.circle
              cx="64" cy="64" r="54"
              fill="none"
              stroke={isComplete ? '#22c55e' : '#f97316'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCLE_CIRCUMFERENCE}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: 'linear' }}
              style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
            />
          </svg>

          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {isComplete ? (
                <motion.span
                  key="done"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl"
                  aria-label="Timer complete"
                >
                  ✅
                </motion.span>
              ) : (
                <motion.span
                  key="time"
                  className="text-2xl font-bold font-mono text-text-primary tabular-nums"
                >
                  {formatTime(remaining)}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Duration adjustment */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <button onClick={() => adjustDuration(-60)} className="btn-ghost py-1 px-2 text-xs">−1m</button>
          <span>Duration: {formatTime(duration)}</span>
          <button onClick={() => adjustDuration(60)}  className="btn-ghost py-1 px-2 text-xs">+1m</button>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsRunning((r) => !r)}
            className="btn-primary px-6 py-2 flex items-center gap-2"
            aria-label={isRunning ? 'Pause timer' : 'Start timer'}
          >
            {isRunning ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {isComplete ? 'Restart' : 'Start'}
              </>
            )}
          </button>
          <button onClick={reset} className="btn-secondary px-4 py-2" aria-label="Reset timer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {isComplete && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-brand-600"
            role="alert"
          >
            Step complete! {stepIndex < steps.length - 1 ? 'Move to next step →' : '🎉 Recipe done!'}
          </motion.p>
        )}
      </div>
    </div>
  );
}
