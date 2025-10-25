import './style.css'
import { initFunctions } from './initFunctions'
import { pin } from './feature/anchor/pin'
import {
        highlightWordsInDocument,
        removeHighlights,
} from './feature/highlight/highlightNode'

export default defineContentScript({
        matches: ['<all_urls>'],

        async main() {
                console.log('-'.repeat(20))
                console.log('content script loaded')

                await initFunctions()
                pin()

                // 页面加载时自动应用持久高亮
                await applyPersistentHighlightOnLoad()

                // 监听来自popup的消息
                browser.runtime.onMessage.addListener(
                        (message, sender, sendResponse) => {
                                console.group('📨 Content Script 收到消息')
                                console.log('消息内容:', message)

                                switch (message.action) {
                                        case 'highlightWords':
                                                console.log(
                                                        '🎨 开始高亮关键词:',
                                                        message.words
                                                )
                                                highlightWordsInDocument(
                                                        message.words
                                                )
                                                sendResponse({
                                                        success: true,
                                                        words: message.words,
                                                })
                                                break

                                        case 'removeHighlight':
                                                console.log('🗑️ 移除所有高亮')
                                                removeHighlights()
                                                sendResponse({ success: true })
                                                break

                                        default:
                                                console.log(
                                                        '❓ 未知消息类型:',
                                                        message.action
                                                )
                                                sendResponse({
                                                        success: false,
                                                        error: 'Unknown action',
                                                })
                                }

                                console.groupEnd()
                                return true // 保持消息通道开放以支持异步响应
                        }
                )

                // 监听storage变化，当持久高亮关键词改变时自动应用
                browser.storage.onChanged.addListener((changes, area) => {
                        if (
                                area === 'local' &&
                                changes.persistent_highlight_keywords
                        ) {
                                console.log(
                                        '🔄 检测到持久高亮关键词变化，重新应用高亮'
                                )
                                const newKeywords =
                                        changes.persistent_highlight_keywords
                                                .newValue
                                if (newKeywords && newKeywords.trim()) {
                                        const keywords = newKeywords
                                                .split('\n')
                                                .map((word: string) =>
                                                        word.trim()
                                                )
                                                .filter(
                                                        (word: string) =>
                                                                word.length > 0
                                                )
                                        highlightWordsInDocument(keywords)
                                } else {
                                        removeHighlights()
                                }
                        }
                })
        },
})

// 页面加载时应用持久高亮
async function applyPersistentHighlightOnLoad() {
        try {
                const persistentKeywords = await storage.getItem<string>(
                        'local:persistent_highlight_keywords'
                )
                if (persistentKeywords && persistentKeywords.trim()) {
                        console.log('🚀 页面加载时自动应用持久高亮')
                        const keywords = persistentKeywords
                                .split('\n')
                                .map((word) => word.trim())
                                .filter((word) => word.length > 0)
                        highlightWordsInDocument(keywords)
                }
        } catch (error) {
                console.warn('页面加载时应用持久高亮失败:', error)
        }
}
