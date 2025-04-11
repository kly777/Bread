import { getTextNodes } from "./kit/getNodes";

/**
 * 遍历并处理给定节点下的所有文本节点
 * 此函数首先获取所有文本节点，然后逐个处理它们
 * 在处理文本节点之前和之后，它会停止和重新启动对DOM树的观察，以确保性能和准确性
 *
 * @param root {Node} - 开始遍历的DOM树的根节点默认为文档的body元素
 */
export function bionicTextNodes(root: Node = document.body) {
    // console.log("processTextNodes");
    // 获取指定根节点下的所有文本节点
    const textNodes = getTextNodes(root);
    // 在处理文本节点之前，停止观察DOM树的变化

    // console.log("textNodes");
    // 遍历所有文本节点并逐个处理
    for (const text of textNodes) {
        processTextNode(text);
    }
}

export function stopBionic() {
    document.querySelectorAll(".bionic-text").forEach((el) => {
        el.outerHTML = el.innerHTML;
    });
}

/**
 * 处理文本节点，将其内容拆分为英文单词和中文字符，并分别应用不同的处理方式
 *
 * 该函数首先获取文本节点的内容，并通过正则表达式将内容分割为英文单词、中文字符和其他字符
 * 然后根据字符类型分别调用相应的处理函数生成新的DOM片段
 * 最终使用新生成的DOM片段替换原始文本节点
 *
 * @param node 待处理的文本节点
 */
function processTextNode(node: Text): void {
    const text = node.textContent || "";
    if (!text.trim()) return; // 忽略空白文本节点

    /**
     * 使用正则表达式将文本分割成多个部分
     * 正则表达式([a-zA-Z\u4e00-\u9fa5]+)用于匹配并保留英文单词和中文字符
     */
    const parts = text.split(/([a-zA-Z\u4e00-\u9fa5]+)/);

    const fragment = document.createDocumentFragment();
    parts.forEach((part) => {
        if (/^[a-zA-Z]+$/.test(part)) {
            // 处理英文单词，调用bionicEn函数进行特殊处理
            fragment.appendChild(bionicEn(part));
        } else if (/^[\u4e00-\u9fa5]+$/.test(part)) {
            // 处理中文字符，调用bionicCn函数进行特殊处理
            fragment.appendChild(bionicCn(part));
        } else {
            // 对于其他字符（如标点符号等），保持原样不变
            fragment.appendChild(document.createTextNode(part));
        }
    });
    // console.log(fragment.textContent);

    // 使用新生成的DOM片段替换原始文本节点
    node.parentNode?.replaceChild(fragment, node);
}

function bionicEn(word: string): DocumentFragment {
    const halfIndex = Math.floor(word.length / 3);
    return createBionicWord(word, halfIndex);
}

function bionicCn(word: string): DocumentFragment {
    const boldIndex = word.length >= 4 ? 2 : 1;
    return createBionicWord(word, boldIndex);
}

function createBionicWord(word: string, boldIndex: number): DocumentFragment {
    if (word.length === 0) return document.createDocumentFragment(); // 处理空字符串

    const firstHalf = word.slice(0, boldIndex);
    const secondHalf = word.slice(boldIndex);

    const fragment = document.createDocumentFragment();
    if (firstHalf) fragment.appendChild(createBoldElement(firstHalf)); // 避免空文本节点
    if (secondHalf) fragment.appendChild(document.createTextNode(secondHalf)); // 避免空文本节点

    return fragment;
}
function createBoldElement(text: string): HTMLElement {
    const strong = document.createElement("b");
    strong.textContent = text;
    strong.style.display = "inline";
    strong.classList.add("bionic-text");
    return strong;
}
