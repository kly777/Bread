/**
 * 高亮词管理器
 * 统一管理所有要高亮的词，包括持久高亮和搜索关键词
 */

export interface HighlightWord {
        text: string
        enabled: boolean
        colorIndex: number
        caseSensitive: boolean
        regex: boolean
        source: 'persistent' | 'search' // 来源：持久高亮或搜索关键词
}

export type WordsUpdateCallback = (words: HighlightWord[]) => void

class WordsManager {
        private persistentWords: HighlightWord[] = []
        private searchWords: HighlightWord[] = []
        private callbacks: WordsUpdateCallback[] = []

        /**
         * 更新持久高亮词
         */
        updatePersistentWords(words: string[]): void {
                this.persistentWords = words.map((word, index) => ({
                        text: word,
                        colorIndex: index % 5,
                        enabled: true,
                        caseSensitive: false,
                        regex: false,
                        source: 'persistent',
                }))
                this.notifyCallbacks()
        }

        /**
         * 更新搜索关键词
         */
        updateSearchWords(words: string[]): void {
                this.searchWords = words.map((word, index) => ({
                        text: word,
                        colorIndex: (index % 5) + 5,
                        enabled: true,
                        caseSensitive: false,
                        regex: false,
                        source: 'search',
                }))
                this.notifyCallbacks()
        }

        /**
         * 添加高亮词
         */
        addWords(words: HighlightWord[]): void {
                for (const newWord of words) {
                        // 检查是否已存在
                        const existingWord = this.getAllWords().find(
                                (w) => w.text === newWord.text
                        )
                        if (!existingWord) {
                                // 添加到持久高亮词
                                this.persistentWords.push({
                                        ...newWord,
                                        source: 'persistent',
                                })
                        }
                }
                this.notifyCallbacks()
        }

        /**
         * 移除高亮词
         */
        removeWord(text: string): void {
                this.persistentWords = this.persistentWords.filter(
                        (w) => w.text !== text
                )
                this.notifyCallbacks()
        }

        /**
         * 切换高亮词状态
         */
        toggleWord(text: string, enabled?: boolean): void {
                const word = this.getAllWords().find((w) => w.text === text)
                if (word) {
                        word.enabled =
                                enabled !== undefined ? enabled : !word.enabled
                        this.notifyCallbacks()
                }
        }

        /**
         * 更新高亮词
         */
        updateWord(word: HighlightWord): void {
                const index = this.persistentWords.findIndex(
                        (w) => w.text === word.text
                )
                if (index >= 0) {
                        this.persistentWords[index] = word
                        this.notifyCallbacks()
                }
        }

        /**
         * 获取所有要高亮的词
         */
        getAllWords(): HighlightWord[] {
                return [...this.persistentWords, ...this.searchWords]
        }

        /**
         * 获取启用的高亮词
         */
        getEnabledWords(): string[] {
                return this.getAllWords()
                        .filter((word) => word.enabled)
                        .map((word) => word.text)
        }

        /**
         * 获取高亮词统计
         */
        getWordStats(
                text: string
        ): { count: number; word: HighlightWord } | null {
                const word = this.getAllWords().find((w) => w.text === text)
                if (word) {
                        return {
                                count: 1, // 简化计数
                                word,
                        }
                }
                return null
        }

        /**
         * 获取所有高亮词统计
         */
        getAllStats(): {
                [text: string]: { count: number; word: HighlightWord }
        } {
                const stats: {
                        [text: string]: { count: number; word: HighlightWord }
                } = {}

                for (const word of this.getAllWords()) {
                        if (word.enabled) {
                                stats[word.text] = {
                                        count: 1, // 简化计数
                                        word,
                                }
                        }
                }

                return stats
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
