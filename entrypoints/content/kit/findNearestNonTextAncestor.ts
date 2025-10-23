import { hasTextNodes } from './hasTextNodes'

/**
 * 查找指定元素最近的非文本节点祖先元素。
 * @param element - 起始元素，从该元素开始向上查找
 * @returns 最近的非文本节点祖先元素；若无父元素则返回自身
 */
export function findNearestNonTextAncestor(element: Element): Element {
        const parent = element.parentElement
        if (parent) {
                // 检查父元素是否包含文本节点
                if (hasTextNodes(parent)) {
                        return findNearestNonTextAncestor(parent)
                } else {
                        // 父元素不含文本节点，返回当前元素
                        // console.log("找到最近的非文本节点祖先元素",element.textContent);
                        return element
                }
        }
        // 若无父元素，返回自身（确保不返回 undefined）
        return element
}
