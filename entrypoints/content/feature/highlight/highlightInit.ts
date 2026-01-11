/**
 * 高亮功能初始化模块
 * 负责高亮功能的初始化和消息处理
 */

import { getWordsManager } from './wordsManager'
import { getHighlighter } from './highlighter'
import { startSearchKeywordAutoUpdate } from './searchKeywordAutoUpdate'

/**
 * 初始化高亮系统
 */
export function initializeHighlightSystem(): void {
        console.log('初始化高亮系统')

        // 启动高亮器
        const highlighter = getHighlighter()
        highlighter.start()

        // 启动搜索关键词自动更新
        startSearchKeywordAutoUpdate()

        // 页面加载时应用持久高亮
        applyPersistentHighlightOnLoad()

        // 设置消息监听
        setupMessageListeners()

        // 设置storage变化监听
        setupStorageListeners()
}

/**
 * 设置消息监听
 */
function setupMessageListeners(): void {
        // 监听来自popup的消息
        browser.runtime.onMessage.addListener((message, _, sendResponse) => {
                console.group('高亮系统收到消息')
                console.log('消息内容:', message)

                switch (message.action) {
                        case 'highlightWords':
                                console.log('开始高亮关键词:', message.words)
                                handleHighlightWords(message.words)
                                sendResponse({
                                        success: true,
                                        words: message.words,
                                })
                                break

                        case 'removeHighlight':
                                console.log('移除所有高亮')
                                handleRemoveHighlight()
                                sendResponse({ success: true })
                                break

                        default:
                                console.log('未知消息类型:', message.action)
                                sendResponse({
                                        success: false,
                                        error: 'Unknown action',
                                })
                }

                console.groupEnd()
                return true // 保持消息通道开放以支持异步响应
        })
}

/**
 * 设置storage变化监听
 */
function setupStorageListeners(): void {
        // 监听storage变化，当持久高亮关键词改变时自动更新
        browser.storage.onChanged.addListener((changes, area) => {
                if (area === 'local' && changes.persistent_highlight_keywords) {
                        console.log('检测到持久高亮关键词变化，更新高亮词')
                        const newKeywords = changes
                                .persistent_highlight_keywords.newValue as
                                | string
                                | undefined
                        handlePersistentKeywordsChange(newKeywords)
                }
        })
}

/**
 * 处理高亮词消息
 */
function handleHighlightWords(words: string[]): void {
        const wordsManager = getWordsManager()
        wordsManager.updatePersistentWords(words)
}

/**
 * 处理移除高亮消息
 */
function handleRemoveHighlight(): void {
        const wordsManager = getWordsManager()
        wordsManager.updatePersistentWords([])
}

/**
 * 处理持久高亮关键词变化
 */
function handlePersistentKeywordsChange(newKeywords: string | undefined): void {
        const wordsManager = getWordsManager()

        if (newKeywords && newKeywords.trim()) {
                const keywords = newKeywords
                        .split('\n')
                        .map((word: string) => word.trim())
                        .filter((word: string) => word.length > 0)
                wordsManager.updatePersistentWords(keywords)
        } else {
                wordsManager.updatePersistentWords([])
        }
}

/**
 * 页面加载时应用持久高亮
 */
async function applyPersistentHighlightOnLoad(): Promise<void> {
        try {
                const result = await browser.storage.local.get(
                        'local:persistent_highlight_keywords'
                )
                const persistentKeywords = result[
                        'local:persistent_highlight_keywords'
                ] as string | undefined
                if (persistentKeywords && persistentKeywords.trim()) {
                        console.log('页面加载时自动应用持久高亮')
                        const keywords = persistentKeywords
                                .split('\n')
                                .map((word: string) => word.trim())
                                .filter((word: string) => word.length > 0)
                        const wordsManager = getWordsManager()
                        wordsManager.updatePersistentWords(keywords)
                }
        } catch (error) {
                console.warn('页面加载时应用持久高亮失败:', error)
        }
}
