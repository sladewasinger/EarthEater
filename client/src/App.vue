<script setup lang="ts">
import { onMounted, onUnmounted, onUpdated, reactive } from 'vue';
import LoadingSpinner from './components/LoadingSpinner.vue';
import { engine } from './main';

const state = reactive({
  isConnected: false,
});

onUpdated(() => {
  engine.leaveLobbies();
});

onMounted(() => {

  function onConnected() {
    console.log("Engine is connected");
    state.isConnected = true;
  }

  function onDisconnected() {
    state.isConnected = false;
    console.log("Engine is disconnected");
  }

  engine.addEventListener("connected", onConnected);
  engine.addEventListener("disconnected", onDisconnected);

  if (engine.isConnected) {
    console.log("Engine is already connected");
    onConnected();
  }

  onUnmounted(() => {
    engine.removeEventListener("connected", onConnected);
    engine.removeEventListener("disconnected", onDisconnected);
  });
});
</script>

<template>
  <div class="loading-spinner" v-if="!state.isConnected">
    <loading-spinner />
  </div>
  <router-view v-if="state.isConnected"></router-view>
</template>

<style scoped>
.loading-spinner {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
</style>
