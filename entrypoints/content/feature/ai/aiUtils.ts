/**
 * AI功能工具函数
 * 提供网页内容提取、处理和分析功能
 */

/**
 * 检查元素是否可见
 */
function isElementVisible(element: Element): boolean {
        const style = window.getComputedStyle(element)
        if (
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                style.opacity === '0'
        ) {
                return false
        }

        const rect = element.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) {
                return false
        }

        // 检查是否在视口内
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        return (
                rect.top < viewportHeight &&
                rect.bottom > 0 &&
                rect.left < viewportWidth &&
                rect.right > 0
        )
}

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
 * 获取高质量的页面内容，用于AI对话
 * 智能提取可见、有意义的文本内容，先获取可见元素，不足时扩展相邻节点
 * @param maxTokens 最大token数量限制
 * @returns 提取的文本内容
 */
export function getChatPageContent(maxTokens = 2000): string {
        // 1. 获取所有可见的文本节点
        const visibleTextNodes = collectVisibleTextNodes()

        // 2. 按DOM顺序排序，保持内容连贯性
        const sortedNodes = sortNodesByDOMOrder(visibleTextNodes)

        // 3. 从中心（视口中心）开始收集内容
        const centerIndex = findViewportCenterIndex(sortedNodes)
        const collectedContent = collectContentFromCenter(
                sortedNodes,
                centerIndex,
                maxTokens
        )

        // 4. 如果内容不足，扩展收集范围
        let finalContent = collectedContent.content
        let collectedTokens = collectedContent.tokens

        if (collectedTokens < maxTokens * 0.7) {
                // 扩展收集相邻节点
                const expandedContent = expandContentCollection(
                        sortedNodes,
                        collectedContent.startIndex,
                        collectedContent.endIndex,
                        maxTokens - collectedTokens
                )
                finalContent += '\n\n' + expandedContent.content
                collectedTokens += expandedContent.tokens
        }

        // 5. 清理和格式化最终内容
        return cleanAndFormatContent(finalContent, maxTokens)
}

/**
 * 收集所有可见的文本节点
 */
function collectVisibleTextNodes(): Array<{
        node: Node
        element: Element
        rect: DOMRect
}> {
        const textNodes: Array<{
                node: Node
                element: Element
                rect: DOMRect
        }> = []

        // 创建TreeWalker遍历所有文本节点
        const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                        acceptNode: (node) => {
                                const parentElement = node.parentElement
                                if (!parentElement) {
                                        return NodeFilter.FILTER_REJECT
                                }

                                // 排除脚本、样式等元素
                                const tagName =
                                        parentElement.tagName.toLowerCase()
                                if (
                                        [
                                                'script',
                                                'style',
                                                'noscript',
                                                'iframe',
                                                'object',
                                                'embed',
                                                'svg',
                                                'canvas',
                                        ].includes(tagName)
                                ) {
                                        return NodeFilter.FILTER_REJECT
                                }

                                // 排除扩展自己的元素
                                if (isExtensionElement(parentElement)) {
                                        return NodeFilter.FILTER_REJECT
                                }

                                // 检查元素是否可见
                                if (!isElementVisible(parentElement)) {
                                        return NodeFilter.FILTER_REJECT
                                }

                                // 检查文本是否有意义
                                const text = node.textContent?.trim()
                                if (!text || text.length < 3) {
                                        return NodeFilter.FILTER_REJECT
                                }

                                // 过滤掉只有符号或数字的文本
                                const meaningfulText = text
                                        .replace(/[^\p{L}\p{N}\s]/gu, '')
                                        .trim()
                                if (meaningfulText.length < 3) {
                                        return NodeFilter.FILTER_REJECT
                                }

                                return NodeFilter.FILTER_ACCEPT
                        },
                }
        )

        let node: Node | null
        while ((node = walker.nextNode())) {
                const parentElement = node.parentElement!
                const rect = parentElement.getBoundingClientRect()
                textNodes.push({ node, element: parentElement, rect })
        }

        return textNodes
}

/**
 * 按DOM顺序对节点进行排序
 */
function sortNodesByDOMOrder(
        nodes: Array<{ node: Node; element: Element; rect: DOMRect }>
): Array<{ node: Node; element: Element; rect: DOMRect }> {
        return nodes.sort((a, b) => {
                // 比较DOM位置
                const position = a.element.compareDocumentPosition(b.element)

                if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
                        return -1 // a在b之前
                } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
                        return 1 // a在b之后
                }

                // 如果无法比较DOM位置，按坐标排序
                if (a.rect.top !== b.rect.top) {
                        return a.rect.top - b.rect.top
                }
                return a.rect.left - b.rect.left
        })
}

/**
 * 找到视口中心的节点索引
 */
function findViewportCenterIndex(
        nodes: Array<{ node: Node; element: Element; rect: DOMRect }>
): number {
        const viewportCenterY = window.innerHeight / 2
        const viewportCenterX = window.innerWidth / 2

        let closestIndex = 0
        let minDistance = Infinity

        for (let i = 0; i < nodes.length; i++) {
                const rect = nodes[i].rect
                const centerY = rect.top + rect.height / 2
                const centerX = rect.left + rect.width / 2

                // 计算到视口中心的距离
                const distance = Math.sqrt(
                        Math.pow(centerX - viewportCenterX, 2) +
                                Math.pow(centerY - viewportCenterY, 2)
                )

                if (distance < minDistance) {
                        minDistance = distance
                        closestIndex = i
                }
        }

        return closestIndex
}

/**
 * 从中心开始收集内容
 */
function collectContentFromCenter(
        nodes: Array<{ node: Node; element: Element; rect: DOMRect }>,
        centerIndex: number,
        maxTokens: number
): { content: string; tokens: number; startIndex: number; endIndex: number } {
        let content = ''
        let tokens = 0
        let startIndex = centerIndex
        let endIndex = centerIndex

        // 先添加中心节点
        const centerNode = nodes[centerIndex]
        const centerText = centerNode.node.textContent?.trim() || ''
        if (centerText) {
                const cleanedText = cleanTextForAI(centerText)
                const textTokens = estimateTokens(cleanedText)

                if (textTokens <= maxTokens) {
                        content = cleanedText
                        tokens = textTokens
                }
        }

        // 向两边扩展，直到达到token限制或没有更多节点
        while (tokens < maxTokens) {
                let expanded = false

                // 尝试向前扩展（DOM顺序更早的节点）
                if (startIndex > 0) {
                        const prevIndex = startIndex - 1
                        const prevNode = nodes[prevIndex]
                        const prevText = prevNode.node.textContent?.trim() || ''

                        if (prevText) {
                                const cleanedText = cleanTextForAI(prevText)
                                const textTokens = estimateTokens(cleanedText)

                                if (tokens + textTokens <= maxTokens) {
                                        content = cleanedText + '\n\n' + content
                                        tokens += textTokens
                                        startIndex = prevIndex
                                        expanded = true
                                }
                        }
                }

                // 尝试向后扩展（DOM顺序更晚的节点）
                if (endIndex < nodes.length - 1) {
                        const nextIndex = endIndex + 1
                        const nextNode = nodes[nextIndex]
                        const nextText = nextNode.node.textContent?.trim() || ''

                        if (nextText) {
                                const cleanedText = cleanTextForAI(nextText)
                                const textTokens = estimateTokens(cleanedText)

                                if (tokens + textTokens <= maxTokens) {
                                        content = content + '\n\n' + cleanedText
                                        tokens += textTokens
                                        endIndex = nextIndex
                                        expanded = true
                                }
                        }
                }

                // 如果两边都无法扩展，退出循环
                if (!expanded) {
                        break
                }
        }

        return { content, tokens, startIndex, endIndex }
}

/**
 * 扩展内容收集范围
 */
function expandContentCollection(
        nodes: Array<{ node: Node; element: Element; rect: DOMRect }>,
        startIndex: number,
        endIndex: number,
        remainingTokens: number
): { content: string; tokens: number } {
        let content = ''
        let tokens = 0

        // 继续向两边扩展，但优先级较低
        let leftIndex = startIndex - 1
        let rightIndex = endIndex + 1

        while (
                tokens < remainingTokens &&
                (leftIndex >= 0 || rightIndex < nodes.length)
        ) {
                // 交替从两边扩展，保持内容平衡
                if (leftIndex >= 0) {
                        const leftNode = nodes[leftIndex]
                        const leftText = leftNode.node.textContent?.trim() || ''

                        if (leftText) {
                                const cleanedText = cleanTextForAI(leftText)
                                const textTokens = estimateTokens(cleanedText)

                                if (tokens + textTokens <= remainingTokens) {
                                        content = cleanedText + '\n\n' + content
                                        tokens += textTokens
                                        leftIndex--
                                } else {
                                        // 如果token不够，尝试截断
                                        const truncatedText =
                                                truncateTextByTokens(
                                                        cleanedText,
                                                        remainingTokens - tokens
                                                )
                                        if (truncatedText) {
                                                content =
                                                        truncatedText +
                                                        '\n\n' +
                                                        content
                                                tokens +=
                                                        estimateTokens(
                                                                truncatedText
                                                        )
                                        }
                                        break
                                }
                        } else {
                                leftIndex--
                        }
                }

                if (rightIndex < nodes.length && tokens < remainingTokens) {
                        const rightNode = nodes[rightIndex]
                        const rightText =
                                rightNode.node.textContent?.trim() || ''

                        if (rightText) {
                                const cleanedText = cleanTextForAI(rightText)
                                const textTokens = estimateTokens(cleanedText)

                                if (tokens + textTokens <= remainingTokens) {
                                        content = content + '\n\n' + cleanedText
                                        tokens += textTokens
                                        rightIndex++
                                } else {
                                        // 如果token不够，尝试截断
                                        const truncatedText =
                                                truncateTextByTokens(
                                                        cleanedText,
                                                        remainingTokens - tokens
                                                )
                                        if (truncatedText) {
                                                content =
                                                        content +
                                                        '\n\n' +
                                                        truncatedText
                                                tokens +=
                                                        estimateTokens(
                                                                truncatedText
                                                        )
                                        }
                                        break
                                }
                        } else {
                                rightIndex++
                        }
                }
        }

        return { content, tokens }
}

/**
 * 清理和格式化最终内容
 */
function cleanAndFormatContent(content: string, maxTokens: number): string {
        // 分割成段落
        const paragraphs = content
                .split('\n\n')
                .filter((p) => p.trim().length > 0)

        // 去重
        const uniqueParagraphs = Array.from(new Set(paragraphs))

        // 确保不超过token限制
        let finalContent = ''
        let totalTokens = 0

        for (const paragraph of uniqueParagraphs) {
                const paragraphTokens = estimateTokens(paragraph)

                if (totalTokens + paragraphTokens <= maxTokens) {
                        finalContent += (finalContent ? '\n\n' : '') + paragraph
                        totalTokens += paragraphTokens
                } else {
                        // 如果超出限制，截断最后一个段落
                        const remainingTokens = maxTokens - totalTokens
                        if (remainingTokens > 10) {
                                // 至少保留10个token
                                const truncatedParagraph = truncateTextByTokens(
                                        paragraph,
                                        remainingTokens
                                )
                                if (truncatedParagraph) {
                                        finalContent +=
                                                (finalContent ? '\n\n' : '') +
                                                truncatedParagraph
                                }
                        }
                        break
                }
        }

        return finalContent.trim()
}

/**
 * 清理文本，移除不必要的字符
 */
function cleanTextForAI(text: string): string {
        // 移除多余的空格和换行
        let cleaned = text.replace(/\s+/g, ' ').trim()

        // 移除常见的无关字符
        cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '')

        // 移除重复的标点
        cleaned = cleaned.replace(/([.,!?])\1+/g, '$1')

        // 移除URL和邮箱
        cleaned = cleaned.replace(/https?:\/\/\S+/g, '')
        cleaned = cleaned.replace(/\S+@\S+\.\S+/g, '')

        return cleaned.trim()
}

/**
 * 按token数量截断文本
 */
function truncateTextByTokens(text: string, maxTokens: number): string {
        const words = text.split(/\s+/)
        let result = ''
        let currentTokens = 0

        for (const word of words) {
                const wordTokens = estimateTokens(word)
                if (currentTokens + wordTokens > maxTokens) {
                        break
                }
                result += (result ? ' ' : '') + word
                currentTokens += wordTokens
        }

        return result
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
