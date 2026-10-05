import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import local from './configs/eslint-plugin-local/index.js';
export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'next-env.d.ts',
    'src/generated/**',
    'artifacts/**',
    'configs/eslint-plugin-local/**',
  ]),
  {
    files: ['**/*.{ts,tsx,mts}'],
    plugins: { local },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      'react/forbid-component-props': ['error', { forbid: ['style'] }],
      'local/one-component-per-file': 'error',
      'local/thin-next-route-pages': 'error',
      'local/no-cross-slice-internal-imports': 'error',
      'local/no-entities-upper-layer-imports': 'error',
      'local/no-query-invalidation-in-ui': 'error',
      'local/no-business-helper-export-from-tsx': 'error',
      'local/no-top-level-type-imports': 'error',
    },
  },
  {
    files: ['src/{app,views,widgets,features}/**/*.{ts,tsx}', 'src/shared/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['~/generated/**', '**/generated/**'],
              message: 'Use an entity public API; generated contracts belong behind entity boundaries.',
            },
          ],
        },
      ],
    },
  },
]);
