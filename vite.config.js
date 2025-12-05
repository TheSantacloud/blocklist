import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest.json'

export default defineConfig(({ mode }) => {
    const isDev = mode === 'dev'
    const finalManifest = isDev
        ? { ...manifest, name: `${manifest.name} (dev)` }
        : manifest

    return {
        root: 'src',
        build: {
            outDir: '../dist',
            emptyOutDir: true,
        },
        plugins: [
            crx({ manifest: finalManifest }),
        ],
    }
})
