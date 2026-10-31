// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    ignores: [
      'dist/**',
      '.angular/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'storybook-static/**',
      'projects/components/src/lib/tokens/tokens.ts',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'sx', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: ['element', 'attribute'], prefix: 'sx', style: 'kebab-case' },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['e2e/**/*.ts', 'projects/*/scripts/**/*.ts', 'projects/components/.storybook/**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
);
