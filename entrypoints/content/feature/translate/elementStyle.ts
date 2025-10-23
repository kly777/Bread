/**
 * 判断指定HTML元素是否为内联元素
 * @param element 需要检测的HTML元素
 * @returns 当元素显示模式为inline/inline-block时返回true，否则返回false
 */
export function isInlineElement(element: HTMLElement): boolean {
        // 定义内联显示模式的合法枚举值
        const INLINE_DISPLAYS = ['inline', 'inline-block', 'inline-flex']

        /*
         * 获取并标准化元素的 display 样式值
         * - 使用 window.getComputedStyle 确保获取最终应用的样式
         * - trim() 去除首尾空白
         * - toLowerCase() 保证与枚举值匹配
         */
        const display = window
                .getComputedStyle(element)
                .display.trim()
                .toLowerCase()

        return INLINE_DISPLAYS.includes(display)
}
//绝对定位/固定定位元素通常有特殊布局需求，行内容器更利于保持原有定位关系
export function isPositionedElement(element: HTMLElement): boolean {
        const position = window.getComputedStyle(element).position
        return ['absolute', 'fixed', 'sticky'].includes(position)
}
//弹性布局/网格布局中的子元素使用块级容器可能破坏布局结构
export function isInFlexContext(element: HTMLElement): boolean {
        const parent = element.parentElement
        if (!parent) return false
        const display = window.getComputedStyle(parent).display
        return display.includes('flex') || display.includes('grid')
}
//有明确宽度限制的元素使用块级容器可能导致文本截断
export function hasSizeConstraints(element: HTMLElement): boolean {
        const style = window.getComputedStyle(element)
        return style.width.trim() !== 'auto' || style.maxWidth.trim() !== 'none'
}
//需要文本溢出处理的元素更适合行内容器保持原有截断效果
export function hasTextOverflow(element: HTMLElement): boolean {
        const overflow = window.getComputedStyle(element).overflow
        return overflow.includes('hidden') || overflow.includes('scroll')
}
//设置特殊垂直对齐方式的元素使用块级容器可能破坏对齐效果
export function hasVerticalAlign(element: HTMLElement): boolean {
        const align = window.getComputedStyle(element).verticalAlign
        return align !== 'auto' && align !== 'baseline'
}
// //包含其他DOM元素的混合内容更适合使用行内容器包裹
// export function hasMixedContent(element: HTMLElement): boolean {
//     return Array.from(element.childNodes).some(
//         (node) =>
//             node.nodeType === Node.ELEMENT_NODE &&
//             node !== element.querySelector(".translation-result")
//     );
// }
/**
 * 判断元素是否设置了文本自动换行样式
 * @param element - 需要检测的HTML元素
 * @returns 当元素的textWrapMode为'wrap'时返回true
 */
export function shouldWrapElement(element: HTMLElement): boolean {
        // 获取元素当前计算后的文本换行模式
        const textWrapMode = window
                .getComputedStyle(element)
                .textWrapMode.trim()
        // 判断是否为强制换行模式
        console.log(textWrapMode)
        return textWrapMode === 'wrap' || textWrapMode === ''
}
