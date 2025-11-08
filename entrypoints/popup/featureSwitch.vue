<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import FeatureSetting from './FeatureSetting.vue'

const props = defineProps<{
        featureName: string
        settings?: Record<string, 'string' | 'number' | 'boolean'>
}>()

// 设置状态类型
type SettingState = 'default' | 'enabled' | 'disabled'

const settingState = ref<SettingState>('default')

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
                const storedConfig = (await storage.getItem(
                        getKeyWithDomainPop(key)
                )) as boolean | null

                if (storedConfig !== null) {
                        settingState.value = storedConfig
                                ? 'enabled'
                                : 'disabled'
                } else {
                        // 如果没有存储的值，使用默认值
                        settingState.value = 'default'
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

// 监听设置状态变化
watch(
        () => settingState.value,
        async (newValue) => {
                if (newValue === 'default') {
                        // 选择默认值，删除存储的设置
                        storage.removeItem(getKeyWithDomainPop(key))
                } else {
                        // 选择自定义值，存储设置
                        const value = newValue === 'enabled'
                        storage.setItem(getKeyWithDomainPop(key), value)
                }
        },
        { deep: true }
)
</script>

<template>
        <div class="feature-switch">
                <div class="feature-header">
                        <span class="feature-name">
                                {{ props.featureName }}
                        </span>
                        <div class="setting-options">
                                <label class="option-item">
                                        <input
                                                type="radio"
                                                v-model="settingState"
                                                value="default"
                                        />
                                        <span>默认</span>
                                </label>
                                <label class="option-item">
                                        <input
                                                type="radio"
                                                v-model="settingState"
                                                value="enabled"
                                        />
                                        <span>开启</span>
                                </label>
                                <label class="option-item">
                                        <input
                                                type="radio"
                                                v-model="settingState"
                                                value="disabled"
                                        />
                                        <span>关闭</span>
                                </label>
                        </div>
                </div>

                <template v-if="props.settings">
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
        margin-bottom: 8px;
        padding: 8px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
}

.feature-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
}

.feature-name {
        font-weight: 600;

        font-size: 14px;
}

.setting-options {
        display: flex;
        gap: 2px;

        border-radius: 4px;
        padding: 1px;
}

.option-item {
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 12px;
        cursor: pointer;
        color: #666;
}

.option-item input[type='radio'] {
        display: none;
}

.option-item:has(input[type='radio']:checked) {
        background: #ffffff;
        color: rgb(0, 0, 0);
}

.setting-item {
        margin-top: 6px;
        padding-left: 12px;
}
</style>
