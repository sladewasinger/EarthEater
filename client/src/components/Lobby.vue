<script setup lang="ts">
import { useRoute } from 'vue-router';
import { engine } from '../main.ts';
import { onMounted } from '@vue/runtime-dom';
import { SocketResponse } from '../../../shared/SocketResponse';
import { watch } from 'vue';

const route = useRoute();

function getLobbyId() {
    return route.params.id as string;
}

watch(() => route.params.id, (newVal, oldVal) => {
    if (newVal !== oldVal) {
        start();
    }
});

onMounted(() => {
    start();
});

function start() {
    const lobbyId = getLobbyId();
    engine.reset();
    console.log('Joining lobby with id: ' + lobbyId)
    engine.joinLobby(lobbyId)
        .then((response: SocketResponse) => {
            console.log('Joined lobby with id: ' + response.data.id);
            engine.start();
        })
        .catch((err: any) => {
            console.log('Error joining lobby: ' + err);
        });
}

</script>

<template></template>

<style scoped></style>
