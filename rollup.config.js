import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import typescript from 'rollup-plugin-typescript'

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
  },
  plugins: [
    resolve(),
    typescript({ module: 'CommonJS' }),
    commonjs({ extensions: ['.js', '.ts', '.tsx'] }), // the ".ts" extension is required
  ],
  external: ['react', 'react-dom', 'prop-types'],
}
