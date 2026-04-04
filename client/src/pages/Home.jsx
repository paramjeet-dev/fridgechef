import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';

const FEATURES = [
  { icon: '📸', title: 'Scan your fridge',  desc: 'AI identifies every ingredient from your photos instantly.',    gradient: 'from-violet-500/20 to-purple-600/10' },
  { icon: '🍽️', title: 'Discover recipes',  desc: 'Find perfect recipes using exactly what you already have.',    gradient: 'from-cyan-500/20 to-blue-600/10'   },
  { icon: '🛒', title: 'Shop the gaps',     desc: "Missing one ingredient? We link straight to BigBasket.",       gradient: 'from-amber-500/20 to-orange-600/10' },
  { icon: '📅', title: 'Plan your week',    desc: 'Auto-generate a full meal plan tailored to your preferences.', gradient: 'from-pink-500/20 to-rose-600/10'   },
];

const FOOD_CARDS = ['🍝', '🥗', '🍛', '🥑', '🍕', '🥞'];

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Home() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <main className="relative overflow-hidden">
      {/* ── Animated background blobs ─────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="blob w-96 h-96 bg-violet-600/20 top-[-10%] left-[-10%] animate-blob" />
        <div className="blob w-80 h-80 bg-cyan-500/15 top-[20%] right-[-5%] animate-blob-delay" />
        <div className="blob w-72 h-72 bg-pink-500/10 bottom-[10%] left-[20%] animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">

        {/* Floating food emojis */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {FOOD_CARDS.map((emoji, i) => (
            <motion.div
              key={i}
              className="absolute text-3xl select-none"
              style={{
                left:  `${10 + (i * 15) % 80}%`,
                top:   `${10 + (i * 23) % 70}%`,
              }}
              animate={{ y: [0, -18, 0], rotate: [0, i % 2 === 0 ? 8 : -8, 0] }}
              transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-brand-500/30 text-sm font-medium text-brand-300 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            AI-powered kitchen assistant
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6">
            Your fridge,{' '}
            <br className="hidden sm:block" />
            <span className="gradient-text">full of recipes</span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload a photo of your fridge. Our AI identifies your ingredients
            and instantly finds delicious recipes you can cook right now.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to={isAuthenticated ? '/upload' : '/auth?mode=register'}
                className="btn-primary text-base px-8 py-3.5 flex items-center gap-2"
              >
                <span>📸</span>
                Scan my fridge
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
            {!isAuthenticated && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/auth" className="btn-secondary text-base px-8 py-3.5">
                  Log in
                </Link>
              </motion.div>
            )}
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-8 mt-12 text-text-muted text-sm"
          >
            {[['AI', 'Powered'], ['7-day', 'Meal Plans'], ['BigBasket', 'Integration']].map(([val, label]) => (
              <div key={label} className="text-center">
                <p className="text-lg font-bold gradient-text">{val}</p>
                <p className="text-xs">{label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {FEATURES.map(({ icon, title, desc, gradient }) => (
            <motion.div
              key={title}
              variants={staggerItem}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="card p-6 text-center relative overflow-hidden group"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
              <div className="relative z-10">
                <motion.span
                  className="text-4xl block mb-4"
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  aria-hidden="true"
                >{icon}</motion.span>
                <h3 className="font-bold text-text-primary mb-2">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}