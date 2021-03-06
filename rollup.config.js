import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
import { terser } from "rollup-plugin-terser"
import filesize from 'rollup-plugin-filesize'
import visualizer from 'rollup-plugin-visualizer'

export default {
  input: 'index.js',
  output: {
    file: 'bundle.js',
    format: 'esm'
  },
  plugins: [
    resolve(),
    typescript(),
    serve(/*{ historyApiFallback: true }*/),
    livereload(),
    // terser(),
    //visualizer({ template: 'sunburst'})
    filesize()
  ]
}
