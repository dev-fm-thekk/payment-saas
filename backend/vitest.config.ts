import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,               // use describe/it/expect without importing
    environment: 'node',         // backend testing, no jsdom needed

    include: ['server/test/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],

    testTimeout: 10_000,         // integration tests hitting a DB can be slow; default 5s is often too tight
    hookTimeout: 10_000,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules', 'tests', 'dist', '**/*.config.ts'],
    },

    // run test files sequentially if they share a DB/state (avoids race conditions)
    // remove this if your tests are fully isolated
    fileParallelism: false,
  },
})