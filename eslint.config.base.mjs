import js from '@eslint/js'
import tseslint from 'typescript-eslint'

/**
 * Regole comuni a frontend e backend: ogni workspace la estende con quello
 * che gli è proprio (globali del browser o di Node, plugin React).
 */
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]
