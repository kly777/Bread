import { intersectionObserverOptions } from './options'

import { getTextNodes } from '../../utils/dom/textNodes'

import { findNearestNonTextAncestor } from '../../utils/dom/traversal'

/**
 * 存储当前可见的非文本父元素集合
 * 用于跟踪当前在视口内的元素
 */
export const nonTextParentElements = new Set<Element>()

const continuedObserver = new IntersectionObserver((entries) => {
        console.log('continuedObserver callback')
        entries.forEach((entry) => {
                if (entry.isIntersecting) {
                        const element = entry.target
                        nonTextParentElements.add(
                                findNearestNonTextAncestor(element)
                        )
                        // if (ans instanceof HTMLElement) {

                        //     ans.style.backgroundColor = "red";
                        // }
                } else {
                        const element = entry.target
                        nonTextParentElements.delete(
                                findNearestNonTextAncestor(element)
                        )
                }
                // console.log("nonTextParentElements changed", nonTextParentElements);
        })
}, intersectionObserverOptions)

/**
 * 初始化持续观察器
 * 执行流程：
 * 1. 获取所有有效文本节点（过滤规则见getTextNodes）
 * 2. 定位每个文本节点的最近块级容器
 * 3. 开始观察这些容器的可见性变化
 */
export function initializeContinuedObserver() {
        // 使用getTextNodes的默认配置：
        // 1. 排除交互元素 2. 过滤隐藏元素 3. 最小文本长度0
        getTextNodes().forEach((text) => {
                const parent = text.parentElement
                if (parent) {
                        // 获取最近的稳定布局容器（跳过行内元素）
                        continuedObserver.observe(
                                findNearestNonTextAncestor(parent)
                        )
                }
        })
}

/**
 * 观察指定文本节点的祖先元素
 * @param text - 需要观察的文本节点
 */
export function observeTextAncestor(text: Text) {
        const parent = text.parentElement // 获取文本节点的直接父元素
        if (parent) {
                // 开始观察最近的非文本祖先元素
                continuedObserver.observe(findNearestNonTextAncestor(parent))
        }
}
