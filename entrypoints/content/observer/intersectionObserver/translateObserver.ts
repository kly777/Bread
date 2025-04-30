import { intersectionObserverOptions } from "./options";

import { manageMutationObserver } from "../domMutationObserver";
import { getTextContainerElement } from "../../kit/getTextContainer";
import { translateElement } from "../../feature/translate/translateElement";

const translateObserver = new IntersectionObserver((entries) => {
    manageMutationObserver(false);
    //  处理所有条目
    entries.filter((e) => e.isIntersecting).forEach(processElement);

    manageMutationObserver(true);
}, intersectionObserverOptions);

// 主处理逻辑
function processElement(entry: IntersectionObserverEntry) {
    const element = entry.target as HTMLElement;
    translateElement(element);
    translateObserver.unobserve(element); // 立即清理
}

// 初始化入口
export function initializeTranslateObserver() {
    observeTranslateElements(document.body);
}

// 统一观察方法
export function observeTranslateElements(root: Element) {
    getTextContainerElement(root).forEach((el) =>
        translateObserver.observe(el)
    );
}
