import { create } from 'zustand';
import imageCompression from 'browser-image-compression';
import api from '../api/axiosInstance';
import { useIngredientStore } from './useIngredientStore';
import toast from 'react-hot-toast';

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,           // Target 500KB max before upload
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  fileType: 'image/jpeg',   // Normalise HEIC/PNG to JPEG
};

export const useUploadStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────
  // Each file entry: { id, file, preview, compressed, status, error }
  files: [],
  status: 'idle',   // idle | compressing | uploading | done | error
  uploadId: null,   // Returned from server after successful upload
  error: null,

  // ── File management ───────────────────────────────────────

  addFiles: async (acceptedFiles) => {
    // Build preview entries immediately so the UI updates instantly
    const newEntries = acceptedFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      compressed: null,
      status: 'pending',   // pending | compressing | ready | error
      error: null,
    }));

    set((state) => ({ files: [...state.files, ...newEntries] }));

    // Compress each file in the background
    for (const entry of newEntries) {
      set((state) => ({
        files: state.files.map((f) =>
          f.id === entry.id ? { ...f, status: 'compressing' } : f
        ),
      }));

      try {
        const compressed = await imageCompression(entry.file, COMPRESSION_OPTIONS);
        set((state) => ({
          files: state.files.map((f) =>
            f.id === entry.id ? { ...f, compressed, status: 'ready' } : f
          ),
        }));
      } catch (err) {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === entry.id
              ? { ...f, status: 'error', error: 'Compression failed' }
              : f
          ),
        }));
      }
    }
  },

  removeFile: (id) => {
    const { files } = get();
    const entry = files.find((f) => f.id === id);
    // Revoke object URL to prevent memory leak
    if (entry?.preview) URL.revokeObjectURL(entry.preview);
    set({ files: files.filter((f) => f.id !== id) });
  },

  clearFiles: () => {
    get().files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    set({ files: [], status: 'idle', uploadId: null, error: null });
  },

  // ── Upload ────────────────────────────────────────────────

  /**
   * Sends all ready compressed files to POST /api/uploads.
   * On success: populates useIngredientStore and returns uploadId.
   */
  uploadImages: async () => {
    const { files } = get();
    const readyFiles = files.filter((f) => f.status === 'ready' && f.compressed);

    if (readyFiles.length === 0) {
      toast.error('No images ready to upload.');
      return { success: false };
    }

    set({ status: 'uploading', error: null });

    const formData = new FormData();
    readyFiles.forEach((entry) => {
      // Use the compressed file but give it the original name
      const renamedFile = new File(
        [entry.compressed],
        entry.file.name.replace(/\.[^.]+$/, '.jpg'),  // Normalise extension
        { type: 'image/jpeg' }
      );
      formData.append('images', renamedFile);
    });

    try {
      const { data } = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Hand ingredients off to ingredient store
      useIngredientStore.getState().setIngredients(data.ingredients);

      set({ status: 'done', uploadId: data.upload.id });
      toast.success(data.message);
      return { success: true, uploadId: data.upload.id };

    } catch (error) {
      const message = error.response?.data?.message || 'Upload failed. Please try again.';
      set({ status: 'error', error: message });
      toast.error(message);
      return { success: false, message };
    }
  },

  resetStatus: () => set({ status: 'idle', error: null }),
}));
