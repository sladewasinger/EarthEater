<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
let lobbyName: string;

function joinLobby(e: Event) {
    e.preventDefault();
    console.log('Joining lobby...');
    router.push('/lobby/' + lobbyName);
}
</script>

<template>
    <div class="card">
        <h1>Join Lobby</h1>
        <form name="joinLobbyForm" @submit="joinLobby">
            <input type="text" id="lobbyName" name="lobbyName" v-model="lobbyName" placeholder="code" required>&nbsp;
            <button type="submit" class="btn-join">Join</button>
        </form>
    </div>
</template>

<style scoped>
h1 {
    margin-top: 0;
    margin-bottom: 0;
}

.btn-join {
    background-color: var(--green);
}
</style>
