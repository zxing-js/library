import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'dist/es2015/index.js',
  external: [
    '@zxing/text-encoding',
  ],
  plugins: [
    resolve(),
  ],
  context: '(globalThis || global || self || window || undefined)',
  output: {
    format: 'umd',
    name: 'ZXing',
    sourcemap: true,
    file: 'dist/umd/index.js'
  },
};
