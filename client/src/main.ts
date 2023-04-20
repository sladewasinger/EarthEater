import './style.css'

import { Engine } from './Engine';
import { Renderer } from "./Renderer";
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);

app.mount('#app');

const renderer = new Renderer();
renderer.loadAssets();
new Engine(renderer);

