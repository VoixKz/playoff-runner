import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __SKIN__: JSON.stringify('original'),
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
