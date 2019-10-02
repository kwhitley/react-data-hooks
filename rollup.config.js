import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
  },
  plugins: [
    babel({
      exclude: 'node_modules/**', // only transpile our source code
    }),
    resolve(),
    typescript({ module: 'CommonJS' }),
    commonjs({ extensions: ['.js', '.ts', '.tsx'] }), // the ".ts" extension is required
  ],
  external: ['react', 'react-dom', 'use-store-hook'],
}
