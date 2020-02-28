const path = require('path')
const rollup = require('rollup')
const rm = require('rimraf').sync
const chokidar = require('chokidar')
const babel = require('rollup-plugin-babel')
const cmd = require('rollup-plugin-commonjs')
const replace = require('rollup-plugin-replace')
const cleanup = require('rollup-plugin-cleanup')
const { terser } = require('rollup-plugin-terser')
const resolve = require('rollup-plugin-node-resolve')

const libName = 'oops'
const version = require('./package.json').version
const entryPath = path.resolve(__dirname, './src/index.js')
const outputPath = filename => path.resolve(__dirname, './dist', filename)

const banner =
  '/*!\n' +
  ` * oops.js v${version}\n` +
  ` * (c) 2019-${new Date().getFullYear()} Imtaotao\n` +
  ' * Released under the MIT License.\n' +
  ' */'

const esm = {
  input: entryPath,
  output: {
    banner,
    format: 'es',
    file: outputPath(`${libName}.esm.js`),
  },
}

const es6m = {
  input: entryPath,
  output: {
    banner,
    format: 'es',
    file: outputPath(`${libName}.es6m.js`),
  },
}

const cjs = {
  input: entryPath,
  output: {
    banner,
    format: 'cjs',
    file: outputPath(`${libName}.common.js`),
  },
}

const umd = {
  input: entryPath,
  output: {
    file: outputPath(`${libName}.umd.js`),
    format: 'umd',
    name: libName,
  }
}

const uglifyCjs = {
  input: entryPath,
  output: {
    banner,
    format: 'cjs',
    file: outputPath(`${libName}.min.js`),
  },
}

// create env variable
const createReplacePlugin = () => {
  return replace({
    __VERSION__: `'${version}'`,
  })
}

async function build (cfg, needUglify, sourcemap = false, needBabel = true) {
  cfg.output.sourcemap = sourcemap

  const buildCfg = {
    input: cfg.input,
    plugins: [
      cleanup(),
      resolve(),
      cmd(),
      createReplacePlugin(),
    ]
  }

  if (needBabel) {
    buildCfg.plugins.splice(
      2, 0,
      babel({
        babelrc: false,
        exclude: 'node_modules/**',
        presets: [['@babel/preset-env', { modules: false }]],
      }),
    )
  }

  if (needUglify) {
    buildCfg.plugins.unshift(
      terser({
        sourcemap: false,
      })
    )
  }

  const bundle = await rollup.rollup(buildCfg)
  await bundle.generate(cfg.output)
  await bundle.write(cfg.output)
}

console.clear()
// delete old build files
rm('./dist')

const buildVersion = sourcemap => {
  const builds = [
    build(esm, false, sourcemap),
    build(cjs, false, sourcemap),
    build(umd, false, sourcemap),
    // build es6 version
    build(es6m, false, sourcemap, false),
  ]

  if (!sourcemap) {
    builds.push(build(uglifyCjs, true, sourcemap))
  }

  return Promise.all(builds)
}

// watch, use in dev and test
if (process.argv.includes('-w')) {
  let i = 0
  let isBuilded = false
  chokidar.watch('./src').on('all', async () => {
    if (isBuilded) return
    isBuilded = true
    console.clear()
    console.log('Rebuild: ' + ++i)
    await buildVersion(true)
    isBuilded = false
  })
  buildVersion(true)
} else {
  buildVersion()
}