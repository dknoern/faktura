import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    // Pre-existing debt, demoted to warnings so `npm run lint` is a usable gate
    // on new work instead of failing on ~320 inherited problems. These are a
    // burn-down list, not rules we disagree with -- re-promote as they go to zero.
    rules: {
      // Legacy JS models still being migrated to TS (see CLAUDE.md).
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-var': 'warn',

      // react-hooks v6 (new in Next 16) flags real correctness smells here --
      // mostly setState inside effects. Worth fixing; too many to block on today.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/error-boundaries': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
    },
  },

  {
    // Build/tooling config files are CommonJS by nature.
    files: ['*.config.{js,mjs,cjs,ts}', 'jest.setup.{js,ts}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
