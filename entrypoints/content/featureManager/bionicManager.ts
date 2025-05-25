import { removeBionicEffects } from "../feature/bionic/bionicNode";

import { manageMutationObserver } from "../observer/domMutationObserver";
import {
    parentToTextNodesMap,
    initializeSingleUseObserver,
    bionicTextObserver,
} from "../observer/intersectionObserver/singleUseObserver";

// 特殊处理：bionic的DOM加载逻辑
export function initBionic() {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            openBionic();
            console.log("DOM 就绪时执行");
        });
    } else {
        window.requestIdleCallback(() => {
            openBionic();
            console.log("延迟到窗口加载完成");
        });
    }
}
export function openBionic() {
    initializeSingleUseObserver();
    manageMutationObserver(true);
}

export function stopBionic() {
    manageMutationObserver(false);
    bionicTextObserver.disconnect();
    parentToTextNodesMap.clear();
    removeBionicEffects();
}
