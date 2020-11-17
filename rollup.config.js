import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const extensions = ['.js', '.ts'];

export default [
  {
    input: './src/index.ts',
    external: [
      '@zxing/text-encoding',
    ],
    context: '(globalThis || global || self || window || undefined)',
    plugins: [
      resolve({
        extensions,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.lib.json',
      }),
    ],
    output: [
      {
        name: 'ZXing',
        file: pkg.browser,
        format: 'umd',
        sourcemap: true,
        plugins: [
          terser({
            output: {
              comments: function (_, comment) {
                let text = comment.value;
                let type = comment.type;
                if (type === 'comment2') {
                  // multiline comment
                  return /@preserve|@license|@cc_on/i.test(text);
                }
              },
            }
          })
        ],
      },
      {
        file: pkg.main,
        format: 'cjs',
      },
      {
        file: pkg.module,
        format: 'esm',
      },
    ],
  },
];
