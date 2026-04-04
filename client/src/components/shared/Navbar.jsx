import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';

const NAV_LINKS = [
  { to: '/upload',    label: 'Scan'      },
  { to: '/inventory', label: 'Fridge'    },
  { to: '/history',   label: 'History'   },
  { to: '/favorites', label: 'Saved'     },
  { to: '/mealplan',  label: 'Meal Plan' },
  { to: '/dashboard', label: 'Stats'     },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isHydrating, logout, hydrate } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/'); };
  const isActive = (to) => location.pathname.startsWith(to);

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${
      scrolled ? 'bg-dark-900/85 backdrop-blur-xl border-b border-white/8 shadow-xl' : 'bg-transparent'
    }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" aria-label="FridgeChef home">
          <motion.span whileHover={{ rotate: 15, scale: 1.15 }} transition={{ type: 'spring', stiffness: 300 }}
            className="text-2xl select-none">🧊</motion.span>
          <span className="font-bold text-xl gradient-text tracking-tight">FridgeChef</span>
        </Link>

        {/* Desktop links */}
        {!isHydrating && isAuthenticated && (
          <ul className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(({ to, label }) => {
              const active = isActive(to);
              return (
                <li key={to}>
                  <Link to={to} className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${active ? 'text-brand-300' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}>
                    {label}
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-lg bg-brand-600/20 border border-brand-500/30 -z-10"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {isHydrating ? (
            <div className="h-8 w-24 skeleton rounded-lg" />
          ) : isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {user?.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm text-text-secondary">{user?.displayName}</span>
              </div>
              <button onClick={handleLogout} className="btn-ghost text-sm">Log out</button>
            </>
          ) : (
            <>
              <Link to="/auth" className="btn-ghost text-sm">Log in</Link>
              <Link to="/auth?mode=register" className="btn-primary text-sm py-2 px-4">Get started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden btn-ghost p-2" onClick={() => setMenuOpen((p) => !p)} aria-label="Toggle menu">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            className="md:hidden border-t border-white/10 bg-dark-900/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {isAuthenticated && NAV_LINKS.map(({ to, label }) => (
                <Link key={to} to={to}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(to)
                      ? 'bg-brand-600/20 text-brand-300 border border-brand-500/20'
                      : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                  }`}
                >{label}</Link>
              ))}
              <div className="pt-2 border-t border-white/10">
                {isAuthenticated
                  ? <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:bg-white/5 rounded-xl">Log out</button>
                  : <Link to="/auth" className="block px-4 py-2.5 text-sm font-medium gradient-text">Log in / Register</Link>
                }
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}