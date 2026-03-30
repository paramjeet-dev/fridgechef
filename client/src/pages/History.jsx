import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { uploadApi } from '../api/recipeApi';
import { useIngredientStore } from '../store/useIngredientStore';
import { LoadingSpinner, EmptyState } from '../components/shared/index';
import { Link } from 'react-router-dom';

function UploadRow({ upload, onReuse }) {
  const imageCount = upload.images?.length || 0;
  const ingredientCount = upload.ingredientCount || 0;
  const date = new Date(upload.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4 flex items-center gap-4"
    >
      {/* Thumbnail stack */}
      <div className="flex -space-x-2 flex-shrink-0">
        {upload.images?.slice(0, 3).map((img, i) => (
          <img
            key={i}
            src={img.thumbnailUrl || img.cloudinaryUrl}
            alt=""
            className="w-12 h-12 rounded-xl object-cover border-2 border-white"
            aria-hidden="true"
            loading="lazy"
          />
        ))}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">
          {ingredientCount} ingredient{ingredientCount !== 1 ? 's' : ''} detected
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          {imageCount} photo{imageCount !== 1 ? 's' : ''} · {date}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onReuse(upload)}
          className="btn-primary text-xs px-3 py-1.5"
          aria-label={`Re-use ingredients from ${date} scan`}
        >
          Find recipes
        </button>
      </div>
    </motion.div>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [uploads, setUploads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const { setIngredients } = useIngredientStore();

  const load = async (p = 1) => {
    try {
      const { data } = await uploadApi.getAll({ page: p, limit: 10 });
      if (p === 1) {
        setUploads(data.uploads);
      } else {
        setUploads((prev) => [...prev, ...data.uploads]);
      }
      setHasMore(data.pagination?.hasMore ?? false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  const handleReuse = (upload) => {
    // Map DB ingredient shape to store shape
    const mapped = (upload.extractedIngredients || []).map((ing) => ({
      id: ing._id,
      ...ing,
    }));
    setIngredients(mapped);
    navigate(`/results/${upload._id}`);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next);
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-display font-bold text-text-primary mb-8">Scan history</h1>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" label="Loading history..." />
        </div>
      ) : uploads.length === 0 ? (
        <EmptyState
          icon="📸"
          title="No scans yet"
          description="Upload your first fridge photo to get started."
          action={<Link to="/upload" className="btn-primary">Scan my fridge</Link>}
        />
      ) : (
        <div className="space-y-3">
          {uploads.map((upload) => (
            <UploadRow key={upload._id} upload={upload} onReuse={handleReuse} />
          ))}

          {hasMore && (
            <button onClick={loadMore} className="btn-secondary w-full mt-2">
              Load more
            </button>
          )}
        </div>
      )}
    </main>
  );
}
