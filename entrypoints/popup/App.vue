<script lang="ts" setup>
import FeatureSwitch from "./FeatureSwitch.vue";

</script>

<template>
  <div class="popup">

    <featureSwitch feature-name="highlight" :settings="{ color: 'string' ,size: 'number' }" />
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
