<script lang="ts" setup>
import FeatureSwitch from './FeatureSwitch.vue'
import ApplyWebsites from './ApplyWebsites.vue'
</script>

<template>
        <div class="popup">
                <FeatureSwitch
                        feature-name="highlight"
                        :settings="{ color: 'string', size: 'number' }"
                />
                <ApplyWebsites />
                <FeatureSwitch feature-name="stripe" />
                <FeatureSwitch feature-name="bionic" />
                <FeatureSwitch feature-name="translate" />
        </div>
</template>

<style scoped>
.popup {
        padding: 8px;
        border-radius: 5px;
}
</style>
