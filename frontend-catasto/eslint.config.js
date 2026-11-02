import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import { reactRefresh } from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import base from '../eslint.config.base.mjs'

export default tseslint.config(
  { ignores: ['dist', '.vercel', 'server'] },
  ...base,
  {
    // Script classici serviti così come sono (es. theme-init.js), fuori dal bundle.
    files: ['public/**/*.js'],
    languageOptions: { globals: globals.browser, sourceType: 'script' },
  },
  {
    // Codice eseguito da Node: la Vercel Function e gli script di build.
    files: ['api/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: { globals: globals.node, sourceType: 'module' },
  },
  {
    files: ['**/*.{ts,tsx}'],
    // Solo le due regole classiche dei hook: le regole del React Compiler
    // (incluse nel preset `recommended` dalla v7) restano fuori per ora.
    extends: [reactRefresh.configs.vite()],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    // Test e helper dei test non passano dal fast refresh di Vite.
    files: ['**/*.test.{ts,tsx}', 'src/test/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
)
