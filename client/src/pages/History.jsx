import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { uploadApi } from '../api/recipeApi';
import { useIngredientStore } from '../store/useIngredientStore';
import { LoadingSpinner, EmptyState } from '../components/shared/index';

function UploadRow({ upload, onReuse }) {
  const imageCount = upload.images?.length || 0;
  const ingCount   = upload.ingredientCount || 0;
  const date       = new Date(upload.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="card p-4 flex items-center gap-4 group hover:border-brand-500/30 transition-all">
      {/* Thumbnails */}
      <div className="flex -space-x-2 flex-shrink-0">
        {upload.images?.slice(0, 3).map((img, i) => (
          <img key={i} src={img.thumbnailUrl || img.cloudinaryUrl} alt=""
            className="w-12 h-12 rounded-xl object-cover border-2 border-dark-900" loading="lazy" aria-hidden="true" />
        ))}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">
          <span className="gradient-text">{ingCount}</span> ingredient{ingCount !== 1 ? 's' : ''} detected
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          {imageCount} photo{imageCount !== 1 ? 's' : ''} · {date}
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        onClick={() => onReuse(upload)} className="btn-primary text-xs px-3 py-1.5 flex-shrink-0">
        Find recipes
      </motion.button>
    </motion.div>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [uploads, setUploads] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const { setIngredients } = useIngredientStore();

  const load = async (p = 1) => {
    try {
      const { data } = await uploadApi.getAll({ page: p, limit: 10 });
      if (p === 1) setUploads(data.uploads);
      else setUploads((prev) => [...prev, ...data.uploads]);
      setHasMore(data.pagination?.hasMore ?? false);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(1); }, []);

  const handleReuse = (upload) => {
    setIngredients((upload.extractedIngredients || []).map((ing) => ({ id: ing._id, ...ing })));
    navigate(`/results/${upload._id}`);
  };

  return (
    <main className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="blob w-48 h-48 bg-violet-600/10 top-0 right-0 animate-blob" />

      <div className="mb-8 relative z-10">
        <h1 className="text-3xl font-bold text-text-primary mb-1">
          Scan <span className="gradient-text">history</span>
        </h1>
        <p className="text-sm text-text-muted">Re-use any previous scan to find new recipes</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : uploads.length === 0 ? (
        <EmptyState icon="📸" title="No scans yet"
          description="Upload your first fridge photo to get started."
          action={<Link to="/upload" className="btn-primary">Scan my fridge</Link>} />
      ) : (
        <div className="space-y-3">
          {uploads.map((upload) => (
            <UploadRow key={upload._id} upload={upload} onReuse={handleReuse} />
          ))}
          {hasMore && (
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={() => { const next = page + 1; setPage(next); load(next); }}
              className="btn-secondary w-full mt-2">
              Load more
            </motion.button>
          )}
        </div>
      )}
    </main>
  );
}