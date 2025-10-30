/**
 * 文本选择相关工具函数
 *
 * 提供获取和处理用户选中文本的功能
 */

/**
 * 获取当前选中的文本
 *
 * 此函数从给定的 Selection 对象中提取选中的文本并返回
 * 如果没有选中的文本或者 selection 对象为空，则返回空字符串
 *
 * @returns 返回选中的文本，如果无文本被选中则返回空字符串
 */
export function getSelectedText(): string {
        // 获取当前用户选中的内容
        const selection = window.getSelection()
        // 检查是否有选中的文本，如果没有则直接返回
        if (!selection) return ''
        return selection.toString().trim().toLowerCase() || ''
}

/**
 * 检查当前是否有文本被选中
 *
 * @returns 如果有文本被选中返回 true，否则返回 false
 */
export function hasSelection(): boolean {
        const selection = window.getSelection()
        return !!(selection && selection.toString().trim())
}

/**
 * 获取选区范围信息
 *
 * @returns 选区范围信息对象，如果没有选区则返回 null
 */
export function getSelectionRange(): Range | null {
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) {
                return null
        }
        return selection.getRangeAt(0)
}
