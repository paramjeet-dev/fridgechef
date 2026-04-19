import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadStore } from '../store/useUploadStore';
import ImageUploadZone from '../components/upload/ImageUploadZone';
import ImagePreviewGrid from '../components/upload/ImagePreviewGrid';

// Humorous messages cycling during upload
const SCAN_MESSAGES = [
  '🔬 Interrogating your vegetables…',
  '🧠 Teaching AI about your sad leftovers…',
  '🥦 Broccoli detected. Judgement reserved.',
  '🍕 Counting pizza slices (don\'t worry, your secret\'s safe)…',
  '📸 Enhancing fridge lighting. NASA-level stuff.',
  '🤖 Consulting Gordon Ramsay\'s ghost…',
  '🧅 Onion identified. Tears incoming.',
  '🥚 Eggs: verified. Omelette possibilities: infinite.',
  '🧪 Running secret ingredient analysis…',
  '🎯 Almost there! Pinching results from the universe…',
  '🍳 Calculating the perfect recipe match…',
  '🌿 Scanning for herbs like a botanical genius…',
];

function ScanningOverlay() {
  const [msgIndex,  setMsgIndex]  = useState(0);
  const [progress,  setProgress]  = useState(0);
  const progressRef = useRef(0);
  const timerRef    = useRef(null);

  // Cycle messages every 1.8 s
  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % SCAN_MESSAGES.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  // Fake progress: runs to ~92 % quickly then slows down to wait for server
  useEffect(() => {
    const tick = () => {
      const cur = progressRef.current;
      let increment;
      if (cur < 40)       increment = 2.5;
      else if (cur < 70)  increment = 1.2;
      else if (cur < 88)  increment = 0.4;
      else                increment = 0.05;

      progressRef.current = Math.min(cur + increment, 92);
      setProgress(progressRef.current);
      timerRef.current = setTimeout(tick, 120);
    };
    timerRef.current = setTimeout(tick, 120);
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-900/90 backdrop-blur-md px-6"
    >
      {/* Pulsing fridge emoji */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="text-7xl mb-8 select-none"
        aria-hidden="true"
      >
        🧊
      </motion.div>

      {/* Progress bar */}
      <div className="w-full max-w-sm mb-6">
        <div className="flex justify-between text-xs text-text-muted mb-2">
          <span>Scanning…</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-600 to-cyan-500"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.12 }}
          />
        </div>
      </div>

      {/* Rotating humorous message */}
      <div className="h-8 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="text-sm text-text-secondary text-center"
          >
            {SCAN_MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <p className="mt-4 text-xs text-text-muted">Please don't close this tab — your fridge deserves better.</p>
    </motion.div>
  );
}

export default function Upload() {
  const navigate = useNavigate();
  const { files, status, uploadId, uploadImages, clearFiles, resetStatus } = useUploadStore();

  useEffect(() => {
    if (status === 'done' && uploadId) navigate(`/results/${uploadId}`);
  }, [status, uploadId, navigate]);

  useEffect(() => () => resetStatus(), [resetStatus]);

  const readyCount       = files.filter((f) => f.status === 'ready').length;
  const compressingCount = files.filter((f) => f.status === 'compressing').length;
  const isUploading      = status === 'uploading';
  const hasError         = status === 'error';
  const canSubmit        = readyCount > 0 && !isUploading && compressingCount === 0;

  return (
    <>
      {/* Full-screen scanning overlay */}
      <AnimatePresence>
        {isUploading && <ScanningOverlay />}
      </AnimatePresence>

      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10 overflow-hidden">
        <div className="blob w-64 h-64 bg-violet-600/15 top-0 right-0 animate-blob" />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 relative z-10">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Scan your <span className="gradient-text">fridge</span>
          </h1>
          <p className="text-text-secondary">
            Upload up to 5 photos — our AI identifies every ingredient automatically.
          </p>
        </motion.div>

        {/* Drop zone */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <ImageUploadZone />
        </motion.div>

        {/* Preview */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
              Selected photos
            </h2>
            <ImagePreviewGrid />
          </motion.div>
        )}

        {/* Compressing indicator */}
        {compressingCount > 0 && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-4 text-sm text-cyan-400 flex items-center gap-2"
            role="status"
          >
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Compressing {compressingCount} image{compressingCount > 1 ? 's' : ''}…
          </motion.p>
        )}

        {/* Error */}
        {hasError && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400"
            role="alert"
          >
            <strong>Upload failed.</strong> Please try again with fewer or smaller images.
          </motion.div>
        )}

        {/* Action bar */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <motion.button
              onClick={uploadImages}
              disabled={!canSubmit}
              whileHover={canSubmit ? { scale: 1.02 } : {}}
              whileTap={canSubmit ? { scale: 0.97 } : {}}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Scan {readyCount} photo{readyCount !== 1 ? 's' : ''}
            </motion.button>

            <motion.button
              onClick={clearFiles}
              disabled={isUploading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="btn-secondary"
            >
              Clear all
            </motion.button>
          </motion.div>
        )}

        {/* Tips (when nothing uploaded yet) */}
        {files.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {[
              { icon: '💡', tip: 'Good lighting', desc: 'Well-lit photos give better detection' },
              { icon: '📐', tip: 'Fill the frame', desc: 'Get close — fit your items in the shot' },
              { icon: '📸', tip: 'Multiple angles', desc: 'Use up to 5 photos to capture everything' },
            ].map(({ icon, tip, desc }) => (
              <div key={tip} className="card p-4 flex gap-3">
                <span className="text-2xl flex-shrink-0" aria-hidden="true">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{tip}</p>
                  <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </main>
    </>
  );
}
