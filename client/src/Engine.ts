import { GameState } from "./models/GameState";
import { Dynamite } from "./models/Dynamite";
import { ProceduralGeneration } from "./ProceduralGeneration";
import { Renderer } from "./Renderer";
import { Vector } from "./Vector";
import { Player } from "./models/Player";
import { Mouse } from "./models/Mouse";

export class EngineState {
    fireDelay: number = 1000;
    fireDebounce: boolean = false;
}

export class Engine {
    fps: number = 60;
    gameState: GameState;
    engineState: EngineState = new EngineState();
    mouse: Mouse;

    constructor(public renderer: Renderer) {
        this.gameState = new GameState();
        this.gameState.grid = ProceduralGeneration.generateCave(500, 500, 0.45, 5);

        this.mouse = new Mouse(this.renderer.canvas);

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
                    this.gameState.player.position.x = x;
                    this.gameState.player.position.y = y;
                    break;
                }
            }
        }

        setInterval(() => {
            this.update();
        }, 1000 / this.fps);
    }

    public update() {
        const now = Date.now();
        const dt = Math.min(now - this.gameState.lastUpdate, 1000 / 20);

        this.gameState.frame++;

        this.gameState.player.move(this.gameState, this.mouse, this.renderer);

        if (!this.engineState.fireDebounce && this.gameState.inputs[" "]) {
            // drop dynamite
            this.engineState.fireDebounce = true;
            setTimeout(() => {
                this.engineState.fireDebounce = false;
            }, this.engineState.fireDelay);

            let pos = this.gameState.player.position.clone(); //Vector.add(this.gameState.player.position, Vector.normalize(Vector.fromAngle(this.gameState.player.facingAngle, 1)));
            if (this.gameState.grid[pos.y][pos.x]?.type === "air") {
                this.createDynamite(pos, 1000, this.gameState.player);
            }
        }

        // center camera on player accounting for zoom:
        this.renderer.pan(
            this.gameState.player.position.x * this.renderer.tileSize * this.renderer.camera.zoom - this.renderer.canvas.width / 2,
            this.gameState.player.position.y * this.renderer.tileSize * this.renderer.camera.zoom - this.renderer.canvas.height / 2
        );

        for (let dynamite of this.gameState.dynamites) {
            dynamite.update(dt);
        }

        this.renderer.render(this.gameState);
        this.gameState.lastUpdate = now;
    }

    private createDynamite(pos: Vector, fuseMs: number, owner: Player) {
        const dynamite = new Dynamite(pos, fuseMs, owner);
        this.gameState.dynamites.push(dynamite);
        setTimeout(() => {
            this.explodeDynamite(dynamite, pos);
        }, fuseMs);
    }

    private explodeDynamite(dynamite: Dynamite, pos: Vector) {
        let explosionRadius = 3;
        let explosionTiles = [];
        for (let y = pos.y - explosionRadius; y <= pos.y + explosionRadius; y++) {
            for (let x = pos.x - explosionRadius; x <= pos.x + explosionRadius; x++) {
                if (this.gameState.grid[y] && this.gameState.grid[y][x]?.type === "stone" && Vector.distance(new Vector(x, y), pos) <= explosionRadius) {
                    explosionTiles.push(new Vector(x, y));
                }
            }
        }

        this.renderer.queueExplosion(pos, explosionRadius, 250);

        for (let tile of explosionTiles) {
            this.gameState.grid[tile.y][tile.x].type = "air";
        }

        this.gameState.dynamites = this.gameState.dynamites.filter(d => d !== dynamite);
    }
}
