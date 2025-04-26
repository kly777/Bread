import { bionicTextNode, offBionic } from "./bionic/bionicNode";
import { highlightSelectedTextInNode } from "./highlight/highlight";
import { removeHighlights } from "./highlight/highlightNode";
import { getTextNodes } from "./kit/getNodes";

const elementToTextNodesMap = new Map<Element, Text[]>();
const elementWithoutText = new Set<Element>();

const intersectionObserverOptions: IntersectionObserverInit = {
    threshold: Array.from({ length: 11 }, (_, i) => i * 0.1), // 简化阈值生成
    rootMargin: "300px",
};

const onceIntersectionObserver = new IntersectionObserver((entries) => {
    // 1. 断开 MutationObserver（避免回调冲突）
    manageMutationObserver(false);

    // 2. 处理所有条目
    entries.forEach(handleIntersectionEntry);

    // 3. 重新连接 MutationObserver
    manageMutationObserver(true);
}, intersectionObserverOptions);

const stableIntersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const element = entry.target;
            elementWithoutText.add(getNoneTextParentElement(element));
        } else {
            const element = entry.target;
            elementWithoutText.delete(getNoneTextParentElement(element));
        }
        // console.log("elementWithoutText changed", elementWithoutText);
    });
}, intersectionObserverOptions);

function getNoneTextParentElement(element: Element): Element {
    const parent = element.parentElement;
    if (parent) {
        if (hasTextNodes(parent)) {
            // 递归调用需返回结果
            return getNoneTextParentElement(parent);
        } else {
            return element;
        }
    }
    // 若无父元素，返回自身（确保不返回 undefined）
    return element;
}
function hasTextNodes(element: Element): boolean {
    return Array.from(element.childNodes).some(
        (node) => node.nodeType === Node.TEXT_NODE
    );
}
function handleIntersectionEntry(entry: IntersectionObserverEntry) {
    const element = entry.target as Element;

    // console.log("elementWithoutText", elementWithoutText);
    const textNodes = elementToTextNodesMap.get(element);

    if (!textNodes || !entry.isIntersecting) return;

    applyBionicToTextNodes(textNodes);
    cleanupElementMapping(element);

    // console.log("Current elementToTextNodesMap:", elementToTextNodesMap);
}
function applyBionicToTextNodes(textNodes: Text[]) {
    textNodes.forEach((text) => bionicTextNode(text));
}

function cleanupElementMapping(element: Element) {
    elementToTextNodesMap.delete(element);
    onceIntersectionObserver.unobserve(element);
}

function manageMutationObserver(shouldObserve: boolean) {
    if (shouldObserve) {
        domMutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });
    } else {
        domMutationObserver.disconnect();
    }
}

export function stopBionic() {
    domMutationObserver.disconnect();
    onceIntersectionObserver.disconnect();
    elementToTextNodesMap.clear();
    offBionic();
}

export function openBionic() {
    initIntersectionObserver();
}

// 观察逻辑优化（建立映射关系）
export const initIntersectionObserver = () => {
    observeTextNodes(getTextNodes());
    getTextNodes().forEach((text) => {
        if (text.parentElement) {
            stableIntersectionObserver.observe(text.parentElement);
        }
    });

    domMutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
};

function highlightFeature() {
    elementWithoutText.forEach((element) => {
        highlightWithoutObserver(element);
    });
}

export function openHighlight() {
    document.addEventListener("mouseup", highlightFeature);
}

export function stopHighlight() {
    document.removeEventListener("mouseup", highlightFeature);
    removeHighlights();
}

function highlightTextWithoutObserver(text: Text) {
    const parent = text.parentElement;
    if (parent) {
        highlightWithoutObserver(parent);
    }
}

function highlightWithoutObserver(element: Element) {
    manageMutationObserver(false);
    highlightSelectedTextInNode(element);
    manageMutationObserver(true);
}

const domMutationObserver: MutationObserver = new MutationObserver(
    (mutations: MutationRecord[]) => {
        // console.log("I observed some changes");

        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node: Node) => {
                function processNode(currentNode: Node) {
                    if (currentNode.nodeType === Node.TEXT_NODE) {
                        console.log(
                            "I observed a text node",
                            currentNode as Text
                        );
                        observeTextNode(currentNode as Text);
                    } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
                        // 递归处理子节点
                        Array.from(
                            (currentNode as ParentNode).childNodes
                        ).forEach(processNode);
                    }
                }
                processNode(node);
            });

            mutation.removedNodes.forEach((node) => {
                handleRemovedNode(node);
            });

            // 处理子树变动（如元素被替换或修改）
            if (mutation.type === "childList") {
                mutation.target.childNodes.forEach((child) => {
                    if (child.nodeType === Node.ELEMENT_NODE) {
                        const element = child as Element;
                        // 检查该元素是否存在于映射中，并重新校验其文本节点
                        if (elementToTextNodesMap.has(element)) {
                            // 重新获取该元素的所有文本节点并更新映射
                            const texts = getTextNodes(element);

                            elementToTextNodesMap.set(element, texts);
                        }
                    }
                });
            }
        });
    }
);

function handleRemovedNode(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        elementToTextNodesMap.delete(element);
        onceIntersectionObserver.unobserve(element);
    } else if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text;
        const parent = textNode.parentElement;
        if (parent) {
            const texts = elementToTextNodesMap.get(parent);
            if (texts) {
                const index = texts.indexOf(textNode);
                if (index !== -1) {
                    texts.splice(index, 1);
                    if (texts.length === 0) {
                        elementToTextNodesMap.delete(parent);
                        onceIntersectionObserver.unobserve(parent);
                    }
                }
            }
        }
    }
}

function observeTextNodes(texts: Text[]) {
    texts.forEach(observeTextNode);
}

function observeTextNode(text: Text) {
    const parent = text.parentElement;
    if (!parent || !document.contains(parent)) return; // 新增存在性校验

    // 更新映射关系
    updateElementMapping(parent, text);
}

function updateElementMapping(parent: Element, text: Text) {
    if (elementToTextNodesMap.has(parent)) {
        const texts = elementToTextNodesMap.get(parent)!;
        if (!texts.includes(text)) texts.push(text);
    } else {
        elementToTextNodesMap.set(parent, [text]);
        onceIntersectionObserver.observe(parent);
    }
}
