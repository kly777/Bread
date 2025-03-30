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
    <featureSwitch feature-name="bionic" />
  </div>
</template>


<style scoped>
.popup {
  padding: 5px;
}
</style>
