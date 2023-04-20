<script setup lang="ts">
const emit = defineEmits(['createLobby']);

function createLobby(e: Event) {
    e.preventDefault();
    console.log('Creating lobby...');
    emit('createLobby');
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
