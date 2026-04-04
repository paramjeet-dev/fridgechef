import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUploadStore } from '../store/useUploadStore';
import ImageUploadZone from '../components/upload/ImageUploadZone';
import ImagePreviewGrid from '../components/upload/ImagePreviewGrid';

export default function Upload() {
  const navigate = useNavigate();
  const { files, status, uploadId, uploadImages, clearFiles, resetStatus } = useUploadStore();

  useEffect(() => {
    if (status === 'done' && uploadId) navigate(`/results/${uploadId}`);
  }, [status, uploadId, navigate]);

  useEffect(() => () => resetStatus(), [resetStatus]);

  const readyCount      = files.filter((f) => f.status === 'ready').length;
  const compressingCount = files.filter((f) => f.status === 'compressing').length;
  const isUploading      = status === 'uploading';
  const hasError         = status === 'error';
  const canSubmit        = readyCount > 0 && !isUploading && compressingCount === 0;

  return (
    <main className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10 overflow-hidden">
      {/* Subtle blobs */}
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

      {/* Status */}
      {compressingCount > 0 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-4 text-sm text-cyan-400 flex items-center gap-2" role="status">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Compressing {compressingCount} image{compressingCount > 1 ? 's' : ''}…
        </motion.p>
      )}

      {hasError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400" role="alert">
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
            aria-busy={isUploading}
          >
            {isUploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Scanning ingredients…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Scan {readyCount} photo{readyCount !== 1 ? 's' : ''}
              </>
            )}
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

      {/* Tips */}
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
  );
}