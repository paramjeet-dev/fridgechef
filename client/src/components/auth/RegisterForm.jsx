import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';

export default function RegisterForm({ onSuccess, onSwitchToLogin }) {
  const { register, isLoading } = useAuthStore();
  const [fields, setFields] = useState({ displayName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!fields.displayName.trim())            e.displayName = 'Display name is required';
    else if (fields.displayName.trim().length < 2) e.displayName = 'Must be at least 2 characters';
    if (!fields.email.trim())                  e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(fields.email)) e.email = 'Enter a valid email';
    if (!fields.password)                      e.password = 'Password is required';
    else if (fields.password.length < 8)       e.password = 'Must be at least 8 characters';
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
    setFields((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      noValidate className="space-y-5"
    >
      {[
        { field: 'displayName', label: 'Your name', type: 'text', placeholder: 'e.g. Priya', autoComplete: 'name' },
        { field: 'email',       label: 'Email',     type: 'email', placeholder: 'you@example.com', autoComplete: 'email' },
        { field: 'password',    label: 'Password',  type: 'password', placeholder: 'At least 8 characters', autoComplete: 'new-password' },
      ].map(({ field, label, type, placeholder, autoComplete }) => (
        <div key={field}>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
          <input
            type={type} autoComplete={autoComplete}
            className={`input ${errors[field] ? 'border-red-500/60' : ''}`}
            placeholder={placeholder}
            value={fields[field]} onChange={set(field)}
          />
          {errors[field] && <p className="mt-1.5 text-xs text-red-400" role="alert">{errors[field]}</p>}
        </div>
      ))}

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
          </svg>Creating account…</>
        ) : 'Create account'}
      </motion.button>

      <p className="text-center text-sm text-text-muted">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="gradient-text font-medium hover:opacity-80 transition-opacity">
          Log in
        </button>
      </p>
    </motion.form>
  );
}