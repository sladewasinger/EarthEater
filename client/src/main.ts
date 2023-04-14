import { Engine } from './Engine';
import { Renderer } from "./Renderer";
import './style.css'

const renderer = new Renderer();
const engine = new Engine(renderer);
engine.start();
