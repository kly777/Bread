import { intersectionObserverOptions } from "./options";
import { bionicTextNode } from "../../feature/bionic/bionicNode";
import { manageMutationObserver } from "../domMutationObserver";
import { getTextNodes } from "../../kit/getTextNodes";

// 使用 Set 存储文本节点，避免重复并提升查找效率
export const parentToTextNodesMap = new Map<Element, Set<Text>>();

export const bionicTextObserver = new IntersectionObserver((entries) => {
    manageMutationObserver(false);
    entries.forEach(processVisibleTextElement);
    manageMutationObserver(true);
}, intersectionObserverOptions);
/**
 * 处理IntersectionObserverEntry，当元素进入视口时应用文本节点的仿生效果并清理映射。
 * @param entry - IntersectionObserver回调接收的条目对象，包含目标元素和相交状态
 * @returns {void}
 */
function processVisibleTextElement(entry: IntersectionObserverEntry): void {
    const element = entry.target as Element;
    const setTexts = parentToTextNodesMap.get(element);

    // 增加 document.contains 检查，确保元素仍在 DOM 中
    if (!setTexts || !entry.isIntersecting || !document.contains(element))
        return;

    // 应用仿生效果到文本节点（例如高亮、动画等）
    applyBionicEffect(Array.from(setTexts));

    // 清理元素与文本节点的映射关系，避免内存泄漏
    cleanupAndUnobserve(element);
}

function applyBionicEffect(textNodes: Text[]) {
    textNodes.forEach((text) => bionicTextNode(text));
}
function cleanupAndUnobserve(element: Element) {
    parentToTextNodesMap.delete(element);
    bionicTextObserver.unobserve(element);
}

export function initializeSingleUseObserver() {
    observeElementNode(document.body);
}

export function observeElementNode(ele: Element) {
    getTextNodes(ele).forEach(observeTextNode);
}

function observeTextNode(text: Text) {
    const parent = text.parentElement;
    if (!parent || !document.contains(parent)) return; // 新增存在性校验

    // 更新映射关系
    linkTextToElement(parent, text);
}
function linkTextToElement(parent: Element, text: Text) {
    if (parentToTextNodesMap.has(parent)) {
        const setTexts = parentToTextNodesMap.get(parent)!;
        if (!setTexts.has(text)) {
            setTexts.add(text);
        }
    } else {
        const setTexts = new Set<Text>([text]);
        parentToTextNodesMap.set(parent, setTexts);
        bionicTextObserver.observe(parent);
    }
}
