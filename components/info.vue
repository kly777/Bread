<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 使用响应式数组存储高亮 span 元素
const highlightSpans = ref<Element[]>([]);
const startTime = new Date().toLocaleTimeString();
onMounted(() => {
    // 更新高亮 span 元素
    const updateHighlightSpans = () => {
        highlightSpans.value = Array.from(document.getElementsByClassName('bread-highlight'));
    };

    // 初始获取
    updateHighlightSpans();

    // 监听 DOM 变化
    const observer = new MutationObserver(updateHighlightSpans);
    observer.observe(document, {
        childList: true,
        subtree: true,
    });


});
</script>

<template>
    <div class="bread">
        <div>
            {{ startTime }}
        </div>
        <!-- 显示动态数量 -->
        <p>匹配了 <strong>{{ highlightSpans.length }}</strong> 个</p>
    </div>
</template>

<style scoped>
.bread {
    background-color: blue;
    opacity: 0.8;
    color: white;
    padding: 10px;
    border-radius: 4px;
}
</style>