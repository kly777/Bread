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
]

// Content script 构建配置 - 构建为独立的 IIFE 文件
const contentScriptConfig = {
        input: 'entrypoints/content/index.ts',
        output: {
                file: `dist/${browser}/content-scripts/content.js`,
                format: 'iife', // 使用 IIFE 格式，适合 content script
                name: 'contentScript', // 全局变量名
                sourcemap: isProduction ? false : 'inline',
                // 禁用代码分割，所有代码打包到一个文件
                inlineDynamicImports: true,
        },
        plugins: [
                ...sharedPlugins,
                // 自定义CSS合并插件（使用postcss处理）- 仅用于 content script
                {
                        name: 'merge-content-css',
                        async buildStart() {
                                // 处理content CSS
                                const contentCssContent = readFileSync(
                                        'entrypoints/content/style.css',
                                        'utf-8'
                                )

                                // 导入所有功能CSS文件
                                const featureCssFiles = [
                                        'entrypoints/content/feature/anchor/anchor.css',
                                        'entrypoints/content/feature/downloadLink/downloadLink.css',
                                        'entrypoints/content/feature/linkTarget/linkTarget.css',
                                        'entrypoints/content/feature/translate/translate.css',
                                ]

                                let allCssContent = contentCssContent
                                for (const cssFile of featureCssFiles) {
                                        if (existsSync(cssFile)) {
                                                allCssContent +=
                                                        '\n' +
                                                        readFileSync(
                                                                cssFile,
                                                                'utf-8'
                                                        )
                                        }
                                }

                                // 配置PostCSS插件链
                                const plugins = [
                                        postcss_import,
                                        ...(isProduction ? [csso] : []),
                                ]

                                // 处理合并后的CSS
                                const result = await postcss(plugins).process(
                                        allCssContent,
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
        ],
}

// Background 和 Popup 构建配置 - 保持原有 ES 模块格式
const backgroundPopupConfig = {
        input: {
                background: 'entrypoints/background/index.ts',
                popup: 'entrypoints/popup/main.tsx',
        },
        output: {
                dir: `dist/${browser}`,
                format: 'es',
                sourcemap: isProduction ? false : 'inline',
                entryFileNames: (chunkInfo) => {
                        if (chunkInfo.name === 'background') {
                                return 'background.js'
                        }
                        return 'assets/[name]-[hash].js'
                },
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: () => {
                        return 'assets/[name]-[hash][extname]'
                },
        },
        plugins: [
                ...sharedPlugins, // 清理 assets 目录中的旧哈希文件
                {
                        name: 'clean-assets',
                        buildStart() {
                                const assetsDir = join(
                                        `dist/${browser}`,
                                        'assets'
                                )
                                if (existsSync(assetsDir)) {
                                        const files = readdirSync(assetsDir)
                                        let removedCount = 0
                                        for (const file of files) {
                                                // 只删除 .js 哈希文件（保留 popup.css 等固定名称文件）
                                                if (
                                                        file.endsWith('.js') &&
                                                        file.includes('-')
                                                ) {
                                                        const filePath = join(
                                                                assetsDir,
                                                                file
                                                        )
                                                        if (
                                                                statSync(
                                                                        filePath
                                                                ).isFile()
                                                        ) {
                                                                unlinkSync(
                                                                        filePath
                                                                )
                                                                removedCount++
                                                        }
                                                }
                                        }
                                        if (removedCount > 0) {
                                                console.log(
                                                        `Cleaned ${removedCount} old hashed files in ${assetsDir}`
                                                )
                                        }
                                }
                        },
                },

                // 自定义CSS合并插件（使用postcss处理）- 用于 popup
                {
                        name: 'merge-popup-css',
                        async buildStart() {
                                // 处理popup CSS
                                const popupCssContent = readFileSync(
                                        'entrypoints/popup/style.css',
                                        'utf-8'
                                )

                                // 配置PostCSS插件链
                                const plugins = [
                                        postcss_import,
                                        ...(isProduction ? [csso] : []),
                                ]

                                // 处理popup CSS
                                const popupResult = await postcss(
                                        plugins
                                ).process(popupCssContent, {
                                        from: 'entrypoints/popup/style.css',
                                        to: 'assets/popup.css',
                                })

                                // 保存处理后的CSS
                                this.emitFile({
                                        type: 'asset',
                                        fileName: 'assets/popup.css',
                                        source: popupResult.css,
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
                // 自动处理HTML中的资源引用
                {
                        name: 'auto-html-references',
                        writeBundle(options, bundle) {
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

                                // 1. 更新JS脚本引用
                                const popupEntryFile = outputFiles.get('popup')
                                if (popupEntryFile) {
                                        const jsRelativePath = `../${popupEntryFile}`
                                        html = html.replace(
                                                /<script\s+type="module"\s+src="[^"]*main\.tsx"[^>]*><\/script>/,
                                                `<script type="module" src="${jsRelativePath}"></script>`
                                        )
                                }

                                // 2. 更新CSS引用 - 查找bundle中的CSS文件
                                const cssFiles = Object.entries(bundle)
                                        .filter(
                                                ([fileName, fileInfo]) =>
                                                        fileInfo.type ===
                                                                'asset' &&
                                                        fileName.endsWith(
                                                                '.css'
                                                        ) &&
                                                        fileName.includes(
                                                                'popup'
                                                        )
                                        )
                                        .map(([fileName]) => fileName)

                                if (cssFiles.length > 0) {
                                        const cssFile = cssFiles[0]
                                        const cssRelativePath = `../${cssFile}`

                                        // 替换或添加CSS链接
                                        if (html.includes('rel="stylesheet"')) {
                                                // 替换现有的CSS链接
                                                html = html.replace(
                                                        /<link\s+rel="stylesheet"\s+href="[^"]*"[^>]*>/,
                                                        `<link rel="stylesheet" href="${cssRelativePath}" />`
                                                )
                                        } else {
                                                // 添加新的CSS链接（在title标签后）
                                                html = html.replace(
                                                        /<title>Bread<\/title>/,
                                                        `<title>Bread</title>\n                <link rel="stylesheet" href="${cssRelativePath}" />`
                                                )
                                        }
                                }

                                // 3. 更新其他资源引用（如图标、图片等）
                                // 这里可以扩展以处理更多类型的资源

                                writeFileSync(htmlPath, html)
                                console.log(
                                        `Updated HTML references in popup/index.html`
                                )

                                // 输出更新信息
                                if (popupEntryFile) {
                                        console.log(`  JS: ${popupEntryFile}`)
                                }
                                if (cssFiles.length > 0) {
                                        console.log(`  CSS: ${cssFiles[0]}`)
                                }
                        },
                },
        ],
}

// 导出两个构建配置
export default [contentScriptConfig, backgroundPopupConfig]
