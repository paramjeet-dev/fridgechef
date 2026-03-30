import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        File: 'readonly',
        FormData: 'readonly',
        IntersectionObserver: 'readonly',
        AudioContext: 'readonly',
        Promise: 'readonly',
        fetch: 'readonly',
        parseInt: 'readonly',
        parseFloat: 'readonly',
        Math: 'readonly',
        Date: 'readonly',
        Array: 'readonly',
        Object: 'readonly',
        String: 'readonly',
        Buffer: 'readonly',
        isNaN: 'readonly',
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React
      'react/prop-types': 'off',              // Using JSDoc instead of PropTypes
      'react/react-in-jsx-scope': 'off',      // Not needed in React 18
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'warn',

      // Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Refresh
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // General
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
];
