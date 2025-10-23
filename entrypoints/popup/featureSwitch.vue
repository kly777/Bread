<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import FeatureSetting from './FeatureSetting.vue'

const props = defineProps<{
        featureName: string
        settings?: Record<string, 'string' | 'number' | 'boolean'>
}>()

interface FeatureConfig {
        enabled: boolean
        settings: Record<string, number | string | boolean>
}

const featureConfig = ref<FeatureConfig>({
        enabled: false,
        settings: {},
})
let domain = 'default' // 默认域名
const key = props.featureName
onMounted(async () => {
        await new Promise<void>((resolve) => {
                browser.runtime.sendMessage(
                        { action: 'getDomain' },
                        (response) => {
                                domain = response.domain || 'default' // 添加兜底值
                                resolve()
                        }
                )
        })

        try {
                // 从storage读取持久化配置
                console.log('读取存储配置', getKeyWithDomainPop(key))
                const storedConfig = (await storage.getItem(
                        getKeyWithDomainPop(key)
                )) as boolean | null
                console.log('读取到存储配置', storedConfig)
                if (storedConfig !== null) {
                        console.log(getKeyWithDomainPop(key))
                        featureConfig.value.enabled = storedConfig
                }
        } catch (error) {
                console.warn(`读取${props.featureName}存储配置失败`, error)
        }
})
function getKeyWithDomainPop(key: string): StorageKey {
        // 如果域名是默认值，则不添加域名前缀
        if (domain === 'default') {
                return `local:${key}`
        }
        // 否则，添加域名前缀
        return `local:${domain}:${key}`
}
type StorageKey = `local:${string}`

// 监听 开关 变化
watch(
        () => featureConfig.value.enabled,
        async (newValue) => {
                console.log(getKeyWithDomainPop(key))
                storage.setItem(getKeyWithDomainPop(key), newValue)
        },
        { deep: true }
)
</script>

<template>
        <div class="feature-switch">
                <div>
                        {{ props.featureName }}
                        <input
                                type="checkbox"
                                v-model="featureConfig.enabled"
                        />
                </div>

                <template v-if="featureConfig.settings">
                        <div
                                v-for="(type, settingName) in props.settings"
                                :key="settingName"
                                class="setting-item"
                        >
                                <FeatureSetting
                                        :settingName="settingName"
                                        :type="type"
                                        :featureName="props.featureName"
                                />
                        </div>
                </template>
        </div>
</template>

<style scoped>
.feature-switch {
        margin-bottom: 5px;
}


.feature-switch > div {
        flex-grow: 1;
        display: flex;
        justify-content: space-between;
}
</style>
