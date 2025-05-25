<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import FeatureSetting from "./FeatureSetting.vue";
import { getKeyWithDomainPop } from "../kit/storage";
const props = defineProps<{
    featureName: string
    settings?: Record<string, "string" | "number" | "boolean">;
}>()


interface FeatureConfig {
    enabled: boolean;
    settings: Record<string, number | string | boolean>;
}

const featureConfig = ref<FeatureConfig>(
    {
        enabled: false,
        settings: {}
    }
)

const key = props.featureName;
// 从 browser.storage.local 获取初始值
// 初始化 feature
onMounted(async () => {
    try {
        // 从storage读取持久化配置
        const storedConfig = await storage.getItem(await getKeyWithDomainPop(key)) as boolean | null;

        if (storedConfig !== null) {
            featureConfig.value.enabled = storedConfig
        }
    } catch (error) {
        console.warn(`读取${props.featureName}存储配置失败`, error);
    }
});

// 监听 开关 变化
watch(
    () => featureConfig.value.enabled,
    async (newValue) => {
        console.log(getKeyWithDomainPop(key))
        storage.setItem(await getKeyWithDomainPop(key), newValue);
    },
    { deep: true }
)



</script>

<template>
    <div class="feature-switch">
        <div>
            {{ props.featureName }}
            <input type="checkbox" v-model="featureConfig.enabled" />
        </div>

        <template v-if="featureConfig.settings">
            <div v-for="(type, settingName) in props.settings" :key="settingName" class="setting-item">
                <FeatureSetting :settingName="settingName" :type="type" :featureName="props.featureName" />
            </div>
        </template>
    </div>
</template>

<style scoped>
.feature-switch {
    margin-bottom: 5px;
}


/* 新增：确保子元素容器可扩展 */
.feature-switch>div {
    flex-grow: 1;
    display: flex;
    justify-content: space-between;
}
</style>
