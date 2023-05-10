import './style.css'

import { Engine } from './Engine';
import { createApp } from 'vue';
import LandingPage from './components/LandingPage.vue';
import Lobby from './components/Lobby.vue';
import App from './App.vue';
import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
    { path: '/', component: LandingPage },
    { path: '/lobby/:id', component: Lobby },
]

// 3. Create the router instance and pass the `routes` option
// You can pass in additional options here, but let's
// keep it simple for now.
const router = createRouter({
    // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
    history: createWebHashHistory(),
    routes, // short for `routes: routes`
})

export let engine = new Engine();

const app = createApp(App);
app.use(router);
app.mount('#app');
