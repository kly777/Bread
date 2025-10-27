import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import ts from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default defineConfig([
        // 全局配置
        {
                ignores: ['.output/**/*', '.wxt/**/*', 'dev/**/*'],
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
                        vue,
                },
                rules: {
                        'no-unused-vars': 'warn',
                        'no-undef': 'warn',
                        'no-redeclare': 'warn',
                        'no-unreachable': 'warn',
                        'no-dupe-keys': 'warn',
                        'no-dupe-else-if': 'warn',
                        'eqeqeq': 'warn',
                        'no-var': 'warn',
                        'prefer-const': 'warn',

                        ...ts.configs['recommended'].rules,
                        ...ts.configs['eslint-recommended'].rules,
                        ...vue.configs['flat/recommended'].rules,
                },
        },
        // TypeScript配置
        {
                files: ['**/*.ts'],
                languageOptions: {
                        parser: tsParser,
                        parserOptions: {
                                project: './tsconfig.json',
                        },
                },
        },
        // Vue配置
        {
                files: ['**/*.vue'],
                languageOptions: {
                        parser: vueParser,
                        parserOptions: {
                                parser: '@typescript-eslint/parser',
                                extraFileExtensions: ['.vue'],
                                project: './tsconfig.eslint.json',
                        },
                },
        },
])
