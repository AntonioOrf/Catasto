import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
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
    extends: [reactHooks.configs['recommended-latest'], reactRefresh.configs.vite],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
  },  {
    // Test e helper dei test non passano dal fast refresh di Vite.
    files: ['**/*.test.{ts,tsx}', 'src/test/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
)
