import { GetTextNodesOptions } from "./getTextNodes";
import { hasTextNodes } from "./hasTextNodes";

const EXCLUDE_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "SVG",
    "MATH",
    "VAR",
    "SAMP",
    "KBD",
    "PRE",
    "TEXTAREA",
    "INPUT",
    "CODE",
]);

const INLINE_DISPLAY_VALUES = new Set([
    "inline",
    "inline-block",
    "inline-flex",
    "inline-grid",
    "inline-table",
]);

export function getTextContainerElement(
    root: Node = document.body,
    options: GetTextNodesOptions = {}
): HTMLElement[] {
    const walker = getTextContainerWalker(root, options);

    // 遍历收集所有符合条件的文本节点
    const textNodes: HTMLElement[] = [];
    while (walker.nextNode()) {
        const node = walker.currentNode as HTMLElement;

        // node.textContent = "";

        textNodes.push(node);
    }

    return textNodes;
}

/**
 * 获取包含有效文本内容的容器元素遍历器
 *
 * @param root - 遍历起始节点，默认为document.body
 * @param options - 过滤配置选项
 * @returns 配置好的TreeWalker实例
 */

export function getTextContainerWalker(
    root: Node = document.body,
    options: GetTextNodesOptions = {}
): TreeWalker {
    const { excludeHidden = true } = options;

    const acceptNode = (node: Node): number => {
        // 仅处理元素节点
        if (node.nodeType !== Node.ELEMENT_NODE) return NodeFilter.FILTER_SKIP;

        const element = node as Element;

        const tagName = element.tagName.toUpperCase();

        // 新增：直接跳过指定标签
        if (EXCLUDE_TAGS.has(tagName)) {
            return NodeFilter.FILTER_REJECT; // 跳过该元素及其所有子节点
        }

        // 排除非容器标签
        // if (EXCLUDED_TAGS.has(element.tagName.toLowerCase())) {
        //     return NodeFilter.FILTER_REJECT;
        // }
        const style = window.getComputedStyle(element);

        // if (
        //     excludeHidden &&
        //     (style.display === "none" || style.visibility === "hidden")
        // ) {
        //     return NodeFilter.FILTER_REJECT;
        // }
        // 文本内容检查
        return (isEligibleElementV2(element)|| isEligibleElement(element))
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
    };

    return document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
        acceptNode,
    });
}

/**
 * 判断给定的DOM元素是否符合特定条件（包含文本且父元素不包含文本，排除特定行内元素情况）。
 * @param element 需要检查的DOM元素
 * @returns 如果元素符合条件返回true，否则返回false
 */
function isEligibleElement(element: Element): boolean {
    const parent = element.parentElement;
    if (!parent) return false;

    const style = window.getComputedStyle(element);

    /**
     * 过滤行内元素且父元素包含文本的情况
     * 避免将包含纯文本的容器元素中的行内元素误判为目标元素
     */
    if (INLINE_DISPLAY_VALUES.has(style.display) && hasTextNodes(parent)) {
        return false;
    }

    const hasText = hasTextNodes(element);
    const parentHasText = hasTextNodes(parent);

    /**
     * 核心判定逻辑：元素自身必须包含文本节点
     * 且其父元素不能直接包含文本节点
     */
    return hasText && !parentHasText;
}


/**
 * 判断给定的DOM元素是否符合特定条件。
 * @param element 需要检查的DOM元素
 * @returns 如果元素符合条件返回true，否则返回false
 */
function isEligibleElementV2(element: Element): boolean {
    if (!hasTextNodes(element)) return false;

    const childNodes = element.childNodes;

    if (childNodes.length === 0) return false;
    for (let i = 0; i < childNodes.length; i++) {
        const node = childNodes[i];

        // 处理文本节点
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue?.trim();
            if (text) continue; // 有效文本节点
            return false; // 空文本节点
        }

        // 处理元素节点
        if (node.nodeType === Node.ELEMENT_NODE) {
            const childElement = node as Element;
            const style = window.getComputedStyle(childElement);

            // 检查是否为行内元素
            if (!INLINE_DISPLAY_VALUES.has(style.display)) {
                return false;
            }
        } else {
            // 非元素/文本节点
            return false;
        }
    }
    return true;
}
