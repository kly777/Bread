/**
 * AI功能工具函数
 * 提供网页内容提取、处理和分析功能
 */

/**
 * 获取视口附近的内容
 * @param maxTokens 最大token数量限制
 * @returns 提取的文本内容
 */
export function getViewportContent(maxTokens = 4000): string {
        // 获取当前视口内的元素
        const viewportHeight = window.innerHeight
        const scrollTop = window.scrollY
        const viewportRect = {
                top: scrollTop,
                bottom: scrollTop + viewportHeight,
        }

        // 收集视口内的文本内容
        let content = ''
        const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                        acceptNode: (node) => {
                                // 过滤扩展自己的元素
                                if (isExtensionElement(node.parentElement)) {
                                        return NodeFilter.FILTER_REJECT
                                }

                                // 检查节点是否在视口内
                                const rect =
                                        node.parentElement?.getBoundingClientRect()
                                if (!rect) return NodeFilter.FILTER_REJECT

                                const nodeTop = rect.top + scrollTop
                                const nodeBottom = rect.bottom + scrollTop

                                // 检查是否与视口重叠
                                if (
                                        nodeBottom < viewportRect.top ||
                                        nodeTop > viewportRect.bottom
                                ) {
                                        return NodeFilter.FILTER_REJECT
                                }

                                return NodeFilter.FILTER_ACCEPT
                        },
                }
        )

        let node: Node | null
        let currentTokens = 0

        while ((node = walker.nextNode()) && currentTokens < maxTokens) {
                const text = node.textContent?.trim()
                if (text && text.length > 0) {
                        content += text + '\n'
                        currentTokens += estimateTokens(text)
                }
        }

        return content
}

/**
 * 获取整个页面的内容（智能截取）
 * @param maxTokens 最大token数量限制
 * @returns 提取的文本内容
 */
export function getPageContent(maxTokens = 8000): string {
        // 优先获取视口内容
        const viewportContent = getViewportContent(maxTokens)

        // 如果视口内容已经足够，直接返回
        if (estimateTokens(viewportContent) >= maxTokens * 0.7) {
                return viewportContent
        }

        // 否则获取更多内容
        let content = viewportContent
        let currentTokens = estimateTokens(content)

        // 从主要内容区域获取更多文本
        const mainContentSelectors = [
                'main',
                'article',
                '.content',
                '#content',
                '.main-content',
                '.post-content',
                '.article-content',
        ]

        for (const selector of mainContentSelectors) {
                const elements = document.querySelectorAll(selector)
                for (const element of elements) {
                        if (currentTokens >= maxTokens) break

                        const elementText = extractTextFromElement(
                                element,
                                maxTokens - currentTokens
                        )
                        if (elementText) {
                                content += '\n' + elementText
                                currentTokens += estimateTokens(elementText)
                        }
                }

                if (currentTokens >= maxTokens) break
        }

        return content
}

/**
 * 从元素中提取文本
 * @param element DOM元素
 * @param maxTokens 最大token数量限制
 * @returns 提取的文本
 */
export function extractTextFromElement(
        element: Element,
        maxTokens = 2000
): string {
        let content = ''
        let currentTokens = 0

        const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                {
                        acceptNode: (node) => {
                                // 过滤扩展自己的元素
                                if (isExtensionElement(node.parentElement)) {
                                        return NodeFilter.FILTER_REJECT
                                }

                                // 过滤隐藏元素
                                if (
                                        node.parentElement &&
                                        isElementHidden(node.parentElement)
                                ) {
                                        return NodeFilter.FILTER_REJECT
                                }

                                return NodeFilter.FILTER_ACCEPT
                        },
                }
        )

        let node: Node | null
        while ((node = walker.nextNode()) && currentTokens < maxTokens) {
                const text = node.textContent?.trim()
                if (text && text.length > 0) {
                        content += text + '\n'
                        currentTokens += estimateTokens(text)
                }
        }

        return content
}

/**
 * 检查是否为扩展元素
 * @param element DOM元素
 * @returns 是否为扩展元素
 */
export function isExtensionElement(element: Element | null): boolean {
        if (!element) return false

        // 检查类名
        const classList = element.classList
        return (
                classList.contains('translation-result') ||
                classList.contains('bread-highlight') ||
                classList.contains('bread-translation') ||
                classList.contains('bread-ai-highlight') ||
                classList.contains('bread-ai-element')
        )
}

/**
 * 检查元素是否隐藏
 * @param element DOM元素
 * @returns 是否隐藏
 */
export function isElementHidden(element: Element): boolean {
        const style = window.getComputedStyle(element)
        return style.display === 'none' || style.visibility === 'hidden'
}

/**
 * 估算文本的token数量
 * @param text 文本内容
 * @returns 估算的token数量
 */
export function estimateTokens(text: string): number {
        // 简单估算：英文大约1个token=4个字符，中文大约1个token=2个字符
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
        const otherChars = text.length - chineseChars
        return Math.ceil(chineseChars / 2 + otherChars / 4)
}

/**
 * 高亮选中的文本
 * @returns 是否成功高亮
 */
export function highlightSelectedText(): boolean {
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed) {
                return false
        }

        const range = selection.getRangeAt(0)
        const selectedText = selection.toString().trim()

        if (selectedText.length === 0) {
                return false
        }

        // 创建高亮标记
        const span = document.createElement('span')
        span.className = 'bread-ai-highlight'
        span.style.cssText = `
        background-color: #fef3c7;
        padding: 2px 4px;
        border-radius: 3px;
        border: 1px solid #f59e0b;
        color: inherit;
        font: inherit;
    `
        span.textContent = selectedText

        // 替换选中的文本
        range.deleteContents()
        range.insertNode(span)

        // 清除选择
        selection.removeAllRanges()

        return true
}

/**
 * 移除所有AI高亮标记
 */
export function removeAllAIHighlights(): void {
        const highlights = document.querySelectorAll('.bread-ai-highlight')
        highlights.forEach((highlight) => {
                const parent = highlight.parentNode
                if (parent) {
                        parent.replaceChild(
                                document.createTextNode(
                                        highlight.textContent || ''
                                ),
                                highlight
                        )
                }
        })
}

/**
 * 获取页面结构化信息
 * @returns 页面结构化信息
 */
export function getPageStructure(): {
        title: string
        url: string
        description: string
        mainContentLength: number
} {
        const title = document.title || ''
        const url = window.location.href || ''

        // 获取页面描述
        let description = ''
        const metaDescription = document.querySelector(
                'meta[name="description"]'
        )
        if (metaDescription) {
                description = metaDescription.getAttribute('content') || ''
        }

        // 估算主要内容长度
        const mainContent = getViewportContent(2000)
        const mainContentLength = estimateTokens(mainContent)

        return {
                title,
                url,
                description,
                mainContentLength,
        }
}

/**
 * 清理HTML内容，移除不必要的标签和属性
 * @param html HTML字符串
 * @returns 清理后的文本
 */
export function cleanHtmlContent(html: string): string {
        // 创建一个临时div来解析HTML
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = html

        // 移除脚本、样式等不需要的标签
        const unwantedTags = [
                'script',
                'style',
                'noscript',
                'iframe',
                'object',
                'embed',
        ]
        unwantedTags.forEach((tag) => {
                const elements = tempDiv.querySelectorAll(tag)
                elements.forEach((el) => el.remove())
        })

        // 移除扩展自己的元素
        const extensionElements = tempDiv.querySelectorAll(
                '.translation-result, .bread-highlight, .bread-translation, .bread-ai-highlight'
        )
        extensionElements.forEach((el) => el.remove())

        // 获取文本内容
        return tempDiv.textContent?.trim() || ''
}
