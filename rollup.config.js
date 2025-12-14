import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import alias from '@rollup/plugin-alias'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import babel from '@rollup/plugin-babel'

import copy from 'rollup-plugin-copy'
import {
        readFileSync,
        writeFileSync,
        existsSync,
        mkdirSync,
        statSync,
} from 'fs'
import { join } from 'path'
import postcss from 'postcss'
import csso from 'postcss-csso'
import postcss_import from 'postcss-import'

const isProduction = process.env.NODE_ENV === 'production'
const browser = process.env.BROWSER || 'firefox'

// 用于存储构建输出的文件映射
const outputFiles = new Map()

// 生成manifest的函数
function generateManifest() {
        const baseManifest = JSON.parse(readFileSync('manifest.json', 'utf-8'))
        const manifest = { ...baseManifest }

        if (browser === 'chrome') {
                manifest.manifest_version = 3
                manifest.background = {
                        service_worker: 'background.js',
                }
                manifest.action = manifest.browser_action
                delete manifest.browser_action

                manifest.host_permissions = manifest.permissions.filter(
                        (p) => p.startsWith('http') || p === '<all_urls>'
                )
                manifest.permissions = manifest.permissions.filter(
                        (p) => !p.startsWith('http') && p !== '<all_urls>'
                )

                delete manifest.browser_specific_settings
        } else {
                manifest.manifest_version = 2
        }

        if (!isProduction) {
                manifest.name = `[DEV] ${manifest.name}`
        }

        const distDir = join('dist', browser)
        if (!existsSync(distDir)) {
                mkdirSync(distDir, { recursive: true })
        }

        const manifestPath = join(distDir, 'manifest.json')
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
        console.log(
                `Generated manifest for ${browser} (MV${manifest.manifest_version})`
        )

        return manifestPath
}

export default {
        input: {
                background: 'entrypoints/background/index.ts',
                content: 'entrypoints/content/index.ts',
                popup: 'entrypoints/popup/main.tsx',
        },
        output: {
                dir: `dist/${browser}`,
                format: 'es',
                sourcemap: isProduction ? false : 'inline',
                entryFileNames: (chunkInfo) => {
                        if (chunkInfo.name === 'content') {
                                return 'content-scripts/content.js'
                        }
                        if (chunkInfo.name === 'background') {
                                return 'background.js'
                        }
                        return 'assets/[name]-[hash].js'
                },
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: (assetInfo) => {
                        if (assetInfo.name === 'content.css') {
                                return 'content-scripts/content.css'
                        }
                        return 'assets/[name]-[hash][extname]'
                },
        },
        plugins: [
                alias({
                        entries: [{ find: '@', replacement: 'src' }],
                }),
                nodeResolve({
                        browser: true,
                        extensions: ['.js', '.ts', '.tsx', '.jsx', '.css'],
                }),
                typescript({
                        tsconfig: './tsconfig.json',
                        sourceMap: !isProduction,
                        inlineSources: !isProduction,
                        include: ['**/*.ts', '**/*.tsx'],
                        exclude: ['**/*.css'],
                }),
                babel({
                        babelHelpers: 'bundled',
                        extensions: ['.ts', '.tsx', '.js', '.jsx'],
                        presets: ['solid'],
                }),
                commonjs(),
                // 处理CSS导入
                {
                        name: 'css-import',
                        resolveId(source) {
                                if (source.endsWith('.css')) {
                                        return { id: source, external: false }
                                }
                                return null
                        },
                        load(id) {
                                if (id.endsWith('.css')) {
                                        // 返回空内容，因为CSS会被合并到单独的文件中
                                        return ''
                                }
                                return null
                        },
                },

                replace({
                        'process.env.NODE_ENV': JSON.stringify(
                                isProduction ? 'production' : 'development'
                        ),
                        'process.env.BROWSER': JSON.stringify(browser),
                        preventAssignment: true,
                }),
                // 自定义CSS合并插件（使用postcss处理）
                {
                        name: 'merge-css',
                        async buildStart() {
                                // 读取CSS文件内容（会自动处理@import）
                                const cssContent = readFileSync(
                                        'entrypoints/content/style.css',
                                        'utf-8'
                                )

                                // 配置PostCSS插件链
                                const plugins = [
                                        postcss_import,
                                        ...(isProduction ? [csso] : []),
                                ]

                                // 处理CSS
                                const result = await postcss(plugins).process(
                                        cssContent,
                                        {
                                                from: 'entrypoints/content/style.css',
                                                to: 'content-scripts/content.css',
                                        }
                                )

                                // 保存处理后的CSS
                                this.emitFile({
                                        type: 'asset',
                                        fileName: 'content-scripts/content.css',
                                        source: result.css,
                                })
                        },
                },
                isProduction &&
                        terser({
                                format: {
                                        comments: false,
                                },
                                compress: {
                                        drop_console: true,
                                        drop_debugger: true,
                                },
                        }),
                // 记录输出文件
                {
                        name: 'record-output-files',
                        generateBundle(options, bundle) {
                                for (const [
                                        fileName,
                                        fileInfo,
                                ] of Object.entries(bundle)) {
                                        if (
                                                fileInfo.type === 'chunk' &&
                                                fileInfo.isEntry
                                        ) {
                                                outputFiles.set(
                                                        fileInfo.name,
                                                        fileName
                                                )
                                        }
                                }
                        },
                },
                // 生成manifest
                {
                        name: 'generate-manifest',
                        buildStart() {
                                generateManifest()
                        },
                },
                copy({
                        targets: [
                                {
                                        src: 'entrypoints/popup/index.html',
                                        dest: `dist/${browser}/popup`,
                                },
                                {
                                        src: 'public/icon/*',
                                        dest: `dist/${browser}/icon`,
                                },
                        ],
                }),
                // 更新popup/index.html中的脚本引用
                {
                        name: 'update-popup-html',
                        writeBundle() {
                                const distDir = `dist/${browser}`
                                const htmlPath = join(
                                        distDir,
                                        'popup',
                                        'index.html'
                                )

                                if (!existsSync(htmlPath)) {
                                        return
                                }

                                // 确保是文件而不是目录
                                const stats = statSync(htmlPath)
                                if (!stats.isFile()) {
                                        return
                                }

                                let html = readFileSync(htmlPath, 'utf-8')
                                const popupEntryFile = outputFiles.get('popup')

                                if (popupEntryFile) {
                                        // 计算相对路径：从popup/index.html到assets/popup-[hash].js
                                        const relativePath = `../${popupEntryFile}`
                                        html = html.replace(
                                                /<script type="module" src="\.\/main\.tsx"><\/script>/,
                                                `<script type="module" src="${relativePath}"></script>`
                                        )
                                        writeFileSync(htmlPath, html)
                                        console.log(
                                                `Updated popup/index.html to reference ${relativePath}`
                                        )
                                }
                        },
                },
        ],
}
