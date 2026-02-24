import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'actions/index': 'src/actions/index.ts',
    'providers/index': 'src/providers/index.ts',
    'utils/index': 'src/utils/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  minify: false,
  target: 'node18',
  outDir: 'dist',
  external: ['@samterminal/core', 'node-telegram-bot-api'],
});
