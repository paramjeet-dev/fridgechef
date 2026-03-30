import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';

export default function LoginForm({ onSuccess, onSwitchToRegister }) {
  const { login, isLoading } = useAuthStore();
  const [fields, setFields] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!fields.email.trim())            e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(fields.email)) e.email = 'Enter a valid email';
    if (!fields.password)                e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await login(fields);
    if (result.success) onSuccess?.();
  };

  const set = (field) => (e) =>
    setFields((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      noValidate
      className="space-y-5"
      aria-label="Login form"
    >
      {/* Email */}
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-text-primary mb-1.5">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          className={`input ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
          placeholder="you@example.com"
          value={fields.email}
          onChange={set('email')}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
        />
        {errors.email && (
          <p id="login-email-error" className="mt-1.5 text-xs text-red-500" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-text-primary mb-1.5">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          className={`input ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
          placeholder="••••••••"
          value={fields.password}
          onChange={set('password')}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'login-password-error' : undefined}
        />
        {errors.password && (
          <p id="login-password-error" className="mt-1.5 text-xs text-red-500" role="alert">
            {errors.password}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Logging in…
          </span>
        ) : (
          'Log in'
        )}
      </button>

      <p className="text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-brand-600 font-medium hover:underline"
        >
          Create one
        </button>
      </p>
    </motion.form>
  );
}
