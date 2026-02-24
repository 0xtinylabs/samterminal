import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/index.ts',
        '**/types/**',
        '**/interfaces/**',
      ],
      thresholds: {
        // Core package should have higher thresholds
        'src/plugins/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/utils/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/flow/**': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        'src/runtime/**': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    testTimeout: 10000,
  },
});
