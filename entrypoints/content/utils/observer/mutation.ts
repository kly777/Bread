/**
 * MutationObserver 相关工具函数
 *
 * 提供 MutationObserver 的管理和操作功能
 */

/**
 * 管理 MutationObserver 的启用和禁用
 *
 * @param shouldObserve - 是否启用观察
 */
export function manageMutationObserver(shouldObserve: boolean): void {
        if (shouldObserve) {
                domMutationObserver.observe(document.body, {
                        childList: true,
                        subtree: true,
                })
        } else {
                domMutationObserver.disconnect()
        }
}

/**
 * 全局 MutationObserver 实例
 */
const domMutationObserver: MutationObserver = new MutationObserver(
        (mutations: MutationRecord[]) => {
                mutations.forEach((mutation) => {
                        if (mutation.type === 'childList') {
                                const addedElements: Element[] = []

                                mutation.addedNodes.forEach((node) => {
                                        if (
                                                node.nodeType ===
                                                Node.ELEMENT_NODE
                                        ) {
                                                addedElements.push(
                                                        node as Element
                                                )
                                        }
                                })

                                if (addedElements.length > 0) {
                                        processNewElements(addedElements)
                                }
                        }

                        if (mutation.type === 'childList') {
                                mutation.removedNodes.forEach((node) => {
                                        handleRemovedNode(node)
                                })
                        }
                })
        }
)

/**
 * 处理新添加的元素
 *
 * @param elements - 新添加的元素数组
 */
function processNewElements(elements: Element[]): void {
        elements.forEach((element) => {
                updateTextNodesMap(element)
                scheduleHighlightUpdate(element)
        })
}

/**
 * 更新文本节点映射
 *
 * @param element - 要处理的元素
 */
function updateTextNodesMap(element: Element): void {
        // 这里可以添加文本节点映射的更新逻辑
        // 例如：parentToTextNodesMap 的更新
}

/**
 * 调度高亮更新
 *
 * @param element - 需要更新高亮的元素
 */
function scheduleHighlightUpdate(element: Element): void {
        // 延迟执行以避免频繁更新
        window.setTimeout(() => {
                // 这里可以添加高亮更新的逻辑
        }, 100)
}

/**
 * 处理被移除的节点
 *
 * @param node - 被移除的节点
 */
function handleRemovedNode(node: Node): void {
        if (node.nodeType === Node.ELEMENT_NODE) {
                // 这里可以添加节点移除时的清理逻辑
                // 例如：从 parentToTextNodesMap 中移除对应的文本节点
        }
}

/**
 * 创建自定义 MutationObserver
 *
 * @param callback - 观察器回调函数
 * @param options - 观察器配置选项
 * @returns MutationObserver 实例
 */
export function createMutationObserver(
        callback: MutationCallback,
        options: MutationObserverInit = { childList: true, subtree: true }
): MutationObserver {
        return new MutationObserver(callback)
}

/**
 * 观察指定元素的变化
 *
 * @param observer - MutationObserver 实例
 * @param target - 要观察的目标元素
 * @param options - 观察器配置选项
 */
export function observeMutations(
        observer: MutationObserver,
        target: Node,
        options: MutationObserverInit = { childList: true, subtree: true }
): void {
        observer.observe(target, options)
}

/**
 * 停止观察变化
 *
 * @param observer - MutationObserver 实例
 */
export function disconnectMutations(observer: MutationObserver): void {
        observer.disconnect()
}
