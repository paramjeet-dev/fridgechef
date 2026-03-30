import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUploadStore } from '../store/useUploadStore';
import ImageUploadZone from '../components/upload/ImageUploadZone';
import ImagePreviewGrid from '../components/upload/ImagePreviewGrid';

export default function Upload() {
  const navigate = useNavigate();
  const { files, status, uploadId, uploadImages, clearFiles, resetStatus } = useUploadStore();

  // Navigate to results once upload completes
  useEffect(() => {
    if (status === 'done' && uploadId) {
      navigate(`/results/${uploadId}`);
    }
  }, [status, uploadId, navigate]);

  // Cleanup previews on unmount
  useEffect(() => () => resetStatus(), [resetStatus]);

  const readyCount = files.filter((f) => f.status === 'ready').length;
  const compressingCount = files.filter((f) => f.status === 'compressing').length;
  const hasError = status === 'error';
  const isUploading = status === 'uploading';
  const canSubmit = readyCount > 0 && !isUploading && compressingCount === 0;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-text-primary">
          Scan your fridge
        </h1>
        <p className="mt-2 text-text-secondary">
          Upload up to 5 photos of your fridge and we&apos;ll identify your ingredients
          and find recipes you can make right now.
        </p>
      </div>

      {/* Drop zone */}
      <ImageUploadZone />

      {/* Preview grid */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6"
        >
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Selected photos
          </h2>
          <ImagePreviewGrid />
        </motion.div>
      )}

      {/* Status messages */}
      {compressingCount > 0 && (
        <p className="mt-4 text-sm text-accent-500 flex items-center gap-2" role="status" aria-live="polite">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Compressing {compressingCount} image{compressingCount > 1 ? 's' : ''}…
        </p>
      )}

      {hasError && (
        <div
          className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
          role="alert"
        >
          <strong>Upload failed.</strong> Please try again. If the problem persists,
          try with fewer or smaller images.
        </div>
      )}

      {/* Action bar */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <button
            onClick={uploadImages}
            disabled={!canSubmit}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
            aria-busy={isUploading}
            aria-disabled={!canSubmit}
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
          </button>

          <button
            onClick={clearFiles}
            disabled={isUploading}
            className="btn-secondary"
          >
            Clear all
          </button>
        </motion.div>
      )}

      {/* Upload tips */}
      {files.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { icon: '💡', tip: 'Good lighting', desc: 'Well-lit photos give better ingredient detection' },
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
