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
    const { excludeHidden = true, minContentLength = 0 } = options;

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

        if (
            excludeHidden &&
            (style.display === "none" || style.visibility === "hidden")
        ) {
            return NodeFilter.FILTER_REJECT;
        }
        // 文本内容检查
        return isEligibleElement(element)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
    };

    return document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
        acceptNode,
    });
}

function isEligibleElement(element: Element): boolean {
    const parent = element.parentElement;
    if (!parent) return false;

    const style = window.getComputedStyle(element);

    // 行内元素过滤逻辑
    if (INLINE_DISPLAY_VALUES.has(style.display) && hasTextNodes(parent)) {
        return false; // 跳过行内元素且父元素含文本的情况
    }

    const hasText = hasTextNodes(element);
    const parentHasText = hasTextNodes(parent);

    // 核心判定条件
    return hasText && !parentHasText;
}
