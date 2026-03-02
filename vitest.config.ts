import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        '.next/**',
        'coverage/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        'prisma/**',
        'scripts/**',
        'e2e/**',
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    retry: 1,
    bail: 5,
    reporters: ['verbose'],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NEXT_PUBLIC_APP_URL': JSON.stringify('http://localhost:3000'),
  },
})
