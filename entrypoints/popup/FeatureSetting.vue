<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const props = defineProps<{
  settingName: string
  type: "string" | "number" | "boolean"
  featureName: string
}>()
type FeatureSettingConfig = string | number | boolean;

type StorageKey =
  | `local:${string}`
  | `session:${string}`
  | `sync:${string}`
  | `managed:${string}`;
const key: StorageKey = `local:${props.featureName + props.settingName}`;
const setting = ref<FeatureSettingConfig>()

onMounted(async () => {
  try {
    // 从storage读取持久化配置
    const storedConfig = await storage.getItem(key) as FeatureSettingConfig | null;

    if (storedConfig) {
      setting.value = storedConfig
    } else {
      // storage.setItem(key, setting.value);
    }
  } catch (error) {
    console.warn(`读取${key}存储配置失败`, error);
  }
});

// 监听 config 变化
watch(
  () => setting.value,
  (newValue) => {
    if (newValue !== null) {
      storage.setItem(key, newValue).catch(error => {
        console.error(`保存${key}配置失败:`, error);
      }
      );
    }
  }
);

</script>

<template>
  <div class="feature-settings">
    <!-- 条件渲染不同输入控件 -->
    <div class="setting-item">
      <label>{{ settingName }}:</label>

      <!-- 布尔值类型 -->
      <input v-if="type === 'boolean'" type="checkbox" v-model="setting"
        :key="`${featureName}-${settingName}-checkbox`" />

      <!-- 数值类型 -->
      <input v-else-if="type === 'number'" type="number" v-model.number="setting"
        :key="`${featureName}-${settingName}-number`" class="numeric-input" />

      <!-- 字符串类型 -->
      <input v-else type="text" v-model="setting" :key="`${featureName}-${settingName}-text`" class="text-input" />
    </div>
  </div>
</template>

<style scoped>
.feature-settings {
  margin-top: 5px;
  padding-left: 10px;
}

.setting-item {
  display: flex;
  align-items: center;
}

.setting-item label {
  margin-right: 10px;
}

.setting-item input[type="checkbox"] {
  margin-left: auto;
}
</style>