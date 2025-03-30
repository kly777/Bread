function createBoldElement(text: string): HTMLElement {
    const strong = document.createElement("b");
    strong.textContent = text;
    strong.style.display = "inline";
    strong.classList.add("bionic-text");
    return strong;
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

function bionicEn(word: string): DocumentFragment {
    const halfIndex = Math.floor(word.length / 3);
    return createBionicWord(word, halfIndex);
}

function bionicCn(word: string): DocumentFragment {
    const boldIndex = word.length >= 4 ? 2 : 1;
    return createBionicWord(word, boldIndex);
}

/**
 * 处理文本节点，将其内容拆分为英文单词和中文字符，并分别应用不同的处理方式
 * @param node 待处理的文本节点
 */
function processTextNode(node: Text): void {
    const text = node.textContent || "";
    if (!text.trim()) return; // 忽略空白文本节点

    const parts = text.split(/([a-zA-Z\u4e00-\u9fa5]+)/);

    const fragment = document.createDocumentFragment();
    parts.forEach((part) => {
        if (/^[a-zA-Z]+$/.test(part)) {
            // 处理英文单词
            fragment.appendChild(bionicEn(part));
        } else if (/^[\u4e00-\u9fa5]+$/.test(part)) {
            // 处理中文字符
            fragment.appendChild(bionicCn(part));
        } else {
            // 其他字符保持不变
            fragment.appendChild(document.createTextNode(part));
        }
    });
    // console.log(fragment.textContent);

    node.parentNode?.replaceChild(fragment, node);

    // node.parentNode?.replaceChild(document.createTextNode(processedWords.join("")), node);
    //  node.textContent = processedWords.join("");
}

export class BionicFeature {
    private observer: MutationObserver;

    constructor() {
        this.observer = new MutationObserver((mutations) => {
            this.observer.disconnect();
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    node.parentElement?.classList.add("observer");
                    this.processTextNodes(node);
                });
            });
            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
        });
    }

    public init(): void {
        this.processTextNodes();
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    public stop(): void {
        this.observer.disconnect();
        document.querySelectorAll(".bionic-text").forEach((el) => {
            el.outerHTML = el.innerHTML;
        });
    }

    /**
     * 遍历并处理给定节点下的所有文本节点
     * 此函数首先获取所有文本节点，然后逐个处理它们
     * 在处理文本节点之前和之后，它会停止和重新启动对DOM树的观察，以确保性能和准确性
     *
     * @param root {Node} - 开始遍历的DOM树的根节点默认为文档的body元素
     */
    private processTextNodes(root: Node = document.body) {
        console.log("processTextNodes");
        // 获取指定根节点下的所有文本节点
        const textNodes = getTextNodes(root);
        // 在处理文本节点之前，停止观察DOM树的变化
        this.observer.disconnect();
        console.log("textNodes");
        // 遍历所有文本节点并逐个处理
        for (const text of textNodes) {
            processTextNode(text);
        }
        // 处理完文本节点后，重新开始观察DOM树的变化，以监控未来的更改
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
}

/**
 * 获取文档中所有可见文本节点
 * 此函数使用TreeWalker遍历文档中的所有文本节点，并排除了一些特定标签内的文本节点，以避免不必要的处理
 * 特定标签包括：input, textarea, select, button, script, style
 *
 * @returns {Text[]} 文本节点数组，包含所有可见的文本节点
 */
function getTextNodes(root: Node = document.body): Text[] {
    console.log("getTextNodes");
    // 获取要处理的nodes
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node: Node) => {
            if (
                node.parentElement &&
                [
                    "input",
                    "textarea",
                    "select",
                    "button",
                    "script",
                    "style",
                    "div",
                ].includes(node.parentElement.tagName.toLowerCase())
            ) {
                return NodeFilter.FILTER_SKIP;
            }
            return NodeFilter.FILTER_ACCEPT;
        },
    });
    let node;
    while ((node = walker.nextNode()) !== null) {
        if (node.nodeType === Node.TEXT_NODE) {
            textNodes.push(node as Text);
        }
    }
    return textNodes;
}
