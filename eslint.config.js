import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import ts from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default defineConfig([
        // 全局配置
        {
                ignores: ['**/.output/**/*', 'dist/**/*', 'dev/**/*'],
                languageOptions: {
                        globals: {
                                browser: 'readonly',
                                document: 'readonly',
                                window: 'readonly',
                                console: 'readonly',
                                storage: 'readonly',
                                defineBackground: 'readonly',
                                defineContentScript: 'readonly',
                                fetch: 'readonly',
                                atob: 'readonly',
                                onUnmounted: 'readonly',
                                createApp: 'readonly',
                                getComputedStyle: 'readonly',
                        },
                },
                plugins: {
                        js,
                        '@typescript-eslint': ts,
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

                        ...ts.configs['recommended'].rules,
                        ...ts.configs['eslint-recommended'].rules,
                },
        },
        // TypeScript配置
        {
                files: ['**/*.ts'],
                languageOptions: {
                        parser: tsParser,
                },
        },
])
