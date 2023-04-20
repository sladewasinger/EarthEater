import { Engine } from './Engine';
import { Renderer } from "./Renderer";
import { loadCustomComponents } from './forms/module';
import './style.css'

loadCustomComponents();

const renderer = new Renderer();
renderer.loadAssets();
new Engine(renderer);
