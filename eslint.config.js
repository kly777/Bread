import { defineConfig, globalIgnores } from 'eslint/config'
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default defineConfig([
        globalIgnores(
                [
                        '**/.output/**/*',
                        'dist/**',
                        'dist-signed/**',
                        'dev/**',
                        'node_modules/**',
                ],
                '忽略文件'
        ),
        eslint.configs.recommended,
        {
                ignores: [
                        '**/.output/**/*',
                        'dist/**',
                        'dist-signed/**',
                        'dev/**',
                        'node_modules/**',
                ],
                languageOptions: {
                        globals: {
                                ...globals.browser,
                                ...globals.es2020,
                                browser: 'readonly',
                                chrome: 'readonly',
                                breadStorage: 'readonly',
                                defineBackground: 'readonly',
                                defineContentScript: 'readonly',
                                onUnmounted: 'readonly',
                                createApp: 'readonly',
                        },
                },
                plugins: {
                        js: eslint,
                },
                rules: {
                        'no-unused-vars': 'warn',
                        'no-undef': 'warn',
                        'no-redeclare': 'warn',
                        'no-unreachable': 'warn',
                        'no-dupe-keys': 'warn',
                        'no-dupe-else-if': 'warn',
                        eqeqeq: 'warn',
                        'no-var': 'warn',
                        'prefer-const': 'warn',
                },
        },
        // Node.js配置文件
        {
                files: [
                        'eslint.config.js',
                        'rollup.config.js',
                        'scripts/**/*.js',
                ],
                languageOptions: {
                        globals: {
                                ...globals.node,
                        },
                },
        },
        tseslint.configs.strict,
        tseslint.configs.stylistic, // 全局配置
])
