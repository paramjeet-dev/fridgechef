import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';

export default function RegisterForm({ onSuccess, onSwitchToLogin }) {
  const { register, isLoading } = useAuthStore();
  const [fields, setFields] = useState({ displayName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!fields.displayName.trim())           e.displayName = 'Display name is required';
    else if (fields.displayName.trim().length < 2) e.displayName = 'Must be at least 2 characters';
    if (!fields.email.trim())                 e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(fields.email)) e.email = 'Enter a valid email';
    if (!fields.password)                     e.password = 'Password is required';
    else if (fields.password.length < 8)      e.password = 'Must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await register(fields);
    if (result.success) onSuccess?.();
  };

  const set = (field) => (e) => {
    setFields((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error on type
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      noValidate
      className="space-y-5"
      aria-label="Registration form"
    >
      {/* Display name */}
      <div>
        <label htmlFor="reg-name" className="block text-sm font-medium text-text-primary mb-1.5">
          Your name
        </label>
        <input
          id="reg-name"
          type="text"
          autoComplete="name"
          className={`input ${errors.displayName ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
          placeholder="e.g. Priya"
          value={fields.displayName}
          onChange={set('displayName')}
          aria-invalid={!!errors.displayName}
          aria-describedby={errors.displayName ? 'reg-name-error' : undefined}
        />
        {errors.displayName && (
          <p id="reg-name-error" className="mt-1.5 text-xs text-red-500" role="alert">
            {errors.displayName}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-text-primary mb-1.5">
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          className={`input ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
          placeholder="you@example.com"
          value={fields.email}
          onChange={set('email')}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'reg-email-error' : undefined}
        />
        {errors.email && (
          <p id="reg-email-error" className="mt-1.5 text-xs text-red-500" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium text-text-primary mb-1.5">
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          className={`input ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
          placeholder="At least 8 characters"
          value={fields.password}
          onChange={set('password')}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'reg-password-error' : 'reg-password-hint'}
        />
        {errors.password ? (
          <p id="reg-password-error" className="mt-1.5 text-xs text-red-500" role="alert">
            {errors.password}
          </p>
        ) : (
          <p id="reg-password-hint" className="mt-1.5 text-xs text-text-muted">
            Minimum 8 characters
          </p>
        )}
      </div>

      <button type="submit" className="btn-primary w-full" disabled={isLoading} aria-busy={isLoading}>
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Creating account…
          </span>
        ) : (
          'Create account'
        )}
      </button>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-brand-600 font-medium hover:underline"
        >
          Log in
        </button>
      </p>
    </motion.form>
  );
}
