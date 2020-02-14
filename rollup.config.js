import resolve from '@rollup/plugin-node-resolve'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
export default {
  input: 'index.js',
  output: {
    file: 'bundle.js',
    format: 'esm'
  },
  plugins: [
    resolve(),
    serve(),
    livereload()
  ]
}
