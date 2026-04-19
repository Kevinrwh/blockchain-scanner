import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/__tests__/**/*.test.ts'],
    exclude: ['**/__tests__/integration.test.ts'],
    typecheck: { tsconfig: './tsconfig.test.json' }
  }
});
