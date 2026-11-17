// ESLint (flat config): TypeScript + Playwright best practices. `npm run lint`
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default defineConfig(
  { ignores: ['node_modules', 'reports', 'playwright-report', 'test-results', '.auth', 'docs', 'scripts'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts', 'pages/**/*.ts', 'components/**/*.ts', 'fixtures/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Hum credentials ya lockout ki wajah se tests ko test.skip(condition) se guard karte hain
      'playwright/no-conditional-in-test': 'off',
      'playwright/no-skipped-test': 'off',
      'playwright/no-conditional-expect': 'off',
      // Assertions page-object helpers ke andar bhi hoti hain (expectSelected, expectLook, expectNoLoginRequest...)
      'playwright/expect-expect': ['warn', { assertFunctionPatterns: ['^(?:\\w+\\.)*expect\\w*$'] }],
      'playwright/no-wait-for-timeout': 'warn',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-require-imports': 'off', // reporter JS helper ko require() se leta hai
    },
  },
);
