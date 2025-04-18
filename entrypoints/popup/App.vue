<script lang="ts" setup>
import featureSwitch from "./featureSwitch.vue";

</script>

<template>
  <div class="popup">

    <featureSwitch feature-name="highlight" />
    <featureSwitch feature-name="stripe" />
    <featureSwitch feature-name="bionic" />
  </div>
</template>


<style scoped>
.popup {
  padding: 8px;
  border-radius: 5px;
}
</style>
