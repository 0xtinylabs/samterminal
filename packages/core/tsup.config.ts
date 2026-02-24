import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'runtime/index': 'src/runtime/index.ts',
    'flow/index': 'src/flow/index.ts',
    'plugins/index': 'src/plugins/index.ts',
    'hooks/index': 'src/hooks/index.ts',
    'chains/index': 'src/chains/index.ts',
    'types/index': 'src/types/index.ts',
    'interfaces/index': 'src/interfaces/index.ts',
    'utils/index': 'src/utils/index.ts',
    'order/index': 'src/order/index.ts',
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
  external: ['typescript'],
});
