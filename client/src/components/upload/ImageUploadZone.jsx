import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { useUploadStore } from '../../store/useUploadStore';

const MAX_FILES = 5;
const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
};

export default function ImageUploadZone() {
  const { files, addFiles } = useUploadStore();
  const remaining = MAX_FILES - files.length;

  const onDrop = useCallback(
    (accepted) => {
      if (accepted.length === 0) return;
      // Slice to respect the remaining quota
      addFiles(accepted.slice(0, remaining));
    },
    [addFiles, remaining]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: remaining,
    disabled: remaining === 0,
    maxSize: 15 * 1024 * 1024, // 15MB — Sharp compresses before upload
  });

  const borderColor = isDragReject
    ? 'border-red-400 bg-red-50'
    : isDragActive
    ? 'border-brand-500 bg-brand-50'
    : remaining === 0
    ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
    : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-brand-50/40';

  return (
    <div>
      <motion.div
        {...getRootProps()}
        animate={{
          scale: isDragActive ? 1.01 : 1,
          borderColor: isDragActive ? '#22c55e' : isDragReject ? '#f87171' : '#cbd5e1',
        }}
        transition={{ duration: 0.15 }}
        className={`
          relative border-2 border-dashed rounded-2xl p-10
          text-center transition-colors duration-200 cursor-pointer
          focus-visible:outline-2 focus-visible:outline-brand-500 focus-visible:outline-offset-2
          ${borderColor}
        `}
        aria-label="Image upload zone. Drag and drop fridge photos here, or click to browse."
        role="button"
        tabIndex={remaining === 0 ? -1 : 0}
      >
        <input {...getInputProps()} aria-label="Upload fridge images" />

        {/* Icon */}
        <motion.div
          animate={{ y: isDragActive ? -4 : 0 }}
          transition={{ duration: 0.2 }}
          className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center"
          aria-hidden="true"
        >
          <svg className="w-7 h-7 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </motion.div>

        {/* Text */}
        {isDragReject ? (
          <p className="text-sm font-medium text-red-500">
            Unsupported file type — use JPEG, PNG, WEBP, or HEIC
          </p>
        ) : isDragActive ? (
          <p className="text-sm font-medium text-brand-600">Drop your fridge photos here…</p>
        ) : remaining === 0 ? (
          <p className="text-sm text-text-secondary">Maximum {MAX_FILES} images reached</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-text-primary mb-1">
              Drop fridge photos here, or{' '}
              <span className="text-brand-600">browse files</span>
            </p>
            <p className="text-xs text-text-muted">
              JPEG, PNG, WEBP, HEIC · up to 15MB each · {remaining} image{remaining !== 1 ? 's' : ''} remaining
            </p>
          </>
        )}
      </motion.div>

      {/* File count hint */}
      {files.length > 0 && (
        <p className="mt-2 text-xs text-text-muted text-right">
          {files.length} / {MAX_FILES} photos added
        </p>
      )}
    </div>
  );
}
