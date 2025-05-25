import { translateContent as translateG } from "../../kit/translateG";
import { translateContent as translateMS } from "../../kit/translateMS";
import { translator } from "../../featureManager/translateManager";
import {
    hasVerticalAlign,
    isInFlexContext,
    isInlineElement,
    isPositionedElement,
    shouldWrapElement,
} from "./elementStyle";
import { setting } from "../../settingManager";
/**
 * 翻译指定元素内容并展示
 * @param element 需要翻译的DOM元素
 * @param targetLang 目标语言代码，默认为简体中文('zh-CN')
 */


const translationCache = new Map<string, string>();



export const translateElement = async (
    element: HTMLElement,
    targetLang = "zh-CN"
): Promise<void> => {
    if (!(element instanceof HTMLElement)) {
        console.warn("Invalid element provided");
        return;
    }
    // element.style.border = "1px solid red";
    /**
     * 步骤一：提取原始文本
     * 排除脚本/样式节点，避免翻译干扰内容
     */
    // 使用TreeWalker实现更高效的遍历
    const EXCLUDE_TAGS = [
        "SCRIPT",
        "STYLE",
        "NOSCRIPT",
        "SVG",
        "VAR",
        "KBD",
        "INPUT",
    ];

    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_ALL, // 只遍历文本节点
        {
            acceptNode: (node) => {
                const parent = node.parentElement;
                // 如果父元素存在并且在排除列表中，则跳过该节点

                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (parent && EXCLUDE_TAGS.includes(parent.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // const display = window
                    //     .getComputedStyle(node as HTMLElement)
                    //     .display.trim()
                    //     .toLowerCase();
                    // console.log("display:", display);
                    // if (display === "none") {
                    //     return NodeFilter.FILTER_REJECT;
                    // }
                }
                if (node.nodeType === Node.TEXT_NODE) {
                    return NodeFilter.FILTER_ACCEPT;
                }

                return NodeFilter.FILTER_SKIP;
            },
        }
    );

    const textFragments: string[] = [];
    while (walker.nextNode()) {
        const text = walker.currentNode.textContent;
        if (text) {
            const sanitizedText = text.replace(/\n/g, "");
            textFragments.push(sanitizedText);
        }
    }

    const originalText = textFragments.join("");
    console.log("originalText:", originalText);
    if (!originalText) return;

    // 新增校验：纯汉字/数字内容不处理
    // 精确匹配英文字母（含全角变体）
    const EN_LETTER_REGEX =
        /[\u0041-\u005a\u0061-\u007a\uFF21-\uFF3A\uFF41-\uFF5A]/u;

    // 替换原有判断逻辑
    if (!EN_LETTER_REGEX.test(originalText)) return;
    try {
        /**
         * 步骤二：执行翻译操作
         * 使用现有翻译服务进行内容转换
         */

        // 替换原有逻辑为函数调用
        const translatedText = await performTranslation(
            translator,
            originalText,
            targetLang
        );
        if(setting.translate === false) {
            console.warn("Translation is disabled in settings.");
            return;
        }

        if (translatedText === originalText) return;
        // 在翻译逻辑中增加多维判断
        const shouldUseInline =
            isInlineElement(element) ||
            isPositionedElement(element) ||
            isInFlexContext(element) ||
            hasVerticalAlign(element);

        const shouldWrap = !shouldUseInline && shouldWrapElement(element);

        const existing = Array.from(element.children).find((child) =>
            child.classList.contains("translation-result")
        );
        if (existing) {
            // 存在则直接替换内容（更高效的更新方式）
            existing.textContent = desString(translatedText, shouldWrap);
        } else {
            // 不存在则创建并添加新容器
            const resultContainer = createTranslationContainer(
                translatedText,
                shouldWrap
            );
            element.appendChild(resultContainer);
        }
    } catch (error) {
        console.error("Element translation failed:", {
            error,
            element,
            timestamp: new Date().toISOString(),
        });
    }
};
function desString(content: string, shouldWrap: boolean): string {
    const resultContent = shouldWrap ? "- " + content : " | " + content;
    return resultContent;
}

function createTranslationContainer(
    translatedText: string,
    shouldWrap: boolean
): HTMLElement {
    const container = document.createElement(shouldWrap ? "div" : "span");

    // if (!shouldWrap) {
    //     container.style.display = "contents"; // 仅对块级容器生效
    // }
    container.classList.add("translation-result");
    if (!shouldWrap) {
        container.title = translatedText;
    }

    const fragment = document.createDocumentFragment();
    fragment.textContent = desString(translatedText, shouldWrap);
    container.appendChild(fragment);

    return container;
}

/**
 * 封装翻译服务调用逻辑
 * @param translator 使用的翻译引擎（MS/G）
 * @param originalText 原始文本
 * @param targetLang 目标语言
 * @returns 翻译后的文本
 */
async function performTranslation(
    translator: string,
    originalText: string,
    targetLang: string
): Promise<string> {
    const cacheKey = `${originalText}:${targetLang}:${translator}`;
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey)!;
    }


    let result: string = ""
    if (translator === "MS") {
        result = await translateMS(originalText, undefined, targetLang);
    } else if (translator === "G") {
        result = await translateG(originalText, undefined, targetLang);
    }

    translationCache.set(cacheKey, result);
    return result;
    throw new Error("Unsupported translator");
}
