// highlightNodeV2.ts
interface TextNodeEntry {
    node: Text;
    start: number;
    end: number;
}

interface MatchRange {
    start: number;
    end: number;
}

function collectTextNodes(rootNode: Node): {
    nodes: TextNodeEntry[];
    mergedText: string;
} {
    const nodes: TextNodeEntry[] = [];
    let offset = 0;
    const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, {
        acceptNode: (node: Node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_ACCEPT;

            // 过滤1: 排除特定标签的父元素
            const excludeTags = [
                "input",
                "textarea",
                "select",
                "button",
                "script",
                "style",
            ];

            if (excludeTags.includes(parent.tagName.toLowerCase())) {
                return NodeFilter.FILTER_SKIP;
            }

            // 新增过滤2: 排除隐藏元素
            const style = window.getComputedStyle(parent);
            if (style.display === "none" || style.visibility === "hidden") {
                return NodeFilter.FILTER_SKIP;
            }

            return NodeFilter.FILTER_ACCEPT;
        },
    });

    while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        const text = node.textContent || "";
        nodes.push({
            node,
            start: offset,
            end: offset + text.length,
        });
        offset += text.length;
    }

    return {
        nodes,
        mergedText: nodes.map((n) => n.node.textContent).join(""),
    };
}

function findMatches(mergedText: string, selectedText: string): MatchRange[] {
    const matches: MatchRange[] = [];
    let index = 0;

    while ((index = mergedText.indexOf(selectedText, index)) !== -1) {
        matches.push({
            start: index,
            end: index + selectedText.length,
        });
        index += selectedText.length;
    }

    return matches;
}

function highlightMatches(nodes: TextNodeEntry[], matches: MatchRange[]): void {
    matches.forEach((match) => {
        let startNode: Text | null = null;
        let endNode: Text | null = null;
        let startPos = 0;
        let endPos = 0;

        // 查找起始结束节点（同原有逻辑）
        for (const entry of nodes) {
            if (entry.start <= match.start && entry.end >= match.start) {
                startNode = entry.node;
                startPos = match.start - entry.start;
            }
            if (entry.start <= match.end && entry.end >= match.end) {
                endNode = entry.node;
                endPos = match.end - entry.start;
            }
        }
        if (!startNode || !endNode) return;

        if (startNode === endNode) {
            const span = createSpanElement();
            span.className = "highlight";

            const nodeText = startNode.textContent || "";
            if (startPos > nodeText.length) return;
            if (endPos - startPos > nodeText.length - startPos) return;

            const textNode = startNode.splitText(startPos);
            const remaining = textNode.splitText(
                Math.min(endPos - startPos, textNode.length)
            );

            startNode.parentNode?.insertBefore(span, textNode);
            span.appendChild(textNode);
            startNode.parentNode?.insertBefore(remaining, span.nextSibling);
        } else {
            // 跨节点高亮逻辑
            const startIndex = nodes.findIndex((n) => n.node === startNode);
            const endIndex = nodes.findIndex((n) => n.node === endNode);

            // 处理起始节点
            const startSpan = createSpanElement();
            const startNodeText = startNode.textContent || "";
            if (startPos > startNodeText.length) return;

            const safeStartPos = Math.min(startPos, startNodeText.length);
            const startSplit = startNode.splitText(safeStartPos);
            startNode.parentNode?.insertBefore(startSpan, startSplit);
            startSpan.appendChild(startSplit);

            // 处理中间节点
            for (let i = startIndex + 1; i < endIndex; i++) {
                const span = createSpanElement();
                const node = nodes[i].node;
                node.parentNode?.replaceChild(span, node);
                span.appendChild(node);
            }

            // 处理结束节点
            const endSpan = createSpanElement();
            const endNodeText = endNode.textContent || "";
            const safeEndPos = Math.min(endPos, endNodeText.length);
            const endSplit = endNode.splitText(safeEndPos);
            endNode.parentNode?.insertBefore(endSpan, endNode.nextSibling);
            endSpan.appendChild(endNode.cloneNode(false));
            endSpan.appendChild(endSplit);
        }
    });
}

/**
 * 创建一个带有高亮样式的span元素
 *
 * 该函数用于创建一个新的span元素，并为其设置特定的样式和类名
 * 以便在页面中高亮显示文本
 *
 * @param textContent - span元素的文本内容
 * @returns 返回一个带有高亮样式的span元素
 */
function createSpanElement(): HTMLElement {
    //return document.createElement("span");
    const span = document.createElement("span");

    // span.textContent = textContent;
    // span.style.border = "2px solid rgb(255, 153, 0)";
    // span.style.boxSizing = "border-box";
    span.style.backgroundColor = "rgba(255, 153, 0, 0.5)";
    span.style.display = "inline";
    span.style.lineHeight = "inherit"; // 继承行高
    span.style.verticalAlign = "baseline";
    return span;
}

// 事件监听处理
document.addEventListener("mouseup", () => {
    highlight();
});

export function highlight(root: Node = document.body) {
    console.log("highlight");
    const selection = window.getSelection();
    if (!selection) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;
    console.log("selectedText", selectedText);

    // 清除旧高亮
    document.querySelectorAll(".highlight").forEach((span) => {
        const parent = span.parentNode;
        if (!parent) return;

        const textNode = document.createTextNode(span.textContent || "");
        parent.replaceChild(textNode, span);
    });

    // 收集和匹配文本
    const { nodes, mergedText } = collectTextNodes(root);
    console.log("mergedText", mergedText);
    if (!mergedText.includes(selectedText)) return;

    const matches = findMatches(mergedText, selectedText);
    if (matches.length === 0) return;

    highlightMatches(nodes, matches);
}
