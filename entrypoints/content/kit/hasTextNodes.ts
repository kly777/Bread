/**
 * 检查元素是否包含文本节点
 * @param element 要检查的DOM元素
 * @returns 如果存在文本节点则返回true，否则返回false
 */
export function hasTextNodes(element: Element): boolean {
    return Array.from(element.childNodes).some(
        (node) => node.nodeType === Node.TEXT_NODE
    );
}
