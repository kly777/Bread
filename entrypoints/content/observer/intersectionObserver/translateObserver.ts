import { intersectionObserverOptions } from "./options";

import { manageMutationObserver } from "../domMutationObserver";
import { getTextContainerElement } from "../../kit/getTextContainer";
import { translateElement } from "../../feature/translate/translateElement";

export const textContainer = new Set<HTMLElement>();

export const translateObserver = new IntersectionObserver((entries) => {
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
    const element = entry.target as HTMLElement;

    // 如果没有文本节点或元素不在视口中，则提前退出
    if (!entry.isIntersecting) return;

    // 应用仿生效果到文本节点（例如高亮、动画等）
    translateElement(element);

    // 清理元素与文本节点的映射关系，避免内存泄漏
    cleanupElement(element);

    // console.log("Current elementToTextNodesMap:", elementToTextNodesMap);
}


function cleanupElement(element: HTMLElement) {
    textContainer.delete(element);
    translateObserver.unobserve(element);
}

export function initializeTranslateObserver() {
    observeElementNode(document.body);
}

export function observeElementNode(ele: Element) {
    observeTextNodes(getTextContainerElement(ele));
}
function observeTextNodes(eles: HTMLElement[]) {
    eles.forEach(observeTextNode);
}

function observeTextNode(eles: HTMLElement) {
    const parent = eles.parentElement;
    if (!parent || !document.contains(parent)) return; // 新增存在性校验

    // 更新映射关系
    registerTextContainerElement(parent);
}
function registerTextContainerElement(parent: HTMLElement) {
    if (textContainer.has(parent)) return;
    textContainer.add(parent);
    translateObserver.observe(parent);
}
