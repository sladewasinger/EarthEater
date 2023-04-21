<script setup lang="ts">
import { onMounted, ref } from 'vue';

const gameContainer = ref(null);

onMounted(() => {

});
</script>
<template>
    <div ref="gameContainer" class="game-container"></div>
</template>

<style scoped>
.game-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
}
</style>