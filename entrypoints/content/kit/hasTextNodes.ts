/**
 * 检查元素是否包含文本节点
 * @param element 要检查的DOM元素
 * @returns 如果存在文本节点则返回true，否则返回false
 */
export function hasTextNodes(element: Element): boolean {
    for (const node of element.childNodes) {
        if (
            node.nodeType === Node.TEXT_NODE &&
            node.textContent?.trim() !== ""
        ) {
            return true;
        }
    }
    return false;
}