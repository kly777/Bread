/**
 * DOM 观察器钩子系统
 * 允许模块注册回调函数，在特定 DOM 事件发生时被调用，实现观察器与模块的解耦。
 */

export type NewElementsHook = (elements: Element[]) => void
export type AttributeChangesHook = (mutations: MutationRecord[]) => void
export type RemovedNodesHook = (nodes: Node[]) => void
export type DomStableHook = () => void

/**
 * 钩子集合
 */
export interface ObserverHooks {
        onNewElements: NewElementsHook[]
        onAttributeChanges: AttributeChangesHook[]
        onRemovedNodes: RemovedNodesHook[]
        onDomStable: DomStableHook[]
}

/**
 * 全局钩子实例（单例）
 */
const globalHooks: ObserverHooks = {
        onNewElements: [],
        onAttributeChanges: [],
        onRemovedNodes: [],
        onDomStable: [],
}

/**
 * 注册新元素钩子
 */
export function registerNewElementsHook(hook: NewElementsHook): void {
        globalHooks.onNewElements.push(hook)
}

/**
 * 注册属性变化钩子
 */
export function registerAttributeChangesHook(hook: AttributeChangesHook): void {
        globalHooks.onAttributeChanges.push(hook)
}

/**
 * 注册移除节点钩子
 */
export function registerRemovedNodesHook(hook: RemovedNodesHook): void {
        globalHooks.onRemovedNodes.push(hook)
}

/**
 * 注册 DOM 稳定钩子
 */
export function registerDomStableHook(hook: DomStableHook): void {
        globalHooks.onDomStable.push(hook)
}

/**
 * 触发新元素钩子
 */
export function triggerNewElements(elements: Element[]): void {
        for (const hook of globalHooks.onNewElements) {
                try {
                        hook(elements)
                } catch (error) {
                        console.error('Error in new elements hook:', error)
                }
        }
}

/**
 * 触发属性变化钩子
 */
export function triggerAttributeChanges(mutations: MutationRecord[]): void {
        for (const hook of globalHooks.onAttributeChanges) {
                try {
                        hook(mutations)
                } catch (error) {
                        console.error('Error in attribute changes hook:', error)
                }
        }
}

/**
 * 触发移除节点钩子
 */
export function triggerRemovedNodes(nodes: Node[]): void {
        for (const hook of globalHooks.onRemovedNodes) {
                try {
                        hook(nodes)
                } catch (error) {
                        console.error('Error in removed nodes hook:', error)
                }
        }
}

/**
 * 触发 DOM 稳定钩子
 */
export function triggerDomStable(): void {
        for (const hook of globalHooks.onDomStable) {
                try {
                        hook()
                } catch (error) {
                        console.error('Error in DOM stable hook:', error)
                }
        }
}

/**
 * 获取钩子集合（仅供测试使用）
 */
export function getHooks(): ObserverHooks {
        return globalHooks
}
