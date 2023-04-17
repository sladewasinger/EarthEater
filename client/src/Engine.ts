import { GameState } from "./models/GameState";
import { Dynamite } from "./models/Dynamite";
import { ProceduralGeneration } from "./ProceduralGeneration";
import { Renderer } from "./Renderer";
import { Vector } from "./Vector";
import { Player } from "./models/Player";
import { Mouse } from "./models/Mouse";
import { Explosion } from "./Explosion";

export class EngineState {
    fireDelay: number = 1000;
    fireDebounce: boolean = false;
    myPlayerId: string | undefined;
    gravity: number = 90;
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

    get myPlayer() {
        return this.gameState.players.find(p => p.id === this.engineState.myPlayerId);
    }

    onKeyUp(e: KeyboardEvent): any {
        this.gameState.inputs[e.key] = false;
    }

    onKeyDown(e: KeyboardEvent): any {
        this.gameState.inputs[e.key] = true;
    }

    public start() {
        // create polygon mesh for terrain
        this.gameState.terrainMesh = this.createTerrainMesh();
        const player = new Player('test');
        this.gameState.players.push(player);
        this.engineState.myPlayerId = player.id;
        this.myPlayer!.position = new Vector(500, 300);

        setInterval(() => {
            this.update();
        }, 1000 / this.fps);
    }

    public update() {
        const now = Date.now();
        const dt = Math.min(now - this.gameState.lastUpdate, 1000 / 20);

        this.gameState.frame++;

        // apply gravity
        for (let player of this.gameState.players) {
            player.position.y += this.engineState.gravity * dt / 1000;

            // resolve player ground collision
            for (let point of this.gameState.terrainMesh) {
                if (point.x >= player.position.x && point.x <= player.position.x + player.hitBox.x) {
                    let yPos = point.y - player.hitBox.y;
                    player.position.y = Math.min(player.position.y, yPos);
                }
            }
        }

        if (this.mouse.left && !this.engineState.fireDebounce) {
            this.engineState.fireDebounce = true;
            setTimeout(() => {
                this.engineState.fireDebounce = false;
            }, this.engineState.fireDelay);

            let mouseWorldPos = this.renderer.getWorldPosition(this.mouse.position);
            let explosion = new Explosion(mouseWorldPos, 50, 1000);
            this.gameState.explosions.push(explosion);

            let explosionRadius = explosion.radius;
            let explosionPos = explosion.position;
            for (let point of this.gameState.terrainMesh) {
                if (point.x >= explosionPos.x - explosionRadius && point.x <= explosionPos.x + explosionRadius) {
                    let yPos = explosionPos.y + Math.sqrt(Math.pow(explosionRadius, 2) - Math.pow(point.x - explosionPos.x, 2));
                    point.y = Math.max(point.y, yPos);
                }
            }
        }

        for (let i = 0; i < this.gameState.explosions.length; i++) {
            let explosion = this.gameState.explosions[i];
            explosion.update(dt);
            if (explosion.timeLeftMs <= 0) {
                this.gameState.explosions.splice(i, 1);
            }
        }

        this.renderer.render(this.gameState);

        // render explosions
        for (let explosion of this.gameState.explosions) {
            this.renderer.renderCircle(explosion.position, explosion.radius, 'rgba(255, 0, 0, 0.5)');
        }

        this.gameState.lastUpdate = now;
    }

    private createTerrainMesh(): Vector[] {
        let startPos = new Vector(0, Math.round(this.renderer.canvas.height / 2));
        let endPosX = this.renderer.canvas.width;

        let terrainMesh = <Vector[]>[];
        terrainMesh.push(startPos);

        let resolution = 10;
        let lastPos = startPos;
        for (let i = 0; i < endPosX; i += resolution) {
            let pos = new Vector(i, Math.min(this.renderer.canvas.height, lastPos.y + (Math.random() * 2 - 1) * 1));
            terrainMesh.push(pos);
            lastPos = pos;
        }
        terrainMesh.push(new Vector(endPosX, startPos.y));

        const bottomRight = new Vector(this.renderer.canvas.width, this.renderer.canvas.height);
        const bottomLeft = new Vector(0, this.renderer.canvas.height);
        terrainMesh.push(bottomRight);
        terrainMesh.push(bottomLeft);

        return terrainMesh;
    }
}
