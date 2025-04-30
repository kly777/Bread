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
        NodeFilter.SHOW_TEXT, // 只遍历文本节点
        {
            acceptNode: (node) => {
                const parent = node.parentElement;
                // 如果父元素存在并且在排除列表中，则跳过该节点
                if (parent && EXCLUDE_TAGS.includes(parent.tagName)) {
                    return NodeFilter.FILTER_SKIP;
                }
                // 所有传入此函数的节点都已是文本节点（由 SHOW_TEXT 控制）
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
        const isInline = isInlineElement(element);
        const shouldWrap = !isInline && translatedText.length >= 10;

        const resultContent = shouldWrap
            ? translatedText
            : " | " + translatedText;

        const existing = element.querySelector(".translation-result");
        if (existing) {
            // 存在则直接替换内容（更高效的更新方式）
            existing.textContent = resultContent;
        } else {
            // 不存在则创建并添加新容器
            const resultContainer = createTranslationContainer(
                resultContent,
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

function isInlineElement(element: HTMLElement): boolean {
    const display = window.getComputedStyle(element).display;
    return display === "inline" || display === "inline-block";
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

    const fragment = document.createDocumentFragment();
    fragment.textContent = translatedText;
    container.appendChild(fragment);

    return container;
}
