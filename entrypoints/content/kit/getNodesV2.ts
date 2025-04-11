// 预定义需要排除的标签列表（提升至模块作用域避免重复创建）
const EXCLUDED_TAGS = new Set([
    "input",
    "textarea",
    "select",
    "button",
    "script",
    "style",
    "noscript",
    "template",
]);

interface GetTextNodesOptions {
    excludeHidden?: boolean; // 是否排除隐藏元素
    minContentLength?: number; // 最小文本长度要求
}

/**
 * 获取指定根节点下所有符合条件的文本节点
 *
 * @param root - 遍历的起始根节点，默认为document.body
 * @param options - 配置选项对象
 * @param options.excludeHidden - 是否排除隐藏元素（默认true）
 * @param options.minContentLength - 文本内容的最小长度要求（默认1）
 * @returns 符合过滤条件的文本节点数组
 *
 * 功能说明：
 * 1. 自动排除预定义的非内容型标签（input/textarea等）
 * 2. 可选过滤隐藏元素（通过CSS计算样式判断）
 * 3. 过滤空白内容及满足最小长度要求的文本
 */
export function getTextNodes(
    root: Node = document.body,
    options: GetTextNodesOptions = {}
): Text[] {
    // 合并默认配置选项
    const { excludeHidden = true, minContentLength = 1 } = options;

    // 创建TreeWalker进行节点遍历，配置复合过滤条件
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node: Node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_ACCEPT;

            /* 过滤逻辑分三个层级处理 */
            // 1. 标签名称过滤：直接拒绝整个子树
            if (EXCLUDED_TAGS.has(parent.tagName.toLowerCase())) {
                return NodeFilter.FILTER_REJECT;
            }

            // 2. 可见性过滤：根据计算样式判断元素是否隐藏
            if (excludeHidden) {
                const style = window.getComputedStyle(parent);
                if (style.display === "none" || style.visibility === "hidden") {
                    return NodeFilter.FILTER_REJECT;
                }
            }

            // 3. 内容过滤：检查文本内容长度是否达标
            const content = node.textContent?.trim() || "";
            if (content.length < minContentLength) {
                return NodeFilter.FILTER_SKIP;
            }

            return NodeFilter.FILTER_ACCEPT;
        },
    });

    // 遍历收集所有符合条件的文本节点
    const textNodes: Text[] = [];
    while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        textNodes.push(node);
    }

    return textNodes;
}
