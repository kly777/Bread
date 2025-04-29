import { getTextNodes } from "../kit/getTextNodes";

import {
    parentToTextNodesMap,
    singleUseObserver,
    observeElementNode,
} from "./intersectionObserver/singleUseObserver";
import { observeTextAncestor } from "./intersectionObserver/stableIntersectionObserver";
import { observeTranslateElements } from "./intersectionObserver/translateObserver";

export function manageMutationObserver(shouldObserve: boolean) {
    if (shouldObserve) {
        domMutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });
    } else {
        domMutationObserver.disconnect();
    }
}

const domMutationObserver: MutationObserver = new MutationObserver(
    (mutations: MutationRecord[]) => {
        console.log("domMutationObserver observed some changes");
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                const walker = document.createTreeWalker(
                    node,
                    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                    {
                        acceptNode: () => {
                            // 仅接受文本节点和元素节点
                            return NodeFilter.FILTER_ACCEPT;
                        },
                    }
                );

                while (walker.nextNode()) {
                    const currentNode = walker.currentNode;
                    if (currentNode.nodeType === Node.TEXT_NODE) {
                        const parent = currentNode.parentElement;
                        if (parent) observeElementNode(parent);
                        observeTextAncestor(currentNode as Text);
                    } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
                        observeElementNode(currentNode as Element);
                    }
                }
                observeTranslateElements(node as Element);
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
                        if (parentToTextNodesMap.has(element)) {
                            // 重新获取该元素的所有文本节点并更新映射
                            const texts = getTextNodes(element);

                            parentToTextNodesMap.set(element, texts);
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
        parentToTextNodesMap.delete(element);
        singleUseObserver.unobserve(element);
    } else if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text;
        const parent = textNode.parentElement;
        if (parent) {
            const texts = parentToTextNodesMap.get(parent);
            if (texts) {
                const index = texts.indexOf(textNode);
                if (index !== -1) {
                    texts.splice(index, 1);
                    if (texts.length === 0) {
                        parentToTextNodesMap.delete(parent);
                        singleUseObserver.unobserve(parent);
                    }
                }
            }
        }
    }
}

