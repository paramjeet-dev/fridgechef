import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';

export default function LoginForm({ onSuccess, onSwitchToRegister }) {
  const { login, isLoading } = useAuthStore();
  const [fields, setFields] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!fields.email.trim())             e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(fields.email)) e.email = 'Enter a valid email';
    if (!fields.password)                 e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await login(fields);
    if (result.success) onSuccess?.();
  };

  const set = (field) => (e) => setFields((p) => ({ ...p, [field]: e.target.value }));

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      noValidate className="space-y-5"
    >
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
        <input
          type="email" autoComplete="email"
          className={`input ${errors.email ? 'border-red-500/60 focus:border-red-500/80' : ''}`}
          placeholder="you@example.com"
          value={fields.email} onChange={set('email')}
        />
        {errors.email && <p className="mt-1.5 text-xs text-red-400" role="alert">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
        <input
          type="password" autoComplete="current-password"
          className={`input ${errors.password ? 'border-red-500/60 focus:border-red-500/80' : ''}`}
          placeholder="••••••••"
          value={fields.password} onChange={set('password')}
        />
        {errors.password && <p className="mt-1.5 text-xs text-red-400" role="alert">{errors.password}</p>}
      </div>

      <motion.button
        type="submit" disabled={isLoading}
        whileHover={!isLoading ? { scale: 1.02 } : {}}
        whileTap={!isLoading ? { scale: 0.97 } : {}}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>Logging in…</>
        ) : 'Log in'}
      </motion.button>

      <p className="text-center text-sm text-text-muted">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToRegister} className="gradient-text font-medium hover:opacity-80 transition-opacity">
          Create one
        </button>
      </p>
    </motion.form>
  );
}