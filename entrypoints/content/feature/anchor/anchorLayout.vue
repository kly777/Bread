<script setup lang="ts">
// import { PropType } from 'vue';

// type anchor = { title: string; link: string, isExternal: boolean }

// const props = defineProps({
//   textToAnchor: {
//     type: Object as PropType<anchor[]>,
//     required: true
//   }
// })
import { ref, computed, onMounted } from 'vue'

const pageWordCount = ref(0)
const pageCharCount = ref(0)
const headingCount = ref(0)
const mediaCount = ref(0)

// 计算页面内容统计
const calculatePageStats = () => {
        try {
                // 计算总字数
                const textContent = document.body.textContent || ''
                pageWordCount.value = textContent
                        .split(/\s+/)
                        .filter(Boolean).length
                pageCharCount.value = textContent.length

                // 计算标题数量
                headingCount.value = document.querySelectorAll(
                        'h1, h2, h3, h4, h5, h6'
                ).length

                // 计算媒体元素数量
                mediaCount.value =
                        document.querySelectorAll('img, video, audio').length
        } catch (e) {
                console.error('Error calculating page stats:', e)
        }
}
// 在组件挂载时计算页面统计
onMounted(() => {
        // 初始计算
        calculatePageStats()

        // 监听DOM变化（当页面动态加载内容时）
        const observer = new MutationObserver(calculatePageStats)
        observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
        })

        // 清理
        onUnmounted(() => {
                observer.disconnect()
        })
})
// 存储选中的文本
const selectedText = ref('')

// 计算选中区域的行数和字符数
const selectedLines = computed(() => selectedText.value.split('\n').length)
const selectedChars = computed(() => selectedText.value.length)
const selectedWords = computed(() => selectedText.value.split(' ').length)
// 获取选中文本的方法
const getSelectionText = () => {
        const selection = window.getSelection?.()
        if (selection && selection.toString().trim() !== '') {
                selectedText.value = selection.toString()
        } else {
                selectedText.value = ''
        }
}

// 在组件挂载时添加事件监听
onMounted(() => {
        document.addEventListener('mousemove', getSelectionText)
})

const scrollProgress = ref(0)

const updateScrollProgress = () => {
        const scrollTop = window.scrollY
        const docHeight = document.documentElement.scrollHeight
        const winHeight = window.innerHeight
        const maxScroll = docHeight - winHeight

        // 处理边界条件
        scrollProgress.value =
                maxScroll <= 0 ? 0 : (scrollTop / maxScroll) * 100
}

// 挂载时添加滚动监听
onMounted(() => {
        window.addEventListener('scroll', updateScrollProgress)
        updateScrollProgress() // 初始计算
})

// 卸载时移除监听
onUnmounted(() => {
        window.removeEventListener('scroll', updateScrollProgress)
})
</script>

<template>
        <div class="bread">
                <span v-if="pageWordCount > 0">
                        pw: {{ (pageWordCount / 1000).toFixed(1) }}k | pc:
                        {{ (pageCharCount / 1000).toFixed(1) }}k |
                </span>
                <span v-if="headingCount > 0"> h: {{ headingCount }} | </span>
                <span v-if="mediaCount > 0"> m: {{ mediaCount }} | </span>
                <span v-if="selectedText">
                        p: {{ selectedLines }} | w: {{ selectedWords }} | c:
                        {{ selectedChars }} |
                </span>
                <span> {{ scrollProgress.toFixed(0) }}% </span>
        </div>
</template>

<style scoped>
.bread {
        box-sizing: border-box;
        border: #000 1px solid;
        color: #000;
        background-color: rgba(240, 248, 255, 0.92);
        cursor: default;
        height: 100%;
        font-size: 12px;
        user-select: none;
        padding: 0;

        display: flex;
        align-items: center;
}

span {
        box-sizing: border-box;
        display: inline-block;
        margin: 0 2px;
        padding: 0 1px;
        height: 90%;
        line-height: 1.2;
        font-size: 0.85rem;
}
</style>
