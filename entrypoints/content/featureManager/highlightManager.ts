import { getHighlightManager, destroyHighlightManager } from '../feature/highlight/highlightManager'
import { HighlightPanel } from '../feature/highlight/highlightPanel'

let highlightPanel: HighlightPanel | null = null
let isHighlightActive = false

/**
 * 开启文本高亮功能
 * 初始化高亮管理器并自动提取关键词
 */
export async function openHighlight() {
        if (isHighlightActive) return

        const manager = getHighlightManager()
        console.log('Highlight Manager Config:', manager.getConfig())

        // 自动提取关键词
        await manager.autoExtractAndHighlight()

        // 启动高亮
        manager.start()

        // 创建控制面板
        highlightPanel = new HighlightPanel(manager)
        highlightPanel.show()

        isHighlightActive = true
}

/**
 * 停止文本高亮功能
 * 移除高亮并销毁面板
 */
export function stopHighlight() {
        if (!isHighlightActive) return

        const manager = getHighlightManager()
        manager.stop()

        if (highlightPanel) {
                highlightPanel.destroy()
                highlightPanel = null
        }

        isHighlightActive = false
}

/**
 * 初始化高亮功能
 * 在页面加载时自动提取关键词但不立即高亮
 */
export async function initHighlight() {
        const manager = getHighlightManager()
        await manager.autoExtractAndHighlight()
}

/**
 * 获取高亮功能状态
 */
export function isHighlightEnabled(): boolean {
        return isHighlightActive
}

/**
 * 切换高亮面板显示状态
 */
export function toggleHighlightPanel() {
        if (!highlightPanel) {
                const manager = getHighlightManager()
                highlightPanel = new HighlightPanel(manager)
        }

        highlightPanel.toggle()
}

/**
 * 清理高亮功能资源
 */
export function destroyHighlight() {
        stopHighlight()
        destroyHighlightManager()
}
