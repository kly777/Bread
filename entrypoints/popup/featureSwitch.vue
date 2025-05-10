<script setup lang="ts">
const props = defineProps(
    {
        featureName: {
            type: String,
            required: true
        }
    }
)

import { ref, watch } from "vue"


const feature = ref(false)

type StorageKey = `local:${string}` | `session:${string}` | `sync:${string}` | `managed:${string}`;

const key: StorageKey = `local:${props.featureName}`;
// 从 browser.storage.local 获取初始值
onMounted(async () => {
    try {

        console.log('featureName:', props.featureName);

        const result = await storage.getItem<boolean>(key);

        console.log('feature value fetched:', result);

        if (result === undefined || result === null) {
            feature.value = true;
        }
        else {
            feature.value = result;
        }

        console.log('feature value fetched:', result);

    } catch (error) {

        console.error('Error fetching storage:', error);

        feature.value = true;
    }
});



watch(feature, async (newVal) => {
    try {
        console.log('feature value changed:', newVal);
        await storage.setItem(key, newVal);
        console.log('feature value saved:', newVal);
    } catch (error) {
        console.error('Error saving storage:', error);
    }
});

</script>


<template>
    <div class="feature-switch">
        {{ featureName }}
        <input type="checkbox" v-model="feature">

    </div>
</template>

<style scoped>
.feature-switch {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 5px;
}
</style>