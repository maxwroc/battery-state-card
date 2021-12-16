import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import serve from 'rollup-plugin-serve';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';


let targetFileName = pkg.main;

const plugins = [
  resolve(),
  minifyHTML(),
];

if (process.env.ROLLUP_WATCH) {
  plugins.push(serve({
    contentBase: ['./'],
    host: '0.0.0.0',
    port: 5501,
    allowCrossOrigin: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  }));
}

plugins.push(typescript());

let sourcemapPathTransform = undefined;

if (process.env.RELEASE) {
  plugins.push(
    terser({
      compress: {}
    })
  );

  let repoRoot = pkg.repository.url
    .replace("https://github.com", "https://raw.githubusercontent.com")
    .replace(/.git$/, "");
  repoRoot += "/";

  sourcemapPathTransform = file => repoRoot + "v" + pkg.version + file.substr(2);
}

export default {
  external: ['lit-element'],
  input: 'src/index.ts',
  output: {
    globals: {
      'lit-element': "LitElement"
    },
    file: targetFileName,
    format: 'iife',
    sourcemap: true,
    sourcemapExcludeSources: true,
    sourcemapPathTransform: sourcemapPathTransform
  },
  plugins: plugins,
}