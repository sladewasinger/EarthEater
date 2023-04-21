<script setup lang="ts">
import { useRoute } from 'vue-router';
import { engine } from '../main.ts';
import { onMounted } from '@vue/runtime-dom';

const route = useRoute();
const lobbyId = route.params.id as string;

console.log(lobbyId);

onMounted(() => {
    engine.reset();
    engine.joinLobby(lobbyId);
    engine.start();
});

</script>

<template></template>

<style scoped></style>
