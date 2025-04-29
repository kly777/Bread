import { translateElement } from "../feature/translate/translateElement";
import { getTextContainerElement } from "../kit/getTextContainer";
import { manageMutationObserver } from "../observer/domMutationObserver";
import { initializeSingleUseObserver } from "../observer/intersectionObserver/singleUseObserver";

export async function openTranslate() {
    const elements = getTextContainerElement();

    // 调试日志：确认元素获取结果
    console.log("Target elements for translation:", elements);

    if (!elements.length) {
        console.warn("No elements found for translation.");
        return;
    }

    const translatePromises = elements.map((ele) =>
        translateElement(ele).catch((error) => {
            console.error("Translation failed for element:", ele, error);
            return Promise.resolve(); // 避免单个失败影响整体流程
        })
    );

    // 容错处理：将所有异常转为已处理状态
    await Promise.all(translatePromises.map((p) => p.catch(() => {})));
}

function closeTranslate() {}
