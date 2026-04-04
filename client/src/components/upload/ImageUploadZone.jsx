import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { useUploadStore } from '../../store/useUploadStore';

const MAX_FILES = 5;
const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png':  ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
};

export default function ImageUploadZone() {
  const { files, addFiles } = useUploadStore();
  const remaining = MAX_FILES - files.length;

  const onDrop = useCallback(
    (accepted) => { if (accepted.length) addFiles(accepted.slice(0, remaining)); },
    [addFiles, remaining]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: remaining,
    disabled: remaining === 0,
    maxSize: 15 * 1024 * 1024,
  });

  return (
    <div>
      <motion.div
        {...getRootProps()}
        animate={{ scale: isDragActive ? 1.02 : 1 }}
        transition={{ duration: 0.15 }}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-200 overflow-hidden
          ${isDragReject
            ? 'border-red-500/60 bg-red-500/5'
            : isDragActive
            ? 'border-brand-500/80 bg-brand-500/10 shadow-glow-violet'
            : remaining === 0
            ? 'border-white/10 bg-white/3 opacity-50 cursor-not-allowed'
            : 'border-white/15 bg-white/4 hover:border-brand-500/50 hover:bg-brand-500/5 hover:shadow-glow-sm'
          }
        `}
        aria-label="Image upload zone. Drag and drop fridge photos here, or click to browse."
        role="button"
        tabIndex={remaining === 0 ? -1 : 0}
      >
        <input {...getInputProps()} aria-label="Upload fridge images" />

        {/* Animated glow ring on drag */}
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 rounded-2xl"
            style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)' }}
          />
        )}

        {/* Icon */}
        <motion.div
          animate={{ y: isDragActive ? -8 : 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10"
        >
          <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600/30 to-cyan-600/20 border border-brand-500/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          {isDragReject ? (
            <p className="text-sm font-medium text-red-400">Unsupported file type — use JPEG, PNG, WEBP, or HEIC</p>
          ) : isDragActive ? (
            <p className="text-sm font-medium text-brand-300">Drop your fridge photos here…</p>
          ) : remaining === 0 ? (
            <p className="text-sm text-text-muted">Maximum {MAX_FILES} images reached</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-text-primary mb-1">
                Drop fridge photos here, or{' '}
                <span className="gradient-text">browse files</span>
              </p>
              <p className="text-xs text-text-muted">
                JPEG, PNG, WEBP, HEIC · up to 15MB · {remaining} image{remaining !== 1 ? 's' : ''} remaining
              </p>
            </>
          )}
        </motion.div>
      </motion.div>

      {files.length > 0 && (
        <p className="mt-2 text-xs text-text-muted text-right">
          {files.length} / {MAX_FILES} photos added
        </p>
      )}
    </div>
  );
}