import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

export default function Auth() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mode, setMode] = useState(
    new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login'
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate(location.state?.from?.pathname || '/upload', { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleSuccess = () => navigate(location.state?.from?.pathname || '/upload', { replace: true });

  return (
    <main className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 overflow-hidden">
      {/* Blobs */}
      <div className="blob w-80 h-80 bg-violet-600/25 top-[-5%] left-[-10%] animate-blob" />
      <div className="blob w-72 h-72 bg-cyan-500/20 bottom-[5%] right-[-5%] animate-blob-delay" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md z-10"
      >
        {/* Card */}
        <div className="glass p-8 rounded-2xl border border-white/10">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="text-5xl mb-4 inline-block"
              aria-hidden="true"
            >🧊</motion.div>
            <h1 className="text-2xl font-bold text-text-primary">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              {mode === 'login'
                ? 'Log in to discover recipes from your fridge'
                : 'Start turning your fridge into a feast'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 mb-6">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  mode === m
                    ? 'bg-gradient-to-r from-brand-600/80 to-cyan-600/60 text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {m === 'login' ? 'Log in' : 'Register'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <LoginForm key="login" onSuccess={handleSuccess} onSwitchToRegister={() => setMode('register')} />
            ) : (
              <RegisterForm key="register" onSuccess={handleSuccess} onSwitchToLogin={() => setMode('login')} />
            )}
          </AnimatePresence>
        </div>

        <p className="mt-4 text-center text-xs text-text-muted">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </main>
  );
}