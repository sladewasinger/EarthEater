import { GameState } from "./models/GameState";
import { ProceduralGeneration } from "./ProceduralGeneration";
import { Renderer } from "./Renderer";
import { Vector } from "./Vector";

export class Engine {
    fps: number = 60;
    gameState: GameState;

    constructor(public renderer: Renderer) {
        this.gameState = new GameState();
        this.gameState.grid = ProceduralGeneration.generateCave(500, 500, 0.45, 5);
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onKeyUp(e: KeyboardEvent): any {
        this.gameState.inputs[e.key] = false;
        this.gameState.player.moveDebounce = false;
    }

    onKeyDown(e: KeyboardEvent): any {
        this.gameState.inputs[e.key] = true;
    }

    public start() {
        // place player in closest air tile:
        for (let y = 0; y < this.gameState.grid.length; y++) {
            for (let x = 0; x < this.gameState.grid[y].length; x++) {
                if (this.gameState.grid[y][x].type === "air") {
                    this.gameState.player.x = x;
                    this.gameState.player.y = y;
                    break;
                }
            }
        }

        setInterval(() => {
            this.update();
        }, 1000 / this.fps);
    }

    public update() {
        this.gameState.player.move(this.gameState);

        // center camera on player accounting for zoom:
        this.renderer.pan(
            this.gameState.player.x * this.renderer.tileSize * this.renderer.camera.zoom - this.renderer.canvas.width / 2,
            this.gameState.player.y * this.renderer.tileSize * this.renderer.camera.zoom - this.renderer.canvas.height / 2
        );

        this.renderer.render(this.gameState);
    }
}
