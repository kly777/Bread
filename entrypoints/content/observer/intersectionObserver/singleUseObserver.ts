import { intersectionObserverOptions } from "./options";

import { bionicTextNode } from "../../feature/bionic/bionicNode";
import { manageMutationObserver } from "../domMutationObserver";
import { getTextNodes } from "../../kit/getNodes";

export const parentToTextNodesMap = new Map<Element, Text[]>();

export const singleUseObserver = new IntersectionObserver((entries) => {
    // 1. 断开 MutationObserver（避免回调冲突）
    manageMutationObserver(false);
    // 2. 处理所有条目
    entries.forEach(handleIntersectionEntry);
    // 3. 重新连接 MutationObserver
    manageMutationObserver(true);
}, intersectionObserverOptions);
/**
 * 处理IntersectionObserverEntry，当元素进入视口时应用文本节点的仿生效果并清理映射。
 * @param entry - IntersectionObserver回调接收的条目对象，包含目标元素和相交状态
 * @returns {void}
 */
function handleIntersectionEntry(entry: IntersectionObserverEntry) {
    const element = entry.target as Element;

    // console.log("elementWithoutText", elementWithoutText);
    const textNodes = parentToTextNodesMap.get(element);

    // 如果没有文本节点或元素不在视口中，则提前退出
    if (!textNodes || !entry.isIntersecting) return;

    // 应用仿生效果到文本节点（例如高亮、动画等）
    applyBionicToTextNodes(textNodes);

    // 清理元素与文本节点的映射关系，避免内存泄漏
    cleanupElementMapping(element);

    // console.log("Current elementToTextNodesMap:", elementToTextNodesMap);
}

function applyBionicToTextNodes(textNodes: Text[]) {
    textNodes.forEach((text) => bionicTextNode(text));
}
function cleanupElementMapping(element: Element) {
    parentToTextNodesMap.delete(element);
    singleUseObserver.unobserve(element);
}

export function registerTextElement(parent: Element, text: Text) {
    if (parentToTextNodesMap.has(parent)) {
        const texts = parentToTextNodesMap.get(parent)!;
        if (!texts.includes(text)) texts.push(text);
    } else {
        parentToTextNodesMap.set(parent, [text]);
        singleUseObserver.observe(parent);
    }
}

export function initializeSingleUseObserver() {
    observeTextNodes(getTextNodes());
}

function observeTextNodes(texts: Text[]) {
    texts.forEach(observeTextNode);
}

export function observeTextNode(text: Text) {
    const parent = text.parentElement;
    if (!parent || !document.contains(parent)) return; // 新增存在性校验

    // 更新映射关系
    registerTextElement(parent, text);
}
