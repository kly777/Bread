/**
 * 文本节点检查工具函数
 *
 * 提供检查元素是否包含文本节点的功能
 */

/**
 * 检查元素是否包含文本节点
 *
 * @param element - 要检查的 DOM 元素
 * @returns 如果存在文本节点则返回 true，否则返回 false
 */
export function hasTextNodes(element: Element): boolean {
        for (const node of element.childNodes) {
                if (
                        node.nodeType === Node.TEXT_NODE &&
                        node.textContent?.trim() !== ''
                ) {
                        return true
                }
        }
        return false
}

/**
 * 获取元素中的所有文本节点
 *
 * @param element - 要检查的 DOM 元素
 * @returns 文本节点数组
 */
export function getTextNodesFromElement(element: Element): Text[] {
        const textNodes: Text[] = []
        for (const node of element.childNodes) {
                if (
                        node.nodeType === Node.TEXT_NODE &&
                        node.textContent?.trim() !== ''
                ) {
                        textNodes.push(node as Text)
                }
        }
        return textNodes
}
