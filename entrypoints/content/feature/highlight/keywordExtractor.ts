/**
 * 搜索引擎配置接口
 * 定义搜索引擎的名称、关键词参数和URL模式
 */
export interface SearchEngineConfig {
        name: string          // 搜索引擎名称
        keywordParam: string  // URL中表示关键词的参数名
        urlPattern: string    // 用于匹配搜索引擎的URL模式
}

/**
 * 关键词来源接口
 * 描述关键词的来源和可信度
 */
export interface KeywordSource {
        type: 'search_engine' | 'referer' | 'input_box' | 'history' | 'inherited' // 来源类型
        keywords: string[]   // 关键词列表
        confidence: number   // 可信度分数 (0-1)
}

/**
 * 关键词提取器
 * 负责从搜索引擎URL、页面元素等自动提取搜索关键词
 */
export class KeywordExtractor {
        // 支持的搜索引擎配置列表
        private searchEngines: SearchEngineConfig[] = [
                { name: 'Google', keywordParam: 'q', urlPattern: '.google.' },
                { name: 'Yahoo', keywordParam: 'p', urlPattern: 'search.yahoo.' },
                { name: 'Baidu', keywordParam: 'wd', urlPattern: '.baidu.com' },
                { name: 'Baidu', keywordParam: 'word', urlPattern: '.baidu.com' },
                { name: 'Bing', keywordParam: 'q', urlPattern: '.bing.com' },
                { name: 'DuckDuckGo', keywordParam: 'q', urlPattern: 'duckduckgo.com' },
                { name: 'Sogou', keywordParam: 'query', urlPattern: 'www.sogou.com' },
                { name: 'Weibo', keywordParam: 'q', urlPattern: 's.weibo.com' },
                { name: '360', keywordParam: 'q', urlPattern: '.so.com' },
                { name: 'Yandex', keywordParam: 'text', urlPattern: 'yandex.com' },
                { name: 'Common1', keywordParam: 'search_query', urlPattern: '' }, // 通用搜索引擎参数
                { name: 'Common2', keywordParam: 'keyword', urlPattern: '' }       // 通用搜索引擎参数
        ]

        // 搜索框选择器列表，用于识别页面中的搜索输入框
        private inputSelectors = [
                '#query', '#search', '#keyword', '#script_q', '#search-q', '.input'
        ]

        /**
         * 从多个来源提取关键词
         * 按可信度排序返回关键词来源列表
         * @returns 排序后的关键词来源数组
         */
        extractKeywords(): KeywordSource[] {
                const sources: KeywordSource[] = []

                // 1. 从当前页面的搜索引擎URL提取（可信度最高）
                const searchEngineKeywords = this.extractFromSearchEngine()
                if (searchEngineKeywords.length > 0) {
                        sources.push({
                                type: 'search_engine',
                                keywords: searchEngineKeywords,
                                confidence: 0.9
                        })
                }

                // 2. 从引用页面（referer）的搜索引擎URL提取
                const refererKeywords = this.extractFromReferer()
                if (refererKeywords.length > 0) {
                        sources.push({
                                type: 'referer',
                                keywords: refererKeywords,
                                confidence: 0.7
                        })
                }

                // 3. 从页面中的输入框提取
                const inputBoxKeywords = this.extractFromInputBoxes()
                if (inputBoxKeywords.length > 0) {
                        sources.push({
                                type: 'input_box',
                                keywords: inputBoxKeywords,
                                confidence: 0.6
                        })
                }

                // 4. 从继承的关键词提取（通过window.name传递）
                const inheritedKeywords = this.extractFromInherited()
                if (inheritedKeywords.length > 0) {
                        sources.push({
                                type: 'inherited',
                                keywords: inheritedKeywords,
                                confidence: 0.8
                        })
                }

                // 按可信度降序排序
                return sources.sort((a, b) => b.confidence - a.confidence)
        }

        private extractFromSearchEngine(): string[] {
                const currentUrl = window.location.href
                const host = window.location.host

                for (const engine of this.searchEngines) {
                        if (engine.urlPattern && host.includes(engine.urlPattern)) {
                                const keywords = this.getKeywordsFromUrl(currentUrl, engine.keywordParam)
                                if (keywords.length > 0) {
                                        return keywords
                                }
                        }
                }
                return []
        }

        private extractFromReferer(): string[] {
                const referer = document.referrer
                if (!referer) return []

                const host = new URL(referer).host

                for (const engine of this.searchEngines) {
                        if (engine.urlPattern && host.includes(engine.urlPattern)) {
                                const keywords = this.getKeywordsFromUrl(referer, engine.keywordParam)
                                if (keywords.length > 0) {
                                        return keywords
                                }
                        }
                }
                return []
        }

        private extractFromInputBoxes(): string[] {
                for (const selector of this.inputSelectors) {
                        const input = document.querySelector(selector) as HTMLInputElement
                        if (input && input.value && input.value.trim()) {
                                return this.processKeywords(input.value.trim())
                        }
                }
                return []
        }

        private extractFromInherited(): string[] {
                if (window.name && window.name.startsWith('bread_highlight::')) {
                        const match = window.name.match(/bread_highlight::(.+)/)
                        if (match && match[1]) {
                                try {
                                        const decoded = decodeURIComponent(match[1])
                                        return this.processKeywords(decoded)
                                } catch {
                                        return []
                                }
                        }
                }
                return []
        }

        private getKeywordsFromUrl(url: string, param: string): string[] {
                try {
                        const urlObj = new URL(url)
                        const keywordStr = urlObj.searchParams.get(param)
                        if (keywordStr) {
                                return this.processKeywords(keywordStr)
                        }
                } catch {
                        return []
                }
                return []
        }

        private processKeywords(keywordStr: string): string[] {
                let processed = keywordStr
                        .replace(/\+/g, ' ')
                        .trim()

                try {
                        processed = decodeURIComponent(processed)
                } catch {
                }

                const keywords = this.splitKeywords(processed)
                return this.filterKeywords(keywords)
        }

        private splitKeywords(text: string): string[] {
                const keywords: string[] = []

                const segments = text.split(/[\s,，、;；]+/)
                for (const segment of segments) {
                        if (segment.trim()) {
                                keywords.push(segment.trim())
                        }
                }

                return keywords
        }

        private filterKeywords(keywords: string[]): string[] {
                const skipWords = new Set([
                        'the', 'to', 'in', 'on', 'among', 'between', 'and', 'a', 'an', 'of', 'by', 'with'
                ])

                return keywords.filter(keyword => {
                        if (keyword.length <= 1) return false
                        if (skipWords.has(keyword.toLowerCase()) && keyword === keyword.toLowerCase()) {
                                return false
                        }
                        return true
                })
        }

        setWindowKeywords(keywords: string[]) {
                if (keywords.length > 0) {
                        const encoded = encodeURIComponent(keywords.join(' '))
                        window.name = `bread_highlight::${encoded}`
                }
        }
}