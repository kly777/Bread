export class HighlightFeature {
    private currentHighlight = {
        text: null as null | string,
        spans: [] as HTMLElement[],
    };

    private observer: MutationObserver;

    constructor() {
        this.observer = new MutationObserver((mutations) => {
            if (this.currentHighlight.text) {
                // 重新高亮以覆盖新内容
                this.removeExistingHighlights();
                this.highlightAllOccurrences(this.currentHighlight.text);
            }
        });
        this.switchHighlight = this.switchHighlight.bind(this);
    }
    public init(): void {
        console.log("highlight init");
        document.addEventListener("mouseup", this.switchHighlight);
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    public stop(): void {
        console.log("highlight stop");
        document.removeEventListener("mouseup", this.switchHighlight);
        this.observer.disconnect();
        this.removeExistingHighlights();
    }

    private removeExistingHighlights() {
        console.log("removeExistingHighlights");
        this.currentHighlight.spans.forEach((span) => {
            const parent = span.parentNode;
            parent?.replaceChild(
                document.createTextNode(
                    span.textContent ? span.textContent : ""
                ),
                span
            );
            parent?.normalize(); // 合并相邻文本节点
        });
        this.currentHighlight.spans = [];
    }

    private highlightTextInNode(node: Text, lowerCaseText: string) {
        const textLength = lowerCaseText.length;
        let nodeText = node.textContent || "";
        let lowerCaseNodeText = nodeText.toLowerCase();
        let startIdx = 0;

        while (
            (startIdx = lowerCaseNodeText.indexOf(lowerCaseText, startIdx)) !==
            -1
        ) {
            if (node.length < startIdx) break;

            const beforeSplit = node.splitText(startIdx);
            const afterHighlight = beforeSplit.splitText(textLength);

            const highlightedNode = beforeSplit;

            const span = document.createElement("span");
            span.className = "bread-highlight";
            span.textContent = highlightedNode.textContent;
            // span.style.border = "2px solid rgb(255, 153, 0)";
            // span.style.boxSizing = "border-box";
            span.style.backgroundColor = "rgba(255, 153, 0, 0.5)";
            span.style.display = "inline";
            span.style.lineHeight = "inherit"; // 继承行高
            span.style.verticalAlign = "baseline";

            highlightedNode.parentNode?.replaceChild(span, highlightedNode);

            this.currentHighlight.spans.push(span);

            lowerCaseNodeText = afterHighlight.textContent?.toLowerCase() || "";
            node = afterHighlight;
            startIdx = 0;
        }
    }
    private switchHighlight() {
        console.log("switchHighlight");
        const selectedText = getSelectedText();
        console.log("selectedText", selectedText);
        if (selectedText.length === 1 && /[a-zA-Z0-9]/.test(selectedText)) {
            return;
        }
        if (selectedText === "") {
            this.removeExistingHighlights();
            this.currentHighlight.text = selectedText;
        }
        if (selectedText && selectedText !== this.currentHighlight.text) {
            console.log(selectedText, this.currentHighlight.text);
            // 清除旧高亮
            this.removeExistingHighlights();
            // 高亮新内容
            this.highlightAllOccurrences(selectedText);
            this.currentHighlight.text = selectedText;
        }
    }

    private highlightAllOccurrences(text: string) {
        // 高亮所有匹配的文本
        console.log("highlightAllOccurrences", text);
        this.observer.disconnect();
        const textNodes = getTextNodes();
        const lowerCaseText = text.toLowerCase();

        textNodes.forEach((node) => {
            this.highlightTextInNode(node, lowerCaseText);
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
}

/**
 * 获取用户在界面上选中的文本
 * 此函数用于提取当前窗口中用户所选中的文本内容它通过window.getSelection方法获取Selection对象，进而转换为字符串并返回
 * 如果没有选中的文本，则返回空字符串
 *
 * @returns {string} 用户选中的文本内容，如果没有选中则返回空字符串
 */
function getSelectedText(): string {
    // 获取选中的文本
    console.log("getSelectedText");
    const selection = window.getSelection();
    return selection?.toString().trim() || "";
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
            // if (
            //     mouseDownElement &&
            //     node.parentElement &&
            //     node.parentElement.contains(mouseDownElement)
            // ) {
            //     continue;
            // }
            textNodes.push(node as Text);
        }
    }
    return textNodes;
}
