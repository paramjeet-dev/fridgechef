import { Component } from 'react';
import { motion } from 'framer-motion';

// ── LoadingSpinner ────────────────────────────────────────────
export function LoadingSpinner({ size = 'md', label = 'Loading…' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-9 h-9', lg: 'w-14 h-14' };
  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-label={label}>
      <div className={`${sizes[size]} relative`}>
        <div className={`${sizes[size]} rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin`} />
        <div className={`${sizes[size]} rounded-full border-2 border-cyan-500/10 border-b-cyan-500 animate-spin absolute inset-0`}
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      {label && <span className="text-sm text-text-muted">{label}</span>}
    </div>
  );
}

// ── SkeletonCard ──────────────────────────────────────────────
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card p-4 space-y-3 ${className}`} aria-hidden="true">
      <div className="skeleton rounded-xl h-36 w-full" />
      <div className="skeleton rounded-lg h-4 w-3/4" />
      <div className="skeleton rounded-lg h-3 w-1/2" />
      <div className="flex gap-2">
        <div className="skeleton rounded-full h-5 w-16" />
        <div className="skeleton rounded-full h-5 w-12" />
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────
export function EmptyState({ icon = '🔍', title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="w-20 h-20 rounded-2xl glass flex items-center justify-center text-4xl mb-5 border border-white/10"
        aria-hidden="true"
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">{description}</p>
      )}
      {action}
    </motion.div>
  );
}

// ── ErrorBoundary ─────────────────────────────────────────────
export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary:', error, info); }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="card p-8 max-w-md w-full text-center">
            <span className="text-5xl mb-4 block">💥</span>
            <h2 className="text-xl font-bold text-text-primary mb-2">Something went wrong</h2>
            <p className="text-sm text-text-secondary mb-6">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button className="btn-primary" onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}>
              Go home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}