/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './__tests__/setup.ts',
    include: ['**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        '__tests__/setup.ts',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/data': path.resolve(__dirname, './src/data'),
      '@/domain': path.resolve(__dirname, './src/domain'),
      '@/presentation': path.resolve(__dirname, './src/presentation'),
      '@/state': path.resolve(__dirname, './src/state'),
      '@/types': path.resolve(__dirname, './src/core/types'),
      '@/__tests__': path.resolve(__dirname, './src/__tests__'),
    },
  },
});
