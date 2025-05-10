<script setup lang="ts">

import { PropType } from 'vue';

type anchor = { title: string; link: string, isExternal: boolean }

// 方式一：对象式声明（推荐）
const props = defineProps({
  textToAnchor: {
    type: Object as PropType<anchor[]>,
    required: true
  }
})
</script>

<template>
  <div class="bread">
    <template v-for="anchor in props.textToAnchor">
      <div class="item" v-if="anchor.isExternal">
        <a :href="anchor.link" target="_blank">{{ anchor.title }}</a>
      </div>
    </template>

  </div>
</template>

<style scoped>
.bread {
  background-color: rgb(203, 203, 203);
  opacity: 0.8;
  color: rgb(0, 0, 0);
  padding: 10px;
  border-radius: 4px;
  height: auto;
  max-height: 100vh;
  width: auto;
  max-width: 300px;
  position: fixed;
  right: 0;
  bottom: 0;
  z-index: 999;
  overflow-y: scroll;
}

.item {
  border-bottom: 1px solid rgb(0, 0, 0);
}

a {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
</style>