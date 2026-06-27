import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Web unit tests — pure, framework-free logic only (request mappers, money math, API error parsing,
 * query keys). Component/integration tests (jsdom + Testing Library + MSW) are a follow-up; the UI
 * primitives they compose are already covered in `@stockflow/ui`.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
  },
});
