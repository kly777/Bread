/**
 * 文本节点获取工具函数
 *
 * 提供获取和过滤文本节点的功能，支持多种过滤条件
 */

/**
 * 预定义需要排除的标签列表
 * 这些标签通常不包含可读文本内容
 */
const EXCLUDED_TAGS = new Set([
        'input',
        'textarea',
        'select',
        'button',
        'script',
        'style',
        'noscript',
        'template',
        'svg',
        'img',
        'audio',
        'video',
        'option',
        'head',
        'iframe',
        'i',
])

/**
 * 文本节点获取选项接口
 */
export interface GetTextNodesOptions {
        /** 是否排除隐藏元素，默认为 true */
        excludeHidden?: boolean
        /** 文本内容的最小长度要求，默认为 0 */
        minContentLength?: number
}

/**
 * 获取指定根节点下所有符合条件的文本节点
 *
 * @param root - 遍历的起始根节点，默认为 document.body
 * @param options - 配置选项对象
 * @returns 符合过滤条件的文本节点数组
 *
 * 功能说明：
 * 1. 自动排除预定义的非内容型标签（input/textarea等）
 * 2. 可选过滤隐藏元素（通过CSS计算样式判断）
 * 3. 过滤空白内容及满足最小长度要求的文本
 * 4. 支持 Shadow DOM 内容访问
 */
export function getTextNodes(
        root: Node = document.body,
        options: GetTextNodesOptions = {}
): Text[] {
        const walker = getTextWalker(root, options)

        // 遍历收集所有符合条件的文本节点
        const textNodes: Text[] = []
        while (walker.nextNode()) {
                const node = walker.currentNode as Text
                textNodes.push(node)
        }

        return textNodes
}

/**
 * 创建文本节点遍历器
 *
 * @param root - 遍历起始节点，默认为 document.body
 * @param options - 过滤配置选项
 * @returns 配置好的 TreeWalker 实例
 */
export function getTextWalker(
        root: Node = document.body,
        options: GetTextNodesOptions = {}
): TreeWalker {
        // 合并默认配置选项
        const { excludeHidden = true, minContentLength = 0 } = options

        const acceptNode = (node: Node) => {
                const parent = node.parentElement

                if (!parent) return NodeFilter.FILTER_ACCEPT

                // 缓存样式以避免重复计算
                const style = window.getComputedStyle(parent)

                // 1. 标签名称过滤：直接拒绝整个子树
                if (EXCLUDED_TAGS.has(parent.tagName.toLowerCase())) {
                        return NodeFilter.FILTER_REJECT
                }

                // 2. 可见性过滤：根据计算样式判断元素是否隐藏
                if (excludeHidden) {
                        if (
                                style.display === 'none' ||
                                style.visibility === 'hidden'
                        ) {
                                return NodeFilter.FILTER_REJECT
                        }
                }

                // 3. 内容过滤：检查文本内容长度是否达标
                const content = node.textContent?.trim() || ''
                if (content.length < minContentLength) {
                        return NodeFilter.FILTER_REJECT
                }

                // 4. Shadow DOM 处理
                if (node.parentElement?.shadowRoot === node.getRootNode()) {
                        return NodeFilter.FILTER_ACCEPT // 允许访问 Shadow DOM 内容
                }

                return NodeFilter.FILTER_ACCEPT
        }

        // 创建 TreeWalker 进行节点遍历，配置复合过滤条件
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                acceptNode,
        })
        return walker
}
