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
  scrollProgress.value = maxScroll <= 0
    ? 0
    : (scrollTop / maxScroll) * 100
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
    <inline v-if="selectedText" class="selection-stats">
      p: {{ selectedLines }} |
      w: {{ selectedWords }} |
      c: {{ selectedChars }} |
    </inline>
    <inline>
      {{ scrollProgress.toFixed(0) }}%
    </inline>
  </div>
</template>

<style scoped>
.bread {
  color: #000;
  padding: 0;
}
p{
  margin: 0;
}
</style>