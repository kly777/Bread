import { defineConfig } from 'wxt'
export default defineConfig({
        modules: ['@wxt-dev/module-vue'],
        browser: 'chrome',
        manifest: {
                permissions: [
                        'storage',
                        'nativeMessaging',
                        'tabs',
                        '<all_urls>',
                        'activeTab',
                        'https://edge.microsoft.com/',
                        'https://api-edge.cognitive.microsofttranslator.com/',
                        'https://translate.googleapis.com/translate_a/single',
                ],
                host_permissions: ['<all_urls>'],
                summary: 'A browser extension for reading enhancement',
                browser_specific_settings: {
                        gecko: {
                                // id: 'bread-extension@kly777.com',
                                // data_collection_permissions: {
                                //         "telemetry": false,
                                //         "study": false
                                // }
                        },
                },
        },
        zip: {
                downloadPackages: [
                        '@kly777/bread',
                        //...
                ],
        },

        vite: (env) => {
                if (env.mode === 'development') {
                        return {
                                build: {
                                        sourcemap: 'inline', // 确保生成 source maps 方便调试
                                },
                                server: {
                                        hmr: {
                                                timeout: 20000, // 增加热重载超时时间
                                        },
                                },
                        }
                }

                return {
                        build: {
                                minify: 'terser',
                                terserOptions: {
                                        compress: {
                                                defaults: true, // 启用所有默认压缩规则
                                                drop_console: true, // 开发时保留 console.*
                                                drop_debugger: true, // 移除 debugger
                                                pure_funcs: ['console.assert'], // 移除断言
                                                unused: true, // 移除未使用代码
                                                dead_code: true, // 移除死代码
                                                evaluate: true,
                                        },
                                        mangle: true, // 混淆变量名（如 `myVar` → `a`）
                                        format: { comments: false }, // 移除注释
                                },
                        },
                        optimizeDeps: { include: ['vue'] },
                }
        },
})
