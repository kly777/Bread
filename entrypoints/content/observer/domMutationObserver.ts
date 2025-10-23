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
 * 1. 暂停所有特性观察器避免冲突
 * 2. 处理新增节点：根据设置启用翻译或仿生功能
 * 3. 处理移除节点：清理相关资源
 * 4. 处理子树变动：更新文本节点映射
 * 异常处理：自动忽略无效节点操作
 */
const domMutationObserver: MutationObserver = new MutationObserver(
        (mutations: MutationRecord[]) => {
                // pin()
                console.log('domMutationObserver observed some changes')
                mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach((node) => {
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                        if (getSetting().translate) {
                                                translateAddedElement(
                                                        node as Element
                                                )
                                        }
                                        if (getSetting().bionic) {
                                                observeElementNode(
                                                        node as Element
                                                )
                                        }
                                }
                        })

                        mutation.removedNodes.forEach((node) => {
                                handleRemovedNode(node)
                        })

                        // 处理子树变动（如元素被替换或修改）
                        if (mutation.type === 'childList') {
                                mutation.target.childNodes.forEach((child) => {
                                        if (
                                                child.nodeType ===
                                                Node.ELEMENT_NODE
                                        ) {
                                                const element = child as Element
                                                // 检查该元素是否存在于映射中，并重新校验其文本节点
                                                if (
                                                        parentToTextNodesMap.has(
                                                                element
                                                        )
                                                ) {
                                                        // 重新获取该元素的所有文本节点并更新映射
                                                        const texts =
                                                                getTextNodes(
                                                                        element
                                                                )
                                                        const textsSet =
                                                                new Set(texts)

                                                        parentToTextNodesMap.set(
                                                                element,
                                                                textsSet
                                                        )
                                                }
                                        }
                                })
                        }
                })
        }
)

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
