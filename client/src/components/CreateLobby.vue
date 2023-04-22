<script setup lang="ts">
import { engine } from '../main';
import { useRouter } from 'vue-router';

const router = useRouter();

function createLobby(e: Event) {
    e.preventDefault();
    console.log('Creating lobby...');
    const promise = engine.createLobby();
    promise.then((lobbyId: string) => {
        console.log('Lobby created with id: ' + lobbyId);
        router.push('/lobby/' + lobbyId);
    });
}
</script>

<template>
    <div class="card">
        <h1>Create Lobby</h1>
        <button type="submit" class="btn-create" @click="createLobby">Create</button>
    </div>
</template>

<style scoped>
:host {
    text-align: center;
}

h1 {
    margin-bottom: 0;
}

.btn-create {
    background-color: var(--orange);
}
</style>
