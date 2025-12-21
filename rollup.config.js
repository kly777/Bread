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
        readdirSync,
        unlinkSync,
} from 'fs'

import { join } from 'path'
import postcss from 'postcss'
import csso from 'postcss-csso'
import postcss_import from 'postcss-import'

const isProduction = process.env.NODE_ENV === 'production'

// 生成manifest的函数
function generateManifest() {
        const baseManifest = JSON.parse(readFileSync('manifest.json', 'utf-8'))
        const manifest = { ...baseManifest }

        // 只支持Firefox，manifest_version为2
        manifest.manifest_version = 2

        if (!isProduction) {
                manifest.name = `[DEV] ${manifest.name}`
        }

        const distDir = 'dist'
        if (!existsSync(distDir)) {
                mkdirSync(distDir, { recursive: true })
        }

        const manifestPath = join(distDir, 'manifest.json')
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
        console.log(
                `Generated manifest for Firefox (MV${manifest.manifest_version})`
        )

        return manifestPath
}

// 共享插件配置
const sharedPlugins = [
        alias({
                entries: [{ find: '@', replacement: 'src' }],
        }),
        nodeResolve({
                browser: true,
                exportConditions: [
                        'solid',
                        'browser',
                        'module',
                        'import',
                        'default',
                ],
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
        // 处理CSS导入，防止rollup解析CSS文件
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
                                // 返回空内容，CSS会被单独处理
                                return ''
                        }
                        return null
                },
        },
        replace({
                preventAssignment: true,
                values: {
                        'process.env.NODE_ENV': JSON.stringify(
                                isProduction ? 'production' : 'development'
                        ),
                },
        }),
]

// 内容脚本配置
const contentScriptConfig = {
        input: 'entrypoints/content/index.ts',
        output: {
                file: 'dist/content-scripts/content.js',
                format: 'iife',
                name: 'contentScript',
                sourcemap: !isProduction,
                inlineDynamicImports: true,
        },
        plugins: [
                ...sharedPlugins,
                {
                        name: 'content-css',
                        async buildStart() {
                                // 读取主CSS文件
                                const contentCssContent = readFileSync(
                                        'entrypoints/content/style.css',
                                        'utf-8'
                                )

                                // 使用postcss处理CSS导入
                                const result = await postcss([
                                        postcss_import({
                                                root: 'entrypoints/content',
                                        }),
                                        ...(isProduction ? [csso()] : []),
                                ]).process(contentCssContent, {
                                        from: 'entrypoints/content/style.css',
                                        to: 'dist/content-scripts/content.css',
                                })

                                // 保存处理后的CSS
                                this.emitFile({
                                        type: 'asset',
                                        fileName: 'content.css',
                                        source: result.css,
                                })
                        },
                },
                ...(isProduction
                        ? [
                                  terser({
                                          format: {
                                                  comments: false,
                                          },
                                          compress: {
                                                  drop_console: true,
                                                  drop_debugger: true,
                                          },
                                  }),
                          ]
                        : []),
        ],
}

// 背景脚本和弹窗配置
const backgroundPopupConfig = {
        input: {
                background: 'entrypoints/background/index.ts',
                popup: 'entrypoints/popup/main.tsx',
        },
        output: {
                dir: 'dist',
                format: 'es',
                sourcemap: !isProduction,
                entryFileNames: (chunkInfo) => {
                        if (chunkInfo.name === 'popup') {
                                return 'popup/index-[hash].js'
                        }
                        return '[name].js'
                },
                chunkFileNames: 'chunks/[name]-[hash].js',
                assetFileNames: (assetInfo) => {
                        if (assetInfo.name === 'style.css') {
                                return 'popup/index-[hash].css'
                        }
                        return 'assets/[name][extname]'
                },
        },
        plugins: [
                ...sharedPlugins,
                {
                        name: 'clean-dist',
                        buildStart() {
                                const assetsDir = 'dist/assets'
                                if (existsSync(assetsDir)) {
                                        const files = readdirSync(assetsDir)
                                        let removedCount = 0
                                        for (const file of files) {
                                                const filePath = join(
                                                        assetsDir,
                                                        file
                                                )
                                                if (
                                                        statSync(
                                                                filePath
                                                        ).isFile()
                                                ) {
                                                        unlinkSync(filePath)
                                                        removedCount++
                                                }
                                        }
                                        if (removedCount > 0) {
                                                console.log(
                                                        `Cleaned up ${removedCount} old asset files`
                                                )
                                        }
                                }
                        },
                },
                {
                        name: 'popup-css',
                        async buildStart() {
                                const popupCssContent = readFileSync(
                                        'entrypoints/popup/style.css',
                                        'utf-8'
                                )

                                // 使用postcss处理CSS导入
                                const result = await postcss([
                                        postcss_import({
                                                root: 'entrypoints/popup',
                                        }),
                                        ...(isProduction ? [csso()] : []),
                                ]).process(popupCssContent, {
                                        from: 'entrypoints/popup/style.css',
                                })

                                // 保存处理后的CSS，使用源文件名作为name
                                this.emitFile({
                                        type: 'asset',
                                        name: 'style.css',
                                        source: result.css,
                                })
                        },
                },
                ...(isProduction
                        ? [
                                  terser({
                                          format: {
                                                  comments: false,
                                          },
                                          compress: {
                                                  drop_console: true,
                                                  drop_debugger: true,
                                          },
                                  }),
                          ]
                        : []),
                copy({
                        targets: [
                                {
                                        src: 'public/icon/*',
                                        dest: 'dist/icon',
                                },
                                {
                                        src: 'entrypoints/popup/index.html',
                                        dest: 'dist/popup',
                                },
                        ],
                }),
                {
                        name: 'generate-manifest',
                        buildStart() {
                                generateManifest()
                        },
                },
                {
                        name: 'inject-popup-assets',
                        writeBundle(options, bundle) {
                                const distDir = 'dist'
                                const htmlPath = join(
                                        distDir,
                                        'popup',
                                        'index.html'
                                )

                                if (!existsSync(htmlPath)) {
                                        console.warn(
                                                'Popup HTML not found:',
                                                htmlPath
                                        )
                                        return
                                }

                                let html = readFileSync(htmlPath, 'utf-8')

                                // 1. 解析HTML，找出所有引用的源文件
                                const sourceRefs = {
                                        js: [],
                                        css: [],
                                }

                                // 查找所有script标签（支持相对路径）
                                const scriptRegex =
                                        /<script\s+[^>]*src="([^"]+)"[^>]*><\/script>/gi
                                let match
                                while (
                                        (match = scriptRegex.exec(html)) !==
                                        null
                                ) {
                                        const src = match[1]
                                        // 只处理本地文件，忽略外部URL
                                        if (
                                                !src.startsWith('http') &&
                                                !src.startsWith('//')
                                        ) {
                                                sourceRefs.js.push(src)
                                        }
                                }

                                // 查找所有link标签（支持相对路径）
                                const linkRegex =
                                        /<link\s+[^>]*href="([^"]+)"[^>]*>/gi
                                while (
                                        (match = linkRegex.exec(html)) !== null
                                ) {
                                        const href = match[1]
                                        // 只处理本地CSS文件，忽略外部URL
                                        if (
                                                !href.startsWith('http') &&
                                                !href.startsWith('//') &&
                                                href.endsWith('.css')
                                        ) {
                                                sourceRefs.css.push(href)
                                        }
                                }

                                // 2. 构建源文件到构建产物的映射
                                const sourceToOutputMap = new Map()

                                // 遍历bundle，构建映射
                                for (const [
                                        outputFile,
                                        fileInfo,
                                ] of Object.entries(bundle)) {
                                        if (
                                                fileInfo.type === 'chunk' &&
                                                fileInfo.isEntry
                                        ) {
                                                // 入口chunk：映射入口文件到输出文件
                                                const entryFile =
                                                        fileInfo.facadeModuleId
                                                if (entryFile) {
                                                        // 获取入口文件的basename（如main.tsx）
                                                        const entryBasename =
                                                                entryFile.replace(
                                                                        /^.*[\\\/]/,
                                                                        ''
                                                                )
                                                        // 映射源文件到输出文件
                                                        sourceToOutputMap.set(
                                                                entryBasename,
                                                                outputFile
                                                        )
                                                        // 同时映射.js版本（因为.tsx会被编译为.js）
                                                        const jsBasename =
                                                                entryBasename.replace(
                                                                        /\.(tsx?|jsx?)$/,
                                                                        '.js'
                                                                )
                                                        sourceToOutputMap.set(
                                                                jsBasename,
                                                                outputFile
                                                        )
                                                }
                                        } else if (
                                                fileInfo.type === 'asset' &&
                                                fileInfo.name
                                        ) {
                                                // asset文件：映射asset名称到输出文件
                                                // 对于CSS文件，我们需要将源文件名映射到输出文件
                                                if (
                                                        fileInfo.name ===
                                                        'style.css'
                                                ) {
                                                        sourceToOutputMap.set(
                                                                'style.css',
                                                                outputFile
                                                        )
                                                }
                                        }
                                }

                                // 3. 替换HTML中的引用
                                let updated = false

                                // 替换script标签
                                for (const sourceJs of sourceRefs.js) {
                                        // 获取源文件的basename（如./main.tsx -> main.tsx）
                                        const sourceBasename = sourceJs
                                                .replace(/^.*[\\\/]/, '')
                                                .replace(/^\.\//, '')
                                        // 尝试查找映射
                                        let outputFile =
                                                sourceToOutputMap.get(
                                                        sourceBasename
                                                )

                                        // 如果没有直接匹配，尝试.js版本（因为.tsx会被编译为.js）
                                        if (
                                                !outputFile &&
                                                sourceBasename.endsWith('.tsx')
                                        ) {
                                                const jsBasename =
                                                        sourceBasename.replace(
                                                                /\.tsx$/,
                                                                '.js'
                                                        )
                                                outputFile =
                                                        sourceToOutputMap.get(
                                                                jsBasename
                                                        )
                                        }
                                        if (
                                                !outputFile &&
                                                sourceBasename.endsWith('.ts')
                                        ) {
                                                const jsBasename =
                                                        sourceBasename.replace(
                                                                /\.ts$/,
                                                                '.js'
                                                        )
                                                outputFile =
                                                        sourceToOutputMap.get(
                                                                jsBasename
                                                        )
                                        }

                                        if (outputFile) {
                                                // 提取文件名部分（如 index-VS98NWwv.js）
                                                const fileName =
                                                        outputFile.replace(
                                                                /^.*[\\\/]/,
                                                                ''
                                                        )
                                                const outputRelativePath = `./${fileName}`
                                                const oldScriptRegex =
                                                        new RegExp(
                                                                `<script\\s+[^>]*src="${sourceJs.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*><\\/script>`
                                                        )
                                                const newScriptTag = `<script type="module" src="${outputRelativePath}"></script>`

                                                html = html.replace(
                                                        oldScriptRegex,
                                                        newScriptTag
                                                )
                                                updated = true
                                                console.log(
                                                        `Replaced ${sourceJs} -> ${outputRelativePath}`
                                                )
                                        } else {
                                                console.warn(
                                                        `Could not find output file for source: ${sourceJs}`
                                                )
                                        }
                                }

                                // 替换link标签
                                for (const sourceCss of sourceRefs.css) {
                                        // 获取源文件的basename（如./style.css -> style.css）
                                        const sourceBasename = sourceCss
                                                .replace(/^.*[\\\/]/, '')
                                                .replace(/^\.\//, '')
                                        const outputFile =
                                                sourceToOutputMap.get(
                                                        sourceBasename
                                                )

                                        if (outputFile) {
                                                // 提取文件名部分（如 index-DI4Kpopc.css）
                                                const fileName =
                                                        outputFile.replace(
                                                                /^.*[\\\/]/,
                                                                ''
                                                        )
                                                const outputRelativePath = `./${fileName}`
                                                const oldLinkRegex = new RegExp(
                                                        `<link\\s+[^>]*href="${sourceCss.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`
                                                )
                                                const newLinkTag = `<link rel="stylesheet" href="${outputRelativePath}">`

                                                html = html.replace(
                                                        oldLinkRegex,
                                                        newLinkTag
                                                )
                                                updated = true
                                                console.log(
                                                        `Replaced ${sourceCss} -> ${outputRelativePath}`
                                                )
                                        } else {
                                                console.warn(
                                                        `Could not find output file for source: ${sourceCss}`
                                                )
                                        }
                                }

                                if (updated) {
                                        writeFileSync(htmlPath, html)
                                        console.log(
                                                'Updated popup HTML with dynamic asset references'
                                        )
                                }
                        },
                },
        ],
}

export default [contentScriptConfig, backgroundPopupConfig]
