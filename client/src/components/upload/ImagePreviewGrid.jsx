import { motion, AnimatePresence } from 'framer-motion';
import { useUploadStore } from '../../store/useUploadStore';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     className: 'badge-slate'  },
  compressing: { label: 'Compressing', className: 'badge-orange', pulse: true },
  ready:       { label: 'Ready',       className: 'badge-green'  },
  error:       { label: 'Error',       className: 'bg-red-100 text-red-600 text-xs font-medium px-2.5 py-0.5 rounded-full' },
};

export default function ImagePreviewGrid() {
  const { files, removeFile, status } = useUploadStore();
  const isUploading = status === 'uploading';

  if (files.length === 0) return null;

  return (
    <div role="list" aria-label="Selected images">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <AnimatePresence mode="popLayout">
          {files.map((entry) => {
            const statusCfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;
            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                role="listitem"
                className="relative group rounded-xl overflow-hidden bg-slate-100 aspect-square"
              >
                {/* Thumbnail */}
                <img
                  src={entry.preview}
                  alt={`Fridge photo: ${entry.file.name}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Dark overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

                {/* Status badge */}
                <div className="absolute top-2 left-2">
                  <span
                    className={`${statusCfg.className} ${statusCfg.pulse ? 'animate-pulse-soft' : ''}`}
                    aria-label={`Image status: ${statusCfg.label}`}
                  >
                    {statusCfg.label}
                  </span>
                </div>

                {/* Remove button — hidden while uploading */}
                {!isUploading && (
                  <button
                    onClick={() => removeFile(entry.id)}
                    className="
                      absolute top-2 right-2
                      w-6 h-6 rounded-full
                      bg-white/90 hover:bg-white
                      flex items-center justify-center
                      opacity-0 group-hover:opacity-100
                      focus-visible:opacity-100
                      transition-opacity duration-150
                      shadow-sm
                    "
                    aria-label={`Remove ${entry.file.name}`}
                  >
                    <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* Compressing overlay shimmer */}
                {entry.status === 'compressing' && (
                  <div className="absolute inset-0 skeleton opacity-40" aria-hidden="true" />
                )}

                {/* Error overlay */}
                {entry.status === 'error' && (
                  <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center">
                    <span className="text-white text-xs font-medium px-2 text-center">
                      {entry.error}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
