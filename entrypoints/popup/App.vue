<script lang="ts" setup>
import FeatureSwitch from './FeatureSwitch.vue'
import ApplyWebsites from './ApplyWebsites.vue'
// import HighlightKeywords from './HighlightKeywords.vue'
</script>

<template>
        <div class="popup">
                <ApplyWebsites />
                <!-- <HighlightKeywords /> -->
                <FeatureSwitch
                        feature-name="highlight"
                        :settings="{ color: 'string', size: 'number' }"
                />

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
