import resolve from '@rollup/plugin-node-resolve';
import license from 'rollup-plugin-license';
import * as path from 'path';

export default {
  input: 'dist/es2015/index.js',
  external: [
    '@zxing/text-encoding',
  ],
  plugins: [
    resolve(),
    license({
      sourcemap: true,
      banner: {
        commentStyle: 'ignored', // lets terser keep it
        content: {
          file: path.join(__dirname, 'LICENSE'),
          encoding: 'utf-8',
        },
        data() {
          return {
            foo: 'foo',
          };
        },
      },
    }),
  ],
  context: '(globalThis || global || self || window || undefined)',
  output: {
    format: 'umd',
    name: 'ZXing',
    sourcemap: true,
    file: 'dist/umd/index.js'
  },
};
