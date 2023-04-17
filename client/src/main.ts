import { Engine } from './Engine';
import { Renderer } from "./Renderer";
import './style.css'

const renderer = new Renderer();
renderer.loadAssets();
const engine = new Engine(renderer);
await engine.start();
