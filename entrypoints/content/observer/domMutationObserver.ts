import { getTextNodes } from "../kit/getTextNodes";
import { getSetting } from "../settingManager";

import {
    parentToTextNodesMap,
    bionicTextObserver,
    observeElementNode,
} from "./intersectionObserver/bionicObserver";
import { observeTranslateElements as translateAddedElement } from "./intersectionObserver/translateObserver";

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
        // pin()
        console.log("domMutationObserver observed some changes");
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (getSetting().translate) {
                        translateAddedElement(node as Element);
                    }
                    if (getSetting().bionic) {
                        observeElementNode(node as Element);
                    }
                }
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
                            const textsSet = new Set(texts);

                            parentToTextNodesMap.set(element, textsSet);
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
        bionicTextObserver.unobserve(element);
    } else if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text;
        const parent = textNode.parentElement;
        if (parent) {
            const texts = parentToTextNodesMap.get(parent);
            if (texts) {
                // 直接尝试删除文本节点
                if (texts.delete(textNode) && texts.size === 0) {
                    parentToTextNodesMap.delete(parent);
                    bionicTextObserver.unobserve(parent);
                }
            }
        }
    }
}
