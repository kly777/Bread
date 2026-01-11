import { getTextNodes } from '../utils/dom/textNodes'

import {
        parentToTextNodesMap,
        bionicTextObserver,
} from './intersectionObserver/bionicObserver'
import {
        triggerNewElements,
        triggerAttributeChanges,
        triggerRemovedNodes,
        triggerDomStable,
} from './observerHooks'

/**
 * 管理DOM变更观察器的启动和停止
 */
export function manageMutationObserver(shouldObserve: boolean) {
        if (shouldObserve) {
                domMutationObserver.observe(document.body, {
                        childList: true,
                        subtree: true,
                        attributes: false,
                        // attributeFilter: ['target'],
                })
        } else {
                domMutationObserver.disconnect()
        }
}

/**
 * DOM变更观察器核心回调函数
 *
 *
 * 这是整个DOM观察系统的核心，负责处理所有DOM结构变化事件
 *
 * 核心处理步骤：
 * 1. 收集所有需要处理的新增节点 - 过滤和分类新增的DOM元素
 * 2. 处理移除节点：清理相关资源 - 防止内存泄漏和无效观察
 * 3. 统一处理新增节点的功能应用 - 根据设置应用翻译、仿生阅读等功能
 * 4. 延迟重新应用高亮避免循环触发 - 使用防抖机制确保DOM稳定
 */
const domMutationObserver: MutationObserver = new MutationObserver(
        (mutations: MutationRecord[]) => {
                // console.group('DOM Mutation Observer')
                // console.log(`检测到 ${mutations.length} 个DOM变更`)
                // console.log(mutations)

                // 处理属性变化（链接目标样式）
                processAttributeChanges(mutations)

                // 使用Set避免重复处理同一个元素
                const newElementsSet = new Set<Element>()
                const removedNodes: Node[] = []
                // let skippedElements = 0

                // 优化：批量处理mutation记录，减少循环嵌套
                mutations.forEach((mutation) => {
                        // console.log(
                        //         `Mutation: ${mutation.type}`,
                        //         mutation.target
                        // )

                        // 优化：使用更高效的新增节点处理
                        // skippedElements +=
                        processAddedNodes(mutation.addedNodes, newElementsSet)

                        // 收集移除节点
                        mutation.removedNodes.forEach((node) => {
                                // console.log(`移除节点: ${node.nodeName}`)
                                removedNodes.push(node)
                                handleRemovedNode(node)
                        })

                        // 优化：减少不必要的子树更新检查
                        if (
                                mutation.type === 'childList' &&
                                parentToTextNodesMap.size > 0
                        ) {
                                updateAffectedTextNodes(mutation.target)
                        }
                })

                // 触发移除节点钩子
                if (removedNodes.length > 0) {
                        triggerRemovedNodes(removedNodes)
                }

                const newElements = Array.from(newElementsSet)
                // console.log(
                //         `统计: ${newElements.length} 个新元素, ${skippedElements} 个跳过元素`
                // )

                // 处理新增元素的功能应用 - 核心业务逻辑
                if (newElements.length > 0) {
                        // console.log('开始处理新元素功能')
                        processNewElements(newElements)

                        // 延迟重新应用高亮（由高亮模块通过钩子处理）
                        // console.log('调度高亮更新')
                        scheduleHighlightUpdate()
                }

                // console.groupEnd()
        }
)

/**
 * 优化：专门处理新增节点，提高代码可读性和性能
 * @returns 跳过的元素数量
 */
function processAddedNodes(
        addedNodes: NodeList,
        newElementsSet: Set<Element>
): number {
        let skippedCount = 0
        for (const node of addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as Element

                        if (isInternalExtensionElement(element)) {
                                // console.log(
                                //         `跳过内部元素: ${element.tagName}.${Array.from(
                                //                 element.classList
                                //         ).join('.')}`
                                // )
                                skippedCount++
                                continue
                        }

                        console.log(`新增元素: ${element.tagName}`, element)
                        newElementsSet.add(element)
                }
        }
        return skippedCount
}

function isInternalExtensionElement(element: Element): boolean {
        // 使用类名快速检测，避免多次classList.contains调用
        const classList = element.classList
        return (
                classList?.contains('translation-result') ||
                classList?.contains('bread-highlight')
        )
}

/**
 * 优化：只更新受影响的文本节点映射
 */
function updateAffectedTextNodes(target: Node): void {
        if (target.nodeType === Node.ELEMENT_NODE) {
                const element = target as Element
                // 只有当目标元素在映射中时才更新
                if (parentToTextNodesMap.has(element)) {
                        updateTextNodesMap(element)
                }
        }
}

/**
 * 处理属性变化（target属性）
 * 触发属性变化钩子，让模块自行处理
 */
function processAttributeChanges(mutations: MutationRecord[]) {
        triggerAttributeChanges(mutations)
}

/**
 * 处理新增元素的功能应用
 */
function processNewElements(elements: Element[]) {
        // console.log(`处理 ${elements.length} 个新元素`)

        // 触发新元素钩子，让模块自行处理
        triggerNewElements(elements)

        // console.log(`完成处理 ${elements.length} 个元素`)
}

/**
 * 更新文本节点映射
 */
function updateTextNodesMap(element: Element) {
        if (parentToTextNodesMap.has(element)) {
                const texts = getTextNodes(element)
                const textsSet = new Set(texts)
                parentToTextNodesMap.set(element, textsSet)
        }
}

/**
 * 延迟重新应用高亮
 */
function scheduleHighlightUpdate() {
        // 使用防抖避免频繁重绘，并暂时关闭观察器避免循环触发
        window.setTimeout(() => {
                domMutationObserver.disconnect()
                // 触发 DOM 稳定钩子，让模块自行处理（例如高亮）
                triggerDomStable()
                // 重新开启观察器
                domMutationObserver.observe(document.body, {
                        childList: true,
                        subtree: true,
                        attributes: false,
                })
        }, 300)
}

/**
 * 处理DOM节点移除事件
 * @param node - 被移除的DOM节点
 * @remarks
 * 处理逻辑分两种情况：
 * 1. 元素节点：清理文本节点映射和观察器
 * 2. 文本节点：从父元素映射中删除
 * 优先级：先处理元素节点再处理文本节点
 */
function handleRemovedNode(node: Node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element
                parentToTextNodesMap.delete(element)
                bionicTextObserver.unobserve(element)
        } else if (node.nodeType === Node.TEXT_NODE) {
                const textNode = node as Text
                const parent = textNode.parentElement
                if (parent) {
                        const texts = parentToTextNodesMap.get(parent)
                        if (texts) {
                                // 直接尝试删除文本节点
                                if (
                                        texts.delete(textNode) &&
                                        texts.size === 0
                                ) {
                                        parentToTextNodesMap.delete(parent)
                                        bionicTextObserver.unobserve(parent)
                                }
                        }
                }
        }
}
