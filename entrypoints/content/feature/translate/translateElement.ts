import { translateContent } from "../../kit/translate";

/**
 * 翻译指定元素内容并展示
 * @param element 需要翻译的DOM元素
 * @param targetLang 目标语言代码，默认为简体中文('zh-CN')
 */
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
        "I",
    ];

    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, // 同时遍历元素和文本节点
        {
            acceptNode: (node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const tagName = (node as HTMLElement).tagName.toUpperCase();
                    if (EXCLUDE_TAGS.includes(tagName)) {
                        return NodeFilter.FILTER_REJECT; // 跳过该元素及其所有子节点
                    }
                }
                return NodeFilter.FILTER_ACCEPT;
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
        const translatedText = await translateContent(
            originalText,
            undefined,
            targetLang
        );
        if (translatedText === originalText) return;

        // 清理旧翻译容器
        const existing = element.querySelector(".translation-result");
        if (existing) existing.remove();

        // 创建新翻译容器
        const resultContainer = createTranslationContainer(
            translatedText,
            isInlineElement(element)
        );

        // 更新DOM
        element.appendChild(resultContainer);
    } catch (error) {
        console.error("Element translation failed:", {
            error,
            element,
            timestamp: new Date().toISOString(),
        });
    }
};

function isInlineElement(element: HTMLElement): boolean {
    return window.getComputedStyle(element).display === "inline";
}
//function isInlineElement(el: HTMLElement): boolean {
//     const inlineTags = ["SPAN", "A", "STRONG", "EM", "B", "I"];
//     return (
//         inlineTags.includes(el.tagName) ||
//         getComputedStyle(el).display === "inline"
//     );
// }

function createTranslationContainer(
    translatedText: string,
    isInline: boolean
): HTMLElement {
    const shouldWrap = !isInline && translatedText.length >= 10;
    const container = document.createElement(shouldWrap ? "div" : "span");
    container.classList.add("translation-result");

    const fragment = document.createDocumentFragment();
    fragment.textContent = shouldWrap ? translatedText : " | " + translatedText;
    container.appendChild(fragment);

    return container;
}
