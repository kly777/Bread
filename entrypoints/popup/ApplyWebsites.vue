<template>
  {{ formatDomain(currentUrl) }}
</template>


<script lang="ts" setup>
import { ref, onMounted } from 'vue'

const currentUrl = ref('')

onMounted(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    currentUrl.value = tab?.url || '无活动标签'
  } catch (error) {
    console.error('获取标签页失败:', error)
    currentUrl.value = '权限不足或发生错误'
  }
})


// 添加域名格式化工具函数
function formatDomain(hostname: string) {

  const rexExp = /(https?:\/\/(.+?)\/)/ig
  const matchResult = hostname.trim().match(rexExp);

  // 返回完整域名或原始值
  return matchResult ? matchResult[0].split(/\/+/)[1] : hostname;

}
</script>
<style scoped>
.current-domain {
  font-weight: bold;
  color: #2c3e50;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>