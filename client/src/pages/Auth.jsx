import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Support ?mode=register URL param (from "Get started" CTA)
  const [mode, setMode] = useState(
    new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login'
  );

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const destination = location.state?.from?.pathname || '/upload';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleSuccess = () => {
    const destination = location.state?.from?.pathname || '/upload';
    navigate(destination, { replace: true });
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-4xl" aria-hidden="true">🧊</span>
            <h1 className="mt-3 text-2xl font-display font-bold text-text-primary">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              {mode === 'login'
                ? 'Log in to discover recipes from your fridge'
                : 'Start turning your fridge into a feast'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl bg-surface-muted p-1 mb-6" role="tablist">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  mode === m
                    ? 'bg-white text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {m === 'login' ? 'Log in' : 'Register'}
              </button>
            ))}
          </div>

          {/* Form — AnimatePresence handles exit before enter */}
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <LoginForm
                key="login"
                onSuccess={handleSuccess}
                onSwitchToRegister={() => setMode('register')}
              />
            ) : (
              <RegisterForm
                key="register"
                onSuccess={handleSuccess}
                onSwitchToLogin={() => setMode('login')}
              />
            )}
          </AnimatePresence>
        </div>

        <p className="mt-4 text-center text-xs text-text-muted">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
