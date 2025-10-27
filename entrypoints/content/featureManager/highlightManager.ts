import {
        getHighlightManager,
        destroyHighlightManager,
} from '../feature/highlight/highlightManager'

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

        isHighlightActive = true
}

/**
 * 停止文本高亮功能
 * 移除高亮
 */
export function stopHighlight() {
        if (!isHighlightActive) return

        const manager = getHighlightManager()
        manager.stop()

        isHighlightActive = false
}

/**
 * 获取高亮功能状态
 */
export function isHighlightEnabled(): boolean {
        return isHighlightActive
}

/**
 * 清理高亮功能资源
 */
export function destroyHighlight() {
        stopHighlight()
        destroyHighlightManager()
}
