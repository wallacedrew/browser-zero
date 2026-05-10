import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests-medium-integration/_setup.ts'],
    include: ['tests-small-unit/**/*.test.{ts,tsx}', 'tests-medium-integration/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
  },
});
