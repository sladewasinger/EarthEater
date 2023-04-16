import { GameState } from "./models/GameState";
import { Dynamite } from "./models/Dynamite";
import { ProceduralGeneration } from "./ProceduralGeneration";
import { Renderer } from "./Renderer";
import { Vector } from "./Vector";
import { Player } from "./models/Player";
import { Mouse } from "./models/Mouse";
import { GridTile } from "./models/GridTile";
import { Explosion } from "./Explosion";

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
    }

    onKeyDown(e: KeyboardEvent): any {
        this.gameState.inputs[e.key] = true;
    }

    public start() {
        // create polygon mesh for terrain
        this.gameState.terrainMesh = this.createTerrainMesh();

        setInterval(() => {
            this.update();
        }, 1000 / this.fps);
    }

    public update() {
        const now = Date.now();
        const dt = Math.min(now - this.gameState.lastUpdate, 1000 / 20);

        this.gameState.frame++;

        if (this.mouse.left && !this.engineState.fireDebounce) {
            this.engineState.fireDebounce = true;
            setTimeout(() => {
                this.engineState.fireDebounce = false;
            }, this.engineState.fireDelay);

            let explosion = new Explosion(this.mouse.position.clone(), 100, 10000);
            this.gameState.explosions.push(explosion);

            // destroy terrain mesh around explosion:
            let explosionRadius = explosion.radius;
            let explosionPos = explosion.position;
            for (let point of this.gameState.terrainMesh) {
                let distance = Vector.distance(point, explosionPos);
                if (distance < explosionRadius) {
                    // push point.y outside of circle
                    let angle = Vector.angleBetween(point, explosionPos);
                    let newPosY = point.y + Math.abs(Math.sin(angle) * explosionRadius);
                    point.y = newPosY;
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
        for (let i = 0; i < (endPosX - startPos.x) / resolution; i++) {
            let pos = new Vector(lastPos.x + resolution, Math.min(this.renderer.canvas.height, lastPos.y + (Math.random() * 2 - 1) * 1));
            terrainMesh.push(pos);
            lastPos = pos;
        }

        const bottomRight = new Vector(this.renderer.canvas.width, this.renderer.canvas.height);
        const bottomLeft = new Vector(0, this.renderer.canvas.height);
        terrainMesh.push(bottomRight);
        terrainMesh.push(bottomLeft);

        return terrainMesh;
    }
}
