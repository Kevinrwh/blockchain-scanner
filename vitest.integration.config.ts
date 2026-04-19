import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/__tests__/integration.test.ts'],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    typecheck: { tsconfig: './tsconfig.test.json' }
  }
});
