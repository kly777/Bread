import { getSetting } from '../../settingManager'

const EXCLUDE_TAGS = [
        'SCRIPT',
        'STYLE',
        'NOSCRIPT',
        'SVG',
        'VAR',
        'KBD',
        'INPUT',
        'PRE',
        'TEXTAREA',
        'INPUT'
]

// 全局标记，用于记录已经被排除翻译的元素
const excludedElements = new WeakSet<HTMLElement>()

/**
 * 检查单个元素是否应该被排除翻译
 */
function isElementExcludable(element: HTMLElement): boolean {
        // 检查元素本身是否是排除标签
        if (EXCLUDE_TAGS.includes(element.tagName)) {
                return true
        }

        // 检查元素是否具有 code-line 类
        if (element.className && element.className.includes('code-line')) {
                return true
        }

        // 检查元素是否具有 contenteditable 属性
        if (element.hasAttribute('contenteditable')) {
                const editableValue = element.getAttribute('contenteditable')
                // contenteditable 为 true 或空字符串时，元素可编辑
                if (editableValue === 'true' || editableValue === '') {
                        return true
                }
        }

        return false
}

/**
 * 检查元素或其祖先是否在排除标签内
 * 这个方法确保翻译行为与DOM结构顺序无关
 */
function isElementExcluded(element: HTMLElement): boolean {
        // 如果已经在排除集合中，直接返回
        if (excludedElements.has(element)) {
                return true
        }

        // 检查元素本身是否应该被排除
        if (isElementExcludable(element)) {
                excludedElements.add(element)
                return true
        }

        // 检查祖先元素链中是否有排除标签
        let parent = element.parentElement
        while (parent && parent !== document.body) {
                if (isElementExcludable(parent)) {
                        excludedElements.add(element)
                        return true
                }
                parent = parent.parentElement
        }

        return false
}

/**
 * 从指定的HTML元素中提取所有未被排除的文本节点内容。
 * 该函数会递归遍历元素的所有子节点，排除特定父标签下的文本节点，
 * 并合并剩余的有效文本片段。
 *
 * @param element - 根HTML元素，作为文本提取的起始节点
 * @returns Promise<string> - 合并后的纯文本字符串，已移除所有换行符
 */
export async function extractTextFragments(
        element: HTMLElement
): Promise<string> {
        // 首先检查元素是否被排除
        if (isElementExcluded(element)) {
                return ''
        }

        /**
         * 使用TreeWalker遍历所有文本节点，排除特定父标签下的文本节点
         */
        const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                {
                        acceptNode: (node) => {
                                // 检查文本节点的父元素链，看是否有排除标签
                                let parent = node.parentElement
                                while (parent && parent !== element) {
                                        if (
                                                EXCLUDE_TAGS.includes(
                                                        parent.tagName
                                                )
                                        ) {
                                                return NodeFilter.FILTER_REJECT
                                        }
                                        parent = parent.parentElement
                                }
                                return NodeFilter.FILTER_ACCEPT
                        },
                }
        )

        // 收集有效文本片段的数组
        const textFragments: string[] = []

        /**
         * 遍历所有通过过滤的文本节点：
         * 1. 移除文本中的换行符
         * 2. 过滤空字符串
         * 3. 将有效文本加入结果数组
         */
        let currentNode: Node | null = walker.nextNode()
        while (currentNode) {
                const text = currentNode.textContent?.replace(/\n/g, '').trim()
                if (text) {
                        textFragments.push(text)
                }
                currentNode = walker.nextNode()
        }

        // 合并所有文本片段并返回最终结果
        return textFragments.join('')
}

/**
 * 优化文本检测：添加长度检查和更精确的英文检测
 */
export function shouldSkipTranslation(text: string): boolean {
        if (!text || text.length < 2) return true

        // 优化正则表达式，只检查是否包含英文字母
        const EN_LETTER_REGEX = /[a-zA-Z]/
        return !EN_LETTER_REGEX.test(text)
}

/**
 * 检查是否应该跳过元素翻译
 */
export function shouldSkipElementTranslation(element: HTMLElement): boolean {
        // 提前检查设置，避免不必要的处理
        if (getSetting().translate === false) {
                return true
        }

        // 验证参数有效性
        if (!(element instanceof HTMLElement)) {
                return true
        }

        // 检查是否已经有翻译结果
        if (element.querySelector('.translation-result')) {
                return true
        }

        if (element.classList.contains('no-translate')) {
                return true
        }

        // 检查元素是否被排除
        if (isElementExcluded(element)) {
                return true
        }

        return false
}

/**
 * 批量预处理元素，标记所有应该排除翻译的元素
 * 添加对可编辑元素的处理
 */
export function preprocessExcludedElements(
        root: Element = document.body
): void {
        // 首先标记所有排除标签本身
        EXCLUDE_TAGS.forEach((tag) => {
                const elements = root.querySelectorAll(tag)
                elements.forEach((el) => {
                        excludedElements.add(el as HTMLElement)
                })
        })

        // 标记所有具有 contenteditable 属性的元素
        const editableElements = root.querySelectorAll('[contenteditable]')
        editableElements.forEach((el) => {
                const editableValue = el.getAttribute('contenteditable')
                if (editableValue === 'true' || editableValue === '') {
                        excludedElements.add(el as HTMLElement)
                }
        })

        // 然后标记所有在排除标签内的子元素
        const allElements = root.querySelectorAll('*')
        allElements.forEach((el) => {
                if (!excludedElements.has(el as HTMLElement)) {
                        let parent = el.parentElement
                        while (parent && parent !== root) {
                                if (EXCLUDE_TAGS.includes(parent.tagName)) {
                                        excludedElements.add(el as HTMLElement)
                                        break
                                }

                                // 检查祖先元素是否可编辑
                                if (parent.hasAttribute('contenteditable')) {
                                        const editableValue = parent.getAttribute('contenteditable')
                                        if (editableValue === 'true' || editableValue === '') {
                                                excludedElements.add(el as HTMLElement)
                                                break
                                        }
                                }

                                parent = parent.parentElement
                        }
                }
        })
}

