import { Component } from 'react';
import { motion } from 'framer-motion';

// ── LoadingSpinner ────────────────────────────────────────────
export function LoadingSpinner({ size = 'md', label = 'Loading…' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-label={label}>
      <svg
        className={`${sizes[size]} animate-spin text-brand-500`}
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}

// ── SkeletonCard — used for recipe/ingredient loading states ──
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card p-4 space-y-3 ${className}`} aria-hidden="true">
      <div className="skeleton rounded-lg h-36 w-full" />
      <div className="skeleton rounded h-4 w-3/4" />
      <div className="skeleton rounded h-3 w-1/2" />
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────
export function EmptyState({ icon = '🔍', title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <span className="text-5xl mb-4" aria-hidden="true">{icon}</span>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>
      )}
      {action}
    </motion.div>
  );
}

// ── ErrorBoundary ─────────────────────────────────────────────
export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="card p-8 max-w-md w-full text-center">
            <span className="text-5xl mb-4 block">💥</span>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Something went wrong</h2>
            <p className="text-sm text-text-secondary mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              className="btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
            >
              Go home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
