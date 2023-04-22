<script setup lang="ts">
import CreateLobby from './CreateLobby.vue';
import JoinLobby from './JoinLobby.vue';
import { reactive } from "vue";
import { engine } from '../main.ts';

const state = reactive({
    isInLobby: false,
});

</script>

<template>
    <div class="container" v-if="!state.isInLobby">
        <CreateLobby />
        <div>
            <h2 class="or">- OR -</h2>
        </div>
        <JoinLobby />
    </div>
</template>

<style scoped>
.container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background-color: #222;
    color: #fff;
    font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
}

.or {
    color: #8C8C8C;
    text-align: center;
}
</style>
