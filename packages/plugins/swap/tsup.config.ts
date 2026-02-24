import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'constants/index': 'src/constants/index.ts',
    'adapters/index': 'src/adapters/index.ts',
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
  external: ['@samterminal/core', '@samterminal/plugin-tokendata', '@samterminal/plugin-walletdata', 'axios', 'viem'],
});
