import { getHighlightManager, destroyHighlightManager } from '../feature/highlight/highlightManager'

let isHighlightActive = false

/**
 * 判断当前页面是否为搜索引擎
 */
function isSearchEngine(): boolean {
        const hostname = window.location.hostname
        const searchEngines = [
                'google.com',
                'bing.com',
                'baidu.com',
                'yahoo.com',
                'duckduckgo.com',
                'yandex.com',
                'ask.com',
                'aol.com'
        ]

        return searchEngines.some(engine => hostname.includes(engine))
}

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
 * 初始化高亮功能
 * 在页面加载时自动提取关键词，如果是搜索引擎则自动开启高亮
 */
export async function initHighlight() {
        const manager = getHighlightManager()
        await manager.autoExtractAndHighlight()

        // 如果是搜索引擎，自动开启高亮
        if (isSearchEngine()) {
                console.log('检测到搜索引擎页面，自动开启高亮功能')
                await openHighlight()
        }
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
