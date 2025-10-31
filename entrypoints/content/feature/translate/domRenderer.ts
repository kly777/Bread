import {
        hasVerticalAlign,
        isInFlexContext,
        isInlineElement,
        isPositionedElement,
        shouldWrapElement,
} from './elementStyle'

// 缓存样式检测结果，避免重复计算
const styleCache = new WeakMap<
        HTMLElement,
        { shouldUseInline: boolean; shouldWrap: boolean }
>()

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

/**
 * 将翻译结果容器插入到目标元素中最后一个有文本或svg的元素之后
 * @param element - 目标HTML元素
 * @param resultContainer - 翻译结果容器元素
 */
function insertAfterLastTextElement(
        element: HTMLElement,
        resultContainer: HTMLElement
): void {
        const childNodes = Array.from(element.childNodes)
        let lastTextElement: Node | null = null

        // 从后向前遍历直接子节点
        for (let i = childNodes.length - 1; i >= 0; i--) {
                const node = childNodes[i]

                // 检查节点是否包含文本内容或为SVG元素
                if (hasTextContent(node) || hasSvgElement(node)) {
                        lastTextElement = node
                        break
                }
        }

        // 如果找到了最后一个包含文本的节点或SVG元素，则在其后插入
        if (lastTextElement) {
                lastTextElement.parentNode?.insertBefore(
                        resultContainer,
                        lastTextElement.nextSibling
                )
        } else {
                // 否则追加到末尾
                element.appendChild(resultContainer)
        }
}

/**
 * 检查元素的子节点中是否包含SVG元素
 * @param node 要检查的节点
 * @returns 如果元素的子节点中包含SVG元素则返回true，否则返回false
 */
function hasSvgElement(node: Node): boolean {
        if (node.nodeType !== Node.ELEMENT_NODE) {
                return false
        }

        const element = node as Element
        return element.querySelector('svg') !== null
}
/**
 * 检查节点是否包含文本内容
 * @param node 要检查的节点
 * @returns 如果节点包含文本内容则返回true，否则返回false
 */
function hasTextContent(node: Node): boolean {
        if (node.nodeType === Node.TEXT_NODE) {
                return !!node.textContent?.trim()
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement
                // 排除翻译结果容器
                if (
                        el.classList &&
                        el.classList.contains('translation-result')
                ) {
                        return false
                }
                return !!el.textContent?.trim()
        }

        return false
}

/**
 * 获取元素的样式信息
 */
export function getElementStyleInfo(element: HTMLElement): {
        shouldUseInline: boolean
        shouldWrap: boolean
} {
        let styleInfo = styleCache.get(element)
        if (!styleInfo) {
                const shouldUseInline =
                        isInlineElement(element) ||
                        isPositionedElement(element) ||
                        isInFlexContext(element) ||
                        hasVerticalAlign(element)

                const shouldWrap =
                        !shouldUseInline && shouldWrapElement(element)

                styleInfo = { shouldUseInline, shouldWrap }
                styleCache.set(element, styleInfo)
        }
        return styleInfo
}
