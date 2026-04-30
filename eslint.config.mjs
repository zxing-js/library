import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'output/**', 'node_modules/**', '**/*.js', '**/*.mjs', '**/*.cjs'],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'eqeqeq': ['error', 'always', { 'null': 'ignore' }],
      'no-eval': 'error',
      'no-var': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'warn',
      'prefer-const': 'warn',
    },
  },
);
