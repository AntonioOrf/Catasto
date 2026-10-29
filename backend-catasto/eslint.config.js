import globals from 'globals'
import tseslint from 'typescript-eslint'
import base from '../eslint.config.base.mjs'

export default tseslint.config(
  { ignores: ['dist'] },
  ...base,
  {
    files: ['**/*.{ts,js}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
  },
)
