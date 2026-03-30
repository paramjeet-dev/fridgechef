import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  fileType: 'image/jpeg',
};

/**
 * Provides a compressFile function and tracks compression progress.
 *
 * Usage:
 *   const { compressFile, isCompressing, progress } = useImageCompression();
 *   const compressed = await compressFile(file);
 */
export function useImageCompression() {
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0); // 0–100

  const compressFile = useCallback(async (file) => {
    setIsCompressing(true);
    setProgress(0);

    try {
      const compressed = await imageCompression(file, {
        ...COMPRESSION_OPTIONS,
        onProgress: (p) => setProgress(p),
      });
      return compressed;
    } finally {
      setIsCompressing(false);
      setProgress(0);
    }
  }, []);

  return { compressFile, isCompressing, progress };
}
