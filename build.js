import * as esbuild from 'esbuild'
import { cpSync, mkdirSync, rmSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const src = join(__dirname, 'src')
const dist = join(__dirname, 'dist')
const isWatch = process.argv.includes('--watch')

function copyStatic() {
  const files = [
    ['manifest.json', 'manifest.json'],
    ['src/popup/popup.html', 'popup/popup.html'],
    ['src/popup/popup.css', 'popup/popup.css'],
    ['src/background/background.js', 'background/background.js'],
  ]
  for (const [from, to] of files) {
    cpSync(join(__dirname, from), join(dist, to), { recursive: true, force: true })
  }
  if (existsSync(join(__dirname, 'src/icons'))) {
    cpSync(join(__dirname, 'src/icons'), join(dist, 'icons'), { recursive: true, force: true })
  }

  const workerDest = join(dist, 'popup', 'pdfjs-dist', 'build')
  mkdirSync(workerDest, { recursive: true })
  cpSync(
    join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
    join(workerDest, 'pdf.worker.min.mjs')
  )

  const wasmDest = join(workerDest, 'wasm')
  mkdirSync(wasmDest, { recursive: true })
  const wasmDir = join(__dirname, 'node_modules', 'pdfjs-dist', 'wasm')
  if (existsSync(wasmDir)) {
    for (const file of ['openjpeg.wasm', 'qcms_bg.wasm', 'jbig2.wasm']) {
      const srcFile = join(wasmDir, file)
      if (existsSync(srcFile)) {
        cpSync(srcFile, join(wasmDest, file))
      }
    }
  }
}

async function build() {
  rmSync(dist, { recursive: true, force: true })
  copyStatic()

  const ctx = await esbuild.context({
    entryPoints: [join(src, 'popup', 'popup.js')],
    bundle: true,
    outfile: join(dist, 'popup', 'popup.js'),
    format: 'esm',
    platform: 'browser',
    target: ['chrome88', 'firefox113'],
    sourcemap: false,
    minify: true,
    logLevel: 'info',
    treeShaking: true,
    keepNames: true,
    external: ['fs', 'fs/promises', 'path', 'crypto', 'child_process', 'os', 'net', 'stream'],
  })

  if (isWatch) {
    await ctx.watch()
    console.log('Watching for changes...')
  } else {
    await ctx.rebuild()
    await ctx.dispose()
    console.log('Build complete: dist/')
  }
}

build().catch((err) => {
  console.error(err)
  process.exit(1)
})
