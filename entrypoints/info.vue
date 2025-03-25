<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

// 使用响应式数组存储 div 元素
const divTags = ref<Element[]>([]);

onMounted(() => {
    // 初始化 divTags
    const updateDivTags = () => {
        divTags.value = Array.from(document.getElementsByTagName('div'));
    };

    // 初始获取
    updateDivTags();

    // 监听 DOM 变化
    const observer = new MutationObserver(updateDivTags);
    observer.observe(document, {
        childList: true,
        subtree: true,
        attributes: false,
    });
});

// 监听 divTags 的变化（可选）
watch(divTags, (newVal) => {
    console.log('divTags 更新:', newVal.length);
});
</script>

<template>
    <div class="bread">
        <!-- 显示动态数量 -->
        <p>当前页面共有 <strong>{{ divTags.length }}</strong> 个 div 标签</p>
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