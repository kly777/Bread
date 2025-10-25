/**
 * DOM变更观察器模块
 * 功能：监听DOM结构变化并触发相应处理逻辑，与设置管理器和特性观察器协同工作
 * 设计决策：
 * 1. 使用单例模式创建MutationObserver实例
 * 2. 结合IntersectionObserver实现按需加载特性处理
 * 3. 维护元素-文本节点映射关系支持动态更新
 */
import { getTextNodes } from '../kit/getTextNodes'
import { getSetting } from '../settingManager'

import {
        parentToTextNodesMap,
        bionicTextObserver,
        observeElementNode,
} from './intersectionObserver/bionicObserver'
import { observeTranslateElements as translateAddedElement } from './intersectionObserver/translateObserver'
import { getHighlightManager } from '../feature/highlight/highlightManager'

export function manageMutationObserver(shouldObserve: boolean) {
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
 * DOM变更观察器核心回调函数
 * @remarks
 * 核心处理步骤：
 * 1. 收集所有需要处理的新增节点
 * 2. 处理移除节点：清理相关资源
 * 3. 统一处理新增节点的功能应用
 * 4. 延迟重新应用高亮避免循环触发
 */
const domMutationObserver: MutationObserver = new MutationObserver(
        (mutations: MutationRecord[]) => {
                console.log('domMutationObserver observed some changes')

                // 收集所有新增元素节点
                const newElements: Element[] = []

                for (const mutation of mutations) {
                        // 处理新增节点
                        for (const node of mutation.addedNodes) {
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                        const element = node as Element
                                        // 跳过翻译模块创建的翻译结果容器和高亮元素，避免循环触发
                                        if (element.classList?.contains('translation-result') ||
                                                element.classList?.contains('bread-highlight')) {
                                                continue
                                        }
                                        newElements.push(element)
                                }
                        }

                        // 处理移除节点
                        for (const node of mutation.removedNodes) {
                                handleRemovedNode(node)
                        }

                        // 处理子树变动（如元素被替换或修改）
                        if (mutation.type === 'childList') {
                                for (const child of mutation.target.childNodes) {
                                        if (child.nodeType === Node.ELEMENT_NODE) {
                                                updateTextNodesMap(child as Element)
                                        }
                                }
                        }
                }

                // 处理新增元素的功能应用
                if (newElements.length > 0) {
                        processNewElements(newElements)

                        // 如果高亮功能已启用，延迟重新应用高亮
                        const highlightManager = getHighlightManager()
                        if (highlightManager.isEnabled()) {
                                scheduleHighlightUpdate(highlightManager)
                        }
                }
        }
)

/**
 * 处理新增元素的功能应用
 */
function processNewElements(elements: Element[]) {
        const translateEnabled = getSetting().translate
        const bionicEnabled = getSetting().bionic

        for (const element of elements) {
                if (translateEnabled) {
                        translateAddedElement(element)
                }
                if (bionicEnabled) {
                        observeElementNode(element)
                }
        }
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
function scheduleHighlightUpdate(highlightManager: ReturnType<typeof getHighlightManager>) {
        // 使用防抖避免频繁重绘，并暂时关闭观察器避免循环触发
        window.setTimeout(() => {
                domMutationObserver.disconnect()
                highlightManager.highlightAll()
                // 重新开启观察器
                domMutationObserver.observe(document.body, {
                        childList: true,
                        subtree: true,
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
