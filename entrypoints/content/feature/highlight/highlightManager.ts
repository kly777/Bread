import { KeywordExtractor } from './keywordExtractor'
import { HighlightWord, HighlightConfig, DEFAULT_CONFIG, createHighlightWord } from './highlightConfig'
import { getKeyWithDomain } from '../../../kit/storage'
import { highlightWordsInDocument, removeHighlights } from './highlightNode'
import { getHighlightStyle } from './highlightConfig'
import { manageMutationObserver } from '../../observer/domMutationObserver'

/**
 * 高亮管理器
 * 负责协调高亮功能的各个组件，包括配置管理、关键词提取、高亮执行等
 */

// 声明全局storage对象
declare const storage: {
        getItem<T>(key: string): Promise<T | null>
        setItem<T>(key: string, value: T): Promise<void>
}

export class HighlightManager {
        private extractor: KeywordExtractor
        private config: HighlightConfig
        private isActive: boolean = false
        private styleElement: HTMLStyleElement | null = null

        constructor() {
                this.config = { ...DEFAULT_CONFIG }
                this.extractor = new KeywordExtractor()
                // 确保样式在初始化时就被注入
                this.injectStyles()
                this.loadConfig()
        }

        async loadConfig() {
                try {
                        const saved = await storage.getItem<HighlightConfig>(getKeyWithDomain('highlight_config'))
                        if (saved) {
                                this.config = { ...DEFAULT_CONFIG, ...saved }
                                this.injectStyles()
                        }
                } catch (error) {
                        console.warn('Failed to load highlight config:', error)
                }
        }

        async saveConfig() {
                try {
                        await storage.setItem(getKeyWithDomain('highlight_config'), this.config)
                } catch (error) {
                        console.warn('Failed to save highlight config:', error)
                }
        }

        async autoExtractAndHighlight() {
                if (!this.config.autoExtract) return

                const sources = this.extractor.extractKeywords()
                console.log('Extracted keywords:', sources)
                if (sources.length === 0) return

                const bestSource = sources[0]
                const newWords = bestSource.keywords.map(keyword =>
                        createHighlightWord(keyword, true)
                )

                this.addWords(newWords)
                this.extractor.setWindowKeywords(bestSource.keywords)

                if (this.isActive) {
                        this.highlightAll()
                }
        }

        addWords(words: HighlightWord[]) {
                for (const newWord of words) {
                        const existingIndex = this.config.words.findIndex(
                                w => w.text === newWord.text
                        )

                        if (existingIndex >= 0) {
                                this.config.words[existingIndex].enabled =
                                        this.config.words[existingIndex].enabled || newWord.enabled
                        } else {
                                newWord.colorIndex = this.config.words.length % 10
                                this.config.words.push(newWord)
                        }
                }

                if (this.config.sortByLength) {
                        this.config.words.sort((a, b) => b.text.length - a.text.length)
                }

                this.saveConfig()
                
                // 如果高亮功能已激活，立即应用高亮
                if (this.isActive) {
                        this.highlightAll()
                }
        }

        removeWord(text: string) {
                this.config.words = this.config.words.filter(w => w.text !== text)
                this.saveConfig()

                if (this.isActive) {
                        this.highlightAll()
                }
        }

        toggleWord(text: string, enabled?: boolean) {
                const word = this.config.words.find(w => w.text === text)
                if (word) {
                        word.enabled = enabled !== undefined ? enabled : !word.enabled
                        this.saveConfig()

                        if (this.isActive) {
                                this.highlightAll()
                        }
                }
        }

        updateWord(word: HighlightWord) {
                const index = this.config.words.findIndex(w => w.text === word.text)
                if (index >= 0) {
                        this.config.words[index] = word
                        this.saveConfig()

                        if (this.isActive) {
                                this.highlightAll()
                        }
                }
        }

        highlightAll() {
                if (!this.isActive) {
                        console.log('⏸️  高亮功能未激活，跳过highlightAll')
                        return
                }

                // 获取启用的高亮词
                const enabledWords = this.config.words
                        .filter(word => word.enabled)
                        .map(word => word.text)

                console.group('🎨 高亮管理器 - highlightAll')
                console.log(`📝 启用的关键词: ${enabledWords.join(', ')}`)
                console.log(`🔢 关键词数量: ${enabledWords.length}`)

                // 使用highlightNode.ts的高亮方案
                highlightWordsInDocument(enabledWords)

                console.log('✅ 高亮应用完成')
                console.groupEnd()

                return new Map() // 为了保持接口兼容性，返回空Map
        }

        navigateToWord(text: string) {
                // 简化实现：暂时不支持导航功能
                console.log(`导航到关键词: ${text} - 功能暂未实现`)
                return null
        }

        getWordStats(text: string) {
                // 简化实现：暂时返回固定计数
                return {
                        count: 1, // 简化计数
                        word: this.config.words.find(w => w.text === text)
                }
        }

        getAllStats() {
                const stats: { [text: string]: { count: number; word: HighlightWord } } = {}

                for (const word of this.config.words) {
                        if (word.enabled) {
                                stats[word.text] = {
                                        count: 1, // 简化计数
                                        word
                                }
                        }
                }

                return stats
        }

        start() {
                console.group('▶️ 高亮管理器 - start')
                console.log('🚀 激活高亮功能')
                this.isActive = true
                this.highlightAll()
                // 开始观察DOM变化，以便在动态内容加载时重新应用高亮
                manageMutationObserver(true)
                console.log('👁️ 已启动DOM观察器')
                console.groupEnd()
        }

        stop() {
                console.group('🛑 高亮管理器 - stop')
                console.log('⏸️  停用高亮功能')
                this.isActive = false
                removeHighlights()
                // 停止观察DOM变化
                manageMutationObserver(false)
                console.log('👁️ 已停止DOM观察器')
                console.groupEnd()
        }

        updateConfig(newConfig: Partial<HighlightConfig>) {
                this.config = { ...this.config, ...newConfig }
                this.injectStyles()
                this.saveConfig()

                if (this.isActive) {
                        this.highlightAll()
                }
        }

        getConfig(): HighlightConfig {
                return { ...this.config }
        }

        getWords(): HighlightWord[] {
                return [...this.config.words]
        }

        isEnabled(): boolean {
                return this.isActive
        }

        destroy() {
                this.stop()
                this.removeStyles()
        }

        /**
         * 注入高亮样式到页面
         */
        private injectStyles() {
                // 移除已存在的样式元素
                this.removeStyles()

                // 创建新的样式元素
                this.styleElement = document.createElement('style')
                this.styleElement.id = 'bread-highlight-styles'
                this.styleElement.textContent = getHighlightStyle(this.config.colorScheme) + `
            .bread-highlight {
                display: inline !important;
                margin: 0 !important;
                padding: 0 1px !important;
                font: inherit !important;
                color: black !important;
                text-decoration: none !important;
            }
        `

                // 确保样式正确注入到文档中
                try {
                        if (document.head) {
                                document.head.appendChild(this.styleElement)
                        } else {
                                document.documentElement.appendChild(this.styleElement)
                        }
                        console.log('Highlighter styles injected successfully')
                } catch (error) {
                        console.error('Failed to inject highlighter styles:', error)
                }
        }

        /**
         * 移除样式元素
         */
        private removeStyles() {
                if (this.styleElement) {
                        this.styleElement.remove()
                        this.styleElement = null
                }
        }
}

let globalHighlightManager: HighlightManager | null = null

export function getHighlightManager(): HighlightManager {
        if (!globalHighlightManager) {
                globalHighlightManager = new HighlightManager()
        }
        return globalHighlightManager
}

export function destroyHighlightManager() {
        if (globalHighlightManager) {
                globalHighlightManager.destroy()
                globalHighlightManager = null
        }
}