import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

export default function (args) {

  let targetFileName = pkg.main;

  const plugins = [
    resolve()
  ];

  console.log(args);

  const target = args.target ? args.target.toUpperCase() : null;
  const allowedTargets = ["ES3", "ES5", "ES6"];
  if (allowedTargets.some(t => t == target)) {
    plugins.push(typescript({ target: target }));
    targetFileName = targetFileName.replace(".js", `.${target.toLowerCase()}.js`);
  }
  else {
    plugins.push(typescript());
  }

  let sourcemapPathTransform = undefined;

  if (args.release) {
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
      file: targetFileName,
      format: 'iife',
      sourcemap: true,
      sourcemapExcludeSources: true,
      sourcemapPathTransform: sourcemapPathTransform
    },
    plugins: plugins,
  }
};