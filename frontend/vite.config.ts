import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * ビルド後に dist/sw.js（Service Worker）を出力する。
 * dist 内の全ファイルを事前キャッシュの対象にし、内容のハッシュをキャッシュのバージョンにする
 */
function serviceWorker(): Plugin {
  let outDir = ''
  return {
    name: 'service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    async closeBundle() {
      const entries = await readdir(outDir, { recursive: true, withFileTypes: true })
      const files = entries
        .filter((e) => e.isFile())
        .map((e) => relative(outDir, join(e.parentPath, e.name)).split(sep).join('/'))
        .filter((f) => f !== 'sw.js' && !f.endsWith('.map'))
        .sort()
      const hash = createHash('sha256')
      for (const file of files) {
        hash.update(file)
        hash.update(await readFile(join(outDir, file)))
      }
      const template = await readFile(new URL('./sw/service-worker.js', import.meta.url), 'utf8')
      const header =
        `const PRECACHE = ${JSON.stringify(['./', ...files])};\n` +
        `const VERSION = ${JSON.stringify(hash.digest('hex').slice(0, 12))};\n`
      await writeFile(join(outDir, 'sw.js'), header + template)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serviceWorker()],
})
