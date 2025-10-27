/**
 * 高亮词管理器
 * 统一管理所有要高亮的词，包括持久高亮和搜索关键词
 */

export interface HighlightWord {
        text: string
        colorIndex: number
        source: 'persistent' | 'search' // 来源：持久高亮或搜索关键词
}

export type WordsUpdateCallback = (words: HighlightWord[]) => void

class WordsManager {
        private persistentWords: string[] = []
        private searchWords: string[] = []
        private callbacks: WordsUpdateCallback[] = []

        /**
         * 更新持久高亮词
         */
        updatePersistentWords(words: string[]): void {
                this.persistentWords = words
                this.notifyCallbacks()
        }

        /**
         * 更新搜索关键词
         */
        updateSearchWords(words: string[]): void {
                this.searchWords = words
                this.notifyCallbacks()
        }

        /**
         * 获取所有要高亮的词
         */
        getAllWords(): HighlightWord[] {
                const words: HighlightWord[] = []

                // 持久高亮词使用颜色索引 0-4
                this.persistentWords.forEach((word, index) => {
                        words.push({
                                text: word,
                                colorIndex: index % 5,
                                source: 'persistent',
                        })
                })

                // 搜索关键词使用颜色索引 5-9
                this.searchWords.forEach((word, index) => {
                        words.push({
                                text: word,
                                colorIndex: (index % 5) + 5,
                                source: 'search',
                        })
                })

                return words
        }

        /**
         * 注册词更新回调
         */
        onWordsUpdate(callback: WordsUpdateCallback): void {
                this.callbacks.push(callback)
        }

        /**
         * 取消注册词更新回调
         */
        offWordsUpdate(callback: WordsUpdateCallback): void {
                const index = this.callbacks.indexOf(callback)
                if (index > -1) {
                        this.callbacks.splice(index, 1)
                }
        }

        /**
         * 通知所有回调
         */
        private notifyCallbacks(): void {
                const words = this.getAllWords()
                this.callbacks.forEach((callback) => {
                        try {
                                callback(words)
                        } catch (error) {
                                console.error(
                                        'Words update callback error:',
                                        error
                                )
                        }
                })
        }
}

// 单例模式
let globalWordsManager: WordsManager | null = null

export function getWordsManager(): WordsManager {
        if (!globalWordsManager) {
                globalWordsManager = new WordsManager()
        }
        return globalWordsManager
}

export function destroyWordsManager(): void {
        globalWordsManager = null
}
