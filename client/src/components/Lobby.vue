<script setup lang="ts">
import { useRoute } from 'vue-router';
import { engine } from '../main.ts';

const route = useRoute();
const lobbyId = route.params.id as string;

console.log(lobbyId);

if (!engine.started) {
    engine.joinLobby(lobbyId);
} else {
    console.log("Already started");
    engine.delete();

    // TODO: Separate engine initialization from engine creation
    //       allow for engine to be started and stopped multiple times
}

engine.start();

</script>

<template></template>

<style scoped></style>
