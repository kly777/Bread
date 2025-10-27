/**
 * 高亮执行器
 * 负责实际的高亮操作，不管理词的状态
 */

import { highlightWordsInDocument, removeHighlights } from './highlightNode'
import { getWordsManager, HighlightWord } from './wordsManager'

export class Highlighter {
        private isActive: boolean = false

        /**
         * 启动高亮器
         */
        start(): void {
                if (this.isActive) return

                this.isActive = true
                console.log('🚀 启动高亮器')

                // 监听词管理器变化
                const wordsManager = getWordsManager()
                wordsManager.onWordsUpdate(this.handleWordsUpdate.bind(this))

                // 初始高亮一次
                this.highlightCurrentWords()
        }

        /**
         * 停止高亮器
         */
        stop(): void {
                if (!this.isActive) return

                this.isActive = false
                console.log('⏹️ 停止高亮器')

                // 取消监听
                const wordsManager = getWordsManager()
                wordsManager.offWordsUpdate(this.handleWordsUpdate.bind(this))

                // 移除所有高亮
                removeHighlights()
        }

        /**
         * 处理词更新
         */
        private handleWordsUpdate(words: HighlightWord[]): void {
                if (!this.isActive) return

                console.log('🔄 检测到词更新，重新应用高亮')
                this.highlightWords(words)
        }

        /**
         * 高亮指定词
         */
        private highlightWords(words: HighlightWord[]): void {
                if (words.length === 0) {
                        removeHighlights()
                        return
                }

                console.log(`🎨 开始高亮 ${words.length} 个词`)
                highlightWordsInDocument(words)
        }

        /**
         * 高亮当前词
         */
        private highlightCurrentWords(): void {
                const wordsManager = getWordsManager()
                const words = wordsManager.getAllWords()
                this.highlightWords(words)
        }

        /**
         * 检查是否激活
         */
        isEnabled(): boolean {
                return this.isActive
        }
}

// 单例模式
let globalHighlighter: Highlighter | null = null

export function getHighlighter(): Highlighter {
        if (!globalHighlighter) {
                globalHighlighter = new Highlighter()
        }
        return globalHighlighter
}

export function destroyHighlighter(): void {
        if (globalHighlighter) {
                globalHighlighter.stop()
                globalHighlighter = null
        }
}
