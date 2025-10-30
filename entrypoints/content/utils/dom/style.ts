/**
 * 样式计算相关工具函数
 *
 * 提供元素样式计算和布局判断功能
 */

/**
 * 判断元素是否为内联元素
 *
 * @param element - 要检查的元素
 * @returns 如果是内联元素返回 true，否则返回 false
 */
export function isInlineElement(element: HTMLElement): boolean {
        // 定义内联显示模式的合法枚举值
        const inlineDisplayValues = new Set([
                'inline',
                'inline-block',
                'inline-flex',
                'inline-grid',
                'inline-table',
        ])

        const display = window.getComputedStyle(element).display
        return inlineDisplayValues.has(display)
}

/**
 * 判断元素是否为定位元素（绝对定位或固定定位）
 *
 * 绝对定位/固定定位元素通常有特殊布局需求，行内容器更利于保持原有定位关系
 *
 * @param element - 要检查的元素
 * @returns 如果是定位元素返回 true，否则返回 false
 */
export function isPositionedElement(element: HTMLElement): boolean {
        const position = window.getComputedStyle(element).position
        return position === 'absolute' || position === 'fixed'
}

/**
 * 判断元素是否在弹性布局上下文中
 *
 * 弹性布局/网格布局中的子元素使用块级容器可能破坏布局结构
 *
 * @param element - 要检查的元素
 * @returns 如果在弹性布局上下文中返回 true，否则返回 false
 */
export function isInFlexContext(element: HTMLElement): boolean {
        const parent = element.parentElement
        if (!parent) return false

        const parentStyle = window.getComputedStyle(parent)
        return (
                parentStyle.display === 'flex' ||
                parentStyle.display === 'inline-flex'
        )
}

/**
 * 判断元素是否有尺寸约束
 *
 * 有明确宽度限制的元素使用块级容器可能导致文本截断
 *
 * @param element - 要检查的元素
 * @returns 如果有尺寸约束返回 true，否则返回 false
 */
export function hasSizeConstraints(element: HTMLElement): boolean {
        const style = window.getComputedStyle(element)
        return (
                style.width !== 'auto' ||
                style.maxWidth !== 'none' ||
                style.minWidth !== 'auto'
        )
}

/**
 * 判断元素是否有文本溢出处理
 *
 * 需要文本溢出处理的元素更适合行内容器保持原有截断效果
 *
 * @param element - 要检查的元素
 * @returns 如果有文本溢出处理返回 true，否则返回 false
 */
export function hasTextOverflow(element: HTMLElement): boolean {
        const overflow = window.getComputedStyle(element).overflow
        return overflow === 'hidden' || overflow === 'clip'
}

/**
 * 判断元素是否有特殊垂直对齐方式
 *
 * 设置特殊垂直对齐方式的元素使用块级容器可能破坏对齐效果
 *
 * @param element - 要检查的元素
 * @returns 如果有特殊垂直对齐方式返回 true，否则返回 false
 */
export function hasVerticalAlign(element: HTMLElement): boolean {
        const align = window.getComputedStyle(element).verticalAlign
        return align !== 'baseline'
}

/**
 * 判断元素是否应该使用行内容器包裹
 *
 * 综合考虑多种布局因素，决定是否使用行内容器
 *
 * @param element - 要检查的元素
 * @returns 如果应该使用行内容器返回 true，否则返回 false
 */
export function shouldWrapElement(element: HTMLElement): boolean {
        // 获取元素当前计算后的文本换行模式
        const whiteSpace = window.getComputedStyle(element).whiteSpace

        // 如果元素本身设置了 nowrap，则使用行内容器
        if (whiteSpace === 'nowrap') {
                return true
        }

        // 检查其他需要行内容器的情况
        return (
                isInlineElement(element) ||
                isPositionedElement(element) ||
                isInFlexContext(element) ||
                hasSizeConstraints(element) ||
                hasTextOverflow(element) ||
                hasVerticalAlign(element)
        )
}

/**
 * 获取元素样式信息摘要
 *
 * @param element - 要检查的元素
 * @returns 包含样式信息的对象
 */
export function getElementStyleInfo(element: HTMLElement): {
        shouldUseInline: boolean
        display: string
        position: string
        whiteSpace: string
        overflow: string
} {
        const style = window.getComputedStyle(element)
        return {
                shouldUseInline: shouldWrapElement(element),
                display: style.display,
                position: style.position,
                whiteSpace: style.whiteSpace,
                overflow: style.overflow,
        }
}
