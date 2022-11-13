import { buildNuxt } from '@nuxt/kit'
import { relative, resolve } from 'pathe'
import chokidar from 'chokidar'
import consola from 'consola'
import { debounce } from 'perfect-debounce'
import { Nuxt } from '@nuxt/schema'
import { clearDir } from '../utils/fs'
import { loadKit } from '../utils/kit'
import { writeTypes } from '../utils/prepare'
import { defineNuxtCommand } from './index'

export default defineNuxtCommand({
  meta: {
    name: 'prepare',
    usage: 'npx nuxi prepare [--watch, -w]',
    description: 'Prepare nuxt for development/build'
  },
  async invoke (args) {
    process.env.NODE_ENV = process.env.NODE_ENV || 'production'
    const rootDir = resolve(args._[0] || '.')

    const { loadNuxt } = await loadKit(rootDir)
    let nuxt: Nuxt

    const load = async () => {
      if (nuxt) { await nuxt.close() }

      nuxt = await loadNuxt({ rootDir, config: { _prepare: true } })
      await clearDir(nuxt.options.buildDir)
      await writeTypes(nuxt)
      // await buildNuxt(nuxt)
      consola.success('Types generated in', relative(process.cwd(), nuxt.options.buildDir))
    }

    if (args.watch || args.w) {
      const dLoad = debounce(load)
      const watcher = chokidar.watch([rootDir], { ignoreInitial: true, persistent: true })
      watcher.on('all', (event, _file) => {
        if (!nuxt) { return }
        dLoad()
      })
    }

    await load()
    return 'wait' as const
  }
})
