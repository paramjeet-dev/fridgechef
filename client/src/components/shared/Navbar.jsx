import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';

const NAV_LINKS = [
  { to: '/upload',    label: 'Scan Fridge' },
  { to: '/inventory', label: 'My Fridge'   },
  { to: '/history',   label: 'History'     },
  { to: '/favorites', label: 'Favourites'  },
  { to: '/mealplan',  label: 'Meal Plan'   },
  { to: '/dashboard', label: 'Dashboard'   },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isHydrating, logout, hydrate } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-display font-bold text-xl text-brand-600 hover:text-brand-700 transition-colors"
          aria-label="FridgeChef home"
        >
          🧊 <span>FridgeChef</span>
        </Link>

        {/* Desktop links */}
        {!isHydrating && isAuthenticated && (
          <ul className="hidden md:flex items-center gap-1" role="list">
            {NAV_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith(to)
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {isHydrating ? (
            <div className="h-8 w-24 skeleton rounded-lg" aria-hidden="true" />
          ) : isAuthenticated ? (
            <>
              <span className="text-sm text-text-secondary">
                Hi, <span className="font-medium text-text-primary">{user?.displayName}</span>
              </span>
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
        <button
          className="md:hidden btn-ghost p-2"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="md:hidden border-t border-slate-100 bg-white overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {isAuthenticated && NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith(to)
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-text-secondary hover:bg-slate-50'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <div className="pt-2 border-t border-slate-100">
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:bg-slate-50 rounded-lg"
                  >
                    Log out
                  </button>
                ) : (
                  <Link to="/auth" className="block px-4 py-2.5 text-sm font-medium text-brand-600">
                    Log in / Register
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}