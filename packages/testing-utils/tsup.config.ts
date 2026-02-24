import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'mocks/index': 'src/mocks/index.ts',
    'fixtures/index': 'src/fixtures/index.ts',
    'factories/index': 'src/factories/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node18',
  outDir: 'dist',
  splitting: false,
  minify: false,
});
