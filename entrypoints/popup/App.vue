<script lang="ts" setup>
import featureSwitch from "./featureSwitch.vue";

</script>

<template>
  <div class="popup">
    Bread
    <hr/>
    <featureSwitch feature-name="highlight" />
    <featureSwitch feature-name="stripe" />
    <featureSwitch feature-name="info" />
    <featureSwitch feature-name="bionic" />
  </div>
</template>


<style scoped>
.popup {
  padding: 8px;
}
</style>
