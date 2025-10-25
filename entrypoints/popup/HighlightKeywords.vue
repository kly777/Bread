<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'

// 持久高亮 - 跨页面保存
const persistentKeywords = ref('')
let debounceTimer: number | null = null

// 从storage加载持久高亮关键词
onMounted(async () => {
        try {
                const savedPersistentKeywords = await storage.getItem<string>(
                        'local:persistent_highlight_keywords'
                )
                if (savedPersistentKeywords) {
                        persistentKeywords.value = savedPersistentKeywords
                }
        } catch (error) {
                console.warn('加载持久高亮关键词失败:', error)
        }
})

// 监听持久高亮变化，使用防抖自动保存和应用
watch(persistentKeywords, (newValue) => {
        savePersistentKeywords(newValue)

        // 使用防抖避免频繁高亮导致的性能问题
        if (debounceTimer) {
                window.clearTimeout(debounceTimer)
        }

        debounceTimer = window.setTimeout(() => {
                applyHighlight()
                debounceTimer = null
        }, 500) // 500ms防抖延迟
})

// 组件卸载时清理定时器
onUnmounted(() => {
        if (debounceTimer) {
                window.clearTimeout(debounceTimer)
                debounceTimer = null
        }
})

/**
 * 解析关键词文本为关键词数组
 */
const parseKeywords = (keywordsText: string): string[] => {
        return keywordsText
                .split('\n')
                .map((word) => word.trim())
                .filter((word) => word.length > 0)
                .filter((word) => word.length >= 2) // 过滤掉单个字母，避免过多匹配
}

/**
 * 应用高亮到页面
 */
const applyHighlight = () => {
        const keywords = parseKeywords(persistentKeywords.value)

        if (keywords.length === 0) {
                removeHighlight()
                return
        }

        console.log(`🎨 应用高亮关键词: ${keywords.join(', ')}`)
        applyHighlightToPage(keywords)
}

/**
 * 清除持久高亮
 */
const clearPersistentKeywords = () => {
        persistentKeywords.value = ''
}

/**
 * 保存持久高亮到storage
 */
const savePersistentKeywords = async (keywords: string) => {
        try {
                await storage.setItem(
                        'local:persistent_highlight_keywords',
                        keywords
                )
        } catch (error) {
                console.error('保存持久高亮关键词失败:', error)
        }
}

/**
 * 应用高亮到当前页面
 */
const applyHighlightToPage = (words: string[]) => {
        browser.tabs
                .query({ active: true, currentWindow: true })
                .then((tabs) => {
                        const tab = tabs[0]
                        if (tab.id) {
                                browser.tabs
                                        .sendMessage(tab.id, {
                                                action: 'highlightWords',
                                                words: words,
                                        })
                                        .catch((error) => {
                                                console.warn(
                                                        '发送高亮消息失败:',
                                                        error
                                                )
                                        })
                        }
                })
}

/**
 * 移除高亮
 */
const removeHighlight = () => {
        browser.tabs
                .query({ active: true, currentWindow: true })
                .then((tabs) => {
                        const tab = tabs[0]
                        if (tab.id) {
                                browser.tabs
                                        .sendMessage(tab.id, {
                                                action: 'removeHighlight',
                                        })
                                        .catch((error) => {
                                                console.warn(
                                                        '发送移除高亮消息失败:',
                                                        error
                                                )
                                        })
                        }
                })
}
</script>

<template>
        <div class="highlight-keywords">
                <h3>高亮关键词</h3>

                <!-- 持久高亮区域 -->
                <div class="input-section">
                        <div class="section-header">
                                <h4>持久高亮</h4>
                                <span class="section-description"
                                        >跨页面保存，修改时自动应用</span
                                >
                        </div>
                        <textarea
                                v-model="persistentKeywords"
                                placeholder="输入要高亮的关键词，每行一个"
                                rows="4"
                                class="keyword-input"
                        ></textarea>
                        <div class="button-group">
                                <button
                                        @click="clearPersistentKeywords"
                                        class="btn btn-secondary"
                                >
                                        清除
                                </button>
                        </div>
                </div>
        </div>
</template>

<style scoped>
.highlight-keywords {
        margin-bottom: 5px;
}

.highlight-keywords h3 {
        margin: 0 0 8px 0;
        font-size: 16px;
        color: rgba(255, 255, 255, 0.87);
}

.input-section {
        margin-bottom: 12px;
        padding: 8px;
        border: 1px solid #444;
        border-radius: 4px;
        background: #1a1a1a;
}

.section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
}

.section-header h4 {
        margin: 0;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.87);
}

.section-description {
        font-size: 11px;
        color: #aaa;
        font-style: italic;
}

.keyword-input {
        width: 100%;
        padding: 8px;
        border: 1px solid #444;
        border-radius: 8px;
        font-size: 14px;
        resize: vertical;
        margin-bottom: 6px;
        font-family: inherit;
        background-color: #1a1a1a;
        color: rgba(255, 255, 255, 0.87);
        box-sizing: border-box;
        display: block;
}

.button-group {
        display: flex;
        gap: 4px;
        justify-content: center;
}

.btn {
        padding: 8px 16px;
        border: 1px solid #444;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        background-color: #1a1a1a;
        color: rgba(255, 255, 255, 0.87);
        transition: border-color 0.25s;
        font-family: inherit;
}

.btn-secondary {
        background-color: #6c757d;
        color: white;
        border-color: #6c757d;
        width: 100%;
}

.btn-secondary:hover {
        background-color: #545b62;
        border-color: #646cff;
}
</style>
