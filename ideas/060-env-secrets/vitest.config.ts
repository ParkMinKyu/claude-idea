import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    deps: {
      // Force Vite to inline and transform the CJS build for this dep.
      optimizer: {
        ssr: {
          include: ['libsodium-wrappers'],
        },
      },
    },
  },
  ssr: {
    noExternal: ['libsodium-wrappers'],
  },
  resolve: {
    conditions: ['require', 'node', 'default'],
  },
});
