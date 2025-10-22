<template>
  {{ currentUrl }}
</template>


<script lang="ts" setup>
import { ref, onMounted } from 'vue'

const currentUrl = ref('加载中...'); // 初始化友好提示

onMounted(() => {
  browser.runtime.sendMessage(
    { action: "getDomain" },
    (response) => {
      currentUrl.value = response.domain || "无法获取域名";
    }
  );
});

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