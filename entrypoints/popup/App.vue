<script lang="ts" setup>
import featureSwitch from "./featureSwitch.vue";

</script>

<template>
  <div class="popup">
    Console
    <hr/>
    <featureSwitch feature-name="highlight" />
    <featureSwitch feature-name="stripe" />
    <featureSwitch feature-name="info" />
  </div>
</template>


<style scoped>
.popup {
  padding: 5px;
}
</style>
