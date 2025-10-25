import {
        HighlightWord,
        HighlightConfig,
        getHighlightStyle,
} from './highlightConfig'
import { getTextWalker } from '../../kit/getTextNodes'

/**
 * 高亮匹配结果接口
 */
interface HighlightMatch {
        word: HighlightWord // 匹配到的高亮词
        matches: Node[] // 匹配到的DOM节点列表
}

/**
 * 高亮引擎核心类
 * 负责执行文本高亮操作，包括样式注入、文本匹配、DOM操作等
 */
export class HighlightEngine {
        private config: HighlightConfig // 高亮配置
        private styleElement: HTMLStyleElement | null = null // 样式元素引用

        /**
         * 构造函数
         * @param config 高亮配置
         */
        constructor(config: HighlightConfig) {
                this.config = config
                this.injectStyles() // 初始化时注入样式
        }

        /**
         * 更新配置
         * @param config 新的高亮配置
         */
        updateConfig(config: HighlightConfig) {
                this.config = config
                this.injectStyles() // 配置更新时重新注入样式
        }

        /**
         * 注入高亮样式到页面
         * 创建style元素并添加到文档头部
         */
        private injectStyles() {
                // 移除已存在的样式元素
                if (this.styleElement) {
                        this.styleElement.remove()
                }

                // 创建新的样式元素
                this.styleElement = document.createElement('style')
                this.styleElement.id = 'bread-highlight-styles'
                this.styleElement.textContent =
                        getHighlightStyle(this.config.colorScheme) +
                        `
            .bread-highlight {
                display: inline !important;        // 确保内联显示
                margin: 0 !important;              // 无外边距
                padding: 0 1px !important;         // 轻微内边距
                font: inherit !important;          // 继承字体
                color: black !important;           // 文字颜色
                text-decoration: none !important;  // 无下划线
            }
            .bread-highlight-indicator {
                background: rgba(29,163,63,.3);    // 半透明绿色背景
                position: absolute;                // 绝对定位
                z-index: 99999;                    // 最高层级
                width: 100%;                       // 全宽
                min-height: 10px;                  // 最小高度
                animation: bread-fade 3s forwards; // 3秒淡出动画
            }
            @keyframes bread-fade {
                from { opacity: 1; }  // 从完全可见开始
                to { opacity: 0; }    // 到完全透明结束
            }
        `

                // 确保样式正确注入到文档中
                try {
                        if (document.head) {
                                document.head.appendChild(this.styleElement)
                        } else {
                                // 如果head不存在，尝试添加到body
                                document.documentElement.appendChild(
                                        this.styleElement
                                )
                        }
                        console.log('Highlighter styles injected successfully')
                } catch (error) {
                        console.error(
                                'Failed to inject highlighter styles:',
                                error
                        )
                }
        }

        /**
         * 高亮整个文档
         * 遍历所有启用的高亮词并应用到文档
         * @returns 高亮匹配结果数组
         */
        highlightDocument(): HighlightMatch[] {
                // 过滤出启用的高亮词
                const enabledWords = this.config.words.filter(
                        (word) => word.enabled
                )
                console.log('Enabled words:', enabledWords)

                // 如果配置了按长度排序，则从长到短排序（避免短词覆盖长词）
                if (this.config.sortByLength) {
                        enabledWords.sort(
                                (a, b) => b.text.length - a.text.length
                        )
                }

                const results: HighlightMatch[] = []

                // 遍历每个高亮词进行匹配
                for (const word of enabledWords) {
                        const matches = this.highlightWord(word)
                        console.log(
                                `Highlighted ${matches.length} occurrences of "${word.text}"`
                        )
                        if (matches.length > 0) {
                                results.push({ word, matches }) // 记录匹配结果
                        }
                }
                console.log('Highlighted', results.length, 'words')
                return results
        }

        /**
         * 高亮单个词
         * 使用TreeWalker遍历文档查找匹配的文本节点
         * @param word 要高亮的词
         * @returns 高亮后的节点数组
         */
        private highlightWord(word: HighlightWord): Node[] {
                // 创建文本节点遍历器
                const walker = getTextWalker(document.body, {
                        excludeHidden: true, // 排除隐藏元素
                        minContentLength: 1, // 最小内容长度
                })

                const matches: Node[] = []
                const regex = this.createRegex(word) // 创建匹配正则

                // 遍历所有文本节点
                while (walker.nextNode()) {
                        const node = walker.currentNode as Text
                        console.log('Checking node text:', node.textContent)
                        const text = node.textContent || ''

                        // 测试文本是否匹配正则
                        if (regex.test(text)) {
                                const highlightedNodes = this.highlightTextNode(
                                        node,
                                        word,
                                        regex
                                )
                                matches.push(...highlightedNodes) // 收集高亮节点
                        }
                }

                return matches
        }

        /**
         * 创建正则表达式
         * 根据高亮词配置生成匹配正则
         * @param word 高亮词配置
         * @returns 正则表达式对象
         */
        private createRegex(word: HighlightWord): RegExp {
                let pattern = word.regex
                        ? word.text
                        : this.escapeRegex(word.text) // 正则模式直接使用，普通模式转义

                const flags = 'g' + (word.caseSensitive ? '' : 'i') // 全局匹配，可选忽略大小写
                return new RegExp(pattern, flags)
        }

        /**
         * 转义正则表达式特殊字符
         * 将普通文本转换为正则表达式安全的形式
         * @param text 原始文本
         * @returns 转义后的正则安全文本
         */
        private escapeRegex(text: string): string {
                return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // 转义所有正则特殊字符
        }

        /**
         * 高亮文本节点
         * 将匹配的文本替换为高亮mark元素
         * @param node 文本节点
         * @param word 高亮词
         * @param regex 匹配正则
         * @returns 创建的高亮元素数组
         */
        private highlightTextNode(
                node: Text,
                word: HighlightWord,
                regex: RegExp
        ): Node[] {
                const text = node.textContent || ''
                const parent = node.parentNode
                if (!parent) return [] // 如果没有父节点，无法操作

                const matches: Node[] = []
                let lastIndex = 0 // 上次匹配结束位置
                let match: RegExpExecArray | null

                const fragment = document.createDocumentFragment() // 创建文档片段

                // 遍历所有匹配项
                while ((match = regex.exec(text)) !== null) {
                        const before = text.substring(lastIndex, match.index) // 匹配前的文本
                        if (before) {
                                fragment.appendChild(
                                        document.createTextNode(before)
                                ) // 添加普通文本节点
                        }

                        // 创建高亮mark元素
                        const mark = document.createElement('mark')
                        mark.className = `bread-highlight bread-highlight-color-${word.colorIndex}`
                        mark.textContent = match[0]
                        fragment.appendChild(mark)
                        matches.push(mark) // 记录高亮元素

                        lastIndex = match.index + match[0].length // 更新最后匹配位置
                }

                const after = text.substring(lastIndex) // 剩余文本
                if (after) {
                        fragment.appendChild(document.createTextNode(after)) // 添加剩余文本
                }

                parent.replaceChild(fragment, node) // 用片段替换原始节点
                return matches
        }

        removeHighlights() {
                const highlights = document.querySelectorAll('.bread-highlight')
                highlights.forEach((highlight) => {
                        const parent = highlight.parentNode
                        if (parent) {
                                const text = document.createTextNode(
                                        highlight.textContent || ''
                                )
                                parent.replaceChild(text, highlight)
                                parent.normalize()
                        }
                })
        }

        navigateToHighlight(
                matches: Node[],
                direction: 'next' | 'prev' = 'next'
        ) {
                if (matches.length === 0) return null

                const viewport = this.getViewportRect()
                let target: Node | null = null
                let minDistance = Infinity

                for (const match of matches) {
                        if (!(match instanceof HTMLElement)) continue

                        const rect = match.getBoundingClientRect()
                        if (rect.width === 0 || rect.height === 0) continue

                        const distance = this.calculateDistance(
                                rect,
                                viewport,
                                direction
                        )

                        if (distance < minDistance) {
                                minDistance = distance
                                target = match
                        }
                }

                if (target) {
                        this.scrollToElement(target as HTMLElement)
                        this.showIndicator(target as HTMLElement)
                        return target
                }

                return null
        }

        private getViewportRect(): DOMRect {
                return new DOMRect(
                        window.scrollX,
                        window.scrollY,
                        window.innerWidth,
                        window.innerHeight
                )
        }

        private calculateDistance(
                rect: DOMRect,
                viewport: DOMRect,
                direction: 'next' | 'prev'
        ): number {
                const elementCenterY = rect.top + rect.height / 2
                const viewportCenterY = viewport.top + viewport.height / 2

                if (direction === 'next') {
                        if (rect.top > viewport.bottom) {
                                return rect.top - viewport.bottom
                        } else if (rect.bottom < viewport.top) {
                                return viewport.top - rect.bottom
                        } else {
                                return Math.abs(
                                        elementCenterY - viewportCenterY
                                )
                        }
                } else {
                        if (rect.bottom < viewport.top) {
                                return viewport.top - rect.bottom
                        } else if (rect.top > viewport.bottom) {
                                return rect.top - viewport.bottom
                        } else {
                                return Math.abs(
                                        elementCenterY - viewportCenterY
                                )
                        }
                }
        }

        private scrollToElement(element: HTMLElement) {
                const rect = element.getBoundingClientRect()
                const scrollY =
                        window.scrollY + rect.top - window.innerHeight / 3
                window.scrollTo({ top: scrollY, behavior: 'smooth' })
        }

        private showIndicator(element: HTMLElement) {
                if (!this.config.showIndicator) return

                const rect = element.getBoundingClientRect()
                const indicator = document.createElement('div')
                indicator.className = 'bread-highlight-indicator'
                indicator.style.top = `${window.scrollY + rect.top}px`
                indicator.style.height = `${rect.height}px`

                document.body.appendChild(indicator)

                window.setTimeout(() => {
                        indicator.remove()
                }, 3000)
        }

        destroy() {
                this.removeHighlights()
                if (this.styleElement) {
                        this.styleElement.remove()
                        this.styleElement = null
                }
        }
}
