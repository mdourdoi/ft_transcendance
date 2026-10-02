import { defineConfig, mergeConfig } from 'vitest/config';
import { svelteTesting } from '@testing-library/svelte/vite';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [svelteTesting()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
    },
  }),
);
