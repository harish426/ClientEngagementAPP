import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default [
  // 1. Browser standalone bundle (IIFE / minified) for <script> tag
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/tracker.min.js',
      format: 'iife',
      name: 'B2BTrackerBundle',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser(),
    ],
  },
  // 2. ESM & CJS module bundle for React/Next.js/Vue apps
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/tracker.esm.js',
        format: 'es',
        sourcemap: true,
      },
      {
        file: 'dist/tracker.cjs.js',
        format: 'cjs',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
  },
];
