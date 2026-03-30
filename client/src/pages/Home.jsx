import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';

const FEATURES = [
  { icon: '📸', title: 'Scan your fridge',    desc: 'Upload photos and we identify every ingredient automatically.' },
  { icon: '🍽️', title: 'Discover recipes',    desc: 'Find recipes using exactly what you already have.' },
  { icon: '🛒', title: 'Shop the gaps',       desc: 'Missing one ingredient? We link you straight to BigBasket.' },
  { icon: '📅', title: 'Plan your week',      desc: 'Auto-generate a full meal plan tailored to your preferences.' },
];

export default function Home() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <main>
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-6xl" aria-hidden="true">🧊</span>
          <h1 className="mt-6 text-4xl sm:text-5xl font-display font-bold text-text-primary leading-tight">
            Your fridge, full of<br />
            <span className="text-brand-500">untapped recipes</span>
          </h1>
          <p className="mt-5 text-lg text-text-secondary max-w-xl mx-auto">
            Upload a photo of your fridge. We identify your ingredients and instantly
            find delicious recipes you can cook right now.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={isAuthenticated ? '/upload' : '/auth?mode=register'}
              className="btn-primary text-base px-8 py-3"
            >
              Scan my fridge →
            </Link>
            {!isAuthenticated && (
              <Link to="/auth" className="btn-secondary text-base px-8 py-3">
                Log in
              </Link>
            )}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        >
          {FEATURES.map(({ icon, title, desc }) => (
            <motion.div
              key={title}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
              className="card p-6 text-center"
            >
              <span className="text-3xl" aria-hidden="true">{icon}</span>
              <h3 className="mt-3 font-semibold text-text-primary">{title}</h3>
              <p className="mt-1.5 text-sm text-text-secondary">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
