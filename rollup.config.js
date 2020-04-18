import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

export default function (agrs) {

  const plugins = [
    resolve(),
    typescript()
  ];

  let sourcemapPathTransform = undefined;

  if (agrs.release) {
    plugins.push(
      terser({
        compress: {}
      })
    );

    sourcemapPathTransform = file =>
      pkg.repository.url.replace(/.git$/, "") + "/blob/" + pkg.version + file.substr(2);
  }

  return {
    external: ['lit-element'],
    input: 'src/index.ts',
    output: {
      globals: {
        'lit-element': "LitElement"
      },
      file: pkg.main,
      format: 'iife',
      sourcemap: true,
      sourcemapExcludeSources: true,
      sourcemapPathTransform: sourcemapPathTransform
    },
    plugins: plugins,
  }
};