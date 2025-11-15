import {
        hasVerticalAlign,
        isInFlexContext,
        isInlineElement,
        isPositionedElement,
        shouldWrapElement,
} from './elementStyle'

// 高性能样式缓存系统
const styleCache = new WeakMap<
        HTMLElement,
        { shouldUseInline: boolean; shouldWrap: boolean }
>()

// 常见元素样式预计算 - 基于标签名的快速缓存
const tagNameStyleCache = new Map<
        string,
        { shouldUseInline: boolean; shouldWrap: boolean }
>([
        ['DIV', { shouldUseInline: false, shouldWrap: true }],
        ['SPAN', { shouldUseInline: true, shouldWrap: false }],
        ['P', { shouldUseInline: false, shouldWrap: true }],
        ['A', { shouldUseInline: true, shouldWrap: false }],
        ['STRONG', { shouldUseInline: true, shouldWrap: false }],
        ['EM', { shouldUseInline: true, shouldWrap: false }],
        ['LI', { shouldUseInline: false, shouldWrap: true }],
        ['H1', { shouldUseInline: false, shouldWrap: true }],
        ['H2', { shouldUseInline: false, shouldWrap: true }],
        ['H3', { shouldUseInline: false, shouldWrap: true }],
        ['H4', { shouldUseInline: false, shouldWrap: true }],
        ['H5', { shouldUseInline: false, shouldWrap: true }],
        ['H6', { shouldUseInline: false, shouldWrap: true }],
])

function desString(content: string, shouldWrap: boolean): string {
        const resultContent = shouldWrap
                ? '- ' + content
                : ' <' + content + '> '
        return resultContent
}

/**
 * 创建用于展示翻译结果的容器元素
 * @param translatedText 需要展示的翻译文本内容
 * @param shouldWrap 是否需要使用块级元素包裹
 * @returns 创建的HTML元素容器
 */
function createTranslationContainer(
        translatedText: string,
        shouldWrap: boolean
): HTMLElement {
        const container = document.createElement(shouldWrap ? 'div' : 'span')

        // 创建基础容器元素：
        // 1. 根据shouldWrap参数决定创建div或span元素
        // 2. 块级元素(div)用于需要独立布局的场景
        // 3. 行内元素(span)用于内联显示场景

        container.classList.add('translation-result')

        // 为行内元素添加title属性：
        // 在非包裹模式下，通过title属性展示完整翻译文本
        // 这可以确保当内容被截断时仍能通过悬停查看完整文本
        if (!shouldWrap) {
                container.title = translatedText
        }

        const fragment = document.createDocumentFragment()

        // 使用文档片段进行内容填充：
        // 1. 通过desString处理文本内容（具体处理逻辑未展示）
        // 2. 文档片段操作可减少DOM重排次数，提升性能
        // 3. 最终将处理后的内容添加到容器中
        fragment.textContent = desString(translatedText, shouldWrap)

        container.appendChild(fragment)

        return container
}

/**
 * 更新或创建翻译容器元素
 * 如果目标元素已包含翻译容器则不做任何操作，否则根据参数创建新的翻译容器并添加到目标元素中
 *
 * @param element - 目标HTML元素，用于查找或挂载翻译容器
 * @param translatedText - 需要显示的翻译文本内容
 * @param shouldWrap - 是否允许文本换行的布尔标志
 *
 * @returns void
 */
export function updateOrCreateTranslationContainer(
        element: HTMLElement,
        translatedText: string,
        shouldWrap: boolean
): void {
        // 查找已存在的翻译容器元素
        const existing = Array.from(element.children).find((child) =>
                child.classList.contains('translation-result')
        )

        if (existing) {
                return
        } else {
                const resultContainer = createTranslationContainer(
                        translatedText,
                        shouldWrap
                )
                insertAfterLastTextElement(element, resultContainer)
        }
}

// 批量DOM操作队列
const domOperationQueue: { element: HTMLElement; container: HTMLElement }[] = []
let domOperationScheduled = false

/**
 * 调度批量DOM操作
 */
function scheduleDomOperation(
        element: HTMLElement,
        container: HTMLElement
): void {
        domOperationQueue.push({ element, container })

        if (!domOperationScheduled) {
                domOperationScheduled = true

                // 使用 requestAnimationFrame 在下一帧批量处理DOM操作
                window.requestAnimationFrame(() => {
                        processDomOperationQueue()
                })
        }
}

/**
 * 处理批量DOM操作队列
 */
function processDomOperationQueue(): void {
        domOperationScheduled = false

        const operations = [...domOperationQueue]
        domOperationQueue.length = 0

        // 批量处理所有DOM操作
        operations.forEach(({ element, container }) => {
                const position = findOptimalInsertPosition(element)
                if (position.node && position.isAfter) {
                        position.node.parentNode?.insertBefore(
                                container,
                                position.node.nextSibling
                        )
                } else if (position.node && !position.isAfter) {
                        position.node.parentNode?.insertBefore(
                                container,
                                position.node
                        )
                } else {
                        element.appendChild(container)
                }
        })
}

/**
 * 优化的插入位置查找算法
 */
function findOptimalInsertPosition(element: HTMLElement): {
        node: Node | null
        isAfter: boolean
} {
        // 快速检查：如果元素没有子节点，直接返回null表示追加到末尾
        if (!element.lastChild) {
                return { node: null, isAfter: false }
        }

        // 从最后一个子节点开始向前查找
        let node: Node | null = element.lastChild

        while (node) {
                // 快速检查：如果是文本节点且包含内容
                if (
                        node.nodeType === Node.TEXT_NODE &&
                        node.textContent?.trim()
                ) {
                        return { node, isAfter: true }
                }

                // 如果是元素节点
                if (node.nodeType === Node.ELEMENT_NODE) {
                        const el = node as HTMLElement

                        // 快速排除翻译结果容器
                        if (el.classList?.contains('translation-result')) {
                                node = node.previousSibling
                                continue
                        }

                        // 检查是否包含文本内容
                        if (el.textContent?.trim()) {
                                return { node, isAfter: true }
                        }

                        // 检查是否包含SVG
                        if (el.querySelector('svg')) {
                                return { node, isAfter: true }
                        }
                }

                node = node.previousSibling
        }

        return { node: null, isAfter: false }
}

/**
 * 将翻译结果容器插入到目标元素中最后一个有文本或svg的元素之后
 * 使用批量DOM操作和优化算法
 * @param element - 目标HTML元素
 * @param resultContainer - 翻译结果容器元素
 */
function insertAfterLastTextElement(
        element: HTMLElement,
        resultContainer: HTMLElement
): void {
        // 使用批量DOM操作调度
        scheduleDomOperation(element, resultContainer)
}

/**
 * 获取元素的样式信息 - 优化版本
 */
export function getElementStyleInfo(element: HTMLElement): {
        shouldUseInline: boolean
        shouldWrap: boolean
} {
        // 首先检查WeakMap缓存
        let styleInfo = styleCache.get(element)
        if (styleInfo) {
                return styleInfo
        }

        // 检查标签名缓存
        const tagName = element.tagName
        const tagStyle = tagNameStyleCache.get(tagName)

        let shouldUseInline: boolean
        let shouldWrap: boolean

        if (tagStyle) {
                // 使用预计算的标签样式作为基准
                shouldUseInline = tagStyle.shouldUseInline
                shouldWrap = tagStyle.shouldWrap

                // 对于预定义样式，只在实际需要时进行详细检查
                if (shouldUseInline) {
                        // 行内元素可能需要额外检查定位和flex上下文
                        shouldUseInline =
                                !isPositionedElement(element) &&
                                !isInFlexContext(element)
                }
        } else {
                // 未知标签，进行完整计算
                shouldUseInline =
                        isInlineElement(element) ||
                        isPositionedElement(element) ||
                        isInFlexContext(element) ||
                        hasVerticalAlign(element)

                shouldWrap = !shouldUseInline && shouldWrapElement(element)
        }

        styleInfo = { shouldUseInline, shouldWrap }
        styleCache.set(element, styleInfo)

        return styleInfo
}
