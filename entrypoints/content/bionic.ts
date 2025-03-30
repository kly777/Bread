function getGoodStrong(text: string): HTMLElement {
    const strong = document.createElement("strong");
    strong.textContent = text;
    strong.style.display = "inline";
    strong.classList = "bionic-text";
    return strong;
}

function bionicWord(word: string, boldIndex: number): DocumentFragment {
    const firstHalf = word.slice(0, boldIndex);
    const secondHalf = word.slice(boldIndex);

    const fragment = document.createDocumentFragment();
    const strong = getGoodStrong(firstHalf);
    fragment.appendChild(strong);
    fragment.appendChild(document.createTextNode(secondHalf));

    return fragment;
}

function bionicEn(word: string): DocumentFragment {
    const halfIndex = Math.floor(word.length / 3);
    return bionicWord(word, halfIndex);
}

function bionicCn(word: string): DocumentFragment {
    const boldIndex = word.length >= 4 ? 2 : 1;
    return bionicWord(word, boldIndex);
}

function processTextNode(node: Text): void {
    console.log("processTextNode");
    const text = node.textContent || "";
    console.log(text);
    // 使用正则表达式匹配英文单词和中文字符
    // const parts = text.split(/([a-zA-Z]+)|([\u4e00-\u9fa5]+)/);
    const parts = text.split(/([a-zA-Z\u4e00-\u9fa5]+)/);
    console.log(parts);

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
                    if (
                        node.parentElement &&
                        [
                            "input",
                            "textarea",
                            "select",
                            "button",
                            "script",
                            "style",
                        ].includes(node.parentElement.tagName.toLowerCase())
                    ) {
                    } else {
                        this.processAddedNode(node);
                    }
                });
            });
            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
        });
    }
    private processAddedNode(node: Node): void {
        if (node.nodeType === Node.TEXT_NODE) {
            processTextNode(node as Text);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const walker = document.createTreeWalker(
                node,
                NodeFilter.SHOW_TEXT,
                {
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
                            ].includes(node.parentElement.tagName.toLowerCase())
                        ) {
                            return NodeFilter.FILTER_SKIP;
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    },
                }
            );
            let textNode;
            while ((textNode = walker.nextNode()) !== null) {
                processTextNode(textNode as Text);
            }
        }
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

    private processTextNodes(root: Node = document.body) {
        console.log("processTextNodes");
        const textNodes = getTextNodes();
        this.observer.disconnect();
        for (const text of textNodes) {
            processTextNode(text);
        }
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
function getTextNodes(): Text[] {
    console.log("getTextNodes");
    // 获取要处理的nodes
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
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
                    ].includes(node.parentElement.tagName.toLowerCase())
                ) {
                    return NodeFilter.FILTER_SKIP;
                }
                return NodeFilter.FILTER_ACCEPT;
            },
        }
    );
    let node;
    while ((node = walker.nextNode()) !== null) {
        if (node.nodeType === Node.TEXT_NODE) {
            textNodes.push(node as Text);
        }
    }
    return textNodes;
}
