/**
 * 获取文档中所有可见文本节点
 * 此函数使用TreeWalker遍历文档中的所有文本节点，并排除了一些特定标签内的文本节点，以避免不必要的处理
 * 特定标签包括：input, textarea, select, button, script, style
 *
 * @returns {Text[]} 文本节点数组，包含所有可见的文本节点
 */
export function getTextNodes(root: Node = document.body): Text[] {
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
